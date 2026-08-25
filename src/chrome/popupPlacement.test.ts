import { describe, expect, it } from 'vitest';
import { MAX_CONCURRENT_POPUPS, popupOffset, popupToMailItem } from './popupPlacement';
import type { PopupItem } from '../sim/types';
import { TIMELINE } from '../script/timeline';

const CONTENT_W = 800;
const CONTENT_H = 560;
const POPUP_W = 300;
const POPUP_H = 250;

describe('popupOffset (§20.2 / §25.1 — derived from the month index, never Math.random)', () => {
  it('is deterministic: the same (month, slot) always produces the same offset', () => {
    const a = popupOffset(41, 0, CONTENT_W, CONTENT_H, POPUP_W, POPUP_H);
    const b = popupOffset(41, 0, CONTENT_W, CONTENT_H, POPUP_W, POPUP_H);
    expect(a).toEqual(b);
  });

  it('varies across months, so a batch of popups is not stacked in one spot', () => {
    const positions = Array.from({ length: 12 }, (_, m) =>
      popupOffset(m, 0, CONTENT_W, CONTENT_H, POPUP_W, POPUP_H),
    );
    const distinct = new Set(positions.map((p) => `${p.x},${p.y}`));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('varies across slots within the same month, so 3 concurrent popups do not overlap exactly', () => {
    const slots = [0, 1, 2].map((slot) => popupOffset(40, slot, CONTENT_W, CONTENT_H, POPUP_W, POPUP_H));
    const distinct = new Set(slots.map((p) => `${p.x},${p.y}`));
    expect(distinct.size).toBe(3);
  });

  it('never places a popup outside the content area', () => {
    for (let month = 0; month < 132; month++) {
      for (let slot = 0; slot < 3; slot++) {
        const { x, y } = popupOffset(month, slot, CONTENT_W, CONTENT_H, POPUP_W, POPUP_H);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + POPUP_W).toBeLessThanOrEqual(CONTENT_W);
        expect(y + POPUP_H).toBeLessThanOrEqual(CONTENT_H);
      }
    }
  });

  it('degrades to (0,0) rather than a negative offset when the popup is bigger than the content area', () => {
    const { x, y } = popupOffset(10, 0, 200, 150, 468, 280);
    expect(x).toBe(0);
    expect(y).toBe(0);
  });
});

describe('the authored timeline never opens more than the §20.2 cap', () => {
  it(`never schedules more than ${MAX_CONCURRENT_POPUPS} popups at once`, () => {
    for (const e of TIMELINE) {
      if (e.channel === 'POP' && e.count != null) {
        expect(e.count, e.id).toBeLessThanOrEqual(MAX_CONCURRENT_POPUPS);
      }
    }
  });
});

describe('popupToMailItem (§10 rule 3 / §20.2 — nothing lost by exploring)', () => {
  const popup: PopupItem = {
    id: 'ev.1998-03.cavendish',
    eventId: 'ev.1998-03.cavendish',
    title: 'A once-in-a-generation opportunity',
    contentId: 'pop.cavendish-1998-03',
    vehicleId: 'cavendish-tech',
    cls: 'scam',
    openedMonth: 26,
    closesMonth: 28,
    x: 40,
    y: 20,
    width: 300,
    height: 250,
  };

  it('carries the offer forward — same content id, same vehicle', () => {
    const mail = popupToMailItem(popup, 26, 'Cavendish Asset Mgmt');
    expect(mail.contentId).toBe(popup.contentId);
    expect(mail.vehicleId).toBe(popup.vehicleId);
    expect(mail.cls).toBe(popup.cls);
    expect(mail.status).toBe('unread');
    expect(mail.expiresMonth).toBeNull();
  });

  it('files under a distinct id from the popup, so it can coexist with it', () => {
    const mail = popupToMailItem(popup, 26, 'Cavendish Asset Mgmt');
    expect(mail.id).not.toBe(popup.id);
  });
});
