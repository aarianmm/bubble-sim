import { describe, expect, it } from 'vitest';
import { TIMELINE, timelineStats } from './timeline';
import { DAYS_PER_MONTH } from '../sim/month';
import { MAIL_MESSAGES, POPUP_MESSAGES } from '../content/messages';
import { DIALOGS } from '../content/dialogs';
import { FACT_SHEETS } from '../content/factsheets';

/**
 * §14.2's own totals, and §14.3's rules the script must satisfy.
 *
 * TOTALS RECONCILIATION — see the long comment at the top of timeline.ts.
 * §14.2's headline prose says "42 authored events" and "17 offers (9 mail,
 * 8 popup)". Counted row by row, the printed §14.2 table itself contained 46
 * events (45 dated rows + the Jan 1996 start marker) and only 14 offers
 * (9 mail, 5 popup, all five of them scams) — every OTHER headline total (6
 * scams, 9 shocks, 3 windfalls, 8 junk, 2 credit, the 9-mail-offer figure)
 * checked out exactly against that table.
 *
 * A popup channel that is 100% scam breaks §10 rule 1 ("Popups skew scam but
 * never determine it... skew, don't determine") and, in spirit, §11.2's
 * fairness contract — the fact sheet stops being a real judgement call once
 * the channel alone gives the answer away. Resolved by adding three named
 * popup offers for the three §9.1 vehicles that otherwise had no delivery
 * anywhere in the timeline: technova-growth (loud, legit-but-mediocre),
 * kingsley-gilt (plain, the crash dampener, arriving well before Mar 2000)
 * and granville-plc (plain, legit, concentrated). Event count is now 49;
 * popup offers 5 -> 8; total offers 14 -> 17 (9 mail, 8 popup) — matching
 * §14.2's own 9/8 split exactly, even though the 42-events headline still
 * doesn't reconcile (documented, not silently forced).
 */
