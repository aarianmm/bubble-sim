/**
 * The real engine (Step 24). Runs `tick()` (src/sim/tick.ts) and the
 * scheduler (src/sim/scheduler.ts) behind the unchanged Engine interface —
 * every page built against `useEngine()` lights up without being edited.
 *
 * THE ONE THING THE HEADLESS RUNNER (sim/run.ts) NEVER HAD TO SOLVE:
 * `tick()` is atomic — one call runs all six §7.3 sub-steps, including
 * fireScheduledEvents' unconditional "auto-resolve any dialog still open
 * with its scripted default" tail (tick.test.ts asserts that behaviour
 * directly, so it can't change). That's exactly right for a headless run
 * with no player, but wrong here: a live DLG event has to actually FREEZE
 * and wait for a click (§20.1), which a single atomic tick() call can't do
 * by itself.
 *
 * The fix is a two-phase commit, entirely local to this file (tick.ts's
 * public contract is untouched):
 *
 *   1. PREVIEW — when a month has DLG events, materialize just the dialog
 *      (scheduler.ts's materializeDialog — byte-identical to what tick.ts
 *      would build) directly into `state.dialogs` WITHOUT calling tick().
 *      Pay-in/expenses/market-move/fees for that month haven't happened
 *      yet; the clock is genuinely frozen (state.dialogs.length > 0).
 *   2. COMMIT — once every DLG event for that month has a resolve-dialog
 *      decision (a month can carry two, e.g. the Mar 2000 crash + boiler),
 *      call the real tick() exactly once, batching all of them in —
 *      matching sim/run.ts's per-month semantics exactly, so a live run and
 *      a headless replay of the same decisions always agree (§25.2).
 *
 * §12.3's forced-sale flow rides the same seam: attemptCommit() below runs
 * the real tick() as a TRIAL. If it produced a NEW forced sale
 * (stats.forcedSales rose), the trial is held back — src/ui/ForcedSale.tsx
 * is shown instead of the silent liquidation, with the exact plan tick.ts
 * already computed (diffed off the trial, never recomputed) plus a genuine
 * "[ Sell something else ]" retry. Only once the player accepts a plan does
 * that trial (or a fresh retry) actually get committed to `state`.
 *
 * `stateRef` mirrors `state` synchronously (via `commitState`, not just a
 * `useEffect`) because the RAF loop below can process several consecutive
 * quiet months in one frame; without it, month 2's tick would run against
 * month 0's still-unflushed React state.
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
import type { Band, Decision, DialogAction, DeathCauseId, EventId, GameState, RunFlags, RunStats, ScriptEvent } from '../sim/types';
import { isValidMonth, monthIndex, MONTH_COUNT, type MonthIndex } from '../sim/month';
import { tick, fireScheduledEvents } from '../sim/tick';
import { EVENTS_BY_ID, eventsForMonth, materializeDialog } from '../sim/scheduler';
import { TIMELINE } from '../script/timeline';
import { VEHICLES } from '../sim/vehicles';
import { currentAllocation } from '../sim/selectors';
import type { VehicleId } from '../sim/ids';
import { ForcedSale, diffForcedSale, type ForcedSaleAlternative, type ForcedSaleItem } from './ForcedSale';

/* ------------------------------------------------------------------ *
 * Initial state — mirrors sim/run.ts's own initialState() exactly. The
 * live engine and the headless runner have to agree bit for bit (§25.2);
 * this is duplicated rather than imported because run.ts doesn't export
 * it (Step 8's file, out of this step's list) — a small, obviously-inert
 * object literal, not logic that could drift.
 * ------------------------------------------------------------------ */
function createInitialState(): GameState {
  const flags: RunFlags = {
    onScamList: false,
    incomeSuspendedMonths: 0,
    era: 'a',
    moneyBase: 'period',
    everOpenedInbox: false,
    everOpenedFactSheet: false,
  };
  const stats: RunStats = {
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
  };
  return {
    month: 0,
    status: 'running',
    cash: 0,
    holdings: {},
    unlocked: [],
    debt: null,
    inbox: [],
    popups: [],
    dialogs: [],
    flags,
    stats,
    wealthHistory: [],
    marketHistory: [],
    deathMonth: null,
    deathCauseId: null,
    decisions: [],
  };
}

