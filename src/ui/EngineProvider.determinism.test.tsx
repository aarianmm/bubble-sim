// @vitest-environment jsdom
/**
 * §25.2 determinism, prompted directly by a bug found during the final
 * integration pass: `sim/run.ts` (the headless aggregator) accumulated
 * `stats.trackerCounterfactualFees` in its own per-month loop, but
 * `sim/tick.ts` never wrote that field itself — so on the LIVE engine
 * (`ui/EngineProvider.tsx`, which calls `tick()` directly with no
 * equivalent aggregation loop of its own) the death card's §9.3 fee line
 * ("the tracker would have charged you £X") always read £0, no matter how
 * long the player had been invested. Fixed by moving the accumulation into
 * `tick()` itself (both call sites now agree; run.ts's own separately
 * computed total simply overwrites tick()'s identical figure in the final
 * `RunStats` object literal — object-literal semantics, not a comment to
 * trust blindly, which is exactly why this test exists).
 *
 * This is the regression test: the headless `run()` and the live
 * `EngineProvider`, given the *same* (script, decisions) pair, must produce
 * bit-identical `RunStats`. Cash-only (the empty decision list) is the one
 * case where the two code paths are provably comparable end-to-end without
 * this test having to reimplement a decision-carrying replay itself:
 *
 *   - `run(TIMELINE, [])` ticks month 0..death with zero decisions, letting
 *     `tick()`'s own `fireScheduledEvents` auto-resolve every DLG event to
 *     its scripted default (that's what a headless run with no player does).
 *   - `EngineProvider`'s `loadPreset('cash-only-march-2000')` calls
 *     `landOnMonth(Mar 2000, new Map())`, which replays months 0..49
 *     identically (`extraByMonth` is empty, so this is run.ts's own loop,
 *     tick for tick) and then, because Mar 2000 itself carries the crash and
 *     boiler DLG events, stops with the crash dialog genuinely materialized
 *     and un-resolved (§20.1 — a live dialog freezes time for a real choice;
 *     it does not auto-resolve). This test clicks each dialog's *own
 *     scripted default button* — the same one `defaultActionFor` in
 *     `tick.ts` would pick for a headless run — so the live trajectory
 *     converges on exactly the same decisions the headless run made for
 *     itself, which is the actual determinism claim (§25.2: same decisions,
 *     same result) rather than a coincidence of two different decision
 *     sets happening to land on the same numbers.
 *
 * It's also not an unrepresentative case to prove determinism on: cash-only
 * is the one number the whole design rests on (CLAUDE.md), so a test that
 * can only pass by accident here is a test worth having regardless of the
 * bug that prompted it.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { EngineProvider } from './EngineProvider';
import { useEngine, type Engine } from './engine';
import { run } from '../sim/run';
import { TIMELINE } from '../script/timeline';
import { monthIndex } from '../sim/month';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;
let engineHandle: Engine | null = null;

function Probe() {
  const engine = useEngine();
  const ref = useRef(engine);
  ref.current = engine;
  engineHandle = engine;
  return null;
}

function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(
      <EngineProvider>
        <Probe />
      </EngineProvider>,
    );
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  container = null;
  root = null;
  engineHandle = null;
  document.body.innerHTML = '';
});

/** Clicks every currently-materialized dialog's own default button — the
 * same button `tick.ts`'s headless auto-resolve tail would pick for itself
 * — until the engine either stops offering one or the run ends. This is
 * what makes the live trajectory decision-for-decision identical to
 * `run()`'s, rather than merely landing on the same final numbers by luck. */
function resolveAllDialogsWithDefaults() {
  for (let guard = 0; guard < 20; guard++) {
    const state = engineHandle!.state;
    if (state.dialogs.length === 0 || state.status !== 'running') return;
    const dialog = state.dialogs[0];
    const action = (dialog.buttons.find((b) => b.isDefault) ?? dialog.buttons[0]).action;
    act(() => {
      engineHandle!.dispatch({ type: 'resolve-dialog', month: state.month, dialogId: dialog.id, action });
    });
  }
  throw new Error('resolveAllDialogsWithDefaults: dialog queue never drained — infinite loop guard tripped');
}

describe('§25.2 — headless run() and the live EngineProvider agree on RunStats (cash-only)', () => {
  it('trackerCounterfactualFees matches bit-for-bit (the bug this test was written to catch)', () => {
    const headless = run(TIMELINE, []);

    mount();
    act(() => {
      engineHandle!.loadPreset('cash-only-march-2000');
    });
    resolveAllDialogsWithDefaults();
    const live = engineHandle!.state;

    // Sanity: this really is the §6/§8.4 calibration case, not some other
    // death, on both sides — otherwise a coincidental 0===0 match would pass
    // for the wrong reason.
    expect(headless.deathMonth).toBe(monthIndex(2000, 3));
    expect(live.deathMonth).toBe(monthIndex(2000, 3));
    expect(headless.status).toBe('dead');
    expect(live.status).toBe('dead');

    expect(live.stats.trackerCounterfactualFees).toBe(headless.stats.trackerCounterfactualFees);
    // Cash-only never unlocks a vehicle, so both sides should agree this is
    // exactly 0 — a non-zero number here would mean the accumulation is
    // reading the wrong state (e.g. pre- instead of post-tick holdings).
    expect(headless.stats.trackerCounterfactualFees).toBe(0);
  });

  it('feesPaid, forcedSales and scamsFunded — the three RunStats fields §22.6 cause-of-death selection actually reads live — also agree', () => {
    const headless = run(TIMELINE, []);

    mount();
    act(() => {
      engineHandle!.loadPreset('cash-only-march-2000');
    });
    resolveAllDialogsWithDefaults();
    const live = engineHandle!.state;

    expect(live.stats.feesPaid).toBe(headless.stats.feesPaid);
    expect(live.stats.forcedSales).toBe(headless.stats.forcedSales);
    expect(live.stats.scamsFunded).toBe(headless.stats.scamsFunded);
    expect(live.stats.scamsFundedIds).toEqual(headless.stats.scamsFundedIds);
  });
});
