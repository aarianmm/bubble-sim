/**
 * Money.tsx — the pure allocation maths (Step 23, §12.2).
 *
 * SEAM: the scheduler that unlocks vehicles (Step 24, src/sim/scheduler.ts)
 * is not merged into this worktree, so a real `useEngine()` state's
 * `holdings` is always `{}` right now — the portfolio is empty at every
 * date. These tests build fixture `GameState`s with holdings directly
 * (matching the exact numbers in §22.5's worked example: £1,240 cash +
 * £3,100 tracker + £1,860 mediocre fund = £6,200 net worth, Sep 2000) so
 * the slider maths — proportional redistribution, locks, the 100%
 * invariant, and the rebalance confirm-step itemisation — is verified
 * against real numbers without needing the real scheduler or a DOM. There
 * is no @testing-library/react in this repo (vitest's `environment` is
 * 'node', not 'jsdom' — see vite.config.ts) and no other *.test.tsx exists
 * anywhere in the codebase, so this file deliberately does not render
 * <MoneyPage/>; it tests the exported pure functions it's built from.
 */
import { describe, expect, it } from 'vitest';
import {
  buildDraftRows,
  buildRebalanceDecision,
  buildRebalancePreview,
  redistribute,
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
