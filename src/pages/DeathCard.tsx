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
import { netWorth, to2026, totalFeesPaid } from '../sim/selectors';
import { bandFor, causeIdFor } from '../sim/bands';
import { DEATH_LINES } from '../content/deathlines';
import { FACT_SHEETS } from '../content/factsheets';
import { monthIndex, monthLabelTitle, MONTH_COUNT, type MonthIndex } from '../sim/month';
import { HOME_URL } from './registry';
import type { Band, FactSheet, GameState, RedFlag } from '../sim/types';
import type { VehicleId } from '../sim/ids';
import { PerformanceChart } from '../ui/PerformanceChart';
import { useExperienceNavigation } from '../launch/experience';
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

function DecadeGraph({ wealthHistory, marketHistory }: { wealthHistory: readonly number[]; marketHistory: readonly number[] }) {
  return (
    <div className="deathcard-graph bevel-in sunken-field">
      <div className="deathcard-graph__heading"><span>RUN TIMELINE</span><b>Your money vs the NASDAQ bubble</b></div>
      <PerformanceChart
        series={[
          { id: 'report-market', label: 'NASDAQ', values: marketHistory, tone: 'market' },
          { id: 'report-player', label: 'your money', values: wealthHistory, tone: 'player' },
        ]}
        height={148}
        scale="independent"
        annotations={[{ month: monthIndex(2000, 3), label: 'BUBBLE PEAK' }]}
        ariaLabel="Shape comparison of your net worth and the NASDAQ Composite from January 1996 to the end of the run; each line uses its own scale"
      />
      <p className="deathcard-graph__note">Shape comparison · each line uses its own scale so timing remains readable.</p>
    </div>
  );
}

export interface PlayerReport {
  strengths: string[];
  nextSteps: string[];
  activity: {
    decisions: number;
    rebalances: number;
    factSheets: number;
    offersAccepted: number;
  };
}

/** Turns the replay log and outcome into specific, non-scoring feedback. The
 * report describes observable behaviour only; it never invents intent or uses
 * final wealth to manufacture a leaderboard-style grade (§15). */
export function buildPlayerReport(state: GameState): PlayerReport {
  const rebalances = state.decisions.filter((decision) => decision.type === 'rebalance').length;
  const factSheets = state.decisions.filter((decision) => decision.type === 'open-fact-sheet').length;
  const offersAccepted = state.decisions.filter((decision) => decision.type === 'accept-offer').length;
  const feesPaid = totalFeesPaid(state);
  const strengths: string[] = [];
  const nextSteps: string[] = [];

  if (state.status === 'survived') strengths.push('You stayed solvent through the entire historical run.');
  if (state.flags.everOpenedFactSheet || factSheets > 0) strengths.push('You opened evidence before relying on presentation alone.');
  if (state.stats.scamsFunded === 0) strengths.push('No recorded scam received any of your investment money.');
  if (state.stats.forcedSales === 0) strengths.push('You avoided a forced sale at a price chosen by the calendar.');
  if (rebalances > 0) strengths.push(`You deliberately reviewed your allocation ${rebalances} time${rebalances === 1 ? '' : 's'}.`);
  if (strengths.length === 0) strengths.push(`You kept making decisions until ${monthLabelTitle(state.deathMonth ?? state.month)}.`);

  if (!state.flags.everOpenedInbox) nextSteps.push('Open the inbox: legitimate offers, warnings and windfalls all arrive through the same noisy channel.');
  if (!state.flags.everOpenedFactSheet && factSheets === 0) nextSteps.push('Open every fact sheet and check regulation, fees, holdings and guaranteed-return language.');
  if (state.stats.scamsFunded > 0) nextSteps.push('Treat guarantees, missing regulators and introducer commissions as evidence—not small print.');
  if (state.stats.forcedSales > 0) nextSteps.push('Keep a larger cash buffer so the next shock does not force a sale during a falling market.');
  if (feesPaid > state.stats.trackerCounterfactualFees + 10) nextSteps.push('Compare total fee drag with the low-cost tracker before allocating to an exciting fund.');
  if (rebalances === 0) nextSteps.push('Use My Money to set a complete 100% target and confirm it; moving a slider alone is only a draft.');

  const universal = [
    'Diversify rather than letting one persuasive offer determine the whole outcome.',
    'Separate the product from its website: polished and ugly pages can both describe legitimate or dangerous choices.',
    'Watch purchasing power as well as the larger nominal pound figure.',
  ];
  for (const tip of universal) {
    if (nextSteps.length >= 3) break;
    nextSteps.push(tip);
  }

  return {
    strengths: strengths.slice(0, 3),
    nextSteps: nextSteps.slice(0, 3),
    activity: { decisions: state.decisions.length, rebalances, factSheets, offersAccepted },
  };
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
  const experienceNavigation = useExperienceNavigation();

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
  const report = buildPlayerReport(state);

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

      <div className="deathcard-report-label">YOUR RUN REPORT · DECISIONS, CONSEQUENCES, NEXT STEPS</div>

      <div className="deathcard-month">{monthLabelTitle(headlineMonth).toUpperCase()}</div>

      <p className="deathcard-cause">{lines.headline}</p>
      <p className="deathcard-detail">{lines.detail}</p>

      <DecadeGraph wealthHistory={state.wealthHistory} marketHistory={state.marketHistory} />

      <div className="deathcard-coaching">
        <section className="deathcard-coaching__panel deathcard-coaching__panel--worked">
          <h2>WHAT YOUR CHOICES SHOW</h2>
          <ul>{report.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="deathcard-coaching__panel deathcard-coaching__panel--next">
          <h2>WHAT TO TRY NEXT</h2>
          <ol>{report.nextSteps.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
      </div>

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
          <span className="deathcard-stats__label">Peak in 2026 money</span>
          <span className="money money--table-cell deathcard-stats__value">
            <span className="money__primary">{formatPounds(to2026(peak.value, peak.month))}</span>
          </span>
        </div>
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">Forced sales</span>
          <span className="deathcard-stats__value">{state.stats.forcedSales}</span>
        </div>
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">Decisions recorded</span>
          <span className="deathcard-stats__value">{report.activity.decisions}</span>
        </div>
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">Fact sheets opened</span>
          <span className="deathcard-stats__value">{report.activity.factSheets}</span>
        </div>
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">Rebalances applied</span>
          <span className="deathcard-stats__value">{report.activity.rebalances}</span>
        </div>
        <div className="deathcard-stats__row">
          <span className="deathcard-stats__label">Offers accepted</span>
          <span className="deathcard-stats__value">{report.activity.offersAccepted}</span>
        </div>
      </div>

      <div className="deathcard-band">
        BAND:&nbsp;<span className="deathcard-band__value">{band}</span>
      </div>

      <div className="deathcard-actions">
        {experienceNavigation && (
          <button type="button" className="bevel-out deathcard-actions__button" onClick={experienceNavigation.returnToLibrary}>
            [ Decade library ]
          </button>
        )}
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
