/**
 * Tier 2 — the popup window (Step 21, §20.2). Unsolicited offers and ads.
 * Time keeps running — nothing in this file pauses anything. Chromeless
 * (no menu, no address bar, no status bar: this component renders none of
 * Window.tsx's children, on purpose), draggable, with a real working ✕.
 *
 * Positioning: `popup.x`/`popup.y` are trusted as given, in pixels,
 * relative to the content area's top-left. sim/tick.ts currently
 * materialises every PopupItem with x/y/width/height all 0 and says so in
 * its own comment ("Step 20's UI is free to derive a richer placement from
 * the month index; the sim doesn't care") — `popupPlacement.ts`'s
 * `popupOffset()` is that derivation, a pure function of (month, slot),
 * never `Math.random()` (§25.1). This component doesn't call it itself
 * (it only renders whatever x/y it's handed) so it stays a dumb, fully
 * testable renderer; NotificationDemo.tsx is the worked example of a
 * caller computing real positions before constructing a PopupItem.
 *
 * §20.5 seam (do NOT build — Step 32, outside the MVP boundary, §26.1):
 * `PopupItem.imitatesDialog` marks the one 2003 popup that pretends to be
 * a system dialog. When that step lands, it needs to render all three of
 * the tells that make the fake fair and detectable, per §20.5:
 *   1. It doesn't pause time — no <Popup> ever touches the clock, and it
 *      still shouldn't when this flag is set.
 *   2. It sits inside the content area, not centred over the whole
 *      window — i.e. it still renders through the popup layer below, not
 *      Dialog.tsx's overlay.
 *   3. Hovering its buttons reveals a URL in the status bar (via
 *      useLinkPreview() / <GameLink>, chrome/router.tsx) — a real system
 *      dialog's buttons never do that.
 * This component deliberately does not branch on `imitatesDialog` today.
 */
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { PopupItem } from '../sim/types';
import './popup.css';

export interface PopupCta {
  label: string;
  url: string;
}

export interface PopupProps {
  popup: PopupItem;
  /** Body paragraphs, resolved by the caller from content/messages.ts
   * (POPUP_MESSAGES[popup.contentId].body) — kept out of PopupItem itself,
   * same split sim/tick.ts already uses for DialogItem/body. */
  body: string[];
  /** WordArt-style heading; falls back to popup.title when omitted. */
  heading?: string;
  /** Scrolling marquee line, real and looping (§23) — omit for calmer
   * (non-junk/scam) offers; not every popup needs to look like a scam
   * (§10 rule 1). */
  marquee?: string;
  /** Tiled, garish background — same "not every popup is a scam" opt-in. */
  loud?: boolean;
  cta?: PopupCta;
  /** Always safe to call, always removes the popup — nothing else in this
   * component does (§10 rule 2: "closing a popup is free and safe,
   * always"). */
  onClose: (popupId: string) => void;
  /** The caller navigates the main window and files the inbox copy
   * (§10 rule 3 / §20.2) — see popupPlacement.ts's popupToMailItem(). This
   * component only reports the click. */
  onCtaClick: (popup: PopupItem, cta: PopupCta) => void;
}

let sharedZCounter = 10;

function getPopupLayer(): HTMLElement {
  let layer = document.getElementById('bubble-popup-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'bubble-popup-layer';
    document.body.appendChild(layer);
  }
  return layer;
}

export function Popup({ popup, body, heading, marquee, loud = false, cta, onClose, onCtaClick }: PopupProps) {
  const [pos, setPos] = useState({ x: popup.x, y: popup.y });
  const [z, setZ] = useState(() => ++sharedZCounter);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; origX: number; origY: number } | null>(
    null,
  );

  function bringToFront() {
    setZ(++sharedZCounter);
  }

  function onTitlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    bringToFront();
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onTitlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setPos({ x: drag.origX + (e.clientX - drag.startX), y: drag.origY + (e.clientY - drag.startY) });
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }

  return createPortal(
    <div
      className="chrome bevel-out comet-popup"
      style={{ left: pos.x, top: pos.y, width: popup.width, height: popup.height, zIndex: z }}
      role="dialog"
      aria-label={popup.title}
      onPointerDown={bringToFront}
      data-popup-id={popup.id}
    >
      <div
        className="comet-popup__titlebar"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="comet-popup__title">{popup.title}</span>
        <button
          type="button"
          className="bevel-out comet-popup__close"
          aria-label="Close"
          title="Close"
          onClick={() => onClose(popup.id)}
        >
          ✕
        </button>
      </div>

      <div className={'comet-popup__content' + (loud ? ' comet-popup__content--loud' : '')}>
        <div className="comet-popup__heading">{heading ?? popup.title}</div>
        {marquee && (
          <div className="comet-popup__marquee-track">
            <span className="comet-popup__marquee-text">{marquee}</span>
          </div>
        )}
        {body.map((paragraph, i) => (
          <p key={i} className="comet-popup__para">
            {paragraph}
          </p>
        ))}
        {cta && (
          <button type="button" className="bevel-out comet-popup__cta" onClick={() => onCtaClick(popup, cta)}>
            {cta.label}
          </button>
        )}
      </div>
    </div>,
    getPopupLayer(),
  );
}
