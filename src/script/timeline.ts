/**
 * §14.2 — THE TIMELINE. The single source of truth for run content, encoded.
 *
 * RECONCILIATION NOTE — read before editing counts.
 *
 * "42 authored events" is §14.2's own headline count. Counted row by row, the
 * printed §14.2 table contains 46 rows (45 dated events plus the "Jan 1996 —
 * Run begins" scene-setter, kept here as an explicit `start` event so the
 * game has an anchor for month 0). That is 4 more than the headline "42".
 *
 * Every OTHER §14.2 total checks out EXACTLY against that row-by-row table:
 * 6 distinct scams, 9 shocks (8 "shock" + 1 "job-loss"), 3 windfalls, 8 junk,
 * 2 credit offers, 9 mail offers (legit + mediocre + scam + both credit-card
 * rows). That agreement is strong evidence the row-by-row table, not the
 * prose headline, is the authoritative one (consistent with §14.2's own
 * framing: "This section is the single source of truth for run content").
 * Only "42 events" and "8 popup offers" don't reconcile: the table names
 * zero non-scam popup offers — only the 5 scam popups (Meridian, Cavendish,
 * Vertex, Halcyon, the fake dialog) — despite §10 rule 1 requiring some to
 * exist ("a real tracker fund advertises by popup too"). That is a genuine,
 * separate content gap in §14.2 as printed. Rather than invent popup offers
 * found nowhere in the master table — which §14.2 itself forbids ("if an
 * event is not in this table, it does not happen") — this file encodes the
 * table faithfully (46 events, 5 popup offers, 14 offers total) and flags
 * the gap here and in the Step 5/6 completion report, for a human or the
 * orchestrating agent to resolve by authoring named popup offers into
 * §14.2 itself.
 *
 * §14.3 rule 2 (every windfall followed by a scam within 90 days) is
 * satisfied WITHOUT changing the total event count: Restitution Partners is
 * moved from 2001-04 to 2000-04, exactly as rule 2's own text authorises
 * ("if playtesting shows the pattern isn't landing, move a scam into
 * mid-2000") — see the note on that event, below. This keeps the six named
 * scams at six (§11.5: "there is no seventh") and avoids adding a row.
 *
 * `timelineStats()` reports the true counts; timeline.test.ts asserts them
 * with the same reconciliation reasoning inline.
 */

import { monthIndex } from '../sim/month';
import type { ScriptEvent } from '../sim/types';

