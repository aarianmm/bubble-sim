/**
 * PLAN-COMET-ASSISTANT.md §4 — deterministic, authored hints for the Comet
 * Assistant's balloon (the plan's "fourth notification surface", quieter
 * than Tier 3 — see the BUILD STATUS Deviation this step adds). Same idiom
 * as src/script/timeline.ts: a typed, hand-dated array read by a pure
 * scheduler. No `Math.random()`, no `Date`, no wall time (CLAUDE.md rule 1,
 * §25.1) — everything here is a function of `state.month` and visible state.
 *
 * SIGNATURE NOTE (plan §4 — "decide and document the scheduler's
 * signature"): `nextHint` takes `shown: ShownHint[]` rather than a bare
 * `shownIds: string[]` plus a separately-threaded `lastShownMonth`. A bare id
 * list can answer "has this hint fired?" but not "how long ago?", which the
 * 6-month gap needs; carrying the month next to each id keeps one array the
 * single source of truth for both questions, so there is nothing for two
 * parallel pieces of caller state to drift out of sync on. The scheduler
 * takes the max month across `shown` rather than trusting append order, so
 * the caller (`src/ui/useAssistant.ts`) doesn't have to promise it appends
 * in chronological order either — it only has to promise it appends what
 * `nextHint` actually returned.
 *
 * VISIBLE-STATE NOTE (plan §1): predicates below read only fields the player
 * can see — `flags`, `cash`, `unlocked`, `popups`, `debt`, and derived
 * allocation percentages. None of plan §1's spoiler fields on VehicleDef or
 * PopupItem appear here, and no predicate reads the body of unread mail — a
 * hint must never be a verdict on a specific product. `hints.test.ts`
 * source-scans this file's text for those exact identifiers (deliberately
 * not repeated in this comment) so a later edit cannot reintroduce a verdict
 * by accident.
 *
 * Two hints below (`address-bar-check`, `status-bar-hover`) are calendar-paced
 * general method reminders rather than reactive triggers. The plan's own §4
 * examples include one keyed on "a hover-preview URL mismatch has been on
 * screen" — that signal lives in chrome/router state (`LoadState`), not in
 * `GameState`, and plan §1 restricts every predicate here to `GameState`.
 * Coaching the same checking *habit* on a fixed month, rather than reacting
 * to a specific occurrence the sim doesn't expose, keeps the predicate pure
 * and keeps the fired month exactly predictable for the headless test.
 */
import type { GameState } from '../sim/types';
import type { MonthIndex } from '../sim/month';
import { monthIndex } from '../sim/month';
import { currentAllocation } from '../sim/selectors';

export interface HintDef {
  id: string;
  /** Earliest month this hint may fire. */
  fromMonth: MonthIndex;
  /** Pure predicate on visible state; no Date, no randomness. */
  when: (state: GameState) => boolean;
  /** Key into ASSISTANT_HINT_COPY in src/content/assistant.ts. */
  contentId: string;
  /** Fire at most once per run. */
  once: true;
}

/** One record per hint the scheduler has already chosen, in no particular order. */
export interface ShownHint {
  id: string;
  month: MonthIndex;
}

/** plan §4 — infrequency is the point: never more than one hint per six simulated months. */
const MIN_GAP_MONTHS = 6;

/**
 * Array order is priority order — the scheduler returns the first match. Kept
 * roughly chronological by `fromMonth` so the priority order and the natural
 * story order agree, but that is a readability choice, not a rule the
 * scheduler depends on.
 */
export const ASSISTANT_HINTS: HintDef[] = [
  {
    id: 'check-inbox',
    fromMonth: monthIndex(1996, 6),
    when: (state) => !state.flags.everOpenedInbox,
    contentId: 'hint.check-inbox',
    once: true,
  },
  {
    id: 'read-fact-sheet',
    fromMonth: monthIndex(1997, 1),
    when: (state) => !state.flags.everOpenedFactSheet,
    contentId: 'hint.read-fact-sheet',
    once: true,
  },
  {
    id: 'idle-cash',
    fromMonth: monthIndex(1997, 6),
    when: (state) => state.cash > 800 && state.unlocked.length === 0,
    contentId: 'hint.idle-cash',
    once: true,
  },
  {
    id: 'popups-are-optional',
    fromMonth: monthIndex(1998, 1),
    when: (state) => state.popups.length > 0,
    contentId: 'hint.popups-are-optional',
    once: true,
  },
  {
    id: 'address-bar-check',
    fromMonth: monthIndex(1998, 4),
    when: () => true,
    contentId: 'hint.address-bar-check',
    once: true,
  },
  {
    id: 'debt-caution',
    fromMonth: monthIndex(1998, 7),
    when: (state) => state.debt !== null && state.debt.balance > 0,
    contentId: 'hint.debt-caution',
    once: true,
  },
  {
    id: 'status-bar-hover',
    fromMonth: monthIndex(1998, 9),
    when: () => true,
    contentId: 'hint.status-bar-hover',
    once: true,
  },
  {
    id: 'concentrated-holdings',
    fromMonth: monthIndex(1999, 1),
    when: (state) => {
      const { byVehicle } = currentAllocation(state);
      return Object.values(byVehicle).some((pct) => (pct ?? 0) > 70);
    },
    contentId: 'hint.concentrated-holdings',
    once: true,
  },
];

/**
 * Pure scheduler: first matching, not-yet-shown hint whose `fromMonth` has
 * passed, subject to the 6-month gap and the two suppression rules below.
 * Never fires while a blocking dialog is open, and never over the death
 * card / survived screen (`status !== 'running'`) — both plan §4 rules.
 */
export function nextHint(state: GameState, shown: ShownHint[]): HintDef | null {
  if (state.status !== 'running') return null;
  if (state.dialogs.length > 0) return null;

  if (shown.length > 0) {
    const lastMonth = shown.reduce((max, s) => Math.max(max, s.month), -Infinity);
    if (state.month - lastMonth < MIN_GAP_MONTHS) return null;
  }

  const shownIds = new Set(shown.map((s) => s.id));

  for (const hint of ASSISTANT_HINTS) {
    if (shownIds.has(hint.id)) continue;
    if (state.month < hint.fromMonth) continue;
    if (hint.when(state)) return hint;
  }

  return null;
}
