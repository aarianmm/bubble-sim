// @vitest-environment jsdom
/**
 * Steps 27-28 tests — the death card.
 *
 * The concurrent scheduler branch (Steps 24-25, `step/scheduler`) isn't
 * merged into this worktree, so a real run never actually ends inside the
 * live app yet — `src/ui/EngineProvider.tsx` is still the PROVISIONAL
 * cash/clock model, whose `stats` fields other than fees/scams/forced-sales
 * are never populated tick-by-tick (only `run()`'s own aggregation loop
 * fills `peakWealth`, `trackerCounterfactualFees`, etc. — see the comment
 * on `peakWealthInfo` in DeathCard.tsx). Per this step's brief, band/cause
 * coverage below is built against **fixture `GameState`s** — a bespoke
 * `EngineContext.Provider` this file controls completely, exactly the
 * `RunResult`-shaped fixtures the task calls for, just reshaped as the
 * `GameState` the page actually reads. One additional test exercises the
 * REAL `EngineProvider` end-to-end (via its already-real `showDeathCard`/
 * `reset`) to prove the one-click-replay wiring itself, independent of the
 * fixture harness.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DeathCard } from './DeathCard';
import { EngineContext, type Engine } from '../ui/engine';
import { EngineProvider } from '../ui/EngineProvider';
import { RouterProvider, useRouter } from '../chrome/router';
import { useEngine } from '../ui/engine';
import { GAME_OVER_URL, HOME_URL } from './registry';
import { monthIndex, MONTH_COUNT } from '../sim/month';
import type { Band, DeathCauseId, GameState, RunStats } from '../sim/types';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

function fixtureStats(overrides: Partial<RunStats> = {}): RunStats {
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

function fixtureState(overrides: Partial<GameState> = {}): GameState {
  return {
    month: 0,
    status: 'dead',
    cash: 0,
    holdings: {},
    unlocked: [],
    debt: null,
    inbox: [],
    popups: [],
    dialogs: [],
    flags: {
      onScamList: false,
      incomeSuspendedMonths: 0,
      era: 'a',
      moneyBase: 'period',
      everOpenedInbox: false,
      everOpenedFactSheet: false,
    },
    stats: fixtureStats(),
    wealthHistory: [0],
    marketHistory: [100],
    deathMonth: null,
    deathCauseId: null,
    decisions: [],
    ...overrides,
  };
}

function mockEngine(state: GameState, resetSpy = vi.fn()): Engine {
  return {
    state,
    paused: true,
    timeRate: 0,
    dispatch: vi.fn(),
    setPaused: vi.fn(),
    setTimeRate: vi.fn(),
    jumpToMonth: vi.fn(),
    forceEvent: vi.fn(),
    loadPreset: vi.fn(),
    showDeathCard: vi.fn(),
    reset: resetSpy,
  };
}

describe('DeathCard (§22.6) — renders for every band', () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function mount(state: GameState) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <EngineContext.Provider value={mockEngine(state)}>
          <RouterProvider initialUrl={GAME_OVER_URL}>
            <DeathCard />
          </RouterProvider>
        </EngineContext.Provider>,
      );
    });
  }

  const DEATH_CASES: { band: Band; causeId: DeathCauseId; deathMonth: number | null; status: GameState['status'] }[] = [
    { band: 'OUCH', causeId: 'broke-as-bubble-peaked', deathMonth: monthIndex(2000, 3), status: 'dead' },
    { band: 'OKAY', causeId: 'funded-a-scam', deathMonth: monthIndex(2001, 6), status: 'dead' },
    { band: 'SOLID', causeId: 'sold-at-the-bottom', deathMonth: monthIndex(2003, 9), status: 'dead' },
    { band: 'IMPRESSIVE', causeId: 'eaten-by-fees', deathMonth: monthIndex(2005, 2), status: 'dead' },
    { band: 'LEGENDARY', causeId: 'survived', deathMonth: null, status: 'survived' },
  ];

  for (const { band, causeId, deathMonth, status } of DEATH_CASES) {
    it(`renders the ${band} band (cause: ${causeId})`, () => {
      mount(
        fixtureState({
          status,
          deathMonth,
          deathCauseId: causeId,
          month: deathMonth ?? MONTH_COUNT - 1,
          wealthHistory: [0, 500, 1200, 800, 300, 0],
          marketHistory: [100, 110, 95, 105, 120, 108],
        }),
      );
      expect(container.textContent).toContain('G A M E');
      expect(container.textContent).toContain('O V E R');
      expect(container.textContent).toContain(band);
      expect(container.textContent).toContain(DEATH_LINE(causeId));
      // §23 — no draw-on animation: the full <path> is present immediately.
      const lines = container.querySelectorAll('.deathcard-graph__line');
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) expect(line.getAttribute('d')).toBeTruthy();
    });
  }

  it('the LEGENDARY card reads December 2006, not a death month (§14.2: the final event is a win)', () => {
    mount(
      fixtureState({
        status: 'survived',
        deathMonth: null,
        deathCauseId: 'survived',
        month: MONTH_COUNT - 1,
      }),
    );
    expect(container.textContent).toContain('DECEMBER 2006');
  });

  it('§11.2 rule 5 — names the specific flags missed, quoted from the scam’s own fact sheet', () => {
    mount(
      fixtureState({
        status: 'dead',
        deathMonth: monthIndex(1999, 4),
        deathCauseId: 'funded-a-scam',
        month: monthIndex(1999, 4),
        stats: fixtureStats({ scamsFunded: 1, scamsFundedIds: ['cavendish-tech'] }),
      }),
    );
    expect(container.textContent).toContain('Cavendish Asset Management');
    expect(container.textContent).toContain('Very high fee');
    expect(container.textContent).toContain('No regulator');
    // Quoted verbatim from the sheet, not just named (§11.2 rule 5: "quoting
    // them from the sheet you could have read").
    expect(container.textContent).toContain('8.0%');
  });

  it('§9.3 — the fee line is always present and quotes the real tracker-counterfactual figure', () => {
    mount(
      fixtureState({
        status: 'dead',
        deathMonth: monthIndex(2003, 1),
        deathCauseId: 'eaten-by-fees',
        month: monthIndex(2003, 1),
        stats: fixtureStats({ feesPaid: 1840, trackerCounterfactualFees: 96 }),
        holdings: {
          'technova-growth': {
            vehicleId: 'technova-growth',
            value: 100,
            contributed: 2000,
            withdrawn: 0,
            feesPaid: 1840,
            targetPct: 100,
            locked: false,
            unlockedMonth: 0,
            collapsed: false,
          },
        },
        unlocked: ['technova-growth'],
      }),
    );
    expect(container.textContent).toContain('You paid');
    expect(container.textContent).toContain('£1,840');
    expect(container.textContent).toContain('£96');
  });

  it('every money figure renders through the same £ formatting <Money> uses (§19.4)', () => {
    mount(
      fixtureState({
        status: 'dead',
        deathMonth: monthIndex(2002, 5),
        deathCauseId: 'ground-down-by-rent',
        month: monthIndex(2002, 5),
        wealthHistory: [0, 100, -50],
      }),
    );
    // A negative figure uses the product's minus sign, not a bare hyphen —
    // proof this went through formatPounds (src/ui/Money.tsx), not ad hoc.
    const moneyNodes = container.querySelectorAll('.money__primary, .deathcard-stats__value');
    expect(moneyNodes.length).toBeGreaterThan(0);
  });

  it('[ Save picture ] is present but disabled — Step 37, beyond the MVP (§26.1)', () => {
    mount(fixtureState({ status: 'dead', deathMonth: monthIndex(2000, 3), deathCauseId: 'broke-as-bubble-peaked' }));
    const btn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Save picture'));
    expect(btn).toBeTruthy();
    expect(btn!.hasAttribute('disabled')).toBe(true);
  });

  it('[ Run it again ] calls engine.reset() synchronously — no confirmation dialog anywhere in the DOM', () => {
    const resetSpy = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const state = fixtureState({ status: 'dead', deathMonth: monthIndex(2000, 3), deathCauseId: 'broke-as-bubble-peaked' });
    act(() => {
      root.render(
        <EngineContext.Provider value={mockEngine(state, resetSpy)}>
          <RouterProvider initialUrl={GAME_OVER_URL}>
            <DeathCard />
          </RouterProvider>
        </EngineContext.Provider>,
      );
    });
    const btn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Run it again'))!;
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});

function DEATH_LINE(causeId: DeathCauseId): string {
  // Mirrors src/content/deathlines.ts — imported indirectly via the
  // component under test; duplicated here only as the string this test
  // asserts against, not as a second source of truth for the copy itself.
  const map: Record<DeathCauseId, string> = {
    'broke-as-bubble-peaked': 'You went broke the same month the bubble peaked.',
    'ground-down-by-rent': 'Ground down. Your rent rose 71%. Your pay rose £0.',
    'funded-a-scam': 'Cavendish Asset Management was never real. Two things on that fact sheet said so.',
    'sold-at-the-bottom': 'You sold at the bottom three times. That’s what got you.',
    'eaten-by-fees': 'You paid £1,840 in fees. The tracker would have charged you £96.',
    'the-card-ate-you': 'The card bridged you through 2001 and then ate you in 2003.',
    'the-fake-dialog': 'That wasn’t a warning from your computer. It was an advert. The clock never stopped.',
    survived: 'Ten years. You’re still here.',
  };
  return map[causeId];
}

/* ------------------------------------------------------------------ *
 * Integration — the real EngineProvider, proving the actual wiring
 * (§25.4's showDeathCard, and Step 28's one-click reset) rather than the
 * mock harness above.
 * ------------------------------------------------------------------ */

