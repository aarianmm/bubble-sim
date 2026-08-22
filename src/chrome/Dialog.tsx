/**
 * Tier 1 — the system dialog (Step 20, §20.1). Shocks, job loss, forced
 * sales, year turns, death. Time is paused for as long as one is open —
 * enforced upstream by src/ui/EngineProvider.tsx, which already freezes
 * the clock while `state.dialogs.length > 0` (see its `frozen` constant).
 * This component's own job is narrower and non-negotiable: there must be
 * NO code path in this file that closes a dialog without the player
 * choosing one of its buttons (§20.1: "there is never a [Dismiss] or
 * [Later]. Shocks are not optional; a choice must be made.").
 *
 * Concretely, that means this file never wires:
 *   - an onClick on the backdrop or the overlay (click-outside-to-close)
 *   - a keydown handler for Escape (or any other key)
 *   - a working handler on the drawn ✕ (it is a real <button disabled>)
 * See dialog.test.ts, which asserts all three by firing the events and
 * checking `onResolve` was never called.
 *
 * §20.4 — the trust hierarchy this tier exists to protect: "the system
 * dialog channel never carries an offer." Enforced at the type level, not
 * just by convention: `DialogItem` (sim/types.ts) has no `vehicleId`
 * field, so a Dialog literally cannot be constructed with one — a
 * `@ts-expect-error` in dialog.test.ts keeps that a live compile-time
 * guarantee rather than a comment that quietly stops being true.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { DialogAction, DialogItem } from '../sim/types';
import { DIALOGS } from '../content/dialogs';
import './dialog.css';

export interface DialogProps {
  dialog: DialogItem;
  /** Fired only when the player activates one of `dialog.buttons`. Nothing
   * else in this component ever calls it. */
  onResolve: (action: DialogAction) => void;
  /**
   * Overrides the plain-string body normally looked up from
   * `DIALOGS[dialog.contentId]`. Additive, optional, defaults to that
   * lookup unchanged — for src/ui/ForcedSale.tsx (§12.3), whose itemized
   * "what will be sold, at what loss, in both money terms" body is computed
   * from live GameState via <Money>, not authored copy, and so has no
   * `contentId` to look up in the first place. Everything else about this
   * component (no dismiss, max two buttons, dims and freezes the page
   * behind it) is unchanged and still applies.
   */
  bodyOverride?: ReactNode;
}

/* 32x32, hand-drawn (§24 — no external assets, nothing from Microsoft). */
function WarningIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="comet-dialog__icon-glyph">
      <polygon
        points="16,2 30,28 2,28"
        fill="var(--icon-yellow)"
        stroke="var(--dk-shadow)"
        strokeWidth="1.5"
      />
      <rect x="14.5" y="11" width="3" height="9" fill="var(--dk-shadow)" />
      <rect x="14.5" y="22" width="3" height="3" fill="var(--dk-shadow)" />
    </svg>
  );
}

export function Dialog({ dialog, onResolve, bodyOverride }: DialogProps) {
  const defaultBtnRef = useRef<HTMLButtonElement | null>(null);
  const body = DIALOGS[dialog.contentId]?.body ?? '';
  // §20.1: max two buttons is content's own rule (content.test.ts enforces
  // it); this is defence in depth so the component itself never renders a
  // third even if that regresses upstream.
  const buttons = dialog.buttons.slice(0, 2);

  useEffect(() => {
    defaultBtnRef.current?.focus();
    // Re-run whenever a *different* dialog takes this component's place
    // (dialogs are stacked one at a time in state.dialogs, but React may
    // reuse this component across them) so keyboard focus always lands on
    // the new dialog's default action, never a stale one.
  }, [dialog.id]);

  return createPortal(
    <>
      <div className="comet-dialog-backdrop" aria-hidden="true" />
      <div className="comet-dialog-overlay" role="presentation">
        <div
          className="chrome bevel-out comet-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`${dialog.id}-title`}
        >
          <div className="comet-dialog__titlebar">
            <span className="comet-dialog__title-icon" aria-hidden="true">
              ⚠
            </span>
            <span id={`${dialog.id}-title`} className="comet-dialog__title">
              Comet Navigator
            </span>
            <button
              type="button"
              className="bevel-out comet-dialog__close"
              disabled
              aria-disabled="true"
              aria-label="Close (disabled — a choice is required)"
              tabIndex={-1}
            >
              ✕
            </button>
          </div>

          <div className="comet-dialog__body">
            <span className="comet-dialog__icon" aria-hidden="true">
              <WarningIcon />
            </span>
            {bodyOverride ?? <p className="comet-dialog__text">{body}</p>}
          </div>

          <div className="comet-dialog__buttons">
            {buttons.map((btn) => (
              <button
                key={btn.action}
                ref={(el) => {
                  if (btn.isDefault) defaultBtnRef.current = el;
                }}
                type="button"
                className={
                  'bevel-out comet-dialog__btn' +
                  (btn.isDefault ? ' comet-dialog__btn--default' : '')
                }
                onClick={() => onResolve(btn.action)}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
