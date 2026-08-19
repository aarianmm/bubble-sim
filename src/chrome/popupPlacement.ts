/**
 * Pure helpers for the Tier 2 popup channel (§20.2, Step 21). No React, no
 * DOM — kept separate from Popup.tsx so the placement arithmetic and the
 * "file a copy" shape can be unit-tested without mounting anything.
 */
import type { MailItem, MonthIndex, PopupItem } from '../sim/types';

/** §20.2: "Up to 3 at once during the 1999-2000 mania. Never more." */
export const MAX_CONCURRENT_POPUPS = 3;

/**
 * §20.2 / §25.1 — popup placement, derived from the month index, never
 * `Math.random()`. The same (month, slot) always produces the same offset,
 * so a dress rehearsal and the live run place every popup identically
 * (§25.1: "a demo that positions popups differently on stage than in
 * rehearsal is the worst outcome available to us").
 *
 * `slot` disambiguates the up-to-3 popups that can share a month (the
 * 1999-05 mania peak fires three at once, §20.2's cap) — it is the popup's
 * index within that month's batch, not a random tiebreaker.
 *
 * sim/tick.ts materialises every PopupItem with x/y/width/height all 0 and
 * says as much in its own comment: "Step 20's UI is free to derive a richer
 * placement from the month index; the sim doesn't care." This is that
 * derivation — Step 24's scheduler (or this file's own caller today, see
 * NotificationDemo.tsx) calls it once per popup to fill in real pixels
 * before the item is ever handed to <Popup>.
 */
export function popupOffset(
  month: MonthIndex,
  slot: number,
  contentWidth: number,
  contentHeight: number,
  popupWidth: number,
  popupHeight: number,
): { x: number; y: number } {
  const maxX = Math.max(0, contentWidth - popupWidth);
  const maxY = Math.max(0, contentHeight - popupHeight);
  // Arithmetic, not RNG (§25.1) — two different linear mixes of the same
  // (month, slot) pair so consecutive months/slots don't line up on a
  // visible diagonal.
  const hx = (month * 47 + slot * 131 + 17) % 97;
  const hy = (month * 71 + slot * 53 + 29) % 89;
  return {
    x: maxX <= 0 ? 0 : hx % (maxX + 1),
    y: maxY <= 0 ? 0 : hy % (maxY + 1),
  };
}

/**
 * §10 rule 3 / §20.2 — "clicking the CTA... files a copy in the inbox, so
 * nothing is permanently lost by exploring." Produces the MailItem shape
 * sim/tick.ts would append to `state.inbox`.
 *
 * SEAM: tick.ts's `applyDecision` has no Decision variant yet for "file
 * this popup as mail" — its existing cases only mutate mail that already
 * exists (open/delete/accept/decline). Adding that variant means touching
 * sim/types.ts's `Decision` union and sim/tick.ts, both outside this step's
 * file list. This function is the pure piece Step 24 needs to close that
 * gap — wiring it in is one `next.inbox = [...next.inbox, popupToMailItem(...)]`
 * once the decision exists. NotificationDemo.tsx uses it directly today so
 * the UI-level guarantee ("closing a popup never loses the offer") is
 * demonstrable now, not just after Step 24 lands.
 */
export function popupToMailItem(popup: PopupItem, month: MonthIndex, from: string): MailItem {
  return {
    id: `${popup.id}.filed`,
    eventId: popup.eventId,
    from,
    subject: popup.title,
    contentId: popup.contentId,
    vehicleId: popup.vehicleId,
    cls: popup.cls,
    arrivedMonth: month,
    // Filed copies don't expire again — the entire point is that nothing
    // explored via the popup is subsequently lost.
    expiresMonth: null,
    status: 'unread',
  };
}
