/**
 * Derived reads over GameState. Pure, React-free, no allocation of new state.
 *
 * Everything the pages want to display but should not compute themselves lives
 * here, so /home, /money and the death card cannot disagree about what "net
 * worth" means.
 */

import type { GameState, BasketBreakdown, VehicleId } from './types';
import { MONTHLY_PAY } from './types';
import { expensesFor, deflatorTo1996 } from './basket';
import type { MonthIndex } from './month';
import { monthIndex, yearOf } from './month';

/** Cash plus every holding, less debt. The headline figure on /home. */
export function netWorth(state: GameState): number {
  let total = state.cash;
  for (const id of state.unlocked) {
    const h = state.holdings[id];
    if (h) total += h.value;
  }
  if (state.debt) total -= state.debt.balance;
  return total;
}

/** Invested value only — excludes cash. */
export function investedValue(state: GameState): number {
  let total = 0;
  for (const id of state.unlocked) {
    const h = state.holdings[id];
    if (h) total += h.value;
  }
  return total;
}

// §9.3 — "what a 0.4% tracker would have charged on the same contributions."
// Fenwick Index Trust's own fee (§9.1) is the reference rate. Shared between
// sim/run.ts (the headless aggregator) and sim/tick.ts (the live engine's
// per-month accumulation) so both agree bit for bit (§25.2).
export const TRACKER_FEE_PCT_PER_MONTH = 0.4 / 100 / 12;

/** §19.4 — the same figure in 1996 purchasing power. */
export function to1996(amount: number, month: MonthIndex): number {
  return amount * deflatorTo1996(month);
}

export interface MonthSummary {
  payIn: number;
  out: number;
  leftOver: number;
  /** Last January's surplus, for the "was £115" line on /home (§22.1). */
  wasLeftOver: number;
  breakdown: BasketBreakdown;
  /** True during the Nov 1999 job loss (§14.1). */
  incomeSuspended: boolean;
}

export function monthSummary(state: GameState): MonthSummary {
  const breakdown = expensesFor(state.month);
  const incomeSuspended = state.flags.incomeSuspendedMonths > 0;
  const payIn = incomeSuspended ? 0 : MONTHLY_PAY;
  const firstYear = monthIndex(yearOf(state.month), 1);
  const prevYearFirst = Math.max(0, firstYear - 12);
  return {
    payIn,
    out: breakdown.total,
    leftOver: payIn - breakdown.total,
    wasLeftOver: MONTHLY_PAY - expensesFor(prevYearFirst).total,
    breakdown,
    incomeSuspended,
  };
}

export function unreadCount(state: GameState): number {
  return state.inbox.filter((m) => m.status === 'unread').length;
}

export function visibleInbox(state: GameState) {
  return state.inbox.filter((m) => m.status === 'unread' || m.status === 'read');
}

export function holdingsList(state: GameState) {
  return state.unlocked
    .map((id) => state.holdings[id])
    .filter((h): h is NonNullable<typeof h> => Boolean(h));
}

/** Total fees paid across every vehicle — the §9.3 death-card line. */
export function totalFeesPaid(state: GameState): number {
  return holdingsList(state).reduce((sum, h) => sum + h.feesPaid, 0);
}

/** Current allocation as percentages of net worth, cash included. */
export function currentAllocation(state: GameState): { cashPct: number; byVehicle: Partial<Record<VehicleId, number>> } {
  const total = netWorth(state);
  if (total <= 0) return { cashPct: 100, byVehicle: {} };
  const byVehicle: Partial<Record<VehicleId, number>> = {};
  for (const h of holdingsList(state)) {
    byVehicle[h.vehicleId] = (h.value / total) * 100;
  }
  return { cashPct: (state.cash / total) * 100, byVehicle };
}