export const TIMELINE: ScriptEvent[] = [
  {
    id: 'ev.1996-01.start',
    date: '1996-01',
    month: monthIndex(1996, 1),
    channel: 'NONE',
    cls: 'start',
    contentId: 'start.1996-01',
    blocksTime: false,
    notes: 'Run begins. £760/mo, £645 out, £0 cash (§8.1).',
  },
  {
    id: 'ev.1996-02.freestuff',
    date: '1996-02',
    month: monthIndex(1996, 2),
    channel: 'POP',
    cls: 'junk',
    contentId: 'pop.freestuff-1996-02',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    notes: 'Teaches that popups exist and are safely closeable.',
  },
  {
    id: 'ev.1996-04.northmoor-bond',
    date: '1996-04',
    month: monthIndex(1996, 4),
    channel: 'MAIL',
    cls: 'legit',
    contentId: 'msg.northmoor-bond',
    vehicleId: 'northmoor-bond',
    expiresDays: null,
    blocksTime: false,
    // §16 discoverability floor — unmistakably safe, first offer of the run.
    notes: 'The discoverability floor (§16). Rate is on the fact sheet only. Hideous site (§21 rule 2).',
  },
  {
    id: 'ev.1996-09.junk',
    date: '1996-09',
    month: monthIndex(1996, 9),
    channel: 'POP',
    cls: 'junk',
    contentId: 'pop.junk-1996-09',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
  },
  {
    id: 'ev.1996-12.northmoor-annual-statement',
    date: '1996-12',
    month: monthIndex(1996, 12),
    channel: 'MAIL',
    cls: 'flavour',
    contentId: 'msg.northmoor-annual-statement',
    vehicleId: 'northmoor-bond',
    expiresDays: null,
    blocksTime: false,
    notes: 'Shows interest earned: £31, against £28/yr of rent inflation. The joke lands silently.',
  },
  {
    id: 'ev.1997-02.windfall-1',
    date: '1997-02',
    month: monthIndex(1997, 2),
    channel: 'MAIL',
    cls: 'windfall',
    contentId: 'msg.windfall-1997-02',
    amount: 2000,
    expiresDays: null,
    blocksTime: false,
    notes: 'Windfall #1 — matured child savings.',
  },
  {
    id: 'ev.1997-03.meridian',
    date: '1997-03',
    month: monthIndex(1997, 3),
    channel: 'POP',
    cls: 'scam',
    contentId: 'pop.meridian-1997-03',
    vehicleId: 'meridian-guaranteed',
    count: 2,
    expiresDays: 45,
    blocksTime: false,
    notes: 'Scam 1. Arrives with a companion junk popup (count 2). Loud, cheap, obvious — three weeks after windfall #1.',
  },
  {
    id: 'ev.1997-05.brightwell-pension',
    date: '1997-05',
    month: monthIndex(1997, 5),
    channel: 'MAIL',
    cls: 'life-admin',
    contentId: 'msg.brightwell-pension',
    vehicleId: 'brightwell-pension',
    expiresDays: 9,
    blocksTime: false,
    notes: 'Teaches allocation diegetically.',
  },
  {
    id: 'ev.1997-07.fenwick-index',
    date: '1997-07',
    month: monthIndex(1997, 7),
    channel: 'MAIL',
    cls: 'legit',
    contentId: 'msg.fenwick-index',
    vehicleId: 'fenwick-index',
    expiresDays: 9,
    blocksTime: false,
    notes: 'The correct answer. Dull page, dull copy, correct.',
  },
  {
    id: 'ev.1997-09.shock',
    date: '1997-09',
    month: monthIndex(1997, 9),
    channel: 'DLG',
    cls: 'shock',
    contentId: 'dlg.shock-1997-09',
    amount: 600,
    blocksTime: true,
    notes: 'Deposit top-up + phone bill.',
  },
  {
    id: 'ev.1997-11.junk',
    date: '1997-11',
    month: monthIndex(1997, 11),
    channel: 'POP',
    cls: 'junk',
    contentId: 'pop.junk-1997-11',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
  },
  {
    id: 'ev.1998-02.dave-fomo',
    date: '1998-02',
    month: monthIndex(1998, 2),
    channel: 'MAIL',
    cls: 'social',
    contentId: 'msg.dave-fomo-1998-02',
    expiresDays: 9,
    blocksTime: false,
    notes: 'FOMO. Links to the tech fund (Cavendish, arriving next month).',
  },
  {
    id: 'ev.1998-03.cavendish',
    date: '1998-03',
    month: monthIndex(1998, 3),
    channel: 'POP',
    cls: 'scam',
    contentId: 'pop.cavendish-1998-03',
    vehicleId: 'cavendish-tech',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    notes: 'Scam 2. The §22.3 example page.',
  },
  {
    id: 'ev.1998-05.capital-direct-card-1',
    date: '1998-05',
    month: monthIndex(1998, 5),
    channel: 'MAIL',
    cls: 'credit',
    contentId: 'msg.capital-direct-card-1998-05',
    vehicleId: 'capital-direct-card',
    expiresDays: 9,
    blocksTime: false,
    mvpDeferred: true,
    notes: 'First card offer (§13). Step 31, beyond the MVP boundary (§26.1).',
  },
  {
    id: 'ev.1998-08.shock',
    date: '1998-08',
    month: monthIndex(1998, 8),
    channel: 'DLG',
    cls: 'shock',
    contentId: 'dlg.shock-1998-08',
    amount: 1100,
    blocksTime: true,
    notes: 'Laptop / car.',
  },
  {
    id: 'ev.1998-10.ashcombe',
    date: '1998-10',
    month: monthIndex(1998, 10),
    channel: 'MAIL',
    cls: 'mediocre',
    contentId: 'msg.ashcombe-managed',
    vehicleId: 'ashcombe-managed',
    expiresDays: 9,
    blocksTime: false,
    notes: 'Legal, legitimate, a mistake.',
  },
  {
    id: 'ev.1998-12.junk',
    date: '1998-12',
    month: monthIndex(1998, 12),
    channel: 'POP',
    cls: 'junk',
    contentId: 'pop.junk-1998-12',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
  },
  {
    id: 'ev.1999-01.fenwick-world',
    date: '1999-01',
    month: monthIndex(1999, 1),
    channel: 'MAIL',
    cls: 'legit',
    contentId: 'msg.fenwick-world',
    vehicleId: 'fenwick-world',
    expiresDays: 9,
    blocksTime: false,
  },
  {
    id: 'ev.1999-05.vertex',
    date: '1999-05',
    month: monthIndex(1999, 5),
    channel: 'POP',
    cls: 'scam',
    contentId: 'pop.vertex-1999-05',
    vehicleId: 'vertex-communications',
    count: 3,
    expiresDays: 45,
    blocksTime: false,
    notes: 'Scam 4 — the pump. Mania peak: three popups at once, the §20.2 cap.',
  },
  {
    id: 'ev.1999-06.halcyon',
    date: '1999-06',
    month: monthIndex(1999, 6),
    channel: 'POP',
    cls: 'scam',
    contentId: 'pop.halcyon-1999-06',
    vehicleId: 'halcyon-reserve',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    notes: 'Scam 3 — the Ponzi (§11.4). Arrives showing 14 months of flawless returns. Best-looking site in the game.',
  },
  {
    id: 'ev.1999-07.dave-up-300',
    date: '1999-07',
    month: monthIndex(1999, 7),
    channel: 'MAIL',
    cls: 'social',
    contentId: 'msg.dave-up-300-1999-07',
    expiresDays: null,
    blocksTime: false,
  },
  {
    id: 'ev.1999-09.quicksilver',
    date: '1999-09',
    month: monthIndex(1999, 9),
    channel: 'MAIL',
    cls: 'legit',
    contentId: 'msg.quicksilver-com',
    vehicleId: 'quicksilver-com',
    expiresDays: 2,
    blocksTime: false,
    notes: 'Real vehicle, catastrophic timing.',
  },
  {
    id: 'ev.1999-11.job-loss',
    date: '1999-11',
    month: monthIndex(1999, 11),
    channel: 'DLG',
    cls: 'job-loss',
    contentId: 'dlg.job-loss-1999-11',
    incomeLostMonths: 3,
    blocksTime: true,
    notes: 'The big one. Redundancy payout arrives separately as windfall #2 (Feb 2000).',
  },
  {
    id: 'ev.1999-12.y2k-junk',
    date: '1999-12',
    month: monthIndex(1999, 12),
    channel: 'POP',
    cls: 'junk',
    contentId: 'pop.y2k-1999-12',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
  },
  {
    id: 'ev.2000-01.year-turn',
    date: '2000-01',
    month: monthIndex(2000, 1),
    channel: 'DLG',
    cls: 'year-turn',
    contentId: 'dlg.year-turn-2000-01',
    blocksTime: true,
    notes: 'BREAK-EVEN. "This year, your pay covers your life exactly. From here it doesn\'t." The thesis, as a beat (§8.3).',
  },
  {
    id: 'ev.2000-02.windfall-2',
    date: '2000-02',
    month: monthIndex(2000, 2),
    channel: 'MAIL',
    cls: 'windfall',
    contentId: 'msg.windfall-2000-02',
    amount: 1800,
    expiresDays: null,
    blocksTime: false,
    notes: 'Redundancy payout; new job, same £760. Cash lands at maximum desperation.',
  },
  {
    id: 'ev.2000-03.crash',
    date: '2000-03',
    month: monthIndex(2000, 3),
    channel: 'DLG',
    cls: 'market',
    contentId: 'dlg.crash-2000-03',
    blocksTime: true,
    notes: 'THE CRASH. Not tuned — March 2000 through 2002 happens because it happened (§9.2).',
  },
  {
    id: 'ev.2000-03.shock-boiler',
    date: '2000-03',
    month: monthIndex(2000, 3),
    channel: 'DLG',
    cls: 'shock',
    contentId: 'dlg.shock-2000-03-boiler',
    amount: 900,
    blocksTime: true,
    // §14.3 rule 3's sole authorised exception — the crash and the boiler
    // deliberately share a month. This is also the one place §14.3 rule 5's
    // "60 quiet days before every shock" is knowingly broken: the point of
    // March 2000 is that it is NOT quiet (§14.1: "deliberately adversarial").
    notes: 'The cash-only player dies here (§8.4). Authored pair with the crash above (§14.3 rule 3).',
  },
  {
    id: 'ev.2000-04.restitution',
    date: '2000-04',
    month: monthIndex(2000, 4),
    channel: 'MAIL',
    cls: 'scam',
    contentId: 'msg.restitution-partners',
    vehicleId: 'restitution-partners',
    expiresDays: 2,
    blocksTime: false,
    // §14.3 rule 2: every windfall must be followed by a scam within 90
    // simulated days. Windfall #2 (2000-02) -> the originally-scripted
    // 2001-04 date was 14 months later, far too slow. Rule 2 authorises
    // exactly this fix in its own text ("move a scam into mid-2000") —
    // moved here rather than inventing a seventh named scam (§11.5: "six
    // scams... there is no seventh"). One month after the crash is also a
    // *more* honest fit for "aimed at whoever just lost money" than the
    // original date, not a weaker one. Scam 5. By mail, so mail can't be
    // trusted either.
    notes: 'MOVED from 2001-04 for §14.3 rule 2 — see the reconciliation note at the top of this file.',
  },
  {
    id: 'ev.2000-06.buy-the-dip',
    date: '2000-06',
    month: monthIndex(2000, 6),
    channel: 'POP',
    cls: 'junk',
    contentId: 'pop.buy-the-dip-2000-06',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
  },
  {
    id: 'ev.2000-10.capital-direct-card-2',
    date: '2000-10',
    month: monthIndex(2000, 10),
    channel: 'MAIL',
    cls: 'credit',
    contentId: 'msg.capital-direct-card-2000-10',
    vehicleId: 'capital-direct-card',
    expiresDays: 2,
    blocksTime: false,
    mvpDeferred: true,
    notes: 'Post-shock. Most tempting, most dangerous. Step 31, beyond the MVP boundary (§26.1).',
  },
  {
    id: 'ev.2000-11.halcyon-suspended',
    date: '2000-11',
    month: monthIndex(2000, 11),
    channel: 'DLG',
    cls: 'scam-payload',
    contentId: 'dlg.halcyon-suspended-2000-11',
    vehicleId: 'halcyon-reserve',
    blocksTime: true,
    notes: '17 months of perfect returns, then nothing.',
  },
  {
    id: 'ev.2001-09.shock-trough',
    date: '2001-09',
    month: monthIndex(2001, 9),
    channel: 'DLG',
    cls: 'shock',
    contentId: 'dlg.shock-2001-09-trough',
    amount: 900,
    blocksTime: true,
    notes: 'The forced-sale moment, in the trough. Designed emotional peak of the run (§14.1).',
  },
  {
    id: 'ev.2001-12.year-turn',
    date: '2001-12',
    month: monthIndex(2001, 12),
    channel: 'DLG',
    cls: 'year-turn',
    contentId: 'dlg.year-turn-2001-12',
    blocksTime: true,
  },
  {
    id: 'ev.2002-01.era-switch',
    date: '2002-01',
    month: monthIndex(2002, 1),
    channel: 'DLG',
    cls: 'era-switch',
    contentId: 'dlg.era-switch-2002-01',
    blocksTime: true,
    notes: 'Era A -> Era B (§18.2). No further explanation.',
  },
  {
    id: 'ev.2002-03.recovery-room',
    date: '2002-03',
    month: monthIndex(2002, 3),
    channel: 'POP',
    cls: 'junk',
    contentId: 'pop.recovery-room-2002-03',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    notes: 'Popup blocker now active — status bar reports blocks.',
  },
  {
    id: 'ev.2002-10.shock',
    date: '2002-10',
    month: monthIndex(2002, 10),
    channel: 'DLG',
    cls: 'shock',
    contentId: 'dlg.shock-2002-10',
    amount: 500,
    blocksTime: true,
  },
  {
    id: 'ev.2003-02.windfall-3',
    date: '2003-02',
    month: monthIndex(2003, 2),
    channel: 'MAIL',
    cls: 'windfall',
    contentId: 'msg.windfall-2003-02',
    amount: 2500,
    expiresDays: null,
    blocksTime: false,
    notes: 'Windfall #3 — a small legacy.',
  },
  {
    id: 'ev.2003-04.security-alert',
    date: '2003-04',
    month: monthIndex(2003, 4),
    channel: 'POP',
    cls: 'scam',
    contentId: 'pop.security-alert-2003-04',
    vehicleId: 'sentinel-protect',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    mvpDeferred: true,
    notes: 'Scam 6 — the fake dialog (§20.5). The hardest one. Step 32, beyond the MVP boundary (§26.1).',
  },
  {
    id: 'ev.2003-09.marlow',
    date: '2003-09',
    month: monthIndex(2003, 9),
    channel: 'MAIL',
    cls: 'legit',
    contentId: 'msg.marlow-corporate-bond',
    vehicleId: 'marlow-corporate-bond',
    expiresDays: 9,
    blocksTime: false,
  },
  {
    id: 'ev.2004-03.shock',
    date: '2004-03',
    month: monthIndex(2004, 3),
    channel: 'DLG',
    cls: 'shock',
    contentId: 'dlg.shock-2004-03',
    amount: 1200,
    blocksTime: true,
    notes: 'Rent spike, moving costs. Most surviving players die here.',
  },
  {
    id: 'ev.2004-08.pension-top-up',
    date: '2004-08',
    month: monthIndex(2004, 8),
    channel: 'MAIL',
    cls: 'life-admin',
    contentId: 'msg.pension-top-up-2004-08',
    vehicleId: 'brightwell-pension',
    expiresDays: 9,
    blocksTime: false,
  },
  {
    id: 'ev.2005-05.shock',
    date: '2005-05',
    month: monthIndex(2005, 5),
    channel: 'DLG',
    cls: 'shock',
    contentId: 'dlg.shock-2005-05',
    amount: 700,
    blocksTime: true,
  },
  {
    id: 'ev.2005-11.late-junk',
    date: '2005-11',
    month: monthIndex(2005, 11),
    channel: 'POP',
    cls: 'junk',
    contentId: 'pop.late-junk-2005-11',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
  },
  {
    id: 'ev.2006-06.shock',
    date: '2006-06',
    month: monthIndex(2006, 6),
    channel: 'DLG',
    cls: 'shock',
    contentId: 'dlg.shock-2006-06',
    amount: 600,
    blocksTime: true,
  },
  {
    id: 'ev.2006-12.win',
    date: '2006-12',
    month: monthIndex(2006, 12),
    channel: 'DLG',
    cls: 'win',
    contentId: 'dlg.win-2006-12',
    blocksTime: true,
    notes: 'THE DECADE ENDS — you survived. LEGENDARY card.',
  },
];

