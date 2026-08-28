/**
 * PLAN-COMET-ASSISTANT.md §8 / Step C2 — the Comet Assistant's hint
 * scheduling. Watches the live engine's month, runs the pure `nextHint`
 * scheduler (src/script/hints.ts), and exposes the current balloon
 * (finished copy + a dismiss callback) to `AssistantBalloon.tsx`.
 *
 * SCOPE (Step C2 file list — "scheduling half only"): this hook does not
 * open a panel, hold a transcript, or send anything. C5 extends this same
 * hook with the chat half (plan §8: `open`/close, transcript, `inFlight`,
 * `send()`) and the time-rate side effect on open/close. Nothing below
 * should need reshaping when that lands — see the section comment before
 * the return statement, where that half's fields join this one's.
 */
import { useEffect, useRef, useState } from 'react';
import { useEngine } from './engine';
import { nextHint, type ShownHint } from '../script/hints';
import { ASSISTANT_HINT_COPY } from '../content/assistant';

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

  // engine.reset() rebuilds state under this same mounted hook. This is the
  // exact signal AppShell's own evolution effect already keys off (App.tsx,
  // KNOWN-ISSUES.md #23) — a run's shown-hint history is run-scoped, not
  // page-scoped, so a reset clears it here rather than waiting for an
  // unmount that may never happen.
  useEffect(() => {
    if (resetKey === previousResetKeyRef.current) return;
    previousResetKeyRef.current = resetKey;
    shownRef.current = [];
    clearDismissTimer();
    setBalloon(null);
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

  /* ---------------------------------------------------------------- *
   * C5 (plan §8) extends this return shape with the chat half: open/close
   * (and the RATE_INBOX time-rate side effect on each), an in-memory
   * transcript cleared by the same resetKey effect above, `inFlight`, and
   * `send()`. All additive — nothing above needs to change shape.
   * ---------------------------------------------------------------- */
  return { balloon, dismissBalloon };
}