describe('the timeline (§14.2)', () => {
  it('matches the reconciled §14.2 table plus the three §10 rule 1 popup offers', () => {
    const stats = timelineStats();
    expect(stats.totalEvents).toBe(49);
    expect(stats.offers).toBe(17);
    expect(stats.mailOffers).toBe(9);
    expect(stats.popupOffers).toBe(8);
    expect(stats.distinctScams).toBe(6); // §11.5: six scams, no seventh
    expect(stats.scamEvents).toBe(6);
    expect(stats.shocks).toBe(9); // §14.2: 8 "shock" + 1 "job-loss"
    expect(stats.windfalls).toBe(3);
    expect(stats.junk).toBe(8);
    expect(stats.credit).toBe(2);
  });

  // §10 rule 1 regression guard — the popup channel must never be 100%
  // scam, or the channel alone teaches the answer and the fact sheet stops
  // being a real judgement call (§11.2).
  it('gives the popup channel at least one non-scam offer', () => {
    const popupOffers = TIMELINE.filter(
      (e) => e.channel === 'POP' && (e.cls === 'legit' || e.cls === 'mediocre' || e.cls === 'scam'),
    );
    const nonScamPopupOffers = popupOffers.filter((e) => e.cls !== 'scam');
    expect(popupOffers.length).toBeGreaterThan(0);
    expect(nonScamPopupOffers.length).toBeGreaterThanOrEqual(1);
    expect(nonScamPopupOffers.map((e) => e.vehicleId).sort()).toEqual(
      ['granville-plc', 'kingsley-gilt', 'technova-growth'].sort(),
    );
  });

  // §14.3 rule 1 / §16 — the discoverability floor.
  it('opens with a safe, fact-sheet-only offer: Apr 1996 Northmoor', () => {
    const firstOffer = TIMELINE.find((e) => e.cls === 'legit' || e.cls === 'mediocre' || e.cls === 'scam');
    expect(firstOffer?.date).toBe('1996-04');
    expect(firstOffer?.vehicleId).toBe('northmoor-bond');
    expect(firstOffer?.cls).toBe('legit');
    const sheet = FACT_SHEETS['northmoor-bond'];
    expect(sheet.redFlags).toHaveLength(0);
    // The rate must not appear in the message body — only on the sheet.
    const msg = MAIL_MESSAGES['msg.northmoor-bond'];
    expect(msg.body.join(' ')).not.toMatch(/5\.2%/);
    expect(sheet.twelveMonthReturn).toMatch(/5\.2%/);
  });

  // §14.3 rule 2 — every windfall is followed by a scam within 90 sim days.
  it('follows every windfall with a scam within 90 simulated days', () => {
    const windfalls = TIMELINE.filter((e) => e.cls === 'windfall').sort((a, b) => a.month - b.month);
    const scams = TIMELINE.filter((e) => e.cls === 'scam').sort((a, b) => a.month - b.month);
    expect(windfalls).toHaveLength(3);

    for (const w of windfalls) {
      const nextScam = scams.find((s) => s.month >= w.month);
      expect(nextScam, `no scam at or after windfall ${w.date}`).toBeDefined();
      const gapDays = (nextScam!.month - w.month) * DAYS_PER_MONTH;
      expect(gapDays, `${w.date} -> ${nextScam!.date} is ${gapDays} days`).toBeLessThanOrEqual(90);
    }

    // The two examples §14.3 calls out by name.
    const windfall1 = windfalls[0];
    const meridian = scams.find((s) => s.vehicleId === 'meridian-guaranteed')!;
    expect(windfall1.date).toBe('1997-02');
    expect(meridian.date).toBe('1997-03');

    // Windfall #2 (2000-02) originally had no scam within 90 days (next was
    // 2001-04, 14 months out). Fixed per rule 2's own text ("move a scam
    // into mid-2000") by retiming Restitution Partners to 2000-04.
    const windfall2 = windfalls[1];
    const restitution = scams.find((s) => s.vehicleId === 'restitution-partners')!;
    expect(windfall2.date).toBe('2000-02');
    expect(restitution.date).toBe('2000-04');
  });

  // §14.3 rule 3 — no two decision-demanding events share a month, except
  // the authored Mar 2000 pair (crash + boiler).
  it('never doubles up a month, except the authored Mar 2000 pair', () => {
    const nonPassive = new Set(['junk', 'flavour', 'social', 'start']);
    const decisionEvents = TIMELINE.filter((e) => !nonPassive.has(e.cls));
    const byMonth = new Map<number, string[]>();
    for (const e of decisionEvents) {
      const list = byMonth.get(e.month) ?? [];
      list.push(e.id);
      byMonth.set(e.month, list);
    }
    const doubled = [...byMonth.entries()].filter(([, ids]) => ids.length > 1);
    expect(doubled).toHaveLength(1);
    const [, ids] = doubled[0];
    expect(new Set(ids)).toEqual(new Set(['ev.2000-03.crash', 'ev.2000-03.shock-boiler']));
  });

  // §14.3 rule 4 — every scam meets the fairness contract.
  it('gives every scam at least two red flags on its fact sheet', () => {
    const scams = TIMELINE.filter((e) => e.cls === 'scam');
    for (const s of scams) {
      const sheet = FACT_SHEETS[s.vehicleId!];
      expect(sheet.redFlags.length, `${s.vehicleId} has ${sheet.redFlags.length} flags`).toBeGreaterThanOrEqual(2);
    }
  });

  // §14.3 rule 5 — at least 60 simulated days of quiet before every major
  // shock, except the Mar 2000 boiler, which is deliberately NOT quiet
  // (§14.1: "deliberately adversarial") — the authorised Mar 2000 pair
  // again, from the other side of the same exception.
  it('gives every shock at least 60 quiet days first, bar the authored Mar 2000 pair', () => {
    const sorted = [...TIMELINE].sort((a, b) => a.month - b.month);
    const shocks = sorted.filter((e) => e.cls === 'shock' || e.cls === 'job-loss');

    for (const shock of shocks) {
      if (shock.id === 'ev.2000-03.shock-boiler') continue; // the documented exception
      const idx = sorted.findIndex((e) => e.id === shock.id);
      const prev = sorted[idx - 1];
      const gapDays = (shock.month - prev.month) * DAYS_PER_MONTH;
      expect(gapDays, `${shock.id}: only ${gapDays} quiet days before it (after ${prev.id})`).toBeGreaterThanOrEqual(
        60,
      );
    }
  });

  // §25.3 — every event's contentId resolves to real content.
  it('resolves every contentId into real content', () => {
    for (const e of TIMELINE) {
      const resolved =
        e.channel === 'MAIL'
          ? MAIL_MESSAGES[e.contentId]
          : e.channel === 'POP'
            ? POPUP_MESSAGES[e.contentId]
            : DIALOGS[e.contentId];
      expect(resolved, `${e.id} (${e.channel}) has no content for "${e.contentId}"`).toBeDefined();
      for (const companionId of e.popupCompanionContentIds ?? []) {
        expect(POPUP_MESSAGES[companionId], `${e.id} has no companion content for "${companionId}"`).toBeDefined();
      }
    }
  });

  it('keeps core educational mail visible for at least 45 simulated days', () => {
    const coreIds = new Set([
      'ev.1997-05.brightwell-pension',
      'ev.1997-07.fenwick-index',
      'ev.1998-10.ashcombe',
      'ev.1999-01.fenwick-world',
      'ev.2003-09.marlow',
    ]);
    const coreMail = TIMELINE.filter((e) => coreIds.has(e.id));
    expect(coreMail).toHaveLength(coreIds.size);
    for (const event of coreMail) expect(event.expiresDays, event.id).toBeGreaterThanOrEqual(45);
  });

  // Every offer's vehicle carries a fact sheet.
  it('gives every offer a vehicle with a fact sheet', () => {
    for (const e of TIMELINE) {
      if (e.vehicleId) {
        expect(FACT_SHEETS[e.vehicleId], `${e.id} -> ${e.vehicleId} has no fact sheet`).toBeDefined();
      }
    }
  });

  it('marks blocking dialogs, and only dialogs, as blocking', () => {
    for (const e of TIMELINE) {
      expect(e.blocksTime).toBe(e.channel === 'DLG');
    }
  });

  it('defers the two credit-card offers and the fake-dialog scam past the MVP boundary (§26.1)', () => {
    const deferred = TIMELINE.filter((e) => e.mvpDeferred).map((e) => e.id).sort();
    expect(deferred).toEqual(
      ['ev.1998-05.capital-direct-card-1', 'ev.2000-10.capital-direct-card-2', 'ev.2003-04.security-alert'].sort(),
    );
  });
});
