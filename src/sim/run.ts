/**
 * The headless runner (§7.3, §25.2, Step 8). `run(script, decisions)` plays
 * the whole decade in one call: no React, no wall clock, no interaction.
 * §25.2's determinism contract is what makes this possible — a run is fully
 * described by `(script, decisions)`, so the same two arguments always
 * produce the same `RunResult`, on any machine.
 *
 * This is what Step 9's verification suite calls, six times, with six
 * hardcoded decision lists.
 */

import type { GameState, RunResult, RunStats, RunFlags, ScriptEvent, Decision } from './types';
import { MONTH_COUNT, type MonthIndex } from './month';
import { tick } from './tick';
import { netWorth, investedValue, to1996, TRACKER_FEE_PCT_PER_MONTH } from './selectors';
import { SCAM_VEHICLE_IDS } from '../script/timeline';
import { DEATH_LINES } from '../content/deathlines';
import { bandFor, causeIdFor, missedRedFlags } from './bands';
import type { VehicleId } from './ids';
import seriesFile from '../data/series.json';
import type { MarketSeriesFile } from '../data/schema';

const SERIES = seriesFile as unknown as MarketSeriesFile;
function seriesRowFor(month: MonthIndex): Record<string, number> {
  return SERIES.rows[month].values as unknown as Record<string, number>;
}

function groupByMonth<T extends { month: MonthIndex }>(items: readonly T[]): Map<MonthIndex, T[]> {
  const map = new Map<MonthIndex, T[]>();
  for (const item of items) {
    const list = map.get(item.month) ?? [];
    list.push(item);
    map.set(item.month, list);
  }
  return map;
}

function initialState(): GameState {
  const flags: RunFlags = {
    onScamList: false,
    incomeSuspendedMonths: 0,
    era: 'a',
    moneyBase: 'period',
    everOpenedInbox: false,
    everOpenedFactSheet: false,
  };
  const stats: RunStats = {
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
  };
  return {
    month: 0,
    status: 'running',
    cash: 0,
    holdings: {},
    unlocked: [],
    debt: null,
    inbox: [],
    popups: [],
    dialogs: [],
    flags,
    stats,
    wealthHistory: [],
    marketHistory: [],
    deathMonth: null,
    deathCauseId: null,
    decisions: [],
  };
}

export function run(script: readonly ScriptEvent[], decisions: readonly Decision[]): RunResult {
  const eventsByMonth = groupByMonth(script);
  const decisionsByMonth = groupByMonth(decisions);

  let state = initialState();
  let peakWealth = 0;
  let peakWealth1996 = 0;
  let monthsUnderwater = 0;
  let trackerCounterfactualFees = 0;
  let marketIndex = 100;
  const wealthHistory: number[] = [];
  const marketHistory: number[] = [];

  for (let m = 0; m < MONTH_COUNT; m++) {
    state = { ...state, month: m };
    const monthEvents = eventsByMonth.get(m) ?? [];
    const monthDecisions = decisionsByMonth.get(m) ?? [];
    state = tick(state, monthEvents, monthDecisions);
    // §25.2 — the ordered, timestamped decision log a replay is built from.
    if (monthDecisions.length > 0) state = { ...state, decisions: [...state.decisions, ...monthDecisions] };

    const worth = netWorth(state);
    wealthHistory.push(worth);
    marketIndex *= seriesRowFor(m)['idx-ftse-all-share'] ?? 1;
    marketHistory.push(marketIndex);

    if (worth > peakWealth) peakWealth = worth;
    const worth1996 = to1996(worth, m);
    if (worth1996 > peakWealth1996) peakWealth1996 = worth1996;
    if (worth < 0) monthsUnderwater += 1;
    trackerCounterfactualFees += investedValue(state) * TRACKER_FEE_PCT_PER_MONTH;

    if (state.status !== 'running') break;
  }

  if (state.status === 'running') state = { ...state, status: 'survived' };

  const scamsFundedSet = new Set(state.stats.scamsFundedIds);
  const scamsDodgedIds = ([...SCAM_VEHICLE_IDS] as VehicleId[]).filter((id) => !scamsFundedSet.has(id));
  const redFlagsMissed = missedRedFlags(state.stats.scamsFundedIds);

  const finalStats: RunStats = {
    ...state.stats,
    peakWealth,
    peakWealth1996,
    finalWealth: netWorth(state),
    trackerCounterfactualFees,
    monthsUnderwater,
    scamsDodged: scamsDodgedIds.length,
    scamsDodgedIds,
    redFlagsMissed,
  };

  const band = bandFor(state.status, state.deathMonth);
  const causeId = causeIdFor(state.status, state.deathMonth, finalStats);
  const lines = DEATH_LINES[causeId];

  return {
    status: state.status,
    deathMonth: state.deathMonth,
    band,
    causeId,
    causeLine: lines.headline,
    detailLine: lines.detail,
    stats: finalStats,
    wealthHistory,
    marketHistory,
  };
}
