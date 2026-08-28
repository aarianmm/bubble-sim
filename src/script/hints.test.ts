/**
 * PLAN-COMET-ASSISTANT.md §4 / Step C2's stated deliverable: a headless test
 * driving a scripted sequence of GameState snapshots through `nextHint` and
 * asserting the exact months each hint fires, the 6-month gap, once-per-run,
 * and the two suppression rules. Same fixture idiom as src/sim/tick.test.ts.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ASSISTANT_HINTS, nextHint, type ShownHint } from './hints';
import { monthIndex } from '../sim/month';
import type { GameState, Holding, PopupItem, RunFlags, RunStats } from '../sim/types';

function baseFlags(overrides: Partial<RunFlags> = {}): RunFlags {
  return {
    onScamList: false,
    incomeSuspendedMonths: 0,
    era: 'a',
    moneyBase: 'period',
    everOpenedInbox: false,
    everOpenedFactSheet: false,
    ...overrides,
  };
}

function baseStats(overrides: Partial<RunStats> = {}): RunStats {
  return {
    peakWealth: 0,
    peakWealth1996: 0,
    finalWealth: 0,
    feesPaid: 0,
    trackerCounterfactualFees: 0,
    scamsFunded: 0,
    scamsDodged: 0,
    forcedSales: 0,
    monthsUnderwater: 0,
    scamsFundedIds: [],
    scamsDodgedIds: [],
    redFlagsMissed: [],
    ...overrides,
  };
}

function makePopup(overrides: Partial<PopupItem> = {}): PopupItem {
  return {
    id: 'pop.test',
    eventId: 'ev.test',
    title: 'Test popup',
    contentId: 'pop.test',
    cls: 'junk',
    openedMonth: 0,
    closesMonth: 2,
    x: 0,
    y: 0,
    width: 300,
    height: 250,
    ...overrides,
  };
}

function makeHolding(overrides: Partial<Holding> = {}): Holding {
  return {
    vehicleId: 'fenwick-index',
    value: 0,
    contributed: 0,
    withdrawn: 0,
    feesPaid: 0,
    targetPct: 0,
    locked: false,
    unlockedMonth: 0,
    collapsed: false,
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    month: monthIndex(1996, 1),
    status: 'running',
    cash: 0,
    holdings: {},
    unlocked: [],
    debt: null,
    inbox: [],
    popups: [],
    dialogs: [],
    flags: baseFlags(),
    stats: baseStats(),
    wealthHistory: [],
    marketHistory: [],
    deathMonth: null,
    deathCauseId: null,
    decisions: [],
    ...overrides,
  };
}

/** The eight authored fromMonths, in the array's own priority order. */
const M = {
  checkInbox: monthIndex(1996, 6),
  readFactSheet: monthIndex(1997, 1),
  idleCash: monthIndex(1997, 6),
  popups: monthIndex(1998, 1),
  addressBar: monthIndex(1998, 4),
  debt: monthIndex(1998, 7),
  statusBar: monthIndex(1998, 9),
  concentrated: monthIndex(1999, 1),
};

/**
 * A month-by-month state builder for the walkthrough test below. Each
 * condition switches on at a fixed month, chosen so the 6-month gap (not the
 * predicate) is what decides several of the exact fire months asserted
 * below — see the inline commentary at each assertion.
 */
function stateAt(month: number): GameState {
  return makeState({
    month,
    // Both flags stay false for the whole walkthrough. Each is only read by
    // its own once-per-run hint's predicate (!everOpenedInbox /
    // !everOpenedFactSheet); once that hint has fired, `shown` retires it
    // regardless of the flag's value, so there is no need to flip either
    // flag true afterward to keep this fixture honest.
    flags: baseFlags({ everOpenedInbox: false, everOpenedFactSheet: false }),
    cash: month < M.idleCash + 6 ? 900 : 100, // idle cash only while unlocked stays empty (see below)
    unlocked: month >= M.concentrated + 12 ? ['fenwick-index'] : [],
    holdings: month >= M.concentrated + 12 ? { 'fenwick-index': makeHolding({ value: 1000 }) } : {},
    popups: month >= M.popups && month < M.popups + 2 ? [makePopup({ openedMonth: month, closesMonth: month + 2 })] : [],
    debt:
      month >= M.debt - 5
        ? { limit: 1500, balance: 200, promoEndsMonth: M.debt + 12, aprPct: 29.8, interestPaid: 0 }
        : null,
  });
}

