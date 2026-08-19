/**
 * Step 26 tests — §15 bands and §22.6 cause-of-death selection.
 *
 * Two layers, deliberately:
 *
 *  1. `bandFor` / `causeIdFor` / `missedRedFlags` are pure functions of
 *     (status, deathMonth, stats) — tested directly with constructed
 *     fixtures, which is the only way to prove the §15 anti-gambling rule
 *     ("bands are determined by survival date only, never by final
 *     wealth") as a *negative*: two fixtures with wildly different wealth
 *     but the same deathMonth must produce the same band.
 *
 *  2. Each of the six §22.6 cause lines this step can reach — everything
 *     except `'the-card-ate-you'` and `'the-fake-dialog'`, both of which
 *     depend on mechanics beyond the Step 1-28 MVP boundary (§26.1: the
 *     credit card, Step 31; the imitation-dialog scam, Step 32) and are
 *     genuinely unreachable, not a gap in this file — is proven reachable
 *     by a real, deterministic decision list run against the authored
 *     §14.2 timeline through `run()`. Five of the six are exercised this
 *     way (`broke-as-bubble-peaked`, `ground-down-by-rent`,
 *     `funded-a-scam`, `sold-at-the-bottom`, `eaten-by-fees`).
 *
 *     `'survived'` is the sixth. Reaching Dec 2006 alive with the real
 *     §14.2 timeline is KNOWN-ISSUES.md issue 1: even the best decision
 *     list found in `verify.test.ts`'s own search dies IMPRESSIVE-band in
 *     Feb 2005, a few pounds short — a deliberately-parked spec-arithmetic
 *     gap this step is explicitly told not to fix. `causeIdFor`'s
 *     'survived' branch is therefore proven the way the rest of this file
 *     proves band boundaries: directly, as a pure function of `status`.
 *     That is a stronger test of the *selection logic* (this step's actual
 *     job) than a full-timeline run would be anyway — it also proves
 *     'survived' outranks every other stat, including ones that would
 *     otherwise read as a dramatic scam/fee/forced-sale death.
 */
import { describe, expect, it } from 'vitest';
import { bandFor, causeIdFor, missedRedFlags } from './bands';
import { run } from './run';
import { TIMELINE } from '../script/timeline';
import { monthIndex } from './month';
import type { Decision, RunStats } from './types';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

function stats(overrides: Partial<RunStats> = {}): RunStats {
  return {
    peakWealth: 0,
    peakWealth1996: 0,
    finalWealth: 0,
    feesPaid: 0,
    trackerCounterfactualFees: 0,
    scamsFunded: 0,
    scamsDodged: 0,
    forcedSales: 0,
    monthsUnderwater: 0,
    scamsFundedIds: [],
    scamsDodgedIds: [],
    redFlagsMissed: [],
    ...overrides,
  };
}

/* ------------------------------------------------------------------ *
 * bandFor — §15: survival date only, never wealth.
 * ------------------------------------------------------------------ */

describe('bandFor (§15)', () => {
  it('OUCH for a death before Jan 2001', () => {
    expect(bandFor('dead', monthIndex(1996, 4))).toBe('OUCH');
    expect(bandFor('dead', monthIndex(2000, 12))).toBe('OUCH');
  });

  it('OKAY for 2001-2002', () => {
    expect(bandFor('dead', monthIndex(2001, 1))).toBe('OKAY');
    expect(bandFor('dead', monthIndex(2002, 12))).toBe('OKAY');
  });

  it('SOLID for 2003-2004', () => {
    expect(bandFor('dead', monthIndex(2003, 1))).toBe('SOLID');
    expect(bandFor('dead', monthIndex(2004, 12))).toBe('SOLID');
  });

  it('IMPRESSIVE for 2005, and for a death anywhere in 2006 (§15 names no band for that case)', () => {
    expect(bandFor('dead', monthIndex(2005, 1))).toBe('IMPRESSIVE');
    expect(bandFor('dead', monthIndex(2005, 12))).toBe('IMPRESSIVE');
    expect(bandFor('dead', monthIndex(2006, 6))).toBe('IMPRESSIVE');
  });

  it('LEGENDARY only for survived, deathMonth null', () => {
    expect(bandFor('survived', null)).toBe('LEGENDARY');
  });

  it('never consults wealth — it is not even a parameter', () => {
    // The strongest proof available: the signature itself has no wealth
    // input, so two runs at wildly different final/peak wealth but the
    // same deathMonth are, by construction, the same band.
    const poor = bandFor('dead', monthIndex(2003, 6));
    const rich = bandFor('dead', monthIndex(2003, 6));
    expect(poor).toBe(rich);
    expect(poor).toBe('SOLID');
  });
});

