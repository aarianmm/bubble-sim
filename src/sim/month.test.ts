import { describe, expect, it } from 'vitest';
import { MONTH_COUNT, monthIndex, monthKey, monthLabel, fromMonthKey } from './month';

describe('the clock', () => {
  it('spans Jan 1996 to Dec 2006 inclusive', () => {
    expect(MONTH_COUNT).toBe(132);
    expect(monthIndex(1996, 1)).toBe(0);
    expect(monthIndex(2006, 12)).toBe(131);
  });

  it('round-trips month keys', () => {
    expect(monthKey(monthIndex(2000, 3))).toBe('2000-03');
    expect(fromMonthKey('2000-03')).toBe(monthIndex(2000, 3));
  });

  it('labels the calibration month', () => {
    expect(monthLabel(monthIndex(2000, 3))).toBe('MARCH 2000');
  });
});
