/**
 * The scheduler (Step 24, §14.2/§20.2). Pure, React-free — the piece that
 * sits ABOVE a single event: given the month, which authored ScriptEvents
 * fire, and given one event, what channel item(s) does it produce.
 *
 * tick.ts's `fireScheduledEvents` (§7.3 sub-step 5) still owns turning those
 * items into GameState changes (appending to inbox/popups/dialogs, the
 * job-loss income-suspension side effect) — that needs GameState and stays
 * there. This file owns the part that's a pure function of (event, month)
 * alone, so it can be:
 *
 *  - shared between tick.ts (the real, committing path) and
 *    src/ui/EngineProvider.tsx (which has to PREVIEW a DLG event's dialog
 *    before committing anything, so time can genuinely freeze for player
 *    input instead of tick.ts's headless auto-resolve-with-default — see
 *    that file's header for why);
 *  - unit-testable without constructing a GameState at all;
 *  - the single place `EventId -> ScriptEvent` lookup lives, for the
 *    presenter's forceEvent(eventId) (§25.4) and the live engine's
 *    "what fires this month" query to share instead of each re-deriving it.
 */
import type { DialogItem, EventId, MailItem, PopupItem, ScriptEvent } from './types';
import type { MonthIndex } from './month';
import { DAYS_PER_MONTH } from './month';
import { TIMELINE } from '../script/timeline';
import { MAIL_MESSAGES, POPUP_MESSAGES } from '../content/messages';
import { DIALOGS } from '../content/dialogs';

/** §20.2: "Up to 3 at once during the 1999-2000 mania. Never more." Kept as
 * its own copy rather than importing src/chrome/popupPlacement.ts's constant
 * of the same name — the sim stays dependency-free of /chrome (this is a
 * game rule, not a rendering detail; popupPlacement.ts's copy governs pixel
 * layout, not how many the sim is willing to materialize). */
export const MAX_CONCURRENT_POPUPS = 3;

/** §20.2's two authored popup sizes, alternating by slot so a 3-at-once
 * batch doesn't read as a grid of identical boxes. */
const POPUP_SIZES = [
  { width: 300, height: 250 },
  { width: 468, height: 280 },
] as const;

/** 45 simulated days, in whole months (§20.2 auto-close / §10.2 expiry). */
const POPUP_LIFETIME_MONTHS = Math.ceil(45 / DAYS_PER_MONTH);

export const EVENTS_BY_ID: Record<EventId, ScriptEvent> = Object.fromEntries(
  TIMELINE.map((e) => [e.id, e]),
);

const EVENTS_BY_MONTH: Map<MonthIndex, ScriptEvent[]> = (() => {
  const map = new Map<MonthIndex, ScriptEvent[]>();
  for (const e of TIMELINE) {
    const list = map.get(e.month) ?? [];
    list.push(e);
    map.set(e.month, list);
  }
  return map;
})();

/** Every authored event whose §14.2 date is `month`. */
export function eventsForMonth(month: MonthIndex): ScriptEvent[] {
  return EVENTS_BY_MONTH.get(month) ?? [];
}

/** A MAIL event's inbox row (§22.2), arriving now regardless of when it was
 * authored — the live engine and forceEvent() both key arrival off the
 * current month, not `event.month`, so forcing early or replaying never
 * shows mail as "arrived in the future". */
export function materializeMail(event: ScriptEvent, month: MonthIndex): MailItem {
  const msg = MAIL_MESSAGES[event.contentId];
  return {
    id: event.id,
    eventId: event.id,
    from: msg?.from ?? '',
    subject: msg?.subject ?? '',
    contentId: event.contentId,
    vehicleId: event.vehicleId,
    cls: event.cls,
    arrivedMonth: month,
    expiresMonth: event.expiresDays == null ? null : month + Math.ceil(event.expiresDays / DAYS_PER_MONTH),
    status: 'unread',
    amount: event.amount,
  };
}

/**
 * A POP event's window(s). Expands `event.count` (the Mar 1997 x2 / May
 * 1999 x3 mania beats, §20.2) into that many concurrent PopupItems, each
 * identified by `${event.id}.${slot}` so close-popup / file-popup-as-mail
 * can target one of a batch — falls back to the bare event id when count is
 * 1 (the overwhelming majority of popups), so single-popup ids stay exactly
 * what they always were.
 *
 * Capped at MAX_CONCURRENT_POPUPS on its own (an authoring-time ceiling —
 * no authored event's count exceeds it); tick.ts additionally enforces the
 * cap against whatever's ALREADY open in GameState, which this function
 * can't see.
 *
 * Pixel position is deliberately left at (0, 0) — the sim doesn't know the
 * viewport. src/chrome/popupPlacement.ts's popupOffset() is the pure
 * derivation the UI calls once it knows the content box, keyed off
 * (openedMonth, slot) exactly as this function keys the id.
 */
export function materializePopups(event: ScriptEvent, month: MonthIndex): PopupItem[] {
  const msg = POPUP_MESSAGES[event.contentId];
  const count = Math.min(Math.max(1, event.count ?? 1), MAX_CONCURRENT_POPUPS);
  const closesMonth = month + POPUP_LIFETIME_MONTHS;
  return Array.from({ length: count }, (_, slot) => {
    const { width, height } = POPUP_SIZES[slot % POPUP_SIZES.length];
    return {
      id: count === 1 ? event.id : `${event.id}.${slot}`,
      eventId: event.id,
      title: msg?.subject ?? '',
      contentId: event.contentId,
      vehicleId: event.vehicleId,
      cls: event.cls,
      openedMonth: month,
      closesMonth,
      x: 0,
      y: 0,
      width,
      height,
    };
  });
}

/**
 * §10.2 "EXPIRES (countdown hits 0) -> gone, silently" / §20.2 popup
 * auto-close. An item is still shown through its own expiresMonth/
 * closesMonth (pages/mail.test.tsx's own "floors expiry at 1d rather than
 * showing 0d for a message due this month" pins that last-day behaviour);
 * it disappears starting the month after. Mail goes to the existing
 * 'expired' MailStatus (so a re-read is possible in principle and nothing
 * needs deleting) — src/sim/selectors.ts's `visibleInbox` already excludes
 * every non-unread/read status, so setting it is the whole mechanism.
 * Popups have no history to keep, so they're just removed.
 */
export function sweepExpired(
  inbox: readonly MailItem[],
  popups: readonly PopupItem[],
  month: MonthIndex,
): { inbox: MailItem[]; popups: PopupItem[] } {
  const nextInbox = inbox.map((m) =>
    (m.status === 'unread' || m.status === 'read') && m.expiresMonth !== null && m.expiresMonth < month
      ? { ...m, status: 'expired' as const }
      : m,
  );
  const nextPopups = popups.filter((p) => !(p.closesMonth < month));
  return { inbox: nextInbox, popups: nextPopups };
}

/** A DLG event's dialog (§20.1). Used both by tick.ts's committing path and
 * by EngineProvider's preview-before-commit path, so the two are always
 * byte-identical — a player is never shown a preview that doesn't match
 * what actually gets recorded. */
export function materializeDialog(event: ScriptEvent, month: MonthIndex): DialogItem {
  const copy = DIALOGS[event.contentId];
  return {
    id: event.id,
    eventId: event.id,
    title: copy?.title ?? '',
    contentId: event.contentId,
    cls: event.cls,
    raisedMonth: month,
    amount: event.amount,
    buttons: copy?.buttons ?? [],
  };
}
