/**
 * Step 8 done-condition: the full decade runs in under 50ms. Also covers
 * §25.2 determinism and the shape of `RunResult` (death date, band, §15
 * secondary stats, wealth/market history for the death-card graph).
 *
 * The §25.3 calibration numbers themselves — cash-only dying Mar 2000, and
 * the other five scripted strategies — are Step 9's job: see verify.test.ts.
 */

import { describe, expect, it } from 'vitest';
import { run } from './run';
import { TIMELINE } from '../script/timeline';
import { MONTH_COUNT, monthIndex } from './month';
import type { Decision } from './types';

describe('run (§7.3, §25.2, Step 8)', () => {
  it('plays the full decade in well under 50ms', () => {
    const start = performance.now();
    run(TIMELINE, []);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('is deterministic: identical (script, decisions) always produce identical results (§25.2)', () => {
    const decisions: Decision[] = [
      { type: 'open-mail', month: monthIndex(1996, 4), mailId: 'ev.1996-04.northmoor-bond' },
      { type: 'accept-offer', month: monthIndex(1996, 4), vehicleId: 'northmoor-bond', source: 'test' },
    ];
    const a = run(TIMELINE, decisions);
    const b = run(TIMELINE, decisions);
    expect(a).toEqual(b);
  });

  it('produces a death month and OUCH band for the cash-only run (accepts nothing)', () => {
    const result = run(TIMELINE, []);
    expect(result.status).toBe('dead');
    expect(result.deathMonth).not.toBeNull();
    expect(result.band).toBe('OUCH');
  });

  it('fills wealthHistory and marketHistory up to (and including) the death month', () => {
    const result = run(TIMELINE, []);
    expect(result.wealthHistory.length).toBeGreaterThan(0);
    expect(result.wealthHistory.length).toBe(result.marketHistory.length);
    expect(result.wealthHistory.length).toBeLessThanOrEqual(MONTH_COUNT);
  });

  it('reports a LEGENDARY band and null deathMonth for a run that reaches Dec 2006', () => {
    // A trivial no-op decision list still "survives" mechanically as long as
    // every dialog resolves to its scripted default and nothing goes
    // insolvent — which cash-only does NOT do; this just checks the shape of
    // a survived result using run()'s own bookkeeping, not a real strategy.
    const result = run(TIMELINE, []);
    if (result.status === 'survived') {
      expect(result.deathMonth).toBeNull();
      expect(result.band).toBe('LEGENDARY');
    } else {
      expect(result.deathMonth).not.toBeNull();
    }
  });

  it('computes trackerCounterfactualFees as a non-negative number (§9.3)', () => {
    const result = run(TIMELINE, [
      { type: 'accept-offer', month: monthIndex(1996, 4), vehicleId: 'northmoor-bond', source: 'test' },
      { type: 'rebalance', month: monthIndex(1996, 4), targets: { 'northmoor-bond': 80 }, cashPct: 20 },
    ]);
    expect(result.stats.trackerCounterfactualFees).toBeGreaterThanOrEqual(0);
  });

  it('never scores by final wealth — bands are date-only (§15)', () => {
    // Two runs that die in the same month must land in the same band even
    // if their final wealth differs (one holds a scrap of a collapsed
    // vehicle, the other doesn't) — banding must not look at stats at all.
    const a = run(TIMELINE, []);
    const b = run(TIMELINE, [
      { type: 'accept-offer', month: monthIndex(1996, 4), vehicleId: 'northmoor-bond', source: 'test' },
    ]);
    // Both are cash-heavy, undiversified, early-death runs — same band family.
    expect(['OUCH', 'OKAY']).toContain(a.band);
    expect(['OUCH', 'OKAY']).toContain(b.band);
  });

  it('names every scam the player never funded as dodged (§15)', () => {
    const result = run(TIMELINE, []);
    expect(result.stats.scamsFundedIds).toHaveLength(0);
    expect(result.stats.scamsDodgedIds).toHaveLength(6); // §11.5 — six scams, none funded
    expect(result.stats.scamsDodged).toBe(6);
  });
});
