/**
 * The Comet Assistant's throbber button (PLAN-COMET-ASSISTANT.md, Step C1;
 * plan §2 — "the right end of the toolbar row — the exact spot where IE4
 * kept its animated throbber logo... a small pixel-art comet with a face").
 * Mounts via `Toolbar.tsx`'s `rightSlot` (Chrome.types.ts).
 *
 * One SVG art group, not the legacy/millennium pair Toolbar.tsx's own icons
 * use (`comet-icon__legacy` / `comet-icon__millennium`). The comet is a
 * single character across the whole run — the plan's diegetic framing is
 * "the AI is real; it wears a 1998 costume" (plan §0.2), not a different
 * face each era — and a friendly rounded face reads fine from
 * `--assistant-button-size: 30px` (Era B) up to 46px (1998) without needing
 * a second, simpler silhouette the way dense toolbar glyphs do. Its
 * "costume" still shifts per milestone: every fill below is a token
 * (tokens.css's `--assistant-comet-*`), so the colours change without a
 * second markup group. This keeps the component itself asking zero
 * questions about which era or year it is in (CLAUDE.md rule 3) — verified
 * by AssistantButton.test.tsx, which renders under all three milestones and
 * asserts byte-identical markup.
 *
 * Owns its own open/closed state locally — the same uncontrolled pattern
 * AddressBar's visited-URL dropdown and MenuBar's open menu already use for
 * presentation-only UI state (see those files). `onOpenChange` lets a later
 * step (`useAssistant.ts`, plan §8) observe transitions — e.g. to slow the
 * clock on open and restore it on close — without this file changing shape.
 */
import { useState } from 'react';
import type { AssistantButtonProps } from './Chrome.types';
import { AssistantPanel } from './AssistantPanel';
import './assistant.css';

/* 32x32, hand-drawn (§24 — no external assets). Tokened colours only. */
function CometIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M4 27 15 16 19 20 8 31z"
        fill="var(--assistant-comet-tail)"
        stroke="var(--dk-shadow)"
        strokeWidth="1"
      />
      <circle
        cx="20"
        cy="12"
        r="9"
        fill="var(--assistant-comet-body)"
        stroke="var(--dk-shadow)"
        strokeWidth="1"
      />
      <path
        d="M14 8a9 9 0 0 1 6-3.9"
        fill="none"
        stroke="var(--assistant-comet-body-light)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M27 15a9 9 0 0 1-3 5.5"
        fill="none"
        stroke="var(--assistant-comet-body-dark)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="13" r="6" fill="var(--assistant-comet-face)" />
      <circle cx="17.5" cy="12" r="1.1" fill="var(--assistant-comet-eye)" />
      <circle cx="22.5" cy="12" r="1.1" fill="var(--assistant-comet-eye)" />
      <path
        d="M17 15.5c1 1.2 4 1.2 5 0"
        fill="none"
        stroke="var(--assistant-comet-eye)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="16" cy="14.5" r="1" fill="var(--assistant-comet-cheek)" />
      <circle cx="24" cy="14.5" r="1" fill="var(--assistant-comet-cheek)" />
    </svg>
  );
}

export function AssistantButton({ onOpenChange }: AssistantButtonProps) {
  const [open, setOpen] = useState(false);

  function setOpenAndNotify(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div className="chrome comet-assistant">
      <button
        type="button"
        className="bevel-out comet-assistant__btn"
        aria-label="Comet Assistant"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpenAndNotify(!open)}
      >
        <span className="comet-assistant__icon">
          <CometIcon />
        </span>
      </button>
      {open && <AssistantPanel onClose={() => setOpenAndNotify(false)} />}
    </div>
  );
}
