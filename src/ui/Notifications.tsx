/**
 * Step 24 wiring — renders the real notification tiers straight off
 * GameState: `state.dialogs[0]` through the real Dialog.tsx (§20.1),
 * `state.popups` through the real Popup.tsx (§20.2). state.inbox's Tier 3
 * badge needs nothing extra — src/chrome/Nav.tsx's useUnreadNotice already
 * reads the real inbox via sim/selectors.ts.
 *
 * Popup pixel position is computed here, not in the sim: sim/tick.ts and
 * sim/scheduler.ts deliberately leave PopupItem.x/y at 0 (they don't know
 * the viewport, §25.1) — src/chrome/popupPlacement.ts's popupOffset() is
 * the pure, non-random derivation from (openedMonth, slot); this is the
 * caller that finally has a content box to hand it.
 */
import { Dialog } from '../chrome/Dialog';
import { Popup, type PopupCta } from '../chrome/Popup';
import { popupOffset } from '../chrome/popupPlacement';
import { POPUP_MESSAGES } from '../content/messages';
import { VEHICLES } from '../sim/vehicles';
import { OFFER_PAGES } from '../content/offerpages';
import { useEngine } from './engine';
import { useRouter } from '../chrome/router';
import type { PopupItem } from '../sim/types';

/** The content area at the 1024x768 floor, less the chrome around it —
 * same figures src/chrome/NotificationDemo.tsx uses, so a popup positioned
 * live and one positioned by the dev harness read identically. */
const CONTENT_W = 1024 - 190;
const CONTENT_H = 768 - 210;

/** PopupItem ids are `${eventId}` (count 1) or `${eventId}.${slot}` (a
 * batch, §20.2) — recover the slot for popupOffset's placement arithmetic. */
function slotOf(popup: PopupItem): number {
  const match = /\.(\d+)$/.exec(popup.id);
  return match ? Number(match[1]) : 0;
}

function ActiveDialog() {
  const { state, dispatch } = useEngine();
  const dialog = state.dialogs[0];
  if (!dialog) return null;
  return (
    <Dialog
      dialog={dialog}
      onResolve={(action) =>
        dispatch({ type: 'resolve-dialog', month: state.month, dialogId: dialog.id, action })
      }
    />
  );
}

function ActivePopups() {
  const { state, dispatch } = useEngine();
  const router = useRouter();

  return (
    <>
      {state.popups.map((popup) => {
        const msg = POPUP_MESSAGES[popup.contentId];
        const vehicle = popup.vehicleId ? VEHICLES[popup.vehicleId] : undefined;
        const offerPage = popup.vehicleId ? OFFER_PAGES[popup.vehicleId as Exclude<typeof popup.vehicleId, 'cash'>] : undefined;
        const { x, y } = popupOffset(popup.openedMonth, slotOf(popup), CONTENT_W, CONTENT_H, popup.width, popup.height);
        const cta: PopupCta | undefined = vehicle && offerPage ? { label: offerPage.ctaLabel, url: vehicle.url } : undefined;

        return (
          <Popup
            key={popup.id}
            popup={{ ...popup, x, y }}
            heading={msg?.subject}
            body={msg?.body ?? []}
            // §21 rule 1: loud is a style band, not a verdict — scams and
            // junk skew loud, but this is decoration, not the tell.
            loud={popup.cls === 'scam' || popup.cls === 'junk'}
            cta={cta}
            onClose={(id) => dispatch({ type: 'close-popup', month: state.month, popupId: id })}
            onCtaClick={(p, clickedCta) => {
              // §10 rule 3 / §20.2 — the CTA both navigates AND files a
              // copy in the inbox, so nothing is permanently lost.
              dispatch({ type: 'file-popup-as-mail', month: state.month, popupId: p.id });
              router.navigate(clickedCta.url);
            }}
          />
        );
      })}
    </>
  );
}

/** Mount once, near the top of the app shell — both children portal to
 * document.body themselves (Dialog.tsx, Popup.tsx), so placement in the
 * React tree doesn't affect where they render. */
export function Notifications() {
  return (
    <>
      <ActiveDialog />
      <ActivePopups />
    </>
  );
}
