/**
 * The Comet Assistant's hint balloon (PLAN-COMET-ASSISTANT.md, Step C2; plan
 * §2 — "a small speech balloon anchored below the button, top-right over the
 * content area... It covers no interactive element the player currently
 * needs, never blocks input, and auto-dismisses after
 * `--assistant-hint-duration`... A ✕ on the balloon dismisses it early.").
 *
 * Presentational only — the scheduling (which hint, when, the auto-dismiss
 * timer) lives in `src/ui/useAssistant.ts`, which passes down finished copy
 * and a single `onDismiss` the ✕ calls early. This mirrors how
 * `Nav.tsx`'s `useUnreadNotice()` owns its own timers while the badge it
 * feeds stays a dumb prop-renderer.
 *
 * §20 addition (this step's BUILD STATUS deviation): the balloon is a new,
 * fourth notification surface, quieter than Tier 3 (§20.3's inbox badge). It
 * never carries an offer or a vehicle — every string it can render comes
 * from `ASSISTANT_HINT_COPY` (src/content/assistant.ts), which is
 * method-coaching copy only — so §20.4's "the chrome never lies" rule
 * extends to it by construction, not by convention.
 *
 * `pointer-events` is scoped to the balloon's own face (not a full-bleed
 * overlay) so it can never intercept a click meant for the page underneath —
 * plan §2's "never blocks input". §23: no `transition` anywhere in this
 * file's styles — mounting IS the appearance, unmounting IS the dismissal.
 */
import type { CSSProperties } from 'react';
import './assistant.css';

export interface AssistantBalloonProps {
  /** Finished, already-looked-up copy (ASSISTANT_HINT_COPY[hint.contentId]). */
  text: string;
  /** Wired to the ✕ and to the auto-dismiss timer in useAssistant.ts. */
  onDismiss: () => void;
  /** Optional style passthrough — useAssistant.ts owns no positioning of its
   * own; every offset lives in assistant.css's tokened anchor, this exists
   * only so a future caller isn't forced to add a wrapper element. */
  style?: CSSProperties;
}

export function AssistantBalloon({ text, onDismiss, style }: AssistantBalloonProps) {
  return (
    <div
      className="chrome bevel-out comet-assistant-balloon"
      role="status"
      aria-live="polite"
      style={style}
    >
      <button
        type="button"
        className="comet-assistant-balloon__close"
        aria-label="Dismiss"
        title="Dismiss"
        onClick={onDismiss}
      >
        ✕
      </button>
      <p className="comet-assistant-balloon__text">{text}</p>
      <span className="comet-assistant-balloon__tail" aria-hidden="true" />
    </div>
  );
}