interface PendingDialog {
  month: MonthIndex;
  /** DLG events for this month not yet shown. */
  queue: ScriptEvent[];
  /** resolve-dialog decisions collected so far this month. */
  decisions: Decision[];
  /** True only for the presenter's forceEvent() on a DLG id: commits via a
   * single fireScheduledEvents call (just this decision), never a full
   * tick() — forcing an event mid-month must not re-run that month's
   * pay/expenses/market/fees a second time. */
  forced?: boolean;
}

interface PendingForcedSale {
  before: GameState;
  month: MonthIndex;
  /** Decisions already applied in this month's batch (resolve-dialog, plus
   * any alt-sell rebalance from a previous "Sell something else" round). */
  decisions: Decision[];
  items: ForcedSaleItem[];
  shortfall: number;
  alternatives: ForcedSaleAlternative[];
  nothingLeft: boolean;
}

/** Everything still sellable that the default plan didn't already touch —
 * §12.3's "[ Sell something else ]" candidates. */
function computeAlternatives(before: GameState, exclude: Set<VehicleId>): ForcedSaleAlternative[] {
  const alts: ForcedSaleAlternative[] = [];
  for (const id of before.unlocked) {
    if (exclude.has(id)) continue;
    const h = before.holdings[id];
    if (!h || h.value <= 0.5) continue;
    const vehicle = VEHICLES[id];
    if (h.collapsed && !vehicle.sellableAfterCollapse) continue; // §11.5 Vertex
    alts.push({ vehicleId: id, label: vehicle.name, value: h.value });
  }
  return alts;
}

function decisionsByMonth(list: readonly Decision[]): Map<MonthIndex, Decision[]> {
  const map = new Map<MonthIndex, Decision[]>();
  for (const d of list) {
    const l = map.get(d.month) ?? [];
    l.push(d);
    map.set(d.month, l);
  }
  return map;
}

/* ------------------------------------------------------------------ *
 * §25.4 preset decision lists — pure functions of the fixed timeline, in
 * the same spirit as sim/verify.test.ts's six strategies. Not exhaustive
 * playtests; good-faith, honest demo states.
 * ------------------------------------------------------------------ */

function openAllMailUpTo(month: MonthIndex): Decision[] {
  const decisions: Decision[] = [];
  for (const e of TIMELINE) {
    if (e.month > month || e.mvpDeferred) continue;
    if (e.channel === 'MAIL') decisions.push({ type: 'open-mail', month: e.month, mailId: e.id });
  }
  return decisions;
}

function holdingThePonziDecisions(month: MonthIndex): Decision[] {
  const decisions = openAllMailUpTo(month);
  const halcyonMonth = monthIndex(1999, 6);
  if (month >= halcyonMonth) {
    decisions.push({ type: 'accept-offer', month: halcyonMonth, vehicleId: 'halcyon-reserve', source: 'preset' });
    decisions.push({ type: 'rebalance', month: halcyonMonth, targets: { 'halcyon-reserve': 50 }, cashPct: 50 });
  }
  return decisions;
}

/**
 * Mirrors sim/verify.test.ts's `perfectPlay()` — the best real decision
 * list the project has found. KNOWN-ISSUES.md #1: it reaches IMPRESSIVE
 * (dies Feb 2005), not a true Dec 2006 survival — a documented, flagged,
 * deprioritised calibration gap (raising the §8.5 windfalls would close
 * it), not something this preset can or should paper over. A presenter who
 * needs a guaranteed win for the closing shot has "Instant death card"
 * (showDeathCard) for exactly that.
 */
function perfectPlayDecisions(): Decision[] {
  const decisions: Decision[] = [];
  const switchMonth = monthIndex(2002, 11);
  for (const e of TIMELINE) {
    if (e.mvpDeferred) continue;
    if (e.channel === 'MAIL') decisions.push({ type: 'open-mail', month: e.month, mailId: e.id });
    if (e.vehicleId === 'fenwick-index') {
      decisions.push({ type: 'accept-offer', month: e.month, vehicleId: e.vehicleId, source: e.id });
    }
  }
  decisions.push({ type: 'accept-offer', month: monthIndex(1997, 7), vehicleId: 'kingsley-gilt', source: 'preset' });
  for (let m = monthIndex(1997, 7); m < switchMonth; m++) {
    decisions.push({ type: 'rebalance', month: m, targets: { 'kingsley-gilt': 65 }, cashPct: 35 });
  }
  for (let m = switchMonth; m < MONTH_COUNT; m++) {
    decisions.push({ type: 'rebalance', month: m, targets: { 'fenwick-index': 45, 'kingsley-gilt': 0 }, cashPct: 55 });
  }
  return decisions;
}

