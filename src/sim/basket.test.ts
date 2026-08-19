import { describe, it, expect } from 'vitest';
import { expensesFor, deflatorTo1996 } from './basket';
import { monthIndex, MONTH_COUNT } from './month';
import { MONTHLY_PAY } from './types';

describe('expensesFor (§8.1-8.3)', () => {
  it('1996 total is exactly £645', () => {
    expect(expensesFor(monthIndex(1996, 1)).total).toBeCloseTo(645, 1);
  });

  it('2000 total is £760 ± £3 (the break-even year, §8.3)', () => {
    expect(Math.abs(expensesFor(monthIndex(2000, 1)).total - 760)).toBeLessThanOrEqual(3);
  });

  it('2006 total is £980 ± £5', () => {
    expect(Math.abs(expensesFor(monthIndex(2006, 1)).total - 980)).toBeLessThanOrEqual(5);
  });

  it('the year-2000 surplus against fixed £760 pay is £0 ± £3 — the thesis of the game', () => {
    const surplus = MONTHLY_PAY - expensesFor(monthIndex(2000, 6)).total;
    expect(Math.abs(surplus)).toBeLessThanOrEqual(3);
  });

  it('components sum to the reported total', () => {
    const b = expensesFor(monthIndex(2003, 7));
    expect(b.rent + b.food + b.bills + b.transport + b.other).toBeCloseTo(b.total, 6);
  });

  it('steps up once per year on the January boundary, flat within a year', () => {
    const jan = expensesFor(monthIndex(2002, 1)).total;
    const jun = expensesFor(monthIndex(2002, 6)).total;
    const dec = expensesFor(monthIndex(2002, 12)).total;
    expect(jun).toBe(jan);
    expect(dec).toBe(jan);
    const nextJan = expensesFor(monthIndex(2003, 1)).total;
    expect(nextJan).toBeGreaterThan(jan);
  });

  it('expenses only ever rise year over year (housing-led squeeze, §8.2)', () => {
    let prev = expensesFor(monthIndex(1996, 1)).total;
    for (let year = 1997; year <= 2006; year++) {
      const cur = expensesFor(monthIndex(year, 1)).total;
      expect(cur).toBeGreaterThan(prev);
      prev = cur;
    }
  });

  it('is defined for every month in the decade', () => {
    for (let m = 0; m < MONTH_COUNT; m++) {
      const b = expensesFor(m);
      expect(Number.isFinite(b.total)).toBe(true);
      expect(b.total).toBeGreaterThan(0);
    }
  });
});

describe('deflatorTo1996 (§19.4)', () => {
  it('is 1 in 1996 (base year)', () => {
    expect(deflatorTo1996(monthIndex(1996, 1))).toBeCloseTo(1, 6);
  });

  it('shrinks monotonically as CPI rises through the decade', () => {
    let prev = deflatorTo1996(monthIndex(1996, 1));
    for (let year = 1997; year <= 2006; year++) {
      const cur = deflatorTo1996(monthIndex(year, 1));
      expect(cur).toBeLessThan(prev);
      prev = cur;
    }
  });

  it('is defined for every month in the decade', () => {
    for (let m = 0; m < MONTH_COUNT; m++) {
      expect(Number.isFinite(deflatorTo1996(m))).toBe(true);
    }
  });
});
