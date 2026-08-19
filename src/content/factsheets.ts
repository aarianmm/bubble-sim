/**
 * §22.4 — the fact sheet. Identical layout for every vehicle, legit or
 * otherwise: "the layout is the lesson." All ten fields are populated on
 * every sheet; empty is never blank, it is NONE ('— none —').
 *
 * FEE SOURCE OF TRUTH: fee numbers below are taken from §9.1 / §11.5 of the
 * design doc (tracker 0.4%, world 0.5%, Technova 5% + 1% exit, Ashcombe
 * 3% + 20% performance, Cavendish 8% + 3% exit, Northmoor 5.2%). If
 * `scripts/source-data/vehicles.ts` (branch step/data-basket) generates a
 * different number for any of these, that generator is the one to fix —
 * these fact sheets and that generator must agree, and the design doc is
 * the tiebreaker.
 *
 * §11.2 the fairness contract is binding here:
 *  - every one of the six scams carries >= 2 red flags (rule 1)
 *  - red flags are on the sheet, one click away, free, untimed (rule 2)
 *  - no single flag is diagnostic — a couple of legit/mediocre sheets below
 *    carry exactly one weak flag apiece, so a checklist alone doesn't work
 *    (rule 3; see Quicksilver, Marlow, Ashcombe, Technova)
 *  - Halcyon Reserve is the genuinely-hard one (rule 4): its two flags are
 *    "Registered in Guernsey" (buried in Regulated by, not shouted) and a create
 *    5% introducer commission (buried in the small print) — no "guaranteed
 *    returns" flag, no implausible headline number. The tell is the return
 *    chart itself: eighteen months, never a down one.
 */

import type { FactSheet } from '../sim/types';
import { NONE } from '../sim/types';
import type { VehicleId } from '../sim/ids';