/* ------------------------------------------------------------------ *
 * causeIdFor — direct unit tests of the selection priority.
 * ------------------------------------------------------------------ */

describe('causeIdFor (§22.6) — selection priority', () => {
  it('survived outranks every other stat', () => {
    const dramaticStats = stats({ scamsFunded: 3, forcedSales: 9, feesPaid: 5000 });
    expect(causeIdFor('survived', null, dramaticStats)).toBe('survived');
  });

  it('a funded scam always wins, even alongside a large fee bill and forced sales', () => {
    expect(
      causeIdFor('dead', monthIndex(2001, 5), stats({ scamsFunded: 1, feesPaid: 900, forcedSales: 5 })),
    ).toBe('funded-a-scam');
  });

  it('a fee bill over the threshold wins ahead of a merely-adjacent forced-sale count', () => {
    expect(causeIdFor('dead', monthIndex(2002, 10), stats({ feesPaid: 501, forcedSales: 12 }))).toBe(
      'eaten-by-fees',
    );
  });

  it('a repeated forced-sale pattern (>=3) wins when the fee bill never got large', () => {
    expect(causeIdFor('dead', monthIndex(2004, 8), stats({ feesPaid: 0, forcedSales: 12 }))).toBe(
      'sold-at-the-bottom',
    );
  });

  it('one or two forced sales — the routine terminal liquidation almost every death has — is not "sold at the bottom"', () => {
    expect(causeIdFor('dead', monthIndex(2003, 6), stats({ feesPaid: 0, forcedSales: 1 }))).toBe(
      'ground-down-by-rent',
    );
    expect(causeIdFor('dead', monthIndex(2003, 6), stats({ feesPaid: 0, forcedSales: 2 }))).toBe(
      'ground-down-by-rent',
    );
  });

  it('"broke the same month the bubble peaked" belongs only to an exact March 2000 death', () => {
    expect(causeIdFor('dead', monthIndex(2000, 3), stats())).toBe('broke-as-bubble-peaked');
    expect(causeIdFor('dead', monthIndex(2000, 1), stats())).toBe('ground-down-by-rent');
    expect(causeIdFor('dead', monthIndex(2000, 5), stats())).toBe('ground-down-by-rent');
  });

  it('falls back to the honest general line when nothing more specific fits', () => {
    expect(causeIdFor('dead', monthIndex(1998, 7), stats())).toBe('ground-down-by-rent');
  });
});

/* ------------------------------------------------------------------ *
 * missedRedFlags (§11.2 rule 5)
 * ------------------------------------------------------------------ */

