/**
 * §14.2 — THE TIMELINE. The single source of truth for run content, encoded.
 *
 * RECONCILIATION NOTE — read before editing counts.
 *
 * "42 authored events" is §14.2's own headline count. Counted row by row, the
 * printed §14.2 table contains 46 rows (45 dated events plus the "Jan 1996 —
 * Run begins" scene-setter, kept here as an explicit `start` event so the
 * game has an anchor for month 0) — 4 more than the headline "42". Every
 * OTHER §14.2 total checked out exactly against that row-by-row table (6
 * distinct scams, 9 shocks, 3 windfalls, 8 junk, 2 credit, 9 mail offers),
 * which is why the table, not the prose headline, was trusted as the
 * authoritative source. That discrepancy is real and is left as-is.
 *
 * What did NOT check out was popup offers: the printed table names zero
 * non-scam popup offers — only the 5 scam popups (Meridian, Cavendish,
 * Vertex, Halcyon, the fake dialog) — which teaches "popup = scam" and
 * directly violates §10 rule 1: "Popups skew scam but never determine it.
 * A real tracker fund advertises by popup too. Skew, don't determine." A
 * popup channel that is 100% scam also breaks §11.2's fairness contract in
 * spirit even where it holds by the letter: the fact sheet stops being a
 * genuine judgement call and becomes decoration, because the channel alone
 * already tells you the answer.
 *
 * RESOLVED: three named popup offers have been added, using the three §9.1
 * vehicles that otherwise had no delivery anywhere in the timeline —
 * `technova-growth` (LOUD, 1998-02, paired with Dave's FOMO email),
 * `kingsley-gilt` (1999-03, well ahead of the 1999 mania peak) and
 * `granville-plc` (2001-03, after the Halcyon collapse). Technova remains
 * the legitimate popup that proves loud does not mean scam; the sober
 * Kingsley and Granville solicitations now arrive by Mail, where their
 * investor-facing tone belongs. Two expendable standalone junk events were
 * removed. A later popup-density pass removed four more standalone junk
 * events and the three junk companions attached to Meridian and Vertex,
 * leaving 43 authored events and 17 offers (11 mail, 6 popup). A late-game
 * pacing pass then added three inert financial-education Mail items and one
 * non-actionable bank-impersonation popup. The resulting 47-event timeline
 * has eight authored POP events, each producing exactly one window.
 * The Aug 2004 life-admin reminder is informational because the player no
 * longer works for Brightwell; life-admin is not included in offer totals.
 *
 * §14.3 rule 2 (every windfall followed by a scam within 90 days) is
 * satisfied WITHOUT adding a scam: Restitution Partners is moved from
 * 2001-04 to 2000-04, exactly as rule 2's own text authorises ("if
 * playtesting shows the pattern isn't landing, move a scam into mid-2000")
 * — see the note on that event, below. This keeps the six named scams at
 * six (§11.5: "there is no seventh").
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
    id: 'ev.1996-12.northmoor-annual-statement',
    date: '1996-12',
    month: monthIndex(1996, 12),
    channel: 'MAIL',
    cls: 'flavour',
    contentId: 'msg.northmoor-annual-statement',
    vehicleId: 'northmoor-bond',
    expiresDays: null,
    blocksTime: false,
    notes: 'Illustrates £31 interest on £600, against £28/yr of rent inflation. The joke lands silently without assuming the player invested.',
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
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    notes: 'Scam 1. Loud, cheap, obvious — three weeks after windfall #1.',
  },
  {
    id: 'ev.1997-05.brightwell-pension',
    date: '1997-05',
    month: monthIndex(1997, 5),
    channel: 'MAIL',
    cls: 'life-admin',
    contentId: 'msg.brightwell-pension',
    vehicleId: 'brightwell-pension',
    expiresDays: 45,
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
    expiresDays: 45,
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
    id: 'ev.1998-02.dave-fomo',
    date: '1998-02',
    month: monthIndex(1998, 2),
    channel: 'MAIL',
    cls: 'social',
    contentId: 'msg.dave-fomo-1998-02',
    expiresDays: 9,
    blocksTime: false,
    notes: 'FOMO. Links to the tech fund (Technova Growth, arriving this same month).',
  },
  {
    id: 'ev.1998-02.technova',
    date: '1998-02',
    month: monthIndex(1998, 2),
    channel: 'POP',
    cls: 'mediocre',
    contentId: 'pop.technova-1998-02',
    vehicleId: 'technova-growth',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    // §10 rule 1 fix (added on the coordinator's instruction): the printed
    // §14.2 table has zero non-scam popup offers, which teaches "popup =
    // scam" and breaks the fairness contract. Technova is the central case:
    // LOUD, legitimate, and simply an expensive mistake (§21) — placed the
    // same month as Dave's FOMO email so the two reinforce each other, the
    // way a friend's tip and a fund's own advertising would in real life.
    notes: 'Legit-but-mediocre popup offer, added for §10 rule 1 ("a real tracker fund advertises by popup too").',
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
    expiresDays: 9,
    blocksTime: false,
    mvpDeferred: true,
    notes: 'Informational credit marketing (§13); usable credit remains beyond the MVP boundary (§26.1).',
  },
  {
    id: 'ev.1998-08.shock',
    date: '1998-08',
    month: monthIndex(1998, 8),
    channel: 'DLG',
    cls: 'shock',
    contentId: 'dlg.shock-1998-08',
    // Calibration (§25.3/§8.4, Step 9): the cash-only player must die in
    // exactly March 2000. The Nov 1999 job-loss event (§14.1, 3 months of
    // no income) fires in tick.ts step 5, so the income suspension it sets
    // first bites the FOLLOWING month — Dec 1999, Jan 2000 and Feb 2000 are
    // the three unpaid months, not Nov itself. With that timing and the
    // real basket/series numbers, the original £1,100 here left too thin a
    // buffer and the cash-only run went bankrupt in Jan 2000 instead.
    // Reduced to £500 — still within the §14.1 £250-£1,600 shock range —
    // which restores the March 2000 death with a comfortable margin (see
    // verify.test.ts and the Step 7/8/9 completion report for the
    // arithmetic). No other field changed.
    amount: 500,
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
    expiresDays: 45,
    blocksTime: false,
    notes: 'Legal, legitimate, a mistake.',
  },
  {
    id: 'ev.1999-01.fenwick-world',
    date: '1999-01',
    month: monthIndex(1999, 1),
    channel: 'MAIL',
    cls: 'legit',
    contentId: 'msg.fenwick-world',
    vehicleId: 'fenwick-world',
    expiresDays: 45,
    blocksTime: false,
  },
  {
    id: 'ev.1999-03.kingsley-gilt',
    date: '1999-03',
    month: monthIndex(1999, 3),
    channel: 'MAIL',
    cls: 'legit',
    contentId: 'pop.kingsley-gilt-1999-03',
    vehicleId: 'kingsley-gilt',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    notes: 'Legit Mail offer. Arrives well ahead of the crash so it can plausibly be held through it.',
  },
  {
    id: 'ev.1999-05.vertex',
    date: '1999-05',
    month: monthIndex(1999, 5),
    channel: 'POP',
    cls: 'scam',
    contentId: 'pop.vertex-1999-05',
    vehicleId: 'vertex-communications',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    notes: 'Scam 4 — the pump. Mania peak.',
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
    id: 'ev.2000-01.year-turn',
    date: '2000-01',
    month: monthIndex(2000, 1),
    channel: 'DLG',
    cls: 'year-turn',
    contentId: 'dlg.year-turn-2000-01',
    blocksTime: true,
    notes: 'BREAK-EVEN. Living costs now match £760 pay; from here costs rise faster. The thesis, as a beat (§8.3).',
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
    channel: 'MAIL',
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
    expiresDays: 2,
    blocksTime: false,
    mvpDeferred: true,
    notes: 'Post-shock informational credit marketing; tempting under pressure, but not actionable in the MVP.',
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
    id: 'ev.2001-03.granville',
    date: '2001-03',
    month: monthIndex(2001, 3),
    channel: 'MAIL',
    cls: 'legit',
    contentId: 'pop.granville-2001-03',
    vehicleId: 'granville-plc',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    // Lands in the ten-month lull between the Halcyon collapse and the Sep
    // 2001 trough shock. Investor-relations correspondence belongs in Mail.
    notes: 'Legit Mail offer in the post-crash rotation into boring blue-chip stocks.',
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
    id: 'ev.2002-06.investor-bulletin',
    date: '2002-06',
    month: monthIndex(2002, 6),
    channel: 'MAIL',
    cls: 'flavour',
    contentId: 'msg.investor-bulletin-2002-06',
    expiresDays: 45,
    blocksTime: false,
    notes: 'State-independent post-crash lesson on uncertainty and diversification.',
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
    expiresDays: 45,
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
    expiresDays: 9,
    blocksTime: false,
    notes: 'Informational reminder only; does not route a former Brightwell employee back to the 1997 scheme.',
  },
  {
    id: 'ev.2005-02.investment-charges',
    date: '2005-02',
    month: monthIndex(2005, 2),
    channel: 'MAIL',
    cls: 'flavour',
    contentId: 'msg.investment-charges-2005-02',
    expiresDays: 45,
    blocksTime: false,
    notes: 'State-independent reminder that recurring investment charges compound over time.',
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
    id: 'ev.2005-09.meadowbank-phishing',
    date: '2005-09',
    month: monthIndex(2005, 9),
    channel: 'POP',
    cls: 'security',
    contentId: 'pop.meadowbank-phishing-2005-09',
    count: 1,
    expiresDays: 45,
    blocksTime: false,
    notes: 'Non-actionable bank-impersonation phishing lesson; X-only because credential mechanics are outside the MVP.',
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
    id: 'ev.2006-08.long-term-planning',
    date: '2006-08',
    month: monthIndex(2006, 8),
    channel: 'MAIL',
    cls: 'flavour',
    contentId: 'msg.long-term-planning-2006-08',
    expiresDays: 45,
    blocksTime: false,
    notes: 'State-independent late-game reflection on regular saving, pensions and diversification.',
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
