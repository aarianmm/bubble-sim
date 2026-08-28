/**
 * PLAN-COMET-ASSISTANT.md §8 — the Comet Assistant's UI state. Step C2 built
 * the hint-scheduling half (watches the live engine's month, runs the pure
 * `nextHint` scheduler in src/script/hints.ts, exposes the current balloon).
 * Step C5 (this pass) adds the chat half: lifted open/closed state, the
 * in-memory transcript, `inFlight`/`offline`, `send()`, and the time-rate
 * side effect on open/close. Both halves share one hook because both are
 * driven by the same engine subscription and the same run-reset signal.
 */
import { useEffect, useRef, useState } from 'react';
import { RATE_ASSISTANT, RATE_NORMAL, useEngine } from './engine';
import { nextHint, type ShownHint } from '../script/hints';
import { ASSISTANT_HINT_COPY } from '../content/assistant';
import { buildAssistantContext, type AssistantRoute } from './assistantContext';
import { matchFallback } from './assistantFallback';
import { streamAssistantReply, type AssistantMessage } from './assistantApi';
import type { AssistantTurn } from '../chrome/Chrome.types';

/** plan §8: "send() ... trim the transcript sent upstream to the last 12
 * turns." Applied to the combined (history + new question) array. */
const MAX_UPSTREAM_TURNS = 12;

/**
 * Matches `--assistant-hint-duration` in tokens.css — identical across all
 * three milestone blocks (it is a timing constant, not a milestone look).
 * Same JS/CSS pairing as `UNREAD_FLASH_MS` in `src/chrome/Nav.tsx` against
 * `--duration-unread-flash`.
 */
export const ASSISTANT_HINT_DURATION_MS = 6000;

export interface AssistantBalloonState {
  hintId: string;
  text: string;
}

export interface UseAssistantResult {
  /** The currently showing balloon, or null between hints. */
  balloon: AssistantBalloonState | null;
  /** Wired to the balloon's ✕ and to the auto-dismiss timer alike. */
  dismissBalloon: () => void;

  /** Lifted here (plan §8) rather than owned by AssistantButton, because
   * `Help > Comet Assistant` (App.tsx) must be able to open the same panel
   * the toolbar throbber does — one owner for one boolean. */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** In-memory only (plan §11: no persistence across runs or reloads);
   * cleared whenever `engine.reset()` rebuilds state (mailNoticeResetKey
   * change), same signal the hint half already keys off below. */
  transcript: AssistantTurn[];
  /** True while a question is in flight — network attempt, timeout, or the
   * synchronous fallback resolution alike. */
  inFlight: boolean;
  /** Latches true the first time any reply in this run comes from the
   * offline fallback (plan §7); never clears itself mid-run. */
  offline: boolean;
  /** Plan §1: the assistant is read-only. This is the only way `send`
   * touches the engine (setTimeRate on open/close) — it never dispatches a
   * game decision. `route` is threaded in by the caller (App.tsx already
   * has the router) rather than imported here, to keep this hook free of a
   * chrome/router dependency. */
  send: (question: string, route: AssistantRoute) => void;
}

