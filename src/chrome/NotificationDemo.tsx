/**
 * A test-only harness for the three notification tiers (§20).
 *
 * ROLE CHANGED BY STEP 24: the scheduler (src/sim/scheduler.ts) now fires
 * every §14.2 event for real, and src/ui/Notifications.tsx renders the
 * genuine `state.dialogs`/`state.popups` through the same Dialog.tsx and
 * Popup.tsx this file uses — this is no longer the only way to see a
 * dialog or three concurrent popups. It stays, unmodified, as a manual,
 * state-independent trigger retained for component tests.
 *
 * Nothing here is reachable in a normal run.
 */
import { useState } from 'react';
import { Dialog } from './Dialog';
import { Popup } from './Popup';
import { MAX_CONCURRENT_POPUPS, popupOffset } from './popupPlacement';
import { useEngine } from '../ui/engine';
import type { DialogItem, PopupItem } from '../sim/types';
import { DAYS_PER_MONTH } from '../sim/month';
import './notification-demo.css';

/** §20.2: popups auto-close after ~45 simulated days. */
const POPUP_LIFETIME_MONTHS = 45 / DAYS_PER_MONTH;

/** The content area at the 1024x768 floor, less the chrome around it. */
const CONTENT_W = 1024 - 190;
const CONTENT_H = 768 - 210;

function sampleDialog(month: number): DialogItem {
  return {
    id: 'demo-dialog',
    eventId: 'demo',
    title: 'Bubble Navigator',
    // Authored copy, so the demo shows the real thing rather than lorem.
    contentId: 'dlg.2000-03.shock.boiler',
    cls: 'shock',
    raisedMonth: month,
    amount: 900,
    buttons: [
      { label: 'Sell to cover', action: 'sell-to-cover', isDefault: true },
      { label: 'Pay from cash', action: 'pay-from-cash' },
    ],
  };
}

/** §20.2 — 300x250 or 468x280. Alternating by slot keeps the batch from
 * reading as a grid of identical boxes. */
const POPUP_SIZES = [
  { width: 300, height: 250 },
  { width: 468, height: 280 },
] as const;

function samplePopup(slot: number, month: number): PopupItem {
  const { width, height } = POPUP_SIZES[slot % POPUP_SIZES.length];
  const { x, y } = popupOffset(month, slot, CONTENT_W, CONTENT_H, width, height);
  return {
    id: `demo-popup-${slot}`,
    eventId: 'demo',
    title: 'EasyPay Credit',
    contentId: 'pop.demo',
    cls: 'junk',
    openedMonth: month,
    closesMonth: month + POPUP_LIFETIME_MONTHS,
    x,
    y,
    width,
    height,
  };
}

export function NotificationDemo() {
  const { state } = useEngine();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popupSlots, setPopupSlots] = useState<number[]>([]);

  return (
    <>
      <div className="chrome notification-demo bevel-out">
        <span className="notification-demo__label">§20 tiers</span>
        <button className="bevel-out" onClick={() => setDialogOpen(true)}>
          Raise dialog
        </button>
        <button
          className="bevel-out"
          onClick={() =>
            setPopupSlots(Array.from({ length: MAX_CONCURRENT_POPUPS }, (_, i) => i))
          }
        >
          Open 3 popups
        </button>
      </div>

      {dialogOpen && (
        <Dialog dialog={sampleDialog(state.month)} onResolve={() => setDialogOpen(false)} />
      )}

      {popupSlots.map((slot) => (
        <Popup
          key={slot}
          popup={samplePopup(slot, state.month)}
          heading="0% INTEREST — BUY NOW, PAY LATER"
          marquee="NOTHING TO PAY FOR 3 MONTHS"
          loud
          body={[
            'Spread the cost today with nothing to pay for the first 3 months.',
            'Standard interest applies after the introductory period.',
          ]}
          onClose={(id) =>
            setPopupSlots((slots) => slots.filter((s) => `demo-popup-${s}` !== id))
          }
          onCtaClick={() => undefined}
        />
      ))}
    </>
  );
}
