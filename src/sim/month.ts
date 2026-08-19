/**
 * The clock. Month 0 is January 1996; month 131 is December 2006.
 * §25.1: no `Date.now()`, no wall clock, no randomness — the calendar is arithmetic.
 */

export const START_YEAR = 1996;
export const END_YEAR = 2006;
export const MONTH_COUNT = 132; // Jan 1996 .. Dec 2006 inclusive

/** 0 = Jan 1996 … 131 = Dec 2006 */
export type MonthIndex = number;

/** "1996-01" — the canonical key used in /script and /data. */
export type MonthKey = string;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function monthIndex(year: number, month1to12: number): MonthIndex {
  return (year - START_YEAR) * 12 + (month1to12 - 1);
}

export function yearOf(m: MonthIndex): number {
  return START_YEAR + Math.floor(m / 12);
}

/** 1..12 */
export function monthOfYear(m: MonthIndex): number {
  return (m % 12) + 1;
}

/** "1996-01" */
export function monthKey(m: MonthIndex): MonthKey {
  return `${yearOf(m)}-${String(monthOfYear(m)).padStart(2, '0')}`;
}

export function fromMonthKey(key: MonthKey): MonthIndex {
  const [y, mo] = key.split('-');
  return monthIndex(Number(y), Number(mo));
}

/** "SEPTEMBER 1998" — the left-nav and page-header form. */
export function monthLabel(m: MonthIndex): string {
  return `${MONTH_NAMES[monthOfYear(m) - 1].toUpperCase()} ${yearOf(m)}`;
}

/** "Sep 1998" — the compact form for tables and fact sheets. */
export function monthLabelShort(m: MonthIndex): string {
  return `${MONTH_ABBR[monthOfYear(m) - 1]} ${yearOf(m)}`;
}

/** "March 2000" — the death-card form. */
export function monthLabelTitle(m: MonthIndex): string {
  return `${MONTH_NAMES[monthOfYear(m) - 1]} ${yearOf(m)}`;
}

export function isValidMonth(m: MonthIndex): boolean {
  return Number.isInteger(m) && m >= 0 && m < MONTH_COUNT;
}

/** 30-day simulated months. Expiries in /script are expressed in days. */
export const DAYS_PER_MONTH = 30;
