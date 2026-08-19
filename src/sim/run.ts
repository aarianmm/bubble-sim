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

import type { GameState, RunResult, RunStats, RunFlags, ScriptEvent, Decision, Band, DeathCauseId } from './types';
import { MONTH_COUNT, monthIndex, type MonthIndex } from './month';
import { tick } from './tick';
import { netWorth, investedValue, to1996 } from './selectors';
import { SCAM_VEHICLE_IDS } from '../script/timeline';
import { FACT_SHEETS } from '../content/factsheets';
import { DEATH_LINES } from '../content/deathlines';
import type { VehicleId } from './ids';
import seriesFile from '../data/series.json';
import type { MarketSeriesFile } from '../data/schema';

const SERIES = seriesFile as unknown as MarketSeriesFile;
function seriesRowFor(month: MonthIndex): Record<string, number> {
  return SERIES.rows[month].values as unknown as Record<string, number>;
}

// §9.3 — "what a 0.4% tracker would have charged on the same contributions."
// Fenwick Index Trust's own fee (§9.1) is the reference rate.
const TRACKER_FEE_PCT_PER_MONTH = 0.4 / 100 / 12;

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

/** §15 — bands are decided by survival date ALONE, never by final wealth. */
function bandFor(status: GameState['status'], deathMonth: MonthIndex | null): Band {
  if (status === 'survived' || deathMonth === null) return 'LEGENDARY';
  if (deathMonth < monthIndex(2001, 1)) return 'OUCH';
  if (deathMonth < monthIndex(2003, 1)) return 'OKAY';
  if (deathMonth < monthIndex(2005, 1)) return 'SOLID';
  // §15 names "2005" for IMPRESSIVE and "survived through Dec 2006" for
  // LEGENDARY, leaving a death in 2006 itself unnamed. That's closer to
  // "almost made it" than to any earlier band, so it folds into IMPRESSIVE
  // rather than inventing a sixth band the design doc doesn't have.
  return 'IMPRESSIVE';
}

/**
 * Best-effort classification of what actually killed the run, for the death
 * card's headline (§22.6). Not a scored field (§15: bands are date-only) —
 * secondary, for teaching. 'the-card-ate-you' and 'the-fake-dialog' are
 * unreachable in the MVP build (Step 31/32, both beyond §26.1's boundary).
 */
function causeFor(state: GameState): DeathCauseId {
  if (state.status === 'survived') return 'survived';
  if (state.stats.scamsFunded > 0) return 'funded-a-scam';
  if (state.stats.forcedSales > 0) return 'sold-at-the-bottom';
  if (state.stats.feesPaid > 500) return 'eaten-by-fees';
  if (state.deathMonth !== null && state.deathMonth < monthIndex(2000, 6)) return 'broke-as-bubble-peaked';
  return 'ground-down-by-rent';
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
  const redFlagsMissed = [...new Set(state.stats.scamsFundedIds.flatMap((id) => FACT_SHEETS[id].redFlags))];

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
  const causeId = causeFor({ ...state, stats: finalStats });
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
