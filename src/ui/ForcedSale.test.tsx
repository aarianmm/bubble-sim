// @vitest-environment jsdom
/**
 * Step 25's stated done-condition: "Sep 2001 with £120 cash and a £900
 * shock produces the §12.3 dialog." Constructs that exact scenario through
 * the real tick() (not a hand-rolled substitute), diffs the result with
 * diffForcedSale, and asserts the rendered dialog matches — plus the
 * "nothing left to sell" edge case (§25: "must handle having nothing
 * sellable left, which ends the run").
 */
import { afterEach, describe, expect, it } from 'vitest';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { EngineProvider } from './EngineProvider';
import { ForcedSale, diffForcedSale } from './ForcedSale';
import { tick } from '../sim/tick';
import { eventsForMonth } from '../sim/scheduler';
import { monthIndex } from '../sim/month';
import type { GameState, Holding, RunFlags, RunStats } from '../sim/types';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

let container: HTMLDivElement | null = null;
let root: Root | null = null;

// Dialog.tsx portals to document.body directly (not into `container`), so
// assertions below query `document`, exactly like Dialog.test.tsx does.
function mount(children: ReactNode) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<EngineProvider>{children}</EngineProvider>);
  });
}

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  container?.remove();
  container = null;
  root = null;
  document.body.innerHTML = '';
});

describe('§12.3 the Sep 2001 forced sale', () => {
  const month = monthIndex(2001, 9);

  function scenario() {
    const before = makeState({
      month,
      cash: 120,
      wealthHistory: Array(month).fill(0),
      marketHistory: Array(month).fill(100),
      unlocked: ['fenwick-index'],
      holdings: { 'fenwick-index': makeHolding({ value: 3000, contributed: 3000 }) },
    });
    const events = eventsForMonth(month);
    expect(events.some((e) => e.contentId === 'dlg.shock-2001-09-trough')).toBe(true);
    const after = tick(before, events, [
      { type: 'resolve-dialog', month, dialogId: 'ev.2001-09.shock-trough', action: 'pay-from-cash' },
    ]);
    return { before, after };
  }

  it('the £900 shock against £120 cash forces a real sale, diffed off the real tick', () => {
    const { before, after } = scenario();
    expect(after.stats.forcedSales).toBe(1);
    const items = diffForcedSale(before, after);
    expect(items).toHaveLength(1);
    expect(items[0].vehicleId).toBe('fenwick-index');
    // £900 shock - £120 cash = £780 must come out of the tracker, at Sep
    // 2001 (crash-trough) prices, exactly the §12.3 lesson.
    expect(items[0].soldAmount).toBeGreaterThanOrEqual(780 - 1);
  });

  it('renders the itemized dialog with a real Sell-to-cover and Sell-something-else button', () => {
    const { before, after } = scenario();
    const items = diffForcedSale(before, after);
    mount(
      <ForcedSale
        before={before}
        items={items}
        shortfall={780}
        alternatives={[]}
        nothingLeft={false}
        onConfirm={() => undefined}
        onPickAlternative={() => undefined}
      />,
    );
    expect(document.body.textContent).toContain('Fenwick Index Trust');
    const buttons = document.querySelectorAll('.comet-dialog__btn');
    expect(buttons.length).toBe(1); // no alternatives supplied here
    expect(buttons[0].textContent).toContain('Sell to cover');
  });

  it('commits the shown plan when [ Sell to cover ] is clicked', () => {
    const { before, after } = scenario();
    const items = diffForcedSale(before, after);
    let confirmed = false;
    mount(
      <ForcedSale
        before={before}
        items={items}
        shortfall={780}
        alternatives={[{ vehicleId: 'fenwick-index', label: 'Fenwick Index Trust', value: 100 }]}
        nothingLeft={false}
        onConfirm={() => {
          confirmed = true;
        }}
        onPickAlternative={() => undefined}
      />,
    );
    const buttons = document.querySelectorAll('.comet-dialog__btn');
    expect(buttons.length).toBe(2);
    act(() => {
      (buttons[0] as HTMLButtonElement).click();
    });
    expect(confirmed).toBe(true);
  });

  it('[ Sell something else ] shows the alternative picker instead of confirming', () => {
    const { before, after } = scenario();
    const items = diffForcedSale(before, after);
    let confirmed = false;
    let picked: string | null = null;
    mount(
      <ForcedSale
        before={before}
        items={items}
        shortfall={780}
        alternatives={[{ vehicleId: 'fenwick-index', label: 'Fenwick Index Trust', value: 2200 }]}
        nothingLeft={false}
        onConfirm={() => {
          confirmed = true;
        }}
        onPickAlternative={(id) => {
          picked = id;
        }}
      />,
    );
    const buttons = document.querySelectorAll('.comet-dialog__btn');
    act(() => {
      (buttons[1] as HTMLButtonElement).click(); // "Sell something else"
    });
    expect(confirmed).toBe(false);
    expect(document.body.textContent).toContain('Sell which holding instead?');
    const pickButton = document.querySelector('.forced-sale__pick') as HTMLButtonElement;
    expect(pickButton).toBeTruthy();
    act(() => {
      pickButton.click();
    });
    expect(picked).toBe('fenwick-index');
  });
});

describe('§25 done-condition — nothing left to sell ends the run', () => {
  it('shows the "nothing left" body with a single Continue button', () => {
    const before = makeState({ month: monthIndex(2001, 9), cash: 0 });
    let confirmed = false;
    mount(
      <ForcedSale
        before={before}
        items={[]}
        shortfall={900}
        alternatives={[]}
        nothingLeft
        onConfirm={() => {
          confirmed = true;
        }}
        onPickAlternative={() => undefined}
      />,
    );
    expect(document.body.textContent).toContain('nothing left to sell');
    const buttons = document.querySelectorAll('.comet-dialog__btn');
    expect(buttons.length).toBe(1);
    act(() => {
      (buttons[0] as HTMLButtonElement).click();
    });
    expect(confirmed).toBe(true);
  });
});
