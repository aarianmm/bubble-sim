/**
 * The Comet Assistant's chat panel (PLAN-COMET-ASSISTANT.md, Step C1; plan
 * §2 — "clicking the button toggles a chat panel anchored under the
 * button, roughly 300×380, era-styled... Title reads 'Comet Assistant'. A
 * text field + Ask button at the bottom, transcript above."). This step
 * ships the shell only: an empty transcript area and a disabled-looking
 * input row. C5 (plan §9) wires the real `useAssistant()` hook in here —
 * `AssistantPanelProps` (Chrome.types.ts) stays deliberately minimal
 * (`onClose` only) so that step can add new optional props without
 * reshaping this one.
 *
 * Follows popup.css's chromeless-surface idiom (its own `bevel-out` face,
 * its own plain title strip) rather than Dialog.tsx's centred Tier-1
 * treatment — this is neither blocking nor a system dialog, and plan §1
 * says the assistant is read-only, so it must never read like one. §23: no
 * easing — opening and closing is the mount/unmount itself, not an
 * animation.
 *
 * Step C5 (plan §9) wires in the real transcript, input and offline status
 * line — all owned by `useAssistant.ts`; this component stays a plain
 * renderer over the props it is handed (`transcript`, `inFlight`,
 * `offline`, `onSend`), same as every other /chrome component (§18.1: /ui
 * is glue, /chrome owns no game logic).
 */
import { useEffect, useState, type KeyboardEvent } from 'react';
import type { AssistantPanelProps } from './Chrome.types';
import './assistant.css';

export function AssistantPanel({ onClose, transcript, inFlight, offline, onSend }: AssistantPanelProps) {
  const [value, setValue] = useState('');

  // Closes on Escape (plan §2); the disabled ✕ pattern from Dialog.tsx does
  // NOT apply here — this is not a Tier 1 dialog, and closing the assistant
  // is always free, exactly like Popup's close button (§10 rule 2's spirit).
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || inFlight) return; // plan §9: empty input is a no-op
    onSend(trimmed);
    setValue('');
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit();
  }

  return (
    <div
      className="chrome bevel-out comet-assistant-panel"
      role="dialog"
      aria-label="Comet Assistant"
    >
      <div className="comet-assistant-panel__titlebar">
        <span className="comet-assistant-panel__title">Comet Assistant</span>
        <button
          type="button"
          className="bevel-out comet-assistant-panel__close"
          aria-label="Close"
          title="Close"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* A polite live region: streamed deltas and the eventual fallback
       * swap both read out without stealing focus from the input below. */}
      <div className="comet-assistant-panel__transcript" role="log" aria-live="polite">
        {transcript.length === 0 ? (
          <p className="comet-assistant-panel__transcript-empty">
            Ask me about the game, your finances, or how to check an offer.
          </p>
        ) : (
          transcript.map((turn, i) => (
            <p
              key={i}
              className={
                'comet-assistant-panel__turn' +
                (turn.role === 'user'
                  ? ' comet-assistant-panel__turn--user'
                  : ' comet-assistant-panel__turn--assistant')
              }
            >
              {turn.content}
            </p>
          ))
        )}
      </div>

      {/* plan §7 — exact wording, visible but not alarming. */}
      {offline && (
        <p className="comet-assistant-panel__offline" role="status">
          ⚠ Working offline — answers from the built-in help file.
        </p>
      )}

      <div className="comet-assistant-panel__inputrow">
        <input
          type="text"
          className="sunken-field comet-assistant-panel__input"
          placeholder="Ask the Comet Assistant…"
          aria-label="Ask the Comet Assistant"
          value={value}
          disabled={inFlight}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button
          type="button"
          className="bevel-out comet-assistant-panel__ask"
          disabled={inFlight || value.trim().length === 0}
          onClick={submit}
        >
          Ask
        </button>
      </div>
    </div>
  );
}
