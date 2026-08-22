/**
 * Step 24 wiring — renders the real notification tiers straight off
 * GameState: `state.dialogs[0]` through the real Dialog.tsx (§20.1),
 * EngineProvider's sequential presentation queue through Popup.tsx (§20.2).
 * state.inbox's Tier 3
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
import { HOME_URL, isPopupPresentationNeutralUrl, MAIL_URL } from '../pages/registry';
import type { PopupItem } from '../sim/types';
import { useEffect, useRef } from 'react';

export const POPUP_GAP_MS = 1750;

export function popupPresentationDurationMs(popup: PopupItem): number {
  if (popup.vehicleId || popup.cls === 'scam' || popup.cls === 'legit' || popup.cls === 'mediocre') return 11000;
  if (popup.cls === 'junk') return 3500;
  return 9000;
}

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
  const { state, dispatch, reset } = useEngine();
  const router = useRouter();
  const dialog = state.dialogs[0];
  if (!dialog) return null;
  return (
    <Dialog
      dialog={dialog}
      onResolve={(action) => {
        if (action === 'restart') {
          reset();
          router.resetTo(HOME_URL);
          return;
        }
        dispatch({ type: 'resolve-dialog', month: state.month, dialogId: dialog.id, action });
      }}
    />
  );
}

function ActivePopups() {
  const {
    timeRate,
    popupPresentation,
    closePresentedPopup,
    filePresentedPopup,
    deferPresentedPopup,
    finishPopupGap,
  } = useEngine();
  const router = useRouter();
  // Simulation time keeps running on external pages; only the presentation
  // timer waits until the player returns to an ordinary portal surface.
  const routeBusy = !isPopupPresentationNeutralUrl(router.url);
  const paused = timeRate === 0 || routeBusy;
  const activeId = popupPresentation.active?.id;

  useEffect(() => {
    if (routeBusy && popupPresentation.phase === 'showing' && activeId) {
      deferPresentedPopup(activeId);
    }
  }, [activeId, deferPresentedPopup, popupPresentation.phase, routeBusy]);

  // Never paint a newly assigned popup over an unresolved external flow;
  // the effect above returns its snapshot to the existing queue/gap path.
  if (routeBusy && popupPresentation.phase === 'showing') return null;

  if (popupPresentation.phase === 'gap') {
    return <PausableTimer timerKey="gap" durationMs={POPUP_GAP_MS} paused={paused} onDone={finishPopupGap} />;
  }

  const popup = popupPresentation.active;
  if (!popup) return null;
  const msg = POPUP_MESSAGES[popup.contentId];
  const vehicle = popup.vehicleId ? VEHICLES[popup.vehicleId] : undefined;
  const offerPage = popup.vehicleId ? OFFER_PAGES[popup.vehicleId as Exclude<typeof popup.vehicleId, 'cash'>] : undefined;
  const placementRegion = router.url === MAIL_URL ? 'mail-lower' : 'default';
  const placementIdentity = `${popup.id}|${popup.openedMonth}|${slotOf(popup)}`;
  const { x, y } = popupOffset(
    popup.openedMonth,
    slotOf(popup),
    CONTENT_W,
    CONTENT_H,
    popup.width,
    popup.height,
    placementRegion,
    placementIdentity,
  );
  const cta: PopupCta | undefined = vehicle && offerPage ? { label: offerPage.ctaLabel, url: vehicle.url } : undefined;

  return (
    <>
      <PausableTimer
        timerKey={popup.id}
        durationMs={popupPresentationDurationMs(popup)}
        paused={paused}
        onDone={() => closePresentedPopup(popup.id)}
      />
      <Popup
        popup={{ ...popup, x, y }}
        heading={msg?.subject}
        body={msg?.body ?? []}
        loud={popup.cls === 'scam' || popup.cls === 'junk' || popup.cls === 'security'}
        cta={cta}
        onClose={closePresentedPopup}
        onCtaClick={(_item, clickedCta) => {
          filePresentedPopup(popup);
          router.navigate(clickedCta.url);
        }}
      />
    </>
  );
}

function PausableTimer({
  timerKey,
  durationMs,
  paused,
  onDone,
}: {
  timerKey: string;
  durationMs: number;
  paused: boolean;
  onDone: () => void;
}) {
  const remainingMs = useRef(durationMs);
  const keyRef = useRef(timerKey);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    keyRef.current = timerKey;
    remainingMs.current = durationMs;
  }, [timerKey, durationMs]);

  useEffect(() => {
    if (paused || remainingMs.current <= 0) return;
    const activeKey = keyRef.current;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => {
      if (keyRef.current === activeKey) {
        remainingMs.current = 0;
        onDoneRef.current();
      }
    }, remainingMs.current);
    return () => {
      window.clearTimeout(timer);
      if (keyRef.current === activeKey) {
        remainingMs.current = Math.max(0, remainingMs.current - (Date.now() - startedAt));
      }
    };
  }, [timerKey, durationMs, paused]);

  return null;
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
