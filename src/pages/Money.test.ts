/**
 * Money.tsx — the pure allocation maths (Step 23, §12.2).
 *
 * These tests build focused fixture `GameState`s with holdings directly
 * (matching the exact numbers in §22.5's worked example: £1,240 cash +
 * £3,100 tracker + £1,860 mediocre fund = £6,200 net worth, Sep 2000) so
 * the slider maths — proportional redistribution, locks, the 100%
 * invariant, suspended-fund constraints, and the rebalance confirm-step
 * itemisation — is verified independently of React. MoneyPage.test.tsx then
 * drives the real AppShell, router and engine in jsdom.
 */
import { describe, expect, it } from 'vitest';
import {
  buildDraftRows,
  buildRebalanceDecision,
  buildRebalancePreview,
  allocationConstraint,
  reconcileDraftRows,
  redistribute,
  redistributeForState,
  returnSincePurchase,
  roundToIntegerAllocation,
  toggleLock,
  type DraftRow,
} from './Money';
import { createInitialState } from '../ui/provisionalSim';
import { monthIndex } from '../sim/month';
import { VEHICLES } from '../sim/vehicles';
import type { GameState, Holding } from '../sim/types';

function fixtureHolding(overrides: Partial<Holding> & Pick<Holding, 'vehicleId'>): Holding {
  return {
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

/** §22.5's worked example, exactly: Sep 2000, £1,240 cash (20%), £3,100 in
 * the tracker (50%), £1,860 in a mediocre growth fund (30%) — £6,200 net
 * worth, integer percentages with no rounding remainder to absorb. */
function fixtureState(): GameState {
  const base = createInitialState();
  return {
    ...base,
    month: monthIndex(2000, 9),
    cash: 1240,
    unlocked: ['fenwick-index', 'technova-growth'],
    holdings: {
      'fenwick-index': fixtureHolding({
        vehicleId: 'fenwick-index',
        value: 3100,
        contributed: 2366, // §22.5: "▲ 31%" — (3100-2366)/2366 ≈ 31%
        feesPaid: 38,
      }),
      'technova-growth': fixtureHolding({
        vehicleId: 'technova-growth',
        value: 1860,
        contributed: 600, // §22.5: "▲ 210%" — (1860-600)/600 = 210%
        feesPaid: 420,
      }),
    },
  };
}

describe('buildDraftRows', () => {
  it('matches §22.5\'s worked example exactly, summing to 100', () => {
    const rows = buildDraftRows(fixtureState());
    expect(rows.map((r) => [r.id, r.pct])).toEqual([
      ['cash', 20],
      ['fenwick-index', 50],
      ['technova-growth', 30],
    ]);
    expect(rows.reduce((s, r) => s + r.pct, 0)).toBe(100);
  });

  it('is 100% cash with no holdings (the real app today — Step 24 not merged)', () => {
    const rows = buildDraftRows(createInitialState());
    expect(rows).toEqual([{ id: 'cash', label: 'Cash', pct: 100, locked: false }]);
  });
});

describe('persistent draft reconciliation and suspended constraints', () => {
  it('keeps existing targets and adds a newly accepted vehicle at 0%', () => {
    const state = fixtureState();
    const draft: DraftRow[] = [
      { id: 'cash', label: 'Cash', pct: 20, locked: false },
      { id: 'fenwick-index', label: 'Tracker', pct: 50, locked: true },
      { id: 'technova-growth', label: 'Mediocre', pct: 30, locked: false },
    ];
    const withNewOffer: GameState = {
      ...state,
      unlocked: [...state.unlocked, 'granville-plc'],
      holdings: {
        ...state.holdings,
        'granville-plc': fixtureHolding({ vehicleId: 'granville-plc' }),
      },
    };
    const reconciled = reconcileDraftRows(draft, withNewOffer);
    expect(reconciled.map((row) => [row.id, row.pct, row.locked])).toEqual([
      ['cash', 20, false],
      ['fenwick-index', 50, true],
      ['technova-growth', 30, false],
      ['granville-plc', 0, false],
    ]);
    expect(reconciled.reduce((sum, row) => sum + row.pct, 0)).toBe(100);
  });

  it('removes an impossible pending purchase when an instrument becomes suspended', () => {
    const base = createInitialState();
    const suspended: GameState = {
      ...base,
      cash: 1000,
      unlocked: ['meridian-guaranteed'],
      holdings: {
        'meridian-guaranteed': fixtureHolding({
          vehicleId: 'meridian-guaranteed',
          value: 0,
          collapsed: true,
        }),
      },
    };
    const reconciled = reconcileDraftRows([
      { id: 'cash', label: 'Cash', pct: 50, locked: false },
      { id: 'meridian-guaranteed', label: 'Meridian', pct: 50, locked: true },
    ], suspended);
    expect(reconciled.map((row) => [row.id, row.pct, row.locked])).toEqual([
      ['cash', 100, false],
      ['meridian-guaranteed', 0, false],
    ]);
  });

  it('disables a worthless suspension, caps an exitable suspension, and freezes Vertex', () => {
    const base = createInitialState();
    const state: GameState = {
      ...base,
      cash: 80,
      unlocked: ['meridian-guaranteed', 'vertex-communications'],
      holdings: {
        'meridian-guaranteed': fixtureHolding({
          vehicleId: 'meridian-guaranteed', value: 0, collapsed: true,
        }),
        'vertex-communications': fixtureHolding({
          vehicleId: 'vertex-communications', value: 20, collapsed: true,
        }),
      },
    };
    const rows = buildDraftRows(state);
    expect(allocationConstraint(state, rows.find((row) => row.id === 'meridian-guaranteed')!)).toMatchObject({
      maxPct: 0, disabled: true,
    });
    expect(allocationConstraint(state, rows.find((row) => row.id === 'vertex-communications')!)).toMatchObject({
      maxPct: 20, disabled: true,
    });

    const exitable: GameState = {
      ...state,
      cash: 80,
      unlocked: ['meridian-guaranteed'],
      holdings: {
        'meridian-guaranteed': fixtureHolding({
          vehicleId: 'meridian-guaranteed', value: 20, collapsed: true,
        }),
      },
    };
    expect(allocationConstraint(exitable, buildDraftRows(exitable)[1])).toMatchObject({
      maxPct: 20, disabled: false,
    });
  });

  it('never increases a suspended row through another slider\'s proportional redistribution', () => {
    const base = createInitialState();
    const state: GameState = {
      ...base,
      cash: 50,
      unlocked: ['fenwick-index', 'meridian-guaranteed'],
      holdings: {
        'fenwick-index': fixtureHolding({ vehicleId: 'fenwick-index', value: 30 }),
        'meridian-guaranteed': fixtureHolding({
          vehicleId: 'meridian-guaranteed', value: 20, collapsed: true,
        }),
      },
    };
    const rows = buildDraftRows(state);
    const afterCashDrag = redistributeForState(state, rows, 'cash', 0);
    expect(afterCashDrag.map((row) => [row.id, row.pct])).toEqual([
      ['cash', 0],
      ['fenwick-index', 80],
      ['meridian-guaranteed', 20],
    ]);

    const afterSuspendedReduction = redistributeForState(
      state,
      rows.map((row) => (row.id === 'fenwick-index' ? { ...row, locked: true } : row)),
      'meridian-guaranteed',
      10,
    );
    expect(afterSuspendedReduction.find((row) => row.id === 'meridian-guaranteed')?.pct).toBe(10);
    expect(afterSuspendedReduction.find((row) => row.id === 'fenwick-index')?.pct).toBe(30);
    expect(afterSuspendedReduction.reduce((sum, row) => sum + row.pct, 0)).toBe(100);
    expect(afterSuspendedReduction.find((row) => row.id === 'fenwick-index')?.locked).toBe(true);
  });
});

describe('returnSincePurchase', () => {
  it('reproduces the §22.5 example returns', () => {
    const state = fixtureState();
    expect(Math.round(returnSincePurchase(state.holdings['fenwick-index']!))).toBe(31);
    expect(Math.round(returnSincePurchase(state.holdings['technova-growth']!))).toBe(210);
  });

  it('is flat, not a divide-by-zero, when nothing has been contributed', () => {
    expect(returnSincePurchase(fixtureHolding({ vehicleId: 'cash' }))).toBe(0);
  });
});

describe('roundToIntegerAllocation', () => {
  it('sums to exactly the target despite fractional shares', () => {
    const out = roundToIntegerAllocation([33.34, 33.33, 33.33], 100);
    expect(out.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('gives the largest remainder the extra point, not just row 0', () => {
    // 10/70, 30/70, 30/70 of 100 -> 14.28, 42.86, 42.86 (frac .28/.86/.86);
    // the two largest-fraction rows should each get bumped, not always [0].
    const out = roundToIntegerAllocation([14.285714, 42.857143, 42.857143], 100);
    expect(out).toEqual([14, 43, 43]);
    expect(out.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('handles a non-100 target (used internally by redistribute)', () => {
    const out = roundToIntegerAllocation([10, 20], 25);
    expect(out.reduce((a, b) => a + b, 0)).toBe(25);
  });

  it('returns [] for an empty row set', () => {
    expect(roundToIntegerAllocation([], 100)).toEqual([]);
  });
});

describe('redistribute', () => {
  const base: DraftRow[] = [
    { id: 'cash', label: 'Cash', pct: 20, locked: false },
    { id: 'fenwick-index', label: 'Tracker', pct: 50, locked: false },
    { id: 'technova-growth', label: 'Mediocre', pct: 30, locked: false },
  ];

  it('always sums to exactly 100 after a drag', () => {
    for (const target of [0, 1, 17, 40, 63, 99, 100]) {
      const out = redistribute(base, 'technova-growth', target);
      expect(out.reduce((s, r) => s + r.pct, 0)).toBe(100);
    }
  });

  it('redistributes the difference proportionally across the others (§12.2)', () => {
    // Drag Technova 30 -> 40. Remaining 60 splits across cash:tracker in
    // their existing 20:50 ratio -> 17:43 (largest-remainder of 17.14/42.86).
    const out = redistribute(base, 'technova-growth', 40);
    const byId = Object.fromEntries(out.map((r) => [r.id, r.pct]));
    expect(byId['technova-growth']).toBe(40);
    expect(byId.cash + byId['fenwick-index']).toBe(60);
    // Proportionality: cash:tracker should still be close to the original
    // 20:50 (2:5) ratio, not an even split.
    expect(byId.cash).toBeLessThan(byId['fenwick-index']);
    expect(byId.cash).toBe(17);
    expect(byId['fenwick-index']).toBe(43);
  });

  it('never moves a locked row, and gives it none of the redistribution', () => {
    const locked = base.map((r) => (r.id === 'fenwick-index' ? { ...r, locked: true } : r));
    const out = redistribute(locked, 'technova-growth', 50);
    const byId = Object.fromEntries(out.map((r) => [r.id, r.pct]));
    expect(byId['fenwick-index']).toBe(50); // untouched
    expect(byId['technova-growth']).toBe(50); // the drag target, honoured
    expect(byId.cash).toBe(0); // absorbs 100 - 50(locked) - 50(dragged)
    expect(out.reduce((s, r) => s + r.pct, 0)).toBe(100);
  });

  it('is a no-op on a locked dragged row', () => {
    const locked = base.map((r) => (r.id === 'technova-growth' ? { ...r, locked: true } : r));
    const out = redistribute(locked, 'technova-growth', 99);
    expect(out).toEqual(locked);
  });

  it('pins the dragged row too when every other row is locked', () => {
    const allOthersLocked = base.map((r) => (r.id === 'technova-growth' ? r : { ...r, locked: true }));
    const out = redistribute(allOthersLocked, 'technova-growth', 99);
    // Nowhere for the slack to go — dragged row can't move off its
    // original 30, because cash+tracker are pinned at 70.
    expect(out.find((r) => r.id === 'technova-growth')!.pct).toBe(30);
    expect(out.reduce((s, r) => s + r.pct, 0)).toBe(100);
  });

  it('splits evenly across others that are all currently at 0%', () => {
    const zeroed: DraftRow[] = [
      { id: 'cash', label: 'Cash', pct: 100, locked: false },
      { id: 'fenwick-index', label: 'Tracker', pct: 0, locked: false },
      { id: 'technova-growth', label: 'Mediocre', pct: 0, locked: false },
    ];
    const out = redistribute(zeroed, 'cash', 0);
    const byId = Object.fromEntries(out.map((r) => [r.id, r.pct]));
    expect(byId.cash).toBe(0);
    expect(byId['fenwick-index']).toBe(50);
    expect(byId['technova-growth']).toBe(50);
  });

  it('clamps a drag past 100 (nothing left for the locked rows to give)', () => {
    const locked = base.map((r) => (r.id === 'fenwick-index' ? { ...r, locked: true } : r));
    const out = redistribute(locked, 'technova-growth', 500);
    expect(out.find((r) => r.id === 'technova-growth')!.pct).toBe(50); // 100 - lockedSum(50)
    expect(out.reduce((s, r) => s + r.pct, 0)).toBe(100);
  });

  /**
   * §25.5's demo path (beat 3, Jul 1997): "accept the tracker, move to 70%
   * tracker / 30% cash" — with Northmoor already 100% funded from beat 1.
   * A DEMO.md-writing pass found that this reads as a single slider drag
   * but is not one: proportional redistribution (§12.2) means dragging only
   * Fenwick to 70% splits the *other* 30% by current weight, and Northmoor
   * (currently 100%) is the only other row with any weight to receive it —
   * so a single drag leaves 30% stranded in Northmoor, not in cash. Locked
   * in here as a permanent regression on the exact operator instruction
   * DEMO.md gives (drag Northmoor to 0% first, then Fenwick to 70%).
   */
  it('the §25.5 demo path 70/30 target needs two drags, not one — Northmoor to 0% first, then Fenwick to 70%', () => {
    const afterBeatOne: DraftRow[] = [
      { id: 'cash', label: 'Cash', pct: 0, locked: false },
      { id: 'northmoor-bond', label: 'Northmoor', pct: 100, locked: false },
      { id: 'fenwick-index', label: 'Tracker', pct: 0, locked: false },
    ];

    const singleDrag = redistribute(afterBeatOne, 'fenwick-index', 70);
    const singleById = Object.fromEntries(singleDrag.map((r) => [r.id, r.pct]));
    // The trap: this is NOT "70% tracker / 30% cash" — 30 lands back in
    // Northmoor because it's the only other row with nonzero weight.
    expect(singleById['northmoor-bond']).toBe(30);
    expect(singleById.cash).toBe(0);

    const zeroedNorthmoor = redistribute(afterBeatOne, 'northmoor-bond', 0);
    const twoDrags = redistribute(zeroedNorthmoor, 'fenwick-index', 70);
    const twoById = Object.fromEntries(twoDrags.map((r) => [r.id, r.pct]));
    expect(twoById['fenwick-index']).toBe(70);
    expect(twoById.cash).toBe(30);
    expect(twoById['northmoor-bond']).toBe(0);
  });
});

describe('toggleLock', () => {
  it('flips only the targeted row', () => {
    const rows: DraftRow[] = [
      { id: 'cash', label: 'Cash', pct: 20, locked: false },
      { id: 'fenwick-index', label: 'Tracker', pct: 80, locked: false },
    ];
    const out = toggleLock(rows, 'cash');
    expect(out.find((r) => r.id === 'cash')!.locked).toBe(true);
    expect(out.find((r) => r.id === 'fenwick-index')!.locked).toBe(false);
    expect(toggleLock(out, 'cash').find((r) => r.id === 'cash')!.locked).toBe(false);
  });
});

describe('buildRebalancePreview', () => {
  it('itemises a buy funded entirely from cash, with no exit fee or realised P&L', () => {
    const state = fixtureState();
    // cash 10 / tracker 60 / mediocre 30 -> tracker buys 620, cash gives it up
    const draft: DraftRow[] = [
      { id: 'cash', label: 'Cash', pct: 10, locked: false },
      { id: 'fenwick-index', label: 'Tracker', pct: 60, locked: false },
      { id: 'technova-growth', label: 'Mediocre', pct: 30, locked: false },
    ];
    const preview = buildRebalancePreview(state, draft);

    const buy = preview.items.find((i) => i.id === 'fenwick-index')!;
    expect(buy.kind).toBe('buy');
    expect(buy.amount).toBeCloseTo(620, 6);

    const unchanged = preview.items.find((i) => i.id === 'technova-growth')!;
    expect(unchanged.kind).toBe('unchanged');

    const cashItem = preview.items.find((i) => i.id === 'cash')!;
    expect(cashItem.kind).toBe('cash');
    expect(cashItem.amount).toBeCloseTo(-620, 6); // cash funds the buy

    expect(preview.totalBuys).toBeCloseTo(620, 6);
    expect(preview.totalSells).toBe(0);
    expect(preview.totalExitFees).toBe(0);
    expect(preview.totalRealisedGain).toBe(0);
    expect(preview.netWorth).toBe(6200);
  });

  it('itemises a sell with realised gain and the vehicle\'s real exit fee, wired from src/sim/vehicles', () => {
    const state = fixtureState();
    // cash 40 / tracker 30 / mediocre 30 -> sell 1240 of the tracker to fund cash
    const draft: DraftRow[] = [
      { id: 'cash', label: 'Cash', pct: 40, locked: false },
      { id: 'fenwick-index', label: 'Tracker', pct: 30, locked: false },
      { id: 'technova-growth', label: 'Mediocre', pct: 30, locked: false },
    ];
    const preview = buildRebalancePreview(state, draft);

    const sell = preview.items.find((i) => i.id === 'fenwick-index')!;
    expect(sell.kind).toBe('sell');
    expect(sell.amount).toBeCloseTo(1240, 6);

    // Sold fraction of the position, applied to its unrealised gain — not
    // hardcoded, so this test stays correct if src/sim/vehicles' fee data
    // ever changes.
    const holding = state.holdings['fenwick-index']!;
    const unrealisedGain = holding.value - (holding.contributed - holding.withdrawn);
    const fraction = 1240 / holding.value;
    expect(sell.realisedGain).toBeCloseTo(unrealisedGain * fraction, 6);
    expect(sell.exitFee).toBeCloseTo(1240 * (VEHICLES['fenwick-index'].exitFeePct / 100), 6);

    expect(preview.totalSells).toBeCloseTo(1240, 6);
    expect(preview.totalExitFees).toBeCloseTo(sell.exitFee!, 6);
  });

  it('leaves everything "unchanged" when the draft already matches reality', () => {
    const state = fixtureState();
    const draft = buildDraftRows(state);
    const preview = buildRebalancePreview(state, draft);
    expect(preview.items.every((i) => i.kind === 'unchanged')).toBe(true);
    expect(preview.totalBuys).toBe(0);
    expect(preview.totalSells).toBe(0);
  });
});

describe('buildRebalanceDecision', () => {
  it('produces a §25.2 rebalance Decision with cash split out of targets', () => {
    const state = fixtureState();
    const draft: DraftRow[] = [
      { id: 'cash', label: 'Cash', pct: 40, locked: false },
      { id: 'fenwick-index', label: 'Tracker', pct: 30, locked: false },
      { id: 'technova-growth', label: 'Mediocre', pct: 30, locked: false },
    ];
    const decision = buildRebalanceDecision(state, draft);
    expect(decision).toEqual({
      type: 'rebalance',
      month: state.month,
      targets: { 'fenwick-index': 30, 'technova-growth': 30 },
      cashPct: 40,
    });
  });
});