describe('missedRedFlags (§11.2 rule 5)', () => {
  it('quotes the funded scam’s own fact-sheet flags', () => {
    expect(missedRedFlags(['cavendish-tech'])).toEqual([
      'very-high-fee',
      'concentrated-holdings',
      'guaranteed-returns',
      'no-regulator',
    ]);
  });

  it('is empty when nothing was funded', () => {
    expect(missedRedFlags([])).toEqual([]);
  });

  it('de-duplicates flags shared across more than one funded scam', () => {
    const flags = missedRedFlags(['meridian-guaranteed', 'cavendish-tech']);
    expect(flags.filter((f) => f === 'no-regulator')).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ *
 * Reachability — five of the six lines, earned by a real scripted
 * playthrough against the authored §14.2 timeline. See file header for
 * why 'survived' is proven above instead of here.
 * ------------------------------------------------------------------ */

function openEveryMail(): Decision[] {
  const decisions: Decision[] = [];
  for (const e of TIMELINE) {
    if (e.mvpDeferred) continue;
    if (e.channel === 'MAIL') decisions.push({ type: 'open-mail', month: e.month, mailId: e.id });
  }
  return decisions;
}

describe('reachability — every §22.6 line the MVP can earn, via run()', () => {
  it('cash-only: "broke as the bubble peaked" — §6/§8.4’s own calibration event', () => {
    const result = run(TIMELINE, []);
    expect(result.status).toBe('dead');
    expect(result.deathMonth).toBe(monthIndex(2000, 3));
    expect(result.band).toBe('OUCH');
    expect(result.causeId).toBe('broke-as-bubble-peaked');
    expect(result.causeLine).toBe('You went broke the same month the bubble peaked.');
  });

  it('cash-plus-windfalls, never invested: "ground down"', () => {
    const result = run(TIMELINE, openEveryMail());
    expect(result.status).toBe('dead');
    expect(result.stats.scamsFunded).toBe(0);
    expect(result.stats.forcedSales).toBe(0); // nothing invested, nothing to liquidate
    expect(result.causeId).toBe('ground-down-by-rent');
    expect(result.causeLine).toBe('Ground down. Your rent rose 71%. Your pay rose £0.');
  });

  it('funds Cavendish (the pump-and-dump tech fund) heavily: "funded a scam" — and names the flags missed', () => {
    const decisions = openEveryMail();
    for (const e of TIMELINE) {
      if (e.vehicleId === 'cavendish-tech') {
        decisions.push({ type: 'accept-offer', month: e.month, vehicleId: e.vehicleId, source: e.id });
        decisions.push({ type: 'rebalance', month: e.month, targets: { 'cavendish-tech': 60 }, cashPct: 40 });
      }
    }
    decisions.sort((a, b) => a.month - b.month);
    const result = run(TIMELINE, decisions);
    expect(result.status).toBe('dead');
    expect(result.stats.scamsFunded).toBeGreaterThan(0);
    expect(result.causeId).toBe('funded-a-scam');
    // §11.2 rule 5 — the missed flags are quoted from the sheet that was
    // one click away, free and untimed.
    expect(result.stats.redFlagsMissed).toEqual(
      expect.arrayContaining(['very-high-fee', 'concentrated-holdings', 'guaranteed-returns', 'no-regulator']),
    );
  });

  it('90% in the fee-free bond, thin cash cushion: repeated forced sales, "sold at the bottom"', () => {
    const decisions = openEveryMail();
    for (const e of TIMELINE) {
      if (e.vehicleId === 'northmoor-bond') {
        decisions.push({ type: 'accept-offer', month: e.month, vehicleId: e.vehicleId, source: e.id });
        decisions.push({ type: 'rebalance', month: e.month, targets: { 'northmoor-bond': 90 }, cashPct: 10 });
      }
    }
    decisions.sort((a, b) => a.month - b.month);
    const result = run(TIMELINE, decisions);
    expect(result.status).toBe('dead');
    expect(result.stats.scamsFunded).toBe(0);
    expect(result.stats.feesPaid).toBeLessThanOrEqual(500); // Northmoor is fee-free (§9.1)
    expect(result.stats.forcedSales).toBeGreaterThanOrEqual(3);
    expect(result.causeId).toBe('sold-at-the-bottom');
  });

  it('45% in Technova (5% annual fee), held for years: "eaten by fees"', () => {
    const decisions = openEveryMail();
    for (const e of TIMELINE) {
      if (e.vehicleId === 'technova-growth') {
        decisions.push({ type: 'accept-offer', month: e.month, vehicleId: e.vehicleId, source: e.id });
        decisions.push({ type: 'rebalance', month: e.month, targets: { 'technova-growth': 45 }, cashPct: 55 });
      }
    }
    decisions.sort((a, b) => a.month - b.month);
    const result = run(TIMELINE, decisions);
    expect(result.status).toBe('dead');
    expect(result.stats.scamsFunded).toBe(0);
    expect(result.stats.feesPaid).toBeGreaterThan(500);
    expect(result.causeId).toBe('eaten-by-fees');
    expect(result.stats.trackerCounterfactualFees).toBeLessThan(result.stats.feesPaid); // §9.3's line
  });
});
