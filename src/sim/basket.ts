/**
 * The expense basket (§8.1, §8.2, §26.2 Step 4). Pure, no React, no Date
 * (§25.1). Reads component index levels from /data/basket.json — generated
 * by scripts/build-series.ts, never hand-edited (§26.2 rule 7) — and weights
 * them by the §8.1 starting pounds.
 *
 * §8.2's single most important defensive fact: **the blended growth rate is
 * an OUTPUT of this weighting, never an input.** Nothing in this file states
 * "expenses grow 4.2%/yr" — that number falls out of five real component
 * series compounding at their own real rates against their own real 1996
 * starting weights.
 *
 * Calibration check performed while building this file (§26.2 Step 4): the
 * baseline §8.2 growth rates (rent 5.5%, food 2.5%, bills 4.0%, transport
 * 3.0%, other 2.0% — see scripts/build-series.ts) already produce 1996=£645,
 * 2000=£760.45 (±£0.45 of the §8.3 break-even target), 2006=£978.50 (±£1.50
 * of target). Both are comfortably inside the ±£3 / ±£5 tolerances, so NO
 * TUNING was applied — the rates in scripts/build-series.ts are the §8.2
 * rates verbatim, not adjusted within the permitted 5.2-5.8% / 3.5-4.5% band.
 */

import basketData from '../data/basket.json';
import { yearOf, type MonthIndex } from './month';
import type { BasketBreakdown, BasketComponent } from './types';

/** §8.1 — January 1996 starting monthly pounds per component. */
const STARTING_POUNDS: Record<BasketComponent, number> = {
  rent: 310,
  food: 140,
  bills: 95,
  transport: 58,
  other: 42,
};

function yearIndex(month: MonthIndex): number {
  const year = yearOf(month);
  const idx = basketData.years.indexOf(year);
  if (idx === -1) {
    throw new Error(`basket.json has no data for year ${year} (month ${month})`);
  }
  return idx;
}

/**
 * Monthly expenses at `month`, stepped once per year on the January boundary
 * (§8.2: "the §8.3 table is per-year") — because `yearOf` only changes in
 * January, indexing by year rather than by month gives that step for free,
 * with no month-level special-casing.
 */
export function expensesFor(month: MonthIndex): BasketBreakdown {
  const idx = yearIndex(month);
  const rent = STARTING_POUNDS.rent * (basketData.levels.rent[idx] / 100);
  const food = STARTING_POUNDS.food * (basketData.levels.food[idx] / 100);
  const bills = STARTING_POUNDS.bills * (basketData.levels.bills[idx] / 100);
  const transport = STARTING_POUNDS.transport * (basketData.levels.transport[idx] / 100);
  const other = STARTING_POUNDS.other * (basketData.levels.other[idx] / 100);
  return { rent, food, bills, transport, other, total: rent + food + bills + transport + other };
}

/**
 * §19.4 dual-money display: multiply a nominal amount at `month` by this to
 * get its 1996-pounds equivalent (base year 1996, cpi[1996] = 100). Derived
 * from the headline CPI component of the same basket series — never a
 * separate hand-tuned inflation constant.
 */
export function deflatorTo1996(month: MonthIndex): number {
  const idx = yearIndex(month);
  return 100 / basketData.levels.cpi[idx];
}