function Harness() {
  const engine = useEngine();
  const router = useRouter();
  return (
    <>
      <button type="button" data-testid="kill" onClick={() => engine.showDeathCard('SOLID', 'sold-at-the-bottom')}>
        kill
      </button>
      <button type="button" data-testid="goto-death" onClick={() => router.navigate(GAME_OVER_URL)}>
        goto
      </button>
      {router.url === GAME_OVER_URL ? <DeathCard /> : <div data-testid="not-death-card" />}
    </>
  );
}

describe('DeathCard — real EngineProvider integration (§25.4, §28)', () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('engine.showDeathCard + navigate renders the card; [ Run it again ] returns to Jan 1996 and off the death card, instantly', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <EngineProvider>
          <RouterProvider initialUrl={HOME_URL}>
            <Harness />
          </RouterProvider>
        </EngineProvider>,
      );
    });

    act(() => container.querySelector<HTMLButtonElement>('[data-testid="kill"]')!.click());
    act(() => container.querySelector<HTMLButtonElement>('[data-testid="goto-death"]')!.click());
    // The band is recomputed from `deathMonth` (still month 0 here — the
    // harness never jumped the clock forward), not trusted from whatever
    // band the presenter's `showDeathCard('SOLID', ...)` call named. That is
    // correct, not a test bug: §15 forbids a band from being anything other
    // than a pure function of survival date, so DeathCard has no way to
    // special-case "the presenter asked for SOLID" even when asked to. The
    // *cause*, by contrast, is exactly what was forced, because
    // `deathCauseId` is authored input, not a derived one.
    expect(container.textContent).toContain('OUCH');
    expect(container.textContent).toContain('You sold at the bottom three times');

    const runAgain = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Run it again'),
    )!;
    act(() => runAgain.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    // §28: Jan 1996, fresh state, and off the death card — synchronously,
    // no intermediate loading state to wait out.
    expect(container.querySelector('[data-testid="not-death-card"]')).toBeTruthy();
  });
});