describe('nextHint (PLAN-COMET-ASSISTANT.md §4)', () => {
  it('fires the eight authored hints at exactly the expected months in one continuous walkthrough', () => {
    const shown: ShownHint[] = [];
    const fired: ShownHint[] = [];

    for (let month = 0; month <= 60; month++) {
      const hint = nextHint(stateAt(month), shown);
      if (hint) {
        shown.push({ id: hint.id, month });
        fired.push({ id: hint.id, month });
      }
    }

    // check-inbox: its own condition is true from month 5 with nothing shown
    // yet, so it fires the moment fromMonth is reached.
    // read-fact-sheet: fromMonth 12, gap from month 5 is already 7 — fires
    // at its own fromMonth.
    // idle-cash: fromMonth 17 is only 5 months after read-fact-sheet (12), so
    // the 6-month gap — not the predicate — pushes the fire to month 18.
    // popups-are-optional: fromMonth 24 is exactly 6 months after 18, so it
    // fires right on its fromMonth.
    // address-bar-check: fromMonth 27 is blocked by the gap from month 24
    // (only 3 months); the gap clears at month 30, which is also when its
    // (always-true) predicate is checked next, so it fires at 30 — ahead of
    // debt-caution, whose fromMonth (30) is the same month but which sits
    // later in ASSISTANT_HINTS's priority order.
    // debt-caution: next gap-cleared month after 30 is 36; its fromMonth (30)
    // already passed and its predicate (debt.balance > 0) is true by then.
    // status-bar-hover: next gap-cleared month after 36 is 42; fromMonth (32)
    // already passed, predicate always true.
    // concentrated-holdings: next gap-cleared month after 42 is 48;
    // fromMonth (36) already passed, and the fixture's single-vehicle 91%
    // concentration (1000 / (1000 + 100)) has been true since month 48
    // (M.concentrated + 12).
    expect(fired).toEqual([
      { id: 'check-inbox', month: M.checkInbox },
      { id: 'read-fact-sheet', month: M.readFactSheet },
      { id: 'idle-cash', month: 18 },
      { id: 'popups-are-optional', month: 24 },
      { id: 'address-bar-check', month: 30 },
      { id: 'debt-caution', month: 36 },
      { id: 'status-bar-hover', month: 42 },
      { id: 'concentrated-holdings', month: 48 },
    ]);

    // Every authored hint fired exactly once.
    expect(fired.map((f) => f.id).sort()).toEqual(ASSISTANT_HINTS.map((h) => h.id).sort());
  });

  it('enforces a minimum 6-month gap between any two hints', () => {
    const shown: ShownHint[] = [{ id: 'check-inbox', month: 10 }];
    // 5 months later: still inside the gap, no hint — even though
    // read-fact-sheet's own fromMonth (12) has passed and its predicate holds.
    expect(nextHint(stateAt(15), shown)).toBeNull();
    // exactly 6 months later: the gap clears.
    const result = nextHint(stateAt(16), shown);
    expect(result?.id).toBe('read-fact-sheet');
  });

  it('never fires the same hint twice in a run (once-per-run)', () => {
    const shown: ShownHint[] = ASSISTANT_HINTS.map((h, i) => ({ id: h.id, month: i * 15 }));
    // Every hint id is already in `shown`; state month is far past every
    // fromMonth and every predicate would otherwise match.
    const state = stateAt(131);
    expect(nextHint(state, shown)).toBeNull();
  });

  it('never fires while a blocking dialog is open, even if a hint would otherwise match', () => {
    const withDialog = makeState({
      month: M.checkInbox,
      dialogs: [
        {
          id: 'dlg.test',
          eventId: 'ev.test',
          title: 'Test',
          contentId: 'dlg.test',
          cls: 'shock',
          raisedMonth: M.checkInbox,
          buttons: [],
        },
      ],
    });
    expect(nextHint(withDialog, [])).toBeNull();
  });

  it('never fires over the death card or the survived screen (status !== "running")', () => {
    const dead = makeState({ month: M.checkInbox, status: 'dead' });
    const survived = makeState({ month: M.checkInbox, status: 'survived' });
    expect(nextHint(dead, [])).toBeNull();
    expect(nextHint(survived, [])).toBeNull();
  });

  it('respects fromMonth — a hint never fires before its authored earliest month', () => {
    const tooEarly = makeState({ month: M.checkInbox - 1, flags: baseFlags({ everOpenedInbox: false }) });
    expect(nextHint(tooEarly, [])).toBeNull();
  });

  // plan §4 / §1: predicates must read only visible state. A source-text scan
  // is cheap and catches a future edit that reintroduces a verdict on a
  // specific product, even though nothing in HintDef's own shape prevents it.
  it('never reads a spoiler field forbidden by plan §1', () => {
    const source = readFileSync(new URL('./hints.ts', import.meta.url), 'utf-8');
    const forbidden = [
      'isScam',
      'collapseMonth',
      'sellableAfterCollapse',
      '.tier',
      'imitatesDialog',
      'scamsFundedIds',
      'scamsDodgedIds',
      'deathCauseId',
      'redFlags',
    ];
    for (const term of forbidden) {
      expect(source.includes(term), `hints.ts must not reference "${term}"`).toBe(false);
    }
  });
});
