/**
 * Market table generator (§9.2, §26.2 Step 3). Run via `npm run build:series`.
 *
 * Emits src/data/series.json (132 rows x every InvestableVehicleId + the six
 * idx-* index columns) and src/data/basket.json (annual CPI-component index
 * levels for the expense basket, §8.2). Never run at game runtime — checked
 * in, regenerated only by re-running this script (§26.2 rule 7: never
 * hand-edit series.json).
 *
 * Real indices, fictional vehicles derived from them (§5.1, §9.2). Every
 * fictional vehicle column is either a direct pass-through of a real index's
 * monthly multiplier, a log-return blend of more than one real index, a
 * log-return amplification of one real index (single stocks: more volatile
 * than the index, same real timing), or an authored payout/collapse schedule
 * for the six scams (§11.4, §11.5).
 *
 * Fees are NOT baked into these multipliers — they are deducted pro-rata
 * monthly in the sim (§9.3, §7.3 step 4). Every multiplier below is
 * gross-of-fee; see meta.note in the emitted file, and see
 * scripts/source-data/vehicles.ts for the fee schedule.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { monthIndex, monthKey, MONTH_COUNT, START_YEAR, END_YEAR } from '../src/sim/month';
import { VEHICLE_IDS, type InvestableVehicleId } from '../src/sim/ids';
import type { MarketSeriesFile, MarketSeriesRow, SeriesColumn, BasketSeriesFile } from '../src/data/schema';

import {
  FTSE_ALL_SHARE_ANCHORS,
  SP500_ANCHORS,
  NASDAQ_ANCHORS,
  BASE_RATE_ANCHORS,
  HEADLINE_CPI_ANNUAL_RATE,
  expandLevelsLog,
  expandLevelsLinear,
} from './source-data/indices';
import { VEHICLE_FEES } from './source-data/vehicles';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/data');

const N = MONTH_COUNT; // 132

/* -------------------------------------------------------------------- *
 * Real index levels -> monthly multipliers
 * -------------------------------------------------------------------- */

function levelsToMultipliers(levels: number[]): number[] {
  return levels.map((level, m) => (m === 0 ? 1.0 : level / levels[m - 1]));
}

const ftseLevels = expandLevelsLog(FTSE_ALL_SHARE_ANCHORS, N, 0.006);
const sp500Levels = expandLevelsLog(SP500_ANCHORS, N, 0.006);
const nasdaqLevels = expandLevelsLog(NASDAQ_ANCHORS, N, 0.008);
const baseRateLevels = expandLevelsLinear(BASE_RATE_ANCHORS, N); // percent p.a., a level not a multiplier

const ftseMult = levelsToMultipliers(ftseLevels);
const sp500Mult = levelsToMultipliers(sp500Levels);
const nasdaqMult = levelsToMultipliers(nasdaqLevels);

/**
 * UK gilt total-return PROXY (documented as such in indices.ts): monthly
 * carry at the current Bank Rate plus a constant-duration (~7yr) capital
 * effect from the month's rate change. This is why kingsley-gilt wins during
 * the 2000-2002 crash (§9.1) — it falls directly out of the real rate-cut
 * path, not out of an authored "gilts go up" fudge.
 */
const GILT_DURATION_YEARS = 7;
function giltMultiplier(m: number): number {
  const ratePct = baseRateLevels[m];
  const carry = ratePct / 100 / 12;
  const prevRatePct = m === 0 ? baseRateLevels[0] : baseRateLevels[m - 1];
  const rateChangeDecimal = (ratePct - prevRatePct) / 100;
  const capitalEffect = -GILT_DURATION_YEARS * rateChangeDecimal;
  return 1 + carry + capitalEffect;
}
const giltMult = Array.from({ length: N }, (_, m) => giltMultiplier(m));

/** idx-cpi (series.json): headline CPI level, 1996-01 = 100, monthly compounding of §8.2's ~2.5%/yr. */
const cpiLevels = Array.from({ length: N }, (_, m) => 100 * Math.pow(1 + HEADLINE_CPI_ANNUAL_RATE, m / 12));