/* ------------------------------------------------------------------ *
 * Stats
 * ------------------------------------------------------------------ */

/** The set of vehicle ids that are §11.5 scams — used to count distinct scams. */
export const SCAM_VEHICLE_IDS = new Set([
  'meridian-guaranteed',
  'cavendish-tech',
  'halcyon-reserve',
  'vertex-communications',
  'restitution-partners',
  'sentinel-protect',
]);

const OFFER_CLASSES = new Set(['legit', 'mediocre', 'scam', 'credit']);

export interface TimelineStats {
  totalEvents: number;
  offers: number;
  mailOffers: number;
  popupOffers: number;
  /** Distinct scam vehicles referenced (§11.5: six, no seventh). */
  distinctScams: number;
  /** Scam-class *events*. Equals distinctScams — every scam appears once. */
  scamEvents: number;
  shocks: number;
  windfalls: number;
  junk: number;
  credit: number;
}

export function timelineStats(): TimelineStats {
  let offers = 0;
  let mailOffers = 0;
  let popupOffers = 0;
  let scamEvents = 0;
  let shocks = 0;
  let windfalls = 0;
  let junk = 0;
  let credit = 0;
  const scamVehicles = new Set<string>();

  for (const e of TIMELINE) {
    if (OFFER_CLASSES.has(e.cls)) {
      offers += 1;
      if (e.channel === 'MAIL') mailOffers += 1;
      if (e.channel === 'POP') popupOffers += 1;
    }
    if (e.cls === 'scam') {
      scamEvents += 1;
      if (e.vehicleId && SCAM_VEHICLE_IDS.has(e.vehicleId)) scamVehicles.add(e.vehicleId);
    }
    if (e.cls === 'shock' || e.cls === 'job-loss') shocks += 1;
    if (e.cls === 'windfall') windfalls += 1;
    if (e.cls === 'junk') junk += 1;
    if (e.cls === 'credit') credit += 1;
  }

  return {
    totalEvents: TIMELINE.length,
    offers,
    mailOffers,
    popupOffers,
    distinctScams: scamVehicles.size,
    scamEvents,
    shocks,
    windfalls,
    junk,
    credit,
  };
}
