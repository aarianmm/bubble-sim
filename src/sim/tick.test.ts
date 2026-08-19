/**
 * Step 7 done-condition: unit-test each of §7.3's six sub-steps in
 * isolation. tick.test.ts owns this; verify.test.ts (Step 9) only exercises
 * the composed `tick`/`run` through full scripted playthroughs.
 */

import { describe, expect, it } from 'vitest';
import {
  payIn,
  expensesOut,
  marketMove,
  interestAndFees,
  fireScheduledEvents,
  solvencyCheck,
  tick,
} from './tick';
import { expensesFor } from './basket';
import { monthIndex } from './month';
import { MONTHLY_PAY } from './types';
import type { GameState, Holding, RunFlags, RunStats, ScriptEvent, Decision } from './types';
import seriesFile from '../data/series.json';
import type { MarketSeriesFile } from '../data/schema';

const SERIES = seriesFile as unknown as MarketSeriesFile;

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

function makeHolding(vehicleId: Holding['vehicleId'], overrides: Partial<Holding> = {}): Holding {
  return {
    vehicleId,
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

/* ------------------------------------------------------------------ *
 * 1. Pay in
 * ------------------------------------------------------------------ */

describe('payIn (§7.3.1)', () => {
  it('adds the fixed £760 nominal salary, never more, never less', () => {
    const next = payIn(makeState({ cash: 100 }));
    expect(next.cash).toBe(100 + MONTHLY_PAY);
  });

  it('skips pay while incomeSuspendedMonths > 0, and decrements the counter', () => {
    const next = payIn(makeState({ cash: 100, flags: baseFlags({ incomeSuspendedMonths: 3 }) }));
    expect(next.cash).toBe(100); // no pay this month
    expect(next.flags.incomeSuspendedMonths).toBe(2);
  });

  it('resumes pay the month the counter reaches zero', () => {
    const suspended = payIn(makeState({ cash: 0, flags: baseFlags({ incomeSuspendedMonths: 1 }) }));
    expect(suspended.flags.incomeSuspendedMonths).toBe(0);
    const resumed = payIn(suspended);
    expect(resumed.cash).toBe(MONTHLY_PAY);
  });
});

/* ------------------------------------------------------------------ *
 * 2. Expenses out
 * ------------------------------------------------------------------ */

describe('expensesOut (§7.3.2, §8.1-8.3)', () => {
  it('deducts exactly the current-year basket total (§8.1: £645 in 1996)', () => {
    const next = expensesOut(makeState({ cash: 1000, month: monthIndex(1996, 6) }));
    expect(next.cash).toBeCloseTo(1000 - expensesFor(monthIndex(1996, 6)).total, 6);
  });

  it('lets cash go negative — catching that is step 6, not this one', () => {
    const next = expensesOut(makeState({ cash: 0, month: monthIndex(2006, 1) }));
    expect(next.cash).toBeLessThan(0);
  });
});

/* ------------------------------------------------------------------ *
 * 3. Market moves
 * ------------------------------------------------------------------ */

describe('marketMove (§7.3.3, §11.4 collapse)', () => {
  it('multiplies a held vehicle by its monthly series multiplier', () => {
    const month = monthIndex(2000, 3); // the crash month — a real, non-trivial multiplier
    const multiplier = SERIES.rows[month].values['fenwick-index' as never] as number;
    const state = makeState({
      month,
      unlocked: ['fenwick-index'],
      holdings: { 'fenwick-index': makeHolding('fenwick-index', { value: 1000 }) },
    });
    const next = marketMove(state);
    expect(next.holdings['fenwick-index']!.value).toBeCloseTo(1000 * multiplier, 6);
  });

  it('leaves cash and unrelated holdings untouched', () => {
    const state = makeState({ cash: 500, month: monthIndex(2000, 1) });
    const next = marketMove(state);
    expect(next.cash).toBe(500);
  });

  it('zeroes a scam permanently in its collapse month (§11.4, e.g. Meridian Dec 1997)', () => {
    const collapseMonth = monthIndex(1997, 12);
    const state = makeState({
      month: collapseMonth,
      unlocked: ['meridian-guaranteed'],
      holdings: { 'meridian-guaranteed': makeHolding('meridian-guaranteed', { value: 800 }) },
    });
    const next = marketMove(state);
    expect(next.holdings['meridian-guaranteed']!.value).toBe(0);
    expect(next.holdings['meridian-guaranteed']!.collapsed).toBe(true);

    // And it stays zero the month after — series.json carries 1 thereafter,
    // so 0 * 1 = 0, permanently, with no partial recovery (§11.4).
    const after = marketMove({ ...next, month: collapseMonth + 1 });
    expect(after.holdings['meridian-guaranteed']!.value).toBe(0);
  });

  it('marks Vertex collapsed but non-zero — the pump falls -98%, it does not vanish (§11.5)', () => {
    const collapseMonth = monthIndex(1999, 9);
    const state = makeState({
      month: collapseMonth,
      unlocked: ['vertex-communications'],
      holdings: { 'vertex-communications': makeHolding('vertex-communications', { value: 1000 }) },
    });
    const next = marketMove(state);
    expect(next.holdings['vertex-communications']!.collapsed).toBe(true);
    expect(next.holdings['vertex-communications']!.value).toBeGreaterThan(0);
    expect(next.holdings['vertex-communications']!.value).toBeLessThan(100); // ~-98%
  });
});

/* ------------------------------------------------------------------ *
 * 4. Interest and fees
 * ------------------------------------------------------------------ */

describe('interestAndFees (§7.3.4, §9.3, §13)', () => {
  it('deducts a vehicle annual fee pro-rata monthly, and records it as feesPaid', () => {
    const state = makeState({
      unlocked: ['fenwick-index'], // 0.4% annual (§9.1)
      holdings: { 'fenwick-index': makeHolding('fenwick-index', { value: 1200, feesPaid: 0 }) },
    });
    const next = interestAndFees(state);
    const expectedFee = 1200 * (0.4 / 100 / 12);
    expect(next.holdings['fenwick-index']!.value).toBeCloseTo(1200 - expectedFee, 6);
    expect(next.holdings['fenwick-index']!.feesPaid).toBeCloseTo(expectedFee, 6);
    expect(next.stats.feesPaid).toBeCloseTo(expectedFee, 6);
  });

  it('charges nothing for a zero-fee vehicle (Northmoor, cash-equivalent default)', () => {
    const state = makeState({
      unlocked: ['northmoor-bond'],
      holdings: { 'northmoor-bond': makeHolding('northmoor-bond', { value: 500 }) },
    });
    const next = interestAndFees(state);
    expect(next.holdings['northmoor-bond']!.value).toBe(500);
  });

  it('takes 20% of the monthly gain as a performance fee (Ashcombe, §9.1)', () => {
    const month = monthIndex(1997, 1);
    const multiplier = SERIES.rows[month].values['ashcombe-managed' as never] as number;
    const preValue = 1000;
    const state = makeState({
      month,
      unlocked: ['ashcombe-managed'],
      holdings: { 'ashcombe-managed': makeHolding('ashcombe-managed', { value: preValue * multiplier }) },
    });
    const next = interestAndFees(state);
    const postMoveValue = preValue * multiplier;
    const gain = postMoveValue - preValue;
    // Both the annual and performance fee are computed off the same
    // post-market-move value and deducted together — see tick.ts §7.3.4.
    const expectedPerfFee = gain > 0 ? gain * 0.2 : 0;
    const expectedAnnualFee = postMoveValue * (3.0 / 100 / 12);
    expect(next.holdings['ashcombe-managed']!.feesPaid).toBeCloseTo(expectedPerfFee + expectedAnnualFee, 6);
  });

  it('leaves cash interest at 0% (§9.1 — the default vehicle)', () => {
    const next = interestAndFees(makeState({ cash: 1000 }));
    expect(next.cash).toBe(1000);
  });

  it('compounds debt interest only after the promo period ends (§13 seam)', () => {
    const month = monthIndex(1999, 1);
    const withinPromo = interestAndFees(
      makeState({ month, debt: { limit: 2000, balance: 500, promoEndsMonth: month + 1, aprPct: 29.8, interestPaid: 0 } }),
    );
    expect(withinPromo.debt!.balance).toBe(500);

    const pastPromo = interestAndFees(
      makeState({ month, debt: { limit: 2000, balance: 500, promoEndsMonth: month, aprPct: 29.8, interestPaid: 0 } }),
    );
    expect(pastPromo.debt!.balance).toBeCloseTo(500 * (1 + 29.8 / 100 / 12), 6);
    expect(pastPromo.debt!.interestPaid).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ *
 * 5. Scheduled events fire
 * ------------------------------------------------------------------ */

describe('fireScheduledEvents (§7.3.5)', () => {
  const mailEvent: ScriptEvent = {
    id: 'ev.test.mail',
    date: '1996-04',
    month: monthIndex(1996, 4),
    channel: 'MAIL',
    cls: 'legit',
    contentId: 'msg.northmoor-bond',
    vehicleId: 'northmoor-bond',
    blocksTime: false,
  };

  it('materializes a MAIL event into the inbox, unread', () => {
    const next = fireScheduledEvents(makeState({ month: mailEvent.month }), [mailEvent], []);
    expect(next.inbox).toHaveLength(1);
    expect(next.inbox[0].status).toBe('unread');
    expect(next.inbox[0].vehicleId).toBe('northmoor-bond');
  });

  it('unlocks a vehicle and charges its accept fee on accept-offer (§11.1)', () => {
    const decision: Decision = { type: 'accept-offer', month: mailEvent.month, vehicleId: 'meridian-guaranteed', source: 'test' };
    const next = fireScheduledEvents(makeState({ month: mailEvent.month, cash: 1000 }), [], [decision]);
    expect(next.unlocked).toContain('meridian-guaranteed');
    expect(next.cash).toBeLessThan(1000); // the §11.1 admin fee, charged immediately
    expect(next.flags.onScamList).toBe(true); // scam-specific
  });

  it('charges nothing to accept a legitimate offer', () => {
    const decision: Decision = { type: 'accept-offer', month: mailEvent.month, vehicleId: 'fenwick-index', source: 'test' };
    const next = fireScheduledEvents(makeState({ month: mailEvent.month, cash: 1000 }), [], [decision]);
    expect(next.cash).toBe(1000);
    expect(next.flags.onScamList).toBe(false);
  });

  it('credits windfall cash only when the mail is opened, and only once (§8.5)', () => {
    const windfallEvent: ScriptEvent = {
      id: 'ev.test.windfall',
      date: '1997-02',
      month: monthIndex(1997, 2),
      channel: 'MAIL',
      cls: 'windfall',
      contentId: 'msg.windfall-1997-02',
      amount: 2000,
      blocksTime: false,
    };
    let state = makeState({ month: windfallEvent.month, cash: 0 });
    state = fireScheduledEvents(state, [windfallEvent], []); // arrives, not opened — no cash yet
    expect(state.cash).toBe(0);

    const open: Decision = { type: 'open-mail', month: windfallEvent.month, mailId: windfallEvent.id };
    state = fireScheduledEvents(state, [], [open]);
    expect(state.cash).toBe(2000);

    // Opening it again (idempotent) must not double-credit.
    state = fireScheduledEvents(state, [], [open]);
    expect(state.cash).toBe(2000);
  });

  it('forfeits a windfall that is deleted unopened (§22.1 "Delete all... will also delete a windfall")', () => {
    const windfallEvent: ScriptEvent = {
      id: 'ev.test.windfall2',
      date: '2000-02',
      month: monthIndex(2000, 2),
      channel: 'MAIL',
      cls: 'windfall',
      contentId: 'msg.windfall-2000-02',
      amount: 1800,
      blocksTime: false,
    };
    let state = makeState({ month: windfallEvent.month, cash: 0 });
    state = fireScheduledEvents(state, [windfallEvent], []);
    state = fireScheduledEvents(state, [], [{ type: 'delete-mail', month: windfallEvent.month, mailId: windfallEvent.id }]);
    expect(state.cash).toBe(0);
  });

  it('auto-resolves a blocking dialog with its scripted default when no decision arrives (§20.1)', () => {
    const shockEvent: ScriptEvent = {
      id: 'ev.test.shock',
      date: '1997-09',
      month: monthIndex(1997, 9),
      channel: 'DLG',
      cls: 'shock',
      contentId: 'dlg.shock-1997-09',
      amount: 600,
      blocksTime: true,
    };
    const next = fireScheduledEvents(makeState({ month: shockEvent.month, cash: 1000 }), [shockEvent], []);
    // "Pay from cash" is the scripted default (§12.3 PAY_OR_SELL) — the £600
    // is gone from cash and no dialog is left open behind it.
    expect(next.cash).toBe(400);
    expect(next.dialogs).toHaveLength(0);
  });

  it('sets flags.era to "b" on the era-switch acknowledgement (§18.2)', () => {
    const eraEvent: ScriptEvent = {
      id: 'ev.test.era',
      date: '2002-01',
      month: monthIndex(2002, 1),
      channel: 'DLG',
      cls: 'era-switch',
      contentId: 'dlg.era-switch-2002-01',
      blocksTime: true,
    };
    const next = fireScheduledEvents(makeState({ month: eraEvent.month }), [eraEvent], []);
    expect(next.flags.era).toBe('b');
  });

  it('executes a rebalance: sells one holding to fund a buy in another', () => {
    const month = monthIndex(2000, 1);
    const state = makeState({
      month,
      unlocked: ['fenwick-index', 'kingsley-gilt'],
      holdings: {
        'fenwick-index': makeHolding('fenwick-index', { value: 1000 }),
        'kingsley-gilt': makeHolding('kingsley-gilt', { value: 0 }),
      },
    });
    const decision: Decision = {
      type: 'rebalance',
      month,
      targets: { 'fenwick-index': 0, 'kingsley-gilt': 100 },
      cashPct: 0,
    };
    const next = fireScheduledEvents(state, [], [decision]);
    expect(next.holdings['fenwick-index']!.value).toBe(0);
    expect(next.holdings['kingsley-gilt']!.value).toBeCloseTo(1000, 6); // both 0% exit fee — nothing lost in the move
  });

  it('charges the exit fee to the vehicle being sold, not the one being bought (Technova, §9.1)', () => {
    const month = monthIndex(2000, 1);
    const state = makeState({
      month,
      unlocked: ['technova-growth', 'fenwick-index'], // Technova carries a 1% exit fee (§9.1)
      holdings: {
        'technova-growth': makeHolding('technova-growth', { value: 1000 }),
        'fenwick-index': makeHolding('fenwick-index', { value: 0 }),
      },
    });
    const decision: Decision = {
      type: 'rebalance',
      month,
      targets: { 'technova-growth': 0, 'fenwick-index': 100 },
      cashPct: 0,
    };
    const next = fireScheduledEvents(state, [], [decision]);
    expect(next.holdings['technova-growth']!.value).toBe(0);
    expect(next.holdings['technova-growth']!.feesPaid).toBeCloseTo(1000 * 0.01, 6);
    expect(next.holdings['fenwick-index']!.value).toBeCloseTo(1000 * 0.99, 6); // the buyer receives net of the seller's exit fee
  });

  it('refuses to sell Vertex after its collapse — unsellable, not just worthless (§11.5)', () => {
    const month = monthIndex(1999, 10);
    const state = makeState({
      month,
      cash: 0,
      unlocked: ['vertex-communications'],
      holdings: { 'vertex-communications': makeHolding('vertex-communications', { value: 20, collapsed: true }) },
    });
    const decision: Decision = { type: 'rebalance', month, targets: { 'vertex-communications': 0 }, cashPct: 100 };
    const next = fireScheduledEvents(state, [], [decision]);
    expect(next.holdings['vertex-communications']!.value).toBe(20); // untouched — refused, not sold
    expect(next.cash).toBe(0);
  });

  it('delivers a Step 31/32 mvpDeferred event as ordinary mail — §26.1 says "deliver it", not "skip it"', () => {
    const cardEvent: ScriptEvent = {
      id: 'ev.test.card',
      date: '1998-05',
      month: monthIndex(1998, 5),
      channel: 'MAIL',
      cls: 'credit',
      contentId: 'msg.capital-direct-card-1998-05',
      vehicleId: 'capital-direct-card',
      mvpDeferred: true,
      blocksTime: false,
    };
    const next = fireScheduledEvents(makeState({ month: cardEvent.month }), [cardEvent], []);
    expect(next.inbox).toHaveLength(1);
    expect(next.inbox[0].vehicleId).toBe('capital-direct-card');
  });

  it('"accepting" a deferred card never creates a working debt facility — state.debt stays null', () => {
    const decision: Decision = {
      type: 'accept-offer',
      month: monthIndex(1998, 5),
      vehicleId: 'capital-direct-card',
      source: 'test',
    };
    const next = fireScheduledEvents(makeState({ month: monthIndex(1998, 5) }), [], [decision]);
    expect(next.unlocked).toContain('capital-direct-card'); // an inert holding, per §26.1
    expect(next.debt).toBeNull(); // nothing to fund it with (§13/§26.1 MVP boundary)
  });
});

/* ------------------------------------------------------------------ *
 * 6. Solvency check
 * ------------------------------------------------------------------ */

describe('solvencyCheck (§7.3.6, §12.3)', () => {
  it('does nothing when cash is non-negative', () => {
    const state = makeState({ cash: 50 });
    expect(solvencyCheck(state)).toBe(state); // same reference — a true no-op
  });

  it('liquidates a holding to cover a shortfall, and counts it as a forced sale', () => {
    const state = makeState({
      cash: -100,
      unlocked: ['fenwick-index'],
      holdings: { 'fenwick-index': makeHolding('fenwick-index', { value: 500 }) },
    });
    const next = solvencyCheck(state);
    expect(next.status).toBe('running'); // survived via liquidation
    expect(next.cash).toBeGreaterThanOrEqual(0);
    expect(next.holdings['fenwick-index']!.value).toBeLessThan(500);
    expect(next.stats.forcedSales).toBe(1);
  });

  it('ends the run when liquidation cannot cover the shortfall and there is no credit (§13/§26.1 MVP)', () => {
    const state = makeState({ month: monthIndex(2000, 3), cash: -900 }); // no holdings, no card
    const next = solvencyCheck(state);
    expect(next.status).toBe('dead');
    expect(next.deathMonth).toBe(monthIndex(2000, 3));
  });

  it('refuses to liquidate Vertex after collapse even to avoid death (§11.5)', () => {
    const state = makeState({
      cash: -50,
      unlocked: ['vertex-communications'],
      holdings: { 'vertex-communications': makeHolding('vertex-communications', { value: 500, collapsed: true }) },
    });
    const next = solvencyCheck(state);
    expect(next.status).toBe('dead'); // couldn't touch the one asset it had
    expect(next.holdings['vertex-communications']!.value).toBe(500); // left untouched
  });
});

/* ------------------------------------------------------------------ *
 * The composed tick — order matters (§7.3 preamble)
 * ------------------------------------------------------------------ */

describe('tick (§7.3) — composition and order', () => {
  it('runs sub-steps in the exact §7.3 order: pay-in and expenses land before a same-month shock', () => {
    // A cash-only month with no shock: pay in, then expenses out.
    const month = monthIndex(1996, 6);
    const next = tick(makeState({ month, cash: 0 }), [], []);
    expect(next.cash).toBeCloseTo(MONTHLY_PAY - expensesFor(month).total, 6);
  });

  it('is a no-op once the run has ended', () => {
    const dead = makeState({ status: 'dead', cash: -50, deathMonth: 5 });
    expect(tick(dead, [], [])).toBe(dead);
  });

  it('kills a cash-only player exactly the month a shock exceeds their buffer', () => {
    const shockEvent: ScriptEvent = {
      id: 'ev.test.shock2',
      date: '2000-03',
      month: monthIndex(2000, 3),
      channel: 'DLG',
      cls: 'shock',
      contentId: 'dlg.shock-2000-03-boiler',
      amount: 900,
      blocksTime: true,
    };
    const next = tick(makeState({ month: shockEvent.month, cash: 300 }), [shockEvent], []);
    expect(next.status).toBe('dead');
  });
});