/* -------------------------------------------------------------------- *
 * Log-return helpers for blending/amplifying real series into fictional ones
 * -------------------------------------------------------------------- */

const ln = Math.log;
const exp = Math.exp;

/** Weighted blend of several multiplier series, done in log-return space. */
function blend(weights: [number[], number][]): number[] {
  return Array.from({ length: N }, (_, m) =>
    exp(weights.reduce((sum, [series, w]) => sum + w * ln(series[m]), 0)),
  );
}

/** Amplify a single series' monthly log-return — same real timing, bigger moves (single stocks). */
function amplify(series: number[], factor: number): number[] {
  return series.map((mult) => exp(ln(mult) * factor));
}

/* -------------------------------------------------------------------- *
 * northmoor-bond: declining building-society rate, tracked off Bank Rate,
 * never a down month (§9.1's "safe" vehicle).
 * -------------------------------------------------------------------- */

function northmoorMultiplier(m: number): number {
  const year = START_YEAR + Math.floor(m / 12);
  const t = (year - START_YEAR) / (END_YEAR - START_YEAR); // 0..1
  const decliningSchedule = 0.052 - t * (0.052 - 0.04); // 5.2% -> 4.0% p.a.
  const trackedRate = baseRateLevels[m] / 100;
  const blended = 0.7 * decliningSchedule + 0.3 * trackedRate;
  return Math.max(1.0005, Math.pow(1 + blended, 1 / 12));
}
const northmoorMult = Array.from({ length: N }, (_, m) => northmoorMultiplier(m));

/* -------------------------------------------------------------------- *
 * The six scams (§11.4, §11.5) — authored payout schedules and collapses.
 * Pattern shared by all: 1.0 (flat/inactive) before launch and after
 * collapse, an authored payout while active, 0 exactly in the collapse
 * month. The 0 permanently zeroes the holding's value even though the
 * multiplier reverts to 1.0 afterwards (0 x 1.0 = 0 forever).
 * -------------------------------------------------------------------- */

function feeFor(id: InvestableVehicleId) {
  const entry = VEHICLE_FEES.find((v) => v.id === id);
  if (!entry) throw new Error(`no fee schedule for ${id}`);
  return entry;
}

function flatSeries(): number[] {
  return Array.from({ length: N }, () => 1.0);
}

/** Meridian Capital Guaranteed Growth — Scam 1. ~2.5%/mo, Mar 1997 - Nov 1997, collapses Dec 1997. */
function meridianSeries(): number[] {
  const out = flatSeries();
  const launch = monthIndex(1997, 3);
  const collapse = feeFor('meridian-guaranteed').collapseMonth!;
  for (let m = launch; m < collapse; m++) out[m] = 1.025;
  out[collapse] = 0;
  return out;
}

/** Cavendish Technology Opportunities — Scam 2. ~4%/mo, Mar 1998 - Jan 1999, collapses Feb 1999. */
function cavendishSeries(): number[] {
  const out = flatSeries();
  const launch = monthIndex(1998, 3);
  const collapse = feeFor('cavendish-tech').collapseMonth!;
  for (let m = launch; m < collapse; m++) out[m] = 1.04;
  out[collapse] = 0;
  return out;
}

/**
 * Halcyon Reserve — Scam 3, THE PONZI (§11.4). Smooth 3-5%/mo, NEVER a down
 * month, Jun 1999 - Oct 2000, then a single 0 in Nov 2000, then flat forever.
 * The 3-5% wobble is a deterministic function of month index (not RNG) —
 * it exists only so the fact sheet's return chart isn't a dead straight
 * line, while staying strictly positive every month (§11.4: "the smoothness
 * is the tell").
 */
function halcyonSeries(): number[] {
  const out = flatSeries();
  const launch = monthIndex(1999, 6);
  const collapse = feeFor('halcyon-reserve').collapseMonth!;
  for (let m = launch; m < collapse; m++) {
    const wobble = 0.5 + 0.5 * Math.sin((m - launch) * 0.35); // 0..1, deterministic
    out[m] = 1 + (0.03 + wobble * 0.02); // 3%..5%, never <= 1
  }
  out[collapse] = 0;
  return out;
}

