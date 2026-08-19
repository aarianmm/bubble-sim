/**
 * BUBBLE — the death card (Steps 27-28, §22.6).
 *
 * "The shareable artefact and the closing shot of the demo." Full-window
 * page — App.tsx greys every toolbar button except Home while this page is
 * showing (§27's own brief: "the machine keeps working, and you don't") —
 * this component itself owns only the content area.
 *
 * Band and cause are computed here, from `state`, every render — never
 * trusted as some pre-baked field, because `GameState` doesn't carry one
 * (§15: a band is a pure function of survival date, nothing else). Reads
 * `state.deathCauseId` when the engine has forced one (the presenter tool,
 * §25.4), and falls back to `causeIdFor` — Step 26's real selection logic —
 * otherwise, which is what a real run will do once the scheduler (Steps
 * 24-25) is wired into the live app.
 */
import { useEngine } from '../ui/engine';
import { useRouter } from '../chrome/router';
import { Money, formatPounds } from '../ui/Money';
import { netWorth, to1996, totalFeesPaid } from '../sim/selectors';
import { bandFor, causeIdFor } from '../sim/bands';
import { DEATH_LINES } from '../content/deathlines';
import { FACT_SHEETS } from '../content/factsheets';
import { monthLabelTitle, MONTH_COUNT, type MonthIndex } from '../sim/month';
import { HOME_URL } from './registry';
import type { Band, FactSheet, RedFlag } from '../sim/types';
import type { VehicleId } from '../sim/ids';
import './deathcard.css';

/* ------------------------------------------------------------------ *
 * §11.2 rule 5 — quoting the missed flags from the sheet itself. Most of
 * §11.3's vocabulary is a literal fact-sheet field; a couple (how the offer
 * arrived, how urgent it felt) describe the *approach* rather than a table
 * row, so those two get a fixed short gloss instead of a quoted value.
 * ------------------------------------------------------------------ */

const RED_FLAG_LABEL: Record<RedFlag, string> = {
  'slightly-high-fee': 'Slightly high fee',
  'short-track-record': 'Short track record',
  'unsolicited-approach': 'Unsolicited approach',
  urgency: 'Urgency / short expiry',
  'concentrated-holdings': 'Concentrated holdings',
  'very-high-fee': 'Very high fee',
  'track-record-under-12-months': 'Track record under 12 months',
  'guaranteed-returns': 'Guaranteed returns',
  'no-regulator': 'No regulator',
  'lookalike-domain': 'Lookalike domain',
  'implausible-return': 'Implausible return',
  'introducer-commission': 'Introducer commission',
};

const RED_FLAG_FIELD: Partial<Record<RedFlag, keyof FactSheet>> = {
  'slightly-high-fee': 'annualFee',
  'very-high-fee': 'annualFee',
  'short-track-record': 'launched',
  'track-record-under-12-months': 'launched',
  'concentrated-holdings': 'holdings',
  'guaranteed-returns': 'minimumReturn',
  'no-regulator': 'regulatedBy',
  'implausible-return': 'twelveMonthReturn',
  'introducer-commission': 'introducerCommission',
};

function quotedFlag(flag: RedFlag, sheet: FactSheet): string {
  const field = RED_FLAG_FIELD[flag];
  if (!field) return RED_FLAG_LABEL[flag];
  return `${RED_FLAG_LABEL[flag]} — "${sheet[field]}"`;
}

/* ------------------------------------------------------------------ *
 * The decade graph — player's wealth vs the market, 96..06. Each series is
 * normalised independently to its own min/max, the same technique
 * `ReturnSparkline` (src/ui/FactSheet.tsx) uses — this is a shape
 * comparison, not a shared-axis one, and it has to read at a glance
 * (§22.6: "it is the shareable object"). §23: no draw-on animation, no
 * easing — the whole line is present the instant this mounts.
 * ------------------------------------------------------------------ */

const GRAPH_WIDTH = 640;
const GRAPH_HEIGHT = 140;
const GRAPH_PAD = 8;

