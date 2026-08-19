/**
 * PROVISIONAL pure cash/clock model for src/ui/EngineProvider.tsx. No
 * React, no `Date`, no randomness (§25.1) — kept pure on purpose so Step 24
 * can lift it straight into /sim once the real scheduler lands, per this
 * step's brief ("anything that could be a pure function belongs in a pure
 * helper, because Step 24 will lift it into /sim").
 *
 * Deliberately ignorant of holdings, events, scams and the market (Steps
 * 7-9 and 24 own those) — it models exactly the cash-only path the rest of
 * the simulation is calibrated against (§6, §8.4: cash-only dies March
 * 2000), which is also why it's a reasonable stand-in until the real tick
 * lands: every number it produces is a real basket number, not a guess.
 */
import { MONTHLY_PAY, type GameState } from '../sim/types';
import { expensesFor } from '../sim/basket';
import { MONTH_COUNT, type MonthIndex } from '../sim/month';

export function createInitialState(): GameState {
  return {
    month: 0,
    status: 'running',
    cash: 0, // §8.1 — starting cash is £0
    holdings: {},
    unlocked: [],
    debt: null,
    inbox: [],
    popups: [],
    dialogs: [],
    flags: {
      onScamList: false,
      incomeSuspendedMonths: 0,
      era: 'a',
      moneyBase: 'period',
      everOpenedInbox: false,
      everOpenedFactSheet: false,
    },
    stats: {
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
    },
    wealthHistory: [0],
    marketHistory: [0],
    deathMonth: null,
    deathCauseId: null,
    decisions: [],
  };
}

/** One month forward: pay in, the real basket out (§7.3 steps 1-4, minus
 * the interest/fee/event machinery Steps 7-9 own). Safe to call on every
 * animation frame without checking status first — it no-ops once the run
 * has ended or the decade is over. */
export function tickOneMonth(state: GameState): GameState {
  if (state.status !== 'running' || state.month >= MONTH_COUNT - 1) {
    return state;
  }
  const month: MonthIndex = state.month + 1;
  const cash = state.cash + MONTHLY_PAY - expensesFor(month).total;
  const wealthHistory = [...state.wealthHistory, cash];
  const dead = cash < 0;
  const survived = !dead && month >= MONTH_COUNT - 1;
  return {
    ...state,
    month,
    cash,
    wealthHistory,
    status: dead ? 'dead' : survived ? 'survived' : 'running',
    deathMonth: dead ? month : state.deathMonth,
    deathCauseId: dead ? 'ground-down-by-rent' : state.deathCauseId,
  };
}

/**
 * Teleport to `month` from a cold start (§25.4 "jump to date"). Recomputed
 * from month 0 every time, rather than iterated from the current state, so
 * jumping is idempotent and can move backward as well as forward — landing
 * on the same date twice must produce exactly the same numbers (§19.3).
 *
 * Once the running cash total would first go negative, the walk stops
 * accumulating (the run would already be over) and every later month
 * repeats that balance, rather than compounding a decade that a real run
 * would never have reached (§12.3).
 */
export function computeStateAtMonth(base: GameState, month: MonthIndex): GameState {
  const wealthHistory: number[] = [0];
  let cash = 0;
  let deathMonth: MonthIndex | null = null;
  for (let m = 1; m <= month; m++) {
    if (deathMonth === null) {
      cash += MONTHLY_PAY - expensesFor(m).total;
      if (cash < 0) deathMonth = m;
    }
    wealthHistory.push(cash);
  }
  const survived = deathMonth === null && month >= MONTH_COUNT - 1;
  return {
    ...base,
    month,
    cash,
    wealthHistory,
    status: deathMonth !== null ? 'dead' : survived ? 'survived' : 'running',
    deathMonth,
    deathCauseId: deathMonth !== null ? 'ground-down-by-rent' : null,
  };
}