/**
 * Vertex Communications — Scam 4, the pump. +200% over May-Aug 1999
 * (~+31.6%/mo, since 1.316^4 ≈ 3.0), then -98% in Sep 1999, then flat —
 * unsellable, not zeroed (the sim, not this data, marks it unsellable).
 */
function vertexSeries(): number[] {
  const out = flatSeries();
  const pumpStart = monthIndex(1999, 5);
  const pumpEnd = monthIndex(1999, 8); // inclusive
  const monthlyPumpMultiplier = Math.pow(3.0, 1 / 4); // four months, x3 total = +200%
  for (let m = pumpStart; m <= pumpEnd; m++) out[m] = monthlyPumpMultiplier;
  const dump = feeFor('vertex-communications').collapseMonth!;
  out[dump] = 0.02; // -98%, not to zero — it freezes, it isn't wiped
  return out;
}

/** Restitution Partners — Scam 5. Upfront fee, returns nothing: flat 1.0, then 0 two months after launch. */
function restitutionSeries(): number[] {
  const out = flatSeries();
  out[feeFor('restitution-partners').collapseMonth!] = 0;
  return out;
}

/** Sentinel Protect — Scam 6. Same shape as Restitution, later collapse. */
function sentinelSeries(): number[] {
  const out = flatSeries();
  out[feeFor('sentinel-protect').collapseMonth!] = 0;
  return out;
}

/* -------------------------------------------------------------------- *
 * Assemble every InvestableVehicleId column (gross of fee, §9.3).
 * -------------------------------------------------------------------- */

const vehicleSeries: Record<InvestableVehicleId, number[]> = {
  'northmoor-bond': northmoorMult,
  'fenwick-index': ftseMult,
  'fenwick-world': blend([[sp500Mult, 0.85], [nasdaqMult, 0.15]]),
  'kingsley-gilt': giltMult,
  'marlow-corporate-bond': giltMult.map((m) => exp(ln(m) * 1.05 + 0.0006)), // small credit spread + extra vol
  'brightwell-pension': blend([[ftseMult, 0.7], [giltMult, 0.3]]),
  'technova-growth': nasdaqMult,
  'ashcombe-managed': blend([
    [blend([[ftseMult, 0.5], [sp500Mult, 0.3], [nasdaqMult, 0.2]]), 0.6],
    [giltMult, 0.4],
  ]),
  'granville-plc': amplify(ftseMult, 1.4),
  'quicksilver-com': amplify(nasdaqMult, 1.6),
  'meridian-guaranteed': meridianSeries(),
  'cavendish-tech': cavendishSeries(),
  'halcyon-reserve': halcyonSeries(),
  'vertex-communications': vertexSeries(),
  'restitution-partners': restitutionSeries(),
  'sentinel-protect': sentinelSeries(),
};

const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

const investableIds = VEHICLE_IDS.filter(
  (id): id is InvestableVehicleId => id !== 'cash' && id !== 'capital-direct-card',
);

const columns: SeriesColumn[] = [
  ...investableIds,
  'idx-ftse-all-share',
  'idx-sp500',
  'idx-nasdaq',
  'idx-gilts',
  'idx-base-rate',
  'idx-cpi',
];

const rows: MarketSeriesRow[] = Array.from({ length: N }, (_, m) => {
  const values = {} as Record<SeriesColumn, number>;
  for (const id of investableIds) values[id] = round6(vehicleSeries[id][m]);
  values['idx-ftse-all-share'] = round6(ftseMult[m]);
  values['idx-sp500'] = round6(sp500Mult[m]);
  values['idx-nasdaq'] = round6(nasdaqMult[m]);
  values['idx-gilts'] = round6(giltMult[m]);
  values['idx-base-rate'] = round6(baseRateLevels[m]);
  values['idx-cpi'] = round6(cpiLevels[m]);
  return { month: monthKey(m), values };
});