function pathFor(series: readonly number[], width: number, height: number, pad: number): string {
  if (series.length === 0) return '';
  if (series.length === 1) return `M${pad},${height / 2} L${width - pad},${height / 2}`;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  // Fixed x-domain of the full 132-month decade — a run that ended early
  // simply stops drawing partway across, which is the point (§22.6's own
  // mock-up shows exactly this: the axis is the decade, not the run).
  const stepX = (width - pad * 2) / (MONTH_COUNT - 1);
  const points = series.map((v, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M${points.join(' L')}`;
}

const YEAR_LABELS = Array.from({ length: 11 }, (_, i) => 1996 + i);

function DecadeGraph({ wealthHistory, marketHistory }: { wealthHistory: readonly number[]; marketHistory: readonly number[] }) {
  const playerPath = pathFor(wealthHistory, GRAPH_WIDTH, GRAPH_HEIGHT, GRAPH_PAD);
  const marketPath = pathFor(marketHistory, GRAPH_WIDTH, GRAPH_HEIGHT, GRAPH_PAD);
  const stepX = (GRAPH_WIDTH - GRAPH_PAD * 2) / (MONTH_COUNT - 1);
  return (
    <div className="deathcard-graph bevel-in sunken-field">
      <div className="deathcard-graph__legend">
        <span className="deathcard-graph__legend-item deathcard-graph__legend-item--player">your money</span>
        <span className="deathcard-graph__legend-item deathcard-graph__legend-item--market">the market</span>
      </div>
      <svg
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT + 16}`}
        width="100%"
        height={GRAPH_HEIGHT + 16}
        role="img"
        aria-label="Your net worth against the market, January 1996 to the end of the run"
      >
        {marketPath && <path d={marketPath} className="deathcard-graph__line deathcard-graph__line--market" />}
        {playerPath && <path d={playerPath} className="deathcard-graph__line deathcard-graph__line--player" />}
        {YEAR_LABELS.map((year, i) => (
          <text
            key={year}
            x={GRAPH_PAD + i * 12 * stepX}
            y={GRAPH_HEIGHT + 12}
            className="deathcard-graph__year"
          >
            {String(year).slice(2)}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Peak wealth — derived from `wealthHistory` at render time rather than
 * `state.stats.peakWealth`. `RunStats.peakWealth` is only ever populated by
 * `run()`'s own aggregation loop (src/sim/run.ts) — a real headless run —
 * not by `tick()` itself, so it isn't safe to trust on live `GameState`
 * until the scheduler (Steps 24-25) does the equivalent bookkeeping.
 * `wealthHistory`, by contrast, is part of `GameState`'s own contract
 * (populated incrementally by whatever's driving the clock) and is always
 * self-consistent with what's on screen.
 * ------------------------------------------------------------------ */

function peakWealthInfo(wealthHistory: readonly number[]): { value: number; month: MonthIndex } {
  if (wealthHistory.length === 0) return { value: 0, month: 0 };
  let bestValue = wealthHistory[0];
  let bestMonth = 0;
  for (let m = 1; m < wealthHistory.length; m++) {
    if (wealthHistory[m] > bestValue) {
      bestValue = wealthHistory[m];
      bestMonth = m;
    }
  }
  return { value: bestValue, month: bestMonth };
}

/* ------------------------------------------------------------------ *
 * The card
 * ------------------------------------------------------------------ */

export function DeathCard() {
  const engine = useEngine();
  const { state } = engine;
  const router = useRouter();

  const survived = state.status === 'survived';
  const band: Band = bandFor(state.status, state.deathMonth);
  const causeId = state.deathCauseId ?? causeIdFor(state.status, state.deathMonth, state.stats);
  const lines = DEATH_LINES[causeId];

  const headlineMonth = survived ? MONTH_COUNT - 1 : (state.deathMonth ?? state.month);
  const finalWorth = netWorth(state);
  const finalMonth = state.deathMonth ?? state.month;
  const peak = peakWealthInfo(state.wealthHistory);
  const feesPaid = totalFeesPaid(state);
  const trackerFees = state.stats.trackerCounterfactualFees;

  const missedScamId: VehicleId | undefined = state.stats.scamsFundedIds.at(-1);
  const missedSheet = missedScamId ? FACT_SHEETS[missedScamId] : null;

  function runItAgain() {
    // §28: one click, no menu, no confirmation, no loading screen.
    engine.reset();
    router.resetTo(HOME_URL);
  }

  return (
    <div className="deathcard-page">
      <div className="deathcard-banner" aria-hidden="true">
        <span className="deathcard-banner__rule" />
        <span className="deathcard-banner__text">G A M E&nbsp;&nbsp;&nbsp;O V E R</span>
        <span className="deathcard-banner__rule" />
      </div>

      <div className="deathcard-month">{monthLabelTitle(headlineMonth).toUpperCase()}</div>

      <p className="deathcard-cause">{lines.headline}</p>
      <p className="deathcard-detail">{lines.detail}</p>

      <DecadeGraph wealthHistory={state.wealthHistory} marketHistory={state.marketHistory} />

      {causeId === 'funded-a-scam' && missedSheet && (
        <div className="deathcard-flags bevel-out">
          <h2 className="deathcard-flags__title">
            You funded {missedSheet.name} ({missedSheet.manager}). The fact sheet was one click away, free
            and untimed. It said:
          </h2>
          <ul className="deathcard-flags__list">
            {missedSheet.redFlags.map((flag) => (
              <li key={flag}>{quotedFlag(flag, missedSheet)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* §9.3 — "that line does more financial education than a tutorial
          ever will." Always shown, given room, regardless of cause: fees
          are visible whether or not they were what killed the run. A
          <div>, not a <p> — <Money>'s non-interactive render is a <div>
          (it needs to stack a primary/secondary pair), which a <p> may not
          contain. */}
      <div className="deathcard-fees">
        You paid <Money amount={feesPaid} month={finalMonth} paired={false} interactive={false} /> in fees. The
        tracker would have charged you{' '}
        <Money amount={trackerFees} month={finalMonth} paired={false} interactive={false} />.
      </div>

      <div className="deathcard-stats bevel-in sunken-field">
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">Final savings</span>
          <Money amount={finalWorth} month={finalMonth} variant="table-cell" paired={false} interactive={false} />
        </div>
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">Fees paid</span>
          <Money amount={feesPaid} month={finalMonth} variant="table-cell" paired={false} interactive={false} />
        </div>
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">Peak savings</span>
          <Money amount={peak.value} month={peak.month} variant="table-cell" paired={false} interactive={false} />
        </div>
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">Scams funded</span>
          <span className="deathcard-stats__value">{state.stats.scamsFunded}</span>
        </div>
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">In 1996 money</span>
          {/* The peak figure's own purchasing power — not `<Money>` itself
              (which always treats its `amount` as period money and would
              double-convert an already-1996 figure), but built from the
              same `formatPounds` every `<Money>` renders through, so the
              typography and £ formatting rule are identical (see
              src/ui/Money.tsx's own doc comment on why it exports this). */}
          <span className="money money--table-cell deathcard-stats__value">
            <span className="money__primary">{formatPounds(to1996(peak.value, peak.month))}</span>
          </span>
        </div>
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">Forced sales</span>
          <span className="deathcard-stats__value">{state.stats.forcedSales}</span>
        </div>
      </div>

      <div className="deathcard-band">
        BAND:&nbsp;<span className="deathcard-band__value">{band}</span>
      </div>

      <div className="deathcard-actions">
        <button
          type="button"
          className="bevel-out deathcard-actions__button"
          disabled
          title="Save picture arrives later in the build (§26.1's Step 37) — outside the MVP."
        >
          [ Save picture ]
        </button>
        <button type="button" className="bevel-out deathcard-actions__button" onClick={runItAgain}>
          [ Run it again ]
        </button>
      </div>
    </div>
  );
}
