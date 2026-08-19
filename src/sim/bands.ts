/**
 * Bands (§15) and cause-of-death selection (§22.6), Step 26.
 *
 * LIFTED FROM src/sim/run.ts: `bandFor` and the shape of `causeFor` (there
 * renamed `causeIdFor`) originated in run.ts (Step 8), which needed *some*
 * band/cause to put in `RunResult`. That was always this step's logic, not
 * run's — run.ts now imports it from here rather than keeping its own copy.
 * `redFlagsMissed`'s derivation (union of the funded scams' fact-sheet red
 * flags) is lifted the same way, for the same reason: §11.2 rule 5 ("the
 * death card always names the flags you missed, quoting them from the
 * sheet you could have read") is this step's fairness-contract obligation,
 * not run's.
 *
 * §15 hard rule, enforced by construction: `bandFor` takes a survival date
 * and nothing else. There is no wealth parameter to pass it, so a band
 * cannot leak final-wealth information even by accident — the anti-gambling
 * guardrail is the function signature, not a convention someone has to
 * remember.
 */

import type { Band, DeathCauseId, RedFlag, RunStats, RunStatus } from './types';
import { monthIndex, type MonthIndex } from './month';
import { FACT_SHEETS } from '../content/factsheets';
import type { VehicleId } from './ids';

/* ------------------------------------------------------------------ *
 * Bands (§15) — survival date only, never wealth.
 * ------------------------------------------------------------------ */

/**
 * §15's table names bands through "2005" (IMPRESSIVE) and "survived through
 * Dec 2006" (LEGENDARY), leaving a death that happens *during* 2006 itself
 * unnamed. A death in 2006 is closer to "almost made it" than to any
 * earlier band, so it folds into IMPRESSIVE rather than inventing a sixth
 * band the design doc doesn't have.
 */
export function bandFor(status: RunStatus, deathMonth: MonthIndex | null): Band {
  if (status === 'survived' || deathMonth === null) return 'LEGENDARY';
  if (deathMonth < monthIndex(2001, 1)) return 'OUCH';
  if (deathMonth < monthIndex(2003, 1)) return 'OKAY';
  if (deathMonth < monthIndex(2005, 1)) return 'SOLID';
  return 'IMPRESSIVE';
}

/* ------------------------------------------------------------------ *
 * Cause of death (§22.6) — specific and earned, from what happened.
 * ------------------------------------------------------------------ */

// §8.4 — the calibration event the whole game is built to hit. The
// "broke the same month the bubble peaked" line is earned by exactly this
// month and no other: a Jan/Feb/Apr/May 2000 death didn't go broke in the
// *same* month the bubble peaked, so it doesn't get to claim the line.
const BUBBLE_PEAK_MONTH: MonthIndex = monthIndex(2000, 3);

// §9.3's canonical line quotes £1,840 — a fee bill of that order is what
// "eaten by fees" means. Below this a few pounds of fees are just the cost
// of being invested at all, not what killed the run.
const FEE_DEATH_THRESHOLD = 500;

// §22.6's own line says "three times" — a single terminal liquidation (the
// one nearly every death-with-holdings ends with, as tick.ts's solvency
// check sells whatever it can before declaring the run dead) isn't the
// "sold at the bottom" story on its own. A *repeated* pattern of forced
// sales is; this threshold is what makes the distinction real rather than
// cosmetic.
const REPEATED_FORCED_SALE_THRESHOLD = 3;

/**
 * Selects the §22.6 cause-of-death line the run actually earned.
 *
 * Order matters and is itself the specificity rule: a scam that was funded
 * is always the headline story (§11.2's fairness contract is the whole
 * point of the game, so if a scam took the player's money that is what
 * killed them, full stop). Short of that, a large fee bill is checked
 * before a repeated forced-sale pattern — deliberately: under this game's
 * calibration, holding enough of a high-fee vehicle for long enough to
 * cross £500 in fees also means riding through most of the shock schedule
 * on a thin cash buffer, which racks up several forced sales along the
 * way almost as a side effect. When both are true, the fee bill is the
 * more legible, more quantified story ("you paid £X, the tracker would
 * have charged £Y" — an exact, checkable number) and gets to be the
 * headline; a *repeated* pattern of forced sales still gets its own line
 * when it dominates and the fee bill never got large (e.g. a fee-free
 * bond, sold from under the player again and again). Last, the exact-month
 * bubble story, which falls back to the honest general "ground down" line
 * when nothing more specific fits (§26's brief: "prefer the honest general
 * line over a dramatic wrong one").
 *
 * `'the-card-ate-you'` (credit card debt spiral, Step 31) and
 * `'the-fake-dialog'` (the imitation-dialog scam, Step 32) are real
 * `DeathCauseId` values but are never selected here — both mechanics are
 * beyond the Step 1-28 MVP boundary (§26.1) and are simply never triggered
 * by anything `RunStats` can carry yet. Wiring them in is exactly the
 * later step's job, not a gap in this selector.
 */
export function causeIdFor(status: RunStatus, deathMonth: MonthIndex | null, stats: RunStats): DeathCauseId {
  if (status === 'survived') return 'survived';
  if (stats.scamsFunded > 0) return 'funded-a-scam';
  if (stats.feesPaid > FEE_DEATH_THRESHOLD) return 'eaten-by-fees';
  if (stats.forcedSales >= REPEATED_FORCED_SALE_THRESHOLD) return 'sold-at-the-bottom';
  if (deathMonth === BUBBLE_PEAK_MONTH) return 'broke-as-bubble-peaked';
  return 'ground-down-by-rent';
}

/* ------------------------------------------------------------------ *
 * §11.2 rule 5 — the flags the player missed, quoted from the sheet.
 * ------------------------------------------------------------------ */

/** Union of the fact-sheet red flags on every scam the player funded,
 * de-duplicated. `run()` puts this on `RunStats.redFlagsMissed`; the death
 * card (Step 27) is responsible for quoting the actual sheet field each
 * flag came from — see `RED_FLAG_FIELD` there. */
export function missedRedFlags(scamsFundedIds: readonly VehicleId[]): RedFlag[] {
  return [...new Set(scamsFundedIds.flatMap((id) => FACT_SHEETS[id].redFlags))];
}