const seriesFile: MarketSeriesFile = {
  meta: {
    generatedBy: 'scripts/build-series.ts',
    generatedFrom: 'scripts/source-data/indices.ts, scripts/source-data/vehicles.ts',
    sources: [
      'FTSE All-Share Index, London Stock Exchange / FTSE Russell — reconstructed month-end levels 1996-2006',
      'S&P 500, Standard & Poor\'s — reconstructed month-end levels 1996-2006',
      'NASDAQ Composite, Nasdaq OMX — reconstructed month-end levels 1996-2006 (peak ~5048 Mar 2000, trough ~1114 Oct 2002)',
      'Bank of England official Bank Rate history, boe.co.uk/monetary-policy',
      'UK gilt total return: a documented PROXY derived from Bank Rate via a constant ~7yr-duration model, not a reconstruction of a published gilts index',
      'Headline UK CPI: ~2.5%/yr average, §8.2',
    ],
    note:
      'Vehicle columns are GROSS OF FEE (§9.3) — annual/exit/performance fees are ' +
      'deducted pro-rata in the sim (§7.3 step 4), never baked into these ' +
      'multipliers. See scripts/source-data/vehicles.ts for fee rates. Index ' +
      'levels are reconstructed to the nearest reasonable precision, not a ' +
      'claimed tick-archive — see scripts/source-data/indices.ts for provenance.',
  },
  columns,
  rows,
};

writeFileSync(resolve(DATA_DIR, 'series.json'), JSON.stringify(seriesFile, null, 2) + '\n');

/* -------------------------------------------------------------------- *
 * basket.json — annual CPI-component index levels, 1996 = 100 (§8.2).
 * Growth rates are the real-series-keyed rates §8.2 specifies. The BLENDED
 * rate is never computed here — it is an output of src/sim/basket.ts
 * weighting these levels by the §8.1 starting pounds, not an input to it.
 * -------------------------------------------------------------------- */

const BASKET_RATES = {
  rent: 0.055, // UK private rental / housing cost index, §8.2
  food: 0.025, // CPI food
  bills: 0.04, // CPI housing, water, electricity, gas
  transport: 0.03, // CPI transport
  other: 0.02, // CPI misc
  cpi: HEADLINE_CPI_ANNUAL_RATE, // headline CPI, shared with idx-cpi above
};

const years = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

function annualLevels(rate: number): number[] {
  return years.map((year) => round6(100 * Math.pow(1 + rate, year - START_YEAR)));
}

const basketFile: BasketSeriesFile = {
  meta: {
    generatedBy: 'scripts/build-series.ts',
    sources: [
      'UK private rental / housing cost index (real series, ~5.5%/yr average 1996-2006), §8.2',
      'CPI food (real series, ~2.5%/yr), §8.2',
      'CPI housing/water/electricity/gas (real series, ~4.0%/yr), §8.2',
      'CPI transport (real series, ~3.0%/yr), §8.2',
      'CPI miscellaneous goods and services (real series, ~2.0%/yr), §8.2',
      'Headline UK CPI (real series, ~2.5%/yr average 1996-2006)',
    ],
    note:
      '1996 = 100 for every component. The blended/headline-beating rate this ' +
      'produces is an OUTPUT of src/sim/basket.ts (it weights these levels by ' +
      'the §8.1 starting pounds), never an input — §8.2 is explicit that this ' +
      'is the single most important defensive fact in the project.',
  },
  years,
  levels: {
    rent: annualLevels(BASKET_RATES.rent),
    food: annualLevels(BASKET_RATES.food),
    bills: annualLevels(BASKET_RATES.bills),
    transport: annualLevels(BASKET_RATES.transport),
    other: annualLevels(BASKET_RATES.other),
    cpi: annualLevels(BASKET_RATES.cpi),
  },
};

writeFileSync(resolve(DATA_DIR, 'basket.json'), JSON.stringify(basketFile, null, 2) + '\n');

console.log(`Wrote series.json (${rows.length} rows, ${columns.length} columns) and basket.json (${years.length} years).`);
