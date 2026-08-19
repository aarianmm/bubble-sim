/**
 * PROVISIONAL — Step 24 (the scheduler) replaces the body of this file. The
 * Engine interface it satisfies is stable.
 *
 * Owns exactly the slice of GameState this step is allowed to touch: the
 * clock and cash (§26.2 Step 13-15 brief — "cash, the clock, pause and the
 * time rate are enough"). Events, offers, holdings, scams and the market
 * are Steps 7-9 and 24's, and are deliberately not wired here — see
 * provisionalSim.ts for the pure model this provider runs on a timer.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  EngineContext,
  MS_PER_MONTH,
  RATE_NORMAL,
  type Engine,
  type PresetName,
} from './engine';
import type { Band, DeathCauseId, Decision, EventId } from '../sim/types';
import { isValidMonth, monthIndex, MONTH_COUNT, type MonthIndex } from '../sim/month';
import { createInitialState, tickOneMonth, computeStateAtMonth } from './provisionalSim';

export function EngineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createInitialState);
  const [paused, setPausedState] = useState(false);
  const [rateOverride, setRateOverride] = useState<number>(RATE_NORMAL);

  // §20.1: a blocking dialog freezes time; the run ending freezes it too —
  // neither is modelled yet (dialogs.length is always 0 here), but the
  // check costs nothing and Step 24 inherits the right behaviour for free.
  const frozen = paused || state.dialogs.length > 0 || state.status !== 'running';
  const timeRate = frozen ? 0 : rateOverride;

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    if (timeRate <= 0) {
      accumulatorRef.current = 0; // no catch-up burst when time resumes
      return;
    }
    lastTsRef.current = null;
    function frame(ts: number) {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      accumulatorRef.current += (ts - lastTsRef.current) * timeRate;
      lastTsRef.current = ts;
      while (accumulatorRef.current >= MS_PER_MONTH) {
        accumulatorRef.current -= MS_PER_MONTH;
        setState((s) => tickOneMonth(s));
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [timeRate]);

  const setPaused = useCallback((p: boolean) => setPausedState(p), []);
  const setTimeRate = useCallback((rate: number) => setRateOverride(rate), []);

  const jumpToMonth = useCallback((month: MonthIndex) => {
    if (!isValidMonth(month)) return; // §19.3 — never silently accept a bad state
    setState((s) => computeStateAtMonth(s, month));
  }, []);

  const forceEvent = useCallback((eventId: EventId) => {
    // SEAM: src/script/timeline.ts (Step 5) and the event-application arm
    // of tick() (Step 7) are not merged into this worktree, so there is no
    // ScriptEvent catalogue to look `eventId` up in. Step 24 should replace
    // this body with a real lookup + application once they land — the UI
    // (src/dev/Presenter.tsx) is already wired to call this as-is.
    console.info(`[presenter] forceEvent('${eventId}') — stub, script/content not merged yet.`);
  }, []);

  const loadPreset = useCallback((preset: PresetName) => {
    // SEAM: presets that describe a portfolio ("holding-the-ponzi",
    // "about-to-be-forced-to-sell", "survived-2006") need holdings and the
    // market table wired through the real tick (Steps 7-9, 24). Until then
    // every preset only moves the clock — exactly right for the ones that
    // are pure dates, an honest approximation (logged as such) for the
    // ones that aren't.
    switch (preset) {
      case 'start':
        setState(createInitialState());
        setPausedState(false);
        setRateOverride(RATE_NORMAL);
        return;
      case 'just-before-the-crash':
        setState((s) => computeStateAtMonth(s, monthIndex(2000, 2))); // Feb 2000
        return;
      case 'cash-only-march-2000':
        setState((s) => computeStateAtMonth(s, monthIndex(2000, 3))); // §6/§8.4's one number
        return;
      case 'about-to-be-forced-to-sell':
        setState((s) => computeStateAtMonth(s, monthIndex(2000, 4)));
        return;
      case 'holding-the-ponzi':
        console.info(
          '[presenter] loadPreset("holding-the-ponzi") — stub, needs holdings (Steps 7-9/24); date only.',
        );
        setState((s) => computeStateAtMonth(s, monthIndex(1999, 4))); // near the authored offer
        return;
      case 'survived-2006':
        console.info(
          '[presenter] loadPreset("survived-2006") — stub, needs holdings (Steps 7-9/24); date only.',
        );
        setState((s) => computeStateAtMonth(s, MONTH_COUNT - 1));
        return;
    }
  }, []);

  /**
   * §25.4 — the closing shot, on demand. Ends the run with an authored band and
   * cause instead of the one the decade would have produced. Step 26 computes
   * these for real; this only forces them for the demo.
   */
  const showDeathCard = useCallback((band: Band, causeId: DeathCauseId) => {
    setState((s) => ({
      ...s,
      status: band === 'LEGENDARY' ? 'survived' : 'dead',
      deathMonth: band === 'LEGENDARY' ? null : s.month,
      deathCauseId: causeId,
    }));
    setPausedState(true);
  }, []);

  const reset = useCallback(() => {
    setState(createInitialState());
    setPausedState(false);
    setRateOverride(RATE_NORMAL);
    accumulatorRef.current = 0;
  }, []);

  const dispatch = useCallback((decision: Decision) => {
    // Provisional log-only dispatch — Steps 7-9/24 give each Decision kind
    // real effects (accept an offer, rebalance, resolve a dialog...). This
    // step only owns the clock, so every decision joins the §25.2 replay
    // log undisturbed; the one exception is the dual-money display flag,
    // which is a pure UI toggle already on GameState and costs nothing to
    // wire for real.
    setState((s) => {
      const next = { ...s, decisions: [...s.decisions, decision] };
      if (decision.type === 'toggle-money-base') {
        next.flags = {
          ...s.flags,
          moneyBase: s.flags.moneyBase === '1996' ? 'period' : '1996',
        };
      }
      return next;
    });
  }, []);

  const engine: Engine = useMemo(
    () => ({
      state,
      paused,
      timeRate,
      dispatch,
      setPaused,
      setTimeRate,
      jumpToMonth,
      forceEvent,
      loadPreset,
      showDeathCard,
      reset,
    }),
    [state, paused, timeRate, dispatch, setPaused, setTimeRate, jumpToMonth, forceEvent, loadPreset, reset],
  );

  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
}