export const FACT_SHEETS: Record<VehicleId, FactSheet> = {
  cash: {
    name: 'Current account',
    manager: 'n/a',
    twelveMonthReturn: '0%',
    annualFee: NONE,
    exitFee: NONE,
    holdings: NONE,
    launched: NONE,
    regulatedBy: 'FSCS protected (Financial Services Compensation Scheme)',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    redFlags: [],
  },

  /* ---------------------------------------------------------------- *
   * Safe / Correct / Reasonable — the legitimate tier
   * ---------------------------------------------------------------- */

  'northmoor-bond': {
    name: 'Northmoor 3-Year Fixed Bond',
    manager: 'Northmoor Building Society',
    // §16 — the fact sheet is the only place the rate appears.
    twelveMonthReturn: '5.2% AER, fixed',
    annualFee: NONE,
    exitFee: 'Forfeit 90 days’ interest on early withdrawal',
    holdings: NONE,
    launched: 'This issue opened Jan 1996',
    regulatedBy: 'Building Societies Commission',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [0.43, 0.43, 0.43, 0.43, 0.43, 0.43, 0.43, 0.43, 0.43, 0.43, 0.43, 0.43],
    redFlags: [],
  },

  'fenwick-index': {
    name: 'Fenwick Index Trust',
    manager: 'Fenwick Fund Management',
    twelveMonthReturn: '+18.4%',
    annualFee: '0.4%',
    exitFee: NONE,
    holdings: '623 companies (tracks the FTSE All-Share)',
    launched: 'Mar 1989',
    regulatedBy: 'IMRO',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [2.1, -1.4, 3.0, 1.2, -0.6, 2.8, -2.1, 1.9, 0.4, -1.0, 2.6, 1.1],
    redFlags: [],
  },

  'fenwick-world': {
    name: 'Fenwick World Trust',
    manager: 'Fenwick Fund Management',
    twelveMonthReturn: '+24.1%',
    annualFee: '0.5%',
    exitFee: NONE,
    holdings: '1,850 companies (tracks global developed markets)',
    launched: 'Sep 1994',
    regulatedBy: 'IMRO',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [3.4, -0.9, 4.1, 2.0, -2.4, 3.6, -1.1, 2.9, 1.0, -1.8, 3.2, 1.6],
    redFlags: [],
  },

  'kingsley-gilt': {
    name: 'Kingsley Gilt Income Fund',
    manager: 'Kingsley Asset Management',
    twelveMonthReturn: '+6.1%',
    annualFee: '0.75%',
    exitFee: NONE,
    holdings: '38 UK government gilts, various maturities',
    launched: '1991',
    regulatedBy: 'IMRO',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [0.5, 0.4, 0.6, 0.3, 0.5, 0.7, 0.4, 0.6, 0.5, 0.4, 0.6, 0.5],
    redFlags: [],
  },

  'marlow-corporate-bond': {
    name: 'Marlow Corporate Bond Fund',
    manager: 'Marlow Investment Partners',
    twelveMonthReturn: '+7.8%',
    annualFee: '0.9%',
    exitFee: NONE,
    holdings: '140 investment-grade corporate bonds',
    launched: '1996',
    regulatedBy: 'FSA',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [0.6, 0.5, 0.7, 0.6, 0.4, 0.8, 0.5, 0.6, 0.7, 0.5, 0.6, 0.7],
    // §11.2 r3: a single weak flag on a wholly legitimate sheet. A short
    // promotional window is common to real fund launches, not just scams.
    redFlags: ['urgency'],
  },

  'brightwell-pension': {
    name: 'Brightwell Ltd Workplace Pension — Default Fund',
    manager: 'Brightwell Ltd, administered by Kingsley Asset Management',
    twelveMonthReturn: '+11.2%',
    annualFee: '0.6%',
    exitFee: NONE,
    holdings: 'A balanced default fund: 60% shares, 40% bonds',
    launched: '1997 (scheme start)',
    regulatedBy: 'OPRA',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [1.1, -0.5, 1.4, 0.8, -0.3, 1.2, -0.7, 1.0, 0.6, -0.4, 1.1, 0.7],
    redFlags: [],
  },

  /* ---------------------------------------------------------------- *
   * Mediocre — legal, legitimate, a mistake
   * ---------------------------------------------------------------- */

  'technova-growth': {
    name: 'Technova Growth Fund',
    manager: 'Technova Asset Management',
    twelveMonthReturn: '+21.6%',
    annualFee: '5.0%',
    exitFee: '1.0%',
    holdings: '58 technology companies',
    launched: 'Jan 1998',
    regulatedBy: 'IMRO',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [4.2, -3.1, 5.0, 2.8, -4.4, 6.1, -2.0, 3.9, 1.4, -3.6, 5.2, 2.1],
    // Legal, disclosed, and still a mistake: the fee alone would out-earn the
    // fund manager most years. §11.3: "Very high fee (>5%) — mediocre and scam."
    redFlags: ['very-high-fee'],
  },

  'ashcombe-managed': {
    name: 'Ashcombe Managed Portfolio',
    manager: 'Ashcombe Wealth Management',
    twelveMonthReturn: '+9.4%',
    annualFee: '3.0% + 20% of gains',
    exitFee: NONE,
    holdings: 'A discretionary blend, rebalanced quarterly',
    launched: '1996',
    regulatedBy: 'IMRO',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [0.9, -0.6, 1.2, 0.7, -0.5, 1.0, -0.4, 0.8, 0.5, -0.3, 0.9, 0.6],
    redFlags: ['slightly-high-fee'],
  },

  /* ---------------------------------------------------------------- *
   * Concentrated — undiversified but real
   * ---------------------------------------------------------------- */

  'granville-plc': {
    name: 'Granville plc (ordinary shares)',
    manager: 'n/a — direct shareholding',
    twelveMonthReturn: '+12.0%',
    annualFee: '£12 flat dealing charge',
    exitFee: NONE,
    holdings: '1 company (Granville plc)',
    launched: 'Listed on the LSE, 1986',
    regulatedBy: 'London Stock Exchange',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [1.5, -2.0, 2.4, -1.1, 1.8, -0.6, 2.1, -1.4, 1.0, 0.5, -0.8, 1.9],
    // §11.3: concentrated holdings, legitimately — single stocks always carry
    // this one, scam or not. Not diagnostic on its own.
    redFlags: ['concentrated-holdings'],
  },

  'quicksilver-com': {
    name: 'Quicksilver.com (ordinary shares)',
    manager: 'n/a — direct shareholding',
    twelveMonthReturn: '+340%',
    annualFee: '£12 flat dealing charge',
    exitFee: NONE,
    holdings: '1 company (Quicksilver.com)',
    launched: 'Listed on the LSE, Jun 1999',
    regulatedBy: 'UK Listing Authority',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [12, 28, 40, 55, 30, 48, 60, 35, 20, 44, 15, 5],
    // Real vehicle, catastrophic timing (§14.2). Same flag as the pump below —
    // proof that one flag alone never tells you which is which.
    redFlags: ['concentrated-holdings'],
  },

  /* ---------------------------------------------------------------- *
   * Fatal — the six §11.5 scams. Every sheet carries >= 2 red flags.
   * ---------------------------------------------------------------- */

  'meridian-guaranteed': {
    name: 'Meridian Capital Guaranteed Growth Fund',
    manager: 'Meridian Capital Group',
    twelveMonthReturn: '+31%',
    annualFee: '2.0%',
    exitFee: NONE,
    holdings: 'Not disclosed',
    launched: 'Jan 1997',
    regulatedBy: NONE,
    minimumReturn: '"30% p.a., guaranteed"',
    introducerCommission: NONE,
    returnChart: [2.5, 2.5, 2.6, 2.5, 2.4, 2.6, 2.5, 2.5, 2.6, 2.4, 2.5, 2.6],
    // Scam 1 — the cheap, amateur one. Loud and obvious on purpose (§11.5).
    redFlags: ['guaranteed-returns', 'no-regulator', 'track-record-under-12-months'],
  },

  'cavendish-tech': {
    // §22.3's own worked example — figures match the mock-up exactly.
    name: 'Technology Opportunities Fund',
    manager: 'Cavendish Asset Management',
    twelveMonthReturn: '+64%',
    annualFee: '8.0%',
    exitFee: '3.0%',
    holdings: '3 companies',
    launched: 'Feb 1998',
    regulatedBy: NONE,
    minimumReturn: '"40% p.a."',
    introducerCommission: '5%',
    returnChart: [5, 5.2, 5, 4.8, 5.1, 5, 5.3, 5, 4.9, 5.1, 5, 5.2],
    redFlags: ['very-high-fee', 'concentrated-holdings', 'guaranteed-returns', 'no-regulator'],
  },

  'halcyon-reserve': {
    // §11.4 the Ponzi. §11.2 rule 4: the genuinely hard one. Deliberately
    // exactly two flags, both easy to skim past — no "guaranteed", no
    // implausible headline number, nothing shouting. The tell is structural:
    // eighteen straight up months on the chart below.
    name: 'Halcyon Reserve',
    manager: 'Halcyon Reserve Partners',
    twelveMonthReturn: '+58%',
    annualFee: '1.5%',
    exitFee: NONE,
    holdings: 'A diversified international portfolio',
    launched: 'Apr 1998',
    // The subtle flag: not "no regulator" in bold, just where it's registered.
    regulatedBy: 'Registered in Guernsey — no UK regulator',
    minimumReturn: NONE,
    // The buried flag: five words in the small print.
    introducerCommission: '5%',
    returnChart: [3.8, 4.0, 4.1, 3.9, 4.2, 4.0, 3.8, 4.1, 4.0, 3.9, 4.2, 4.1, 4.0, 3.9, 4.1, 4.0, 4.2, 4.1],
    redFlags: ['no-regulator', 'introducer-commission'],
  },

  'vertex-communications': {
    name: 'Vertex Communications (ordinary shares)',
    manager: 'n/a — direct shareholding',
    twelveMonthReturn: '+200%',
    annualFee: '1.0%',
    exitFee: NONE,
    holdings: '1 company (Vertex Communications)',
    launched: 'Listed Jan 1999',
    regulatedBy: NONE,
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [8, 15, 30, 60],
    // Scam 4 — the pump. §11.5: single holding, unsolicited tip, 4-month record.
    redFlags: ['concentrated-holdings', 'unsolicited-approach', 'track-record-under-12-months'],
  },

  'restitution-partners': {
    name: 'Restitution Partners — Loss Recovery Service',
    manager: 'Restitution Partners LLP',
    twelveMonthReturn: NONE,
    annualFee: '£150 upfront administration fee',
    exitFee: NONE,
    holdings: NONE,
    launched: '2000',
    regulatedBy: NONE,
    minimumReturn: '"We recover what you lost"',
    introducerCommission: NONE,
    returnChart: [],
    // Scam 5 — arrives by mail, aimed at whoever just lost money (§11.5).
    // Timeline note: retimed to 2000-04 (§14.3 rule 2) — see src/script/timeline.ts.
    redFlags: ['no-regulator', 'unsolicited-approach', 'implausible-return'],
  },

  'sentinel-protect': {
    name: 'Sentinel Protect',
    manager: 'Sentinel Protect Ltd',
    twelveMonthReturn: NONE,
    annualFee: '£45 "protection fee"',
    exitFee: NONE,
    holdings: NONE,
    launched: NONE,
    regulatedBy: NONE,
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [],
    // Scam 6 — the fake dialog (§20.5). mvpDeferred in the timeline (Step 32),
    // but the fact sheet still has to pass the fairness contract on its own.
    redFlags: ['no-regulator', 'urgency', 'lookalike-domain'],
  },

  /* ---------------------------------------------------------------- *
   * Negative — §13
   * ---------------------------------------------------------------- */

  'capital-direct-card': {
    name: 'Capital Direct Gold Card',
    manager: 'Capital Direct Bank plc',
    twelveMonthReturn: NONE,
    annualFee: '0% for 6 months, then 29.8% APR variable',
    exitFee: NONE,
    holdings: NONE,
    launched: '1998',
    regulatedBy: 'Office of Fair Trading — Consumer Credit Licence',
    minimumReturn: NONE,
    introducerCommission: NONE,
    returnChart: [],
    redFlags: [],
  },
};
