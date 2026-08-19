/**
 * The title bar (§18.1). Shows the current page title; `_ □ ✕` are inert but
 * correctly drawn — hovering shows the bevel press (window.css). Clicking ✕
 * prompts "Are you sure you want to leave?" and only fires onCloseConfirmed
 * if the player confirms (§18.1's table, row "Title bar").
 *
 * Static (§26.2 Step 12): minimize/maximize do nothing, on purpose — there is
 * no real desktop under this window to minimize to.
 */
import type { TitleBarProps } from './Chrome.types';
import { noop } from './Chrome.types';

/* An abstract "app" glyph, inline SVG rather than a Unicode character —
 * glyph coverage for symbols like ⊞ varies enough across fallback fonts
 * (§25.4: the bitmap W95FA clone isn't bundled yet) that a drawn icon is
 * the only way to guarantee it renders the same everywhere (§24). */
function WindowIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="comet-titlebar__icon-glyph">
      <rect x="1" y="1" width="14" height="14" fill="var(--face)" stroke="var(--title-text)" strokeWidth="1" />
      <rect x="1" y="1" width="14" height="4" fill="var(--title-text)" />
      <rect x="3" y="9" width="4" height="4" fill="var(--title-text)" />
      <rect x="9" y="9" width="4" height="4" fill="var(--title-text)" />
    </svg>
  );
}

export function TitleBar({ title, onCloseConfirmed = noop }: TitleBarProps) {
  function handleClose() {
    if (window.confirm('Are you sure you want to leave?')) {
      onCloseConfirmed();
    }
  }

  return (
    <div className="chrome comet-titlebar">
      <span className="comet-titlebar__icon">
        <WindowIcon />
      </span>
      <span className="comet-titlebar__title">{title}</span>
      <div className="comet-titlebar__controls">
        <button
          type="button"
          className="bevel-out comet-titlebar__btn"
          aria-label="Minimize"
          title="Minimize"
        >
          _
        </button>
        <button
          type="button"
          className="bevel-out comet-titlebar__btn"
          aria-label="Maximize"
          title="Maximize"
        >
          □
        </button>
        <button
          type="button"
          className="bevel-out comet-titlebar__btn comet-titlebar__btn--close"
          aria-label="Close"
          title="Close"
          onClick={handleClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