export function EngineProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createInitialState);
  const [paused, setPausedState] = useState(false);
  const [evolutionPaused, setEvolutionPausedState] = useState(false);
  const [rateOverride, setRateOverride] = useState<number>(RATE_NORMAL);
  const [forcedSale, setForcedSale] = useState<PendingForcedSale | null>(null);

  const stateRef = useRef(state);
  const processedRef = useRef(-1); // last month whose full tick() has committed; -1 = none yet
  const pendingRef = useRef<PendingDialog | null>(null);
  const forcedSaleTrialRef = useRef<GameState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const commitState = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // §20.1: a blocking dialog freezes time; a pending forced-sale choice
  // does too (it's the same "time paused until a choice is made" contract,
  // §12.3). The Jan 1998/2000 interface evolution owns a separate hold so
  // the player's Pause button cannot release its prompt, installer or final
  // welcome early; the run ending freezes the clock for good.
  const frozen =
    paused || evolutionPaused || state.dialogs.length > 0 || forcedSale !== null || state.status !== 'running';
  const timeRate = frozen ? 0 : rateOverride;

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  /* ---------------------------------------------------------------- *
   * attemptCommit — the one place a month's tick() actually runs live.
   * `before` must already have `dialogs: []` (any preview dialog cleared).
   * ---------------------------------------------------------------- */
  const attemptCommit = useCallback(
    (before: GameState, month: MonthIndex, decisions: Decision[]) => {
      const trial = tick({ ...before, month }, eventsForMonth(month), decisions);
      const newForcedSale = trial.stats.forcedSales > before.stats.forcedSales;
      if (!newForcedSale) {
        processedRef.current = month;
        forcedSaleTrialRef.current = null;
        setForcedSale(null);
        commitState({ ...trial, decisions: [...trial.decisions, ...decisions] });
        return;
      }
      const items = diffForcedSale(before, trial);
      const soldIds = new Set(items.map((i) => i.vehicleId));
      const alternatives = computeAlternatives(before, soldIds);
      const shortfall = items.reduce((sum, i) => sum + i.soldAmount - i.exitFee, 0) + Math.max(0, -trial.cash);
      const nothingLeft = items.length === 0 && alternatives.length === 0;
      forcedSaleTrialRef.current = trial;
      setForcedSale({ before, month, decisions, items, shortfall, alternatives, nothingLeft });
    },
    [commitState],
  );

  const advancePending = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    if (pending.queue.length === 0) {
      pendingRef.current = null;
      if (pending.forced) {
        // Presenter forceEvent() on a DLG id: apply just the decision, no
        // month-boundary tick (§ file header) — this month's pay/expenses/
        // market/fees already happened, or haven't reached this month yet.
        const s = stateRef.current;
        const next = fireScheduledEvents(s, [], pending.decisions);
        commitState({ ...next, decisions: [...next.decisions, ...pending.decisions] });
        return;
      }
      attemptCommit({ ...stateRef.current, dialogs: [] }, pending.month, pending.decisions);
      return;
    }
    const [next, ...rest] = pending.queue;
    pendingRef.current = { ...pending, queue: rest };
    commitState({ ...stateRef.current, dialogs: [materializeDialog(next, pending.month)] });
  }, [attemptCommit, commitState]);

  const resolveDialogFlow = useCallback(
    (month: MonthIndex, dialogId: string, action: DialogAction) => {
      const decision: Decision = { type: 'resolve-dialog', month, dialogId, action };
      const pending = pendingRef.current;
      if (pending) {
        pendingRef.current = { ...pending, decisions: [...pending.decisions, decision] };
        advancePending();
        return;
      }
      // No tracked pending batch (shouldn't happen in normal play — a
      // dialog is only ever on screen because beginMonth/landOnMonth put it
      // there) — apply directly as a defensive fallback.
      const s = stateRef.current;
      const next = fireScheduledEvents(s, [], [decision]);
      commitState({ ...next, decisions: [...next.decisions, decision] });
    },
    [advancePending, commitState],
  );

  /* ---------------------------------------------------------------- *
   * beginMonth — the live clock's per-month entry point. `before` is
   * passed explicitly (never closed over) so this stays a stable callback
   * the RAF loop can call every frame without a stale-state bug.
   * ---------------------------------------------------------------- */
  const beginMonth = useCallback(
    (before: GameState, month: MonthIndex) => {
      const events = eventsForMonth(month);
      const dlgQueue = events.filter((e) => e.channel === 'DLG' && !e.mvpDeferred);
      if (dlgQueue.length === 0) {
        attemptCommit({ ...before, dialogs: [] }, month, []);
        return;
      }
      const [first, ...rest] = dlgQueue;
      pendingRef.current = { month, queue: rest, decisions: [] };
      commitState({ ...before, month, dialogs: [materializeDialog(first, month)] });
    },
    [attemptCommit, commitState],
  );

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
        if (pendingRef.current) break; // a dialog just opened this frame — stop
        accumulatorRef.current -= MS_PER_MONTH;
        const next = processedRef.current + 1;
        if (next >= MONTH_COUNT) break;
        beginMonth(stateRef.current, next);
        if (pendingRef.current) break; // ditto, just raised
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [timeRate, beginMonth]);

  const setPaused = useCallback((p: boolean) => setPausedState(p), []);
  const setEvolutionPaused = useCallback((p: boolean) => setEvolutionPausedState(p), []);
  const setTimeRate = useCallback((rate: number) => setRateOverride(rate), []);

  /* ---------------------------------------------------------------- *
   * landOnMonth — the shared engine behind jumpToMonth/loadPreset/the
   * Presenter's date buttons. Headless-replays 0..month-1 (auto-resolving
   * defaults exactly like sim/run.ts — nobody's watching those months),
   * then treats `month` itself as a live arrival, so a jump to e.g. Mar
   * 2000 lands with the crash dialog genuinely on screen, not already
   * resolved.
   * ---------------------------------------------------------------- */
  const landOnMonth = useCallback(
    (month: MonthIndex, extraByMonth: Map<MonthIndex, Decision[]>) => {
      let s = createInitialState();
      for (let m = 0; m < month; m++) {
        const d = extraByMonth.get(m) ?? [];
        s = tick({ ...s, month: m }, eventsForMonth(m), d);
        if (d.length) s = { ...s, decisions: [...s.decisions, ...d] };
        if (s.status !== 'running') break;
      }
      pendingRef.current = null;
      forcedSaleTrialRef.current = null;
      setForcedSale(null);

      if (s.status !== 'running') {
        processedRef.current = month;
        commitState({ ...s, month });
        return;
      }

      const extra = extraByMonth.get(month) ?? [];
      const events = eventsForMonth(month);
      const dlgQueue = events.filter((e) => e.channel === 'DLG' && !e.mvpDeferred);
      if (dlgQueue.length === 0) {
        attemptCommit({ ...s, dialogs: [] }, month, extra);
        return;
      }
      const [first, ...rest] = dlgQueue;
      processedRef.current = month - 1;
      pendingRef.current = { month, queue: rest, decisions: extra };
      commitState({ ...s, month, dialogs: [materializeDialog(first, month)] });
    },
    [attemptCommit, commitState],
  );

  const jumpToMonth = useCallback(
    (month: MonthIndex) => {
      if (!isValidMonth(month)) return; // §19.3 — never silently accept a bad state
      landOnMonth(month, new Map());
    },
    [landOnMonth],
  );

  const forceEvent = useCallback(
    (eventId: EventId) => {
      const event = EVENTS_BY_ID[eventId];
      if (!event) {
        console.info(`[presenter] forceEvent('${eventId}') — no such event id.`);
        return;
      }
      if (pendingRef.current || forcedSale) return; // one blocking thing at a time
      const s = stateRef.current;
      if (event.channel === 'DLG' && !event.mvpDeferred) {
        pendingRef.current = { month: s.month, queue: [], decisions: [], forced: true };
        commitState({ ...s, dialogs: [...s.dialogs, materializeDialog(event, s.month)] });
        return;
      }
      commitState(fireScheduledEvents(s, [event], []));
    },
    [forcedSale, commitState],
  );

  const loadPreset = useCallback(
    (preset: PresetName) => {
      switch (preset) {
        case 'start':
          pendingRef.current = null;
          forcedSaleTrialRef.current = null;
          setForcedSale(null);
          processedRef.current = -1;
          accumulatorRef.current = 0;
          commitState(createInitialState());
          setPausedState(false);
          setEvolutionPausedState(false);
          setRateOverride(RATE_NORMAL);
          return;
        case 'cash-only-march-2000':
          landOnMonth(monthIndex(2000, 3), new Map()); // §6/§8.4's one number
          return;
        case 'just-before-the-crash': {
          const month = monthIndex(2000, 2);
          landOnMonth(month, decisionsByMonth(openAllMailUpTo(month)));
          return;
        }
        case 'about-to-be-forced-to-sell': {
          // One month shy of the Sep 2001 trough shock (§12.3) — the live
          // clock's next tick raises it for real, ready to demo ForcedSale.
          const month = monthIndex(2001, 8);
          landOnMonth(month, decisionsByMonth(openAllMailUpTo(month)));
          return;
        }
        case 'holding-the-ponzi': {
          const month = monthIndex(2000, 6);
          landOnMonth(month, decisionsByMonth(holdingThePonziDecisions(month)));
          return;
        }
        case 'survived-2006':
          landOnMonth(MONTH_COUNT - 1, decisionsByMonth(perfectPlayDecisions()));
          return;
      }
    },
    [landOnMonth, commitState],
  );

  /**
   * §25.4 — the closing shot, on demand. Ends the run with an authored band
   * and cause instead of the one the decade would have produced.
   */
  const showDeathCard = useCallback(
    (band: Band, causeId: DeathCauseId) => {
      pendingRef.current = null;
      forcedSaleTrialRef.current = null;
      setForcedSale(null);
      const s = stateRef.current;
      commitState({
        ...s,
        status: band === 'LEGENDARY' ? 'survived' : 'dead',
        deathMonth: band === 'LEGENDARY' ? null : s.month,
        deathCauseId: causeId,
      });
      setPausedState(true);
    },
    [commitState],
  );

  const reset = useCallback(() => {
    loadPreset('start');
  }, [loadPreset]);

  const dispatch = useCallback(
    (decision: Decision) => {
      if (decision.type === 'resolve-dialog') {
        resolveDialogFlow(decision.month, decision.dialogId, decision.action);
        return;
      }
      if (pendingRef.current || forcedSale) return; // blocked while a dialog/forced-sale is up
      const s = stateRef.current;
      const next = fireScheduledEvents(s, [], [decision]);
      commitState({ ...next, decisions: [...next.decisions, decision] });
    },
    [resolveDialogFlow, forcedSale, commitState],
  );

  /* ---------------------------------------------------------------- *
   * §12.3 — the two ForcedSale choices.
   * ---------------------------------------------------------------- */
  const onForcedSaleConfirm = useCallback(() => {
    const trial = forcedSaleTrialRef.current;
    if (!trial || !forcedSale) return;
    processedRef.current = forcedSale.month;
    forcedSaleTrialRef.current = null;
    setForcedSale(null);
    commitState({ ...trial, decisions: [...trial.decisions, ...forcedSale.decisions] });
  }, [forcedSale, commitState]);

  const onForcedSalePickAlternative = useCallback(
    (vehicleId: VehicleId) => {
      if (!forcedSale) return;
      const alloc = currentAllocation(forcedSale.before);
      const targets: Partial<Record<VehicleId, number>> = {};
      let cashPct = alloc.cashPct;
      for (const [id, pct] of Object.entries(alloc.byVehicle) as [VehicleId, number][]) {
        if (id === vehicleId) cashPct += pct;
        else targets[id] = pct;
      }
      const sellDecision: Decision = { type: 'rebalance', month: forcedSale.month, targets, cashPct };
      attemptCommit(forcedSale.before, forcedSale.month, [sellDecision, ...forcedSale.decisions]);
    },
    [forcedSale, attemptCommit],
  );

  const engine: Engine = useMemo(
    () => ({
      state,
      paused,
      timeRate,
      dispatch,
      setPaused,
      setEvolutionPaused,
      setTimeRate,
      jumpToMonth,
      forceEvent,
      loadPreset,
      showDeathCard,
      reset,
    }),
    [
      state,
      paused,
      timeRate,
      dispatch,
      setPaused,
      setEvolutionPaused,
      setTimeRate,
      jumpToMonth,
      forceEvent,
      loadPreset,
      showDeathCard,
      reset,
    ],
  );

  return (
    <EngineContext.Provider value={engine}>
      {children}
      {forcedSale && (
        <ForcedSale
          before={forcedSale.before}
          items={forcedSale.items}
          shortfall={forcedSale.shortfall}
          alternatives={forcedSale.alternatives}
          nothingLeft={forcedSale.nothingLeft}
          onConfirm={onForcedSaleConfirm}
          onPickAlternative={onForcedSalePickAlternative}
        />
      )}
    </EngineContext.Provider>
  );
}