export function useAssistant(): UseAssistantResult {
  const engine = useEngine();
  const month = engine.state.month;
  const dialogCount = engine.state.dialogs.length;
  const status = engine.state.status;
  const resetKey = engine.mailNoticeResetKey ?? 0;

  // Run-scoped bookkeeping. A ref, not state: it feeds a pure function
  // (nextHint) on every render and never itself needs to trigger one.
  const shownRef = useRef<ShownHint[]>([]);
  const previousResetKeyRef = useRef(resetKey);
  const dismissTimerRef = useRef<number | null>(null);
  const [balloon, setBalloon] = useState<AssistantBalloonState | null>(null);

  function clearDismissTimer() {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }

  function dismissBalloon() {
    clearDismissTimer();
    setBalloon(null);
  }

  // Chat half (Step C5, plan §8).
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState<AssistantTurn[]>([]);
  const [inFlight, setInFlight] = useState(false);
  const [offline, setOffline] = useState(false);

  // engine.reset() rebuilds state under this same mounted hook. This is the
  // exact signal AppShell's own evolution effect already keys off (App.tsx,
  // KNOWN-ISSUES.md #23) — a run's shown-hint history AND its transcript are
  // both run-scoped, not page-scoped (plan §11: "no persistence across runs
  // or reloads"), so a reset clears both here rather than waiting for an
  // unmount that may never happen. `inFlight`/`offline` are reset alongside
  // it — a stale "Working offline" banner surviving into a fresh run would
  // misreport the new run's own (as yet untested) connectivity.
  useEffect(() => {
    if (resetKey === previousResetKeyRef.current) return;
    previousResetKeyRef.current = resetKey;
    shownRef.current = [];
    clearDismissTimer();
    setBalloon(null);
    setTranscript([]);
    setInFlight(false);
    setOffline(false);
  }, [resetKey]);

  useEffect(() => {
    const hint = nextHint(engine.state, shownRef.current);
    if (!hint) return;

    shownRef.current = [...shownRef.current, { id: hint.id, month }];
    clearDismissTimer();
    setBalloon({ hintId: hint.id, text: ASSISTANT_HINT_COPY[hint.contentId] ?? '' });
    dismissTimerRef.current = window.setTimeout(() => {
      dismissTimerRef.current = null;
      setBalloon(null);
    }, ASSISTANT_HINT_DURATION_MS);
    // Re-runs on every month tick and on any dialog/status change, since
    // both gate `nextHint` (plan §4: never over a blocking dialog, never off
    // the running state) as well as month. Depends on the three primitives
    // nextHint's own gates read, not on `engine.state` itself.
  }, [month, dialogCount, status]);

  useEffect(() => clearDismissTimer, []);

  // Plan §8: "On open: engine.setTimeRate(RATE_ASSISTANT)... On close:
  // restore RATE_NORMAL. Never pause." The cleanup covers both an explicit
  // close (open flips false) and an unmount while still open (plan C5
  // acceptance: "make sure the rate is restored if the component unmounts
  // while open") — an effect cleanup fires in both cases identically.
  // `setPaused`/`setAutoPaused` are never called anywhere in this hook.
  useEffect(() => {
    if (!open) return;
    engine.setTimeRate(RATE_ASSISTANT);
    return () => engine.setTimeRate(RATE_NORMAL);
    // Deliberately keyed on `open` alone, not `engine` — `engine.setTimeRate`
    // is a stable useCallback (EngineProvider.tsx), and re-running this
    // effect on every state tick would fight the player's own hold-to-fast-
    // forward rate changes while the panel sits open.
  }, [open]);

  /**
   * Plan §8 `send()`:
   *  1. push the user turn; trim what's sent upstream to the last 12 turns;
   *  2. build context from the *live* engine state and the caller's route;
   *  3. stream the reply, appending deltas to a live streaming turn;
   *  4. on any `failure`, discard the partial and replace it with the
   *     authored fallback, latching `offline`;
   *  5. never throws — a failure is a normal, handled outcome, not an
   *     exception the caller must catch.
   *
   * The only engine call anywhere in this hook is `setTimeRate` above —
   * `send` never calls `engine.dispatch`, so it can never issue a game
   * decision (plan §1's read-only corollary, keeping the §25.2 determinism
   * contract intact).
   */
  function send(question: string, route: AssistantRoute) {
    const trimmed = question.trim();
    if (!trimmed || inFlight) return;

    const userTurn: AssistantTurn = { role: 'user', content: trimmed };
    const upstream: AssistantMessage[] = [...transcript, userTurn]
      .slice(-MAX_UPSTREAM_TURNS)
      .map((t) => ({ role: t.role, content: t.content }));
    // Context is built from the live engine state at send-time, not from a
    // stale closure — the player's question is answered against what they
    // can see right now.
    const context = buildAssistantContext(engine.state, route);

    setTranscript((cur) => [...cur, userTurn, { role: 'assistant', content: '' }]);
    setInFlight(true);

    void (async () => {
      let accumulated = '';
      let failed = false;

      try {
        for await (const event of streamAssistantReply(context, upstream)) {
          if (event.type === 'delta') {
            accumulated += event.text;
            setTranscript((cur) => {
              const next = cur.slice();
              next[next.length - 1] = { role: 'assistant', content: accumulated };
              return next;
            });
          } else if (event.type === 'done') {
            break;
          } else {
            // event.type === 'failure' — discard the partial (plan §7),
            // never mix streamed and fallback content in one turn.
            failed = true;
            break;
          }
        }
      } catch {
        failed = true;
      }

      if (failed) {
        const fallback = matchFallback(trimmed, engine.state);
        setTranscript((cur) => {
          const next = cur.slice();
          next[next.length - 1] = { role: 'assistant', content: fallback };
          return next;
        });
        setOffline(true);
      }
      setInFlight(false);
    })();
  }

  return { balloon, dismissBalloon, open, setOpen, transcript, inFlight, offline, send };
}
