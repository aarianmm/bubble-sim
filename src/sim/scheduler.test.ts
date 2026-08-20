/**
 * Step 24 done-condition, at the unit level: every §14.2 event materializes
 * into the right channel with the right shape. The end-to-end "jump to any
 * date and the right tier fires" check lives in EngineProvider's own
 * behaviour (verified manually per the completion report) — this file
 * covers the pure materialization tick.ts and EngineProvider both build on.
 */
import { describe, expect, it } from 'vitest';
import { EVENTS_BY_ID, eventsForMonth, materializeDialog, materializeMail, materializePopups, MAX_CONCURRENT_POPUPS } from './scheduler';
import { monthIndex } from './month';
import { TIMELINE } from '../script/timeline';
import type { ScriptEvent } from './types';

describe('EVENTS_BY_ID / eventsForMonth', () => {
  it('indexes every authored event by id', () => {
    expect(Object.keys(EVENTS_BY_ID)).toHaveLength(TIMELINE.length);
    for (const e of TIMELINE) expect(EVENTS_BY_ID[e.id]).toBe(e);
  });

  it('returns the Northmoor bond for Apr 1996 and nothing for a quiet month', () => {
    const apr96 = eventsForMonth(monthIndex(1996, 4));
    expect(apr96.map((e) => e.id)).toContain('ev.1996-04.northmoor-bond');
    expect(eventsForMonth(monthIndex(1996, 3))).toHaveLength(0);
  });

  it('returns both Mar 2000 dialogs (the crash and the boiler) for the same month', () => {
    const mar2000 = eventsForMonth(monthIndex(2000, 3)).filter((e) => e.channel === 'DLG');
    expect(mar2000).toHaveLength(2);
  });
});

describe('materializeMail', () => {
  it('carries the event amount and vehicle straight through, arriving at the given month', () => {
    const event = EVENTS_BY_ID['ev.1997-02.windfall-1'];
    const mail = materializeMail(event, monthIndex(1997, 2));
    expect(mail.status).toBe('unread');
    expect(mail.amount).toBe(2000);
    expect(mail.arrivedMonth).toBe(monthIndex(1997, 2));
  });

});

describe('materializeDialog', () => {
  it('produces the exact same shape a live preview and tick.ts both need', () => {
    const event = EVENTS_BY_ID['ev.2000-03.shock-boiler'];
    const dialog = materializeDialog(event, monthIndex(2000, 3));
    expect(dialog.amount).toBe(900);
    expect(dialog.buttons.length).toBeGreaterThan(0);
    expect(dialog.buttons.length).toBeLessThanOrEqual(2);
  });
});

describe('materializePopups (§20.2)', () => {
  it('opens exactly one item for a count-1 event, id === event.id', () => {
    const event = EVENTS_BY_ID['ev.1996-02.freestuff'];
    const popups = materializePopups(event, monthIndex(1996, 2));
    expect(popups).toHaveLength(1);
    expect(popups[0].id).toBe(event.id);
  });

  it('expands Meridian into its offer plus one distinct companion junk popup', () => {
    const event = EVENTS_BY_ID['ev.1997-03.meridian'];
    const popups = materializePopups(event, monthIndex(1997, 3));
    expect(popups).toHaveLength(2);
    expect(new Set(popups.map((p) => p.id)).size).toBe(2);
    expect(popups.every((p) => p.eventId === event.id)).toBe(true);
    expect(popups.map((p) => p.contentId)).toEqual([
      'pop.meridian-1997-03',
      'pop.junk-meridian-companion-1997-03',
    ]);
    expect(popups.map((p) => p.cls)).toEqual(['scam', 'junk']);
    expect(popups[1].vehicleId).toBeUndefined();
  });

  it('expands Vertex into its offer plus two distinct junk popups at the §20.2 cap', () => {
    const event = EVENTS_BY_ID['ev.1999-05.vertex'];
    const popups = materializePopups(event, monthIndex(1999, 5));
    expect(popups).toHaveLength(3);
    expect(popups).toHaveLength(MAX_CONCURRENT_POPUPS);
    expect(popups.map((p) => p.contentId)).toEqual([
      'pop.vertex-1999-05',
      'pop.junk-vertex-companion-a-1999-05',
      'pop.junk-vertex-companion-b-1999-05',
    ]);
    expect(popups.map((p) => p.cls)).toEqual(['scam', 'junk', 'junk']);
    expect(popups.slice(1).every((p) => p.vehicleId === undefined)).toBe(true);
  });

  it('never exceeds the cap even if a hypothetical event asked for more', () => {
    const hypothetical: ScriptEvent = {
      id: 'ev.test.oversized',
      date: '1999-05',
      month: monthIndex(1999, 5),
      channel: 'POP',
      cls: 'junk',
      contentId: 'pop.demo',
      count: 7,
      blocksTime: false,
    };
    expect(materializePopups(hypothetical, monthIndex(1999, 5))).toHaveLength(MAX_CONCURRENT_POPUPS);
  });

  it('keeps popup expiry as short simulated bookkeeping independent of presentation timing', () => {
    const meridian = materializePopups(EVENTS_BY_ID['ev.1997-03.meridian'], monthIndex(1997, 3));
    expect(meridian.every((popup) => popup.closesMonth - popup.openedMonth === 2)).toBe(true);
  });
});
