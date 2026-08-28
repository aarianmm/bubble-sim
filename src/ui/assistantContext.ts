/**
 * The Comet Assistant's view of the world (PLAN-COMET-ASSISTANT.md §5).
 *
 * §1 of that plan is the one structural principle this file exists to
 * enforce: "the assistant sees only what the player can see." That is not a
 * prompt-engineering aspiration here — it is a data rule, and this is the
 * enforcement point. `buildAssistantContext` is built by EXPLICIT ALLOW-LIST
 * CONSTRUCTION: every field below is named and copied by hand from `state`.
 * Nothing is built by spreading `state` (or any nested object off it) and
 * deleting the forbidden keys afterwards — a delete-list is a promise that
 * can be broken by the next field someone adds upstream; an allow-list
 * physically cannot leak a field nobody typed the name of.
 *
 * Never emitted, by construction (plan §1 / §5):
 *  - `VehicleDef.isScam`, `collapseMonth`, `sellableAfterCollapse`, `tier`
 *  - any `ScriptEvent` (the script itself is never imported here)
 *  - the body of any mail item with `status === 'unread'`
 *  - `PopupItem.imitatesDialog` (only `.title` is read off a popup)
 *  - `stats.scamsFundedIds`, `scamsDodgedIds`, `redFlagsMissed`, `deathCauseId`
 *  - `FactSheet.redFlags` — deriving the flags from the ten visible fields
 *    is the skill the assistant is coaching, so the answer is withheld even
 *    though the fields it's computed from are shown in full.
 *
 * Pure: no DOM, no `Date`, no randomness — same rules as `/sim` (CLAUDE.md
 * rule 2), even though this file lives in `/ui` because it reads chrome
 * route state (`{url, title}`) alongside `GameState`.
 *
 * Mail bodies are read only from `MAIL_MESSAGES` (never `POPUP_MESSAGES`),
 * deliberately mirroring `src/pages/Mail.tsx`'s own lookup exactly — see
 * that file's `MAIL_MESSAGES[openItem.contentId]?.body`. A popup filed into
 * the inbox (`popupToMailItem`, `src/chrome/popupPlacement.ts`) keeps its
 * original `pop.*` contentId, which is not a `MAIL_MESSAGES` key, so an
 * opened filed-popup mail item currently renders with no body on-screen
 * either. Matching that (rather than "fixing" it here with a wider lookup)
 * keeps this file's one job honest: show the assistant exactly what the
 * player's screen shows, bug-for-bug. Worth a `KNOWN-ISSUES.md` entry.
 */
import type { GameState, MailItem, RunFlags } from '../sim/types';
import { MONTHLY_PAY } from '../sim/types';
import { VEHICLE_IDS } from '../sim/ids';
import { monthLabelTitle, DAYS_PER_MONTH, type MonthIndex } from '../sim/month';
import {
  currentAllocation,
  holdingsList,
  investedValue,
  monthSummary,
  netWorth,
  totalFeesPaid,
} from '../sim/selectors';
import { VEHICLES } from '../sim/vehicles';
import { MAIL_MESSAGES } from '../content/messages';

/** Route shape the chrome hands out (`src/chrome/router.tsx`'s `RouterValue`). */
export interface AssistantRoute {
  url: string;
  title: string;
}

export interface AssistantExpenseBreakdown {
  rent: number;
  food: number;
  bills: number;
  transport: number;
  other: number;
}

export interface AssistantHolding {
  /** Display name only (`VehicleDef.name`) — never the `VehicleId`. */
  name: string;
  value: number;
  targetPct: number;
  feesPaid: number;
}

export interface AssistantInboxRow {
  from: string;
  subject: string;
  /** Days remaining, or null for "never" — mirrors the inbox row (§10.2). */
  expiresDays: number | null;
  unread: boolean;
  /** Only present when `unread` is false — the message has been opened. */
  body?: string[];
}

/** The ten §22.4 fact-sheet fields the player can read. `redFlags` and
 * `returnChart` are deliberately excluded — see the file header. */
export interface AssistantFactSheet {
  view: 'offer' | 'factsheet';
  name: string;
  manager: string;
  twelveMonthReturn: string;
  annualFee: string;
  exitFee: string;
  holdings: string;
  launched: string;
  regulatedBy: string;
  minimumReturn: string;
  introducerCommission: string;
}

export interface AssistantContext {
  /** "September 1998" — `monthLabelTitle`. */
  date: string;
  era: RunFlags['era'];
  cash: number;
  monthlyPay: number;
  expenses: {
    total: number;
    breakdown: AssistantExpenseBreakdown;
  };
  holdings: AssistantHolding[];
  portfolio: {
    netWorth: number;
    investedValue: number;
    cashPct: number;
  };
  /** Last 12 entries of `wealthHistory` (may be truncated further, see below). */
  wealthTrend: number[];
  inbox: AssistantInboxRow[];
  popups: { title: string }[];
  /** The address bar is a gameplay element (§17.1) — verbatim, lookalike
   * domain included, exactly what the player sees. */
  page: AssistantRoute;
  /** Present only when `page.url` resolves to a vehicle's offer or fact
   * sheet page. */
  factSheet?: AssistantFactSheet;
  stats: {
    feesPaidToDate: number;
    forcedSales: number;
  };
}

/** Mirrors `src/pages/Mail.tsx`'s private `daysUntilExpiry` exactly (kept as
 * a small duplicate rather than an import so this pure, dependency-light
 * serializer never has to pull in a React page component). */
function daysUntilExpiry(item: MailItem, currentMonth: MonthIndex): number | null {
  if (item.expiresMonth == null) return null;
  const monthsLeft = item.expiresMonth - currentMonth;
  return Math.max(1, monthsLeft * DAYS_PER_MONTH);
}

/** Matches `route.url` against the current vehicle's offer page or fact
 * sheet URL (`src/pages/Offer.tsx`'s own `${url}` / `${url}/factsheet`
 * scheme) and returns only the ten public fact-sheet fields. Exact-match
 * only, same reasoning as `Offer.tsx`'s `resolveOfferUrl` — a lookalike
 * domain the player hasn't actually navigated to can never resolve here. */
function resolveFactSheetContext(url: string): AssistantFactSheet | undefined {
  for (const id of VEHICLE_IDS) {
    if (id === 'cash') continue;
    const vehicle = VEHICLES[id];
    let view: 'offer' | 'factsheet' | null = null;
    if (url === vehicle.url) view = 'offer';
    else if (url === `${vehicle.url}/factsheet`) view = 'factsheet';
    if (!view) continue;

    const sheet = vehicle.factSheet;
    return {
      view,
      name: sheet.name,
      manager: sheet.manager,
      twelveMonthReturn: sheet.twelveMonthReturn,
      annualFee: sheet.annualFee,
      exitFee: sheet.exitFee,
      holdings: sheet.holdings,
      launched: sheet.launched,
      regulatedBy: sheet.regulatedBy,
      minimumReturn: sheet.minimumReturn,
      introducerCommission: sheet.introducerCommission,
    };
  }
  return undefined;
}

const MAX_BYTES = 4096; // plan §5: "capped at ~4 KB of JSON"

function jsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/**
 * Truncates a fully-built context down to the ~4 KB budget, lowest-value
 * content first:
 *
 *  1. Bodies of already-opened mail, **oldest arrival first**. The player
 *     can always re-open a message from the inbox; losing an old body costs
 *     the assistant nothing that bears on what the player is deciding now.
 *  2. `wealthTrend`, **oldest entries first**. A short, recent trend still
 *     answers "am I going up or down"; the far end of a 12-month window is
 *     the least useful part of it to keep under pressure.
 *  3. Whole inbox rows (metadata and all), **oldest arrival first**, only
 *     if a very long-running, heavily-populated inbox still overflows once
 *     (1) and (2) are exhausted. This tier is not in the plan's §5 prose,
 *     which names only (1)-(2); it is added because a late-decade run with
 *     a large, never-deleted inbox can exceed 4 KB on row metadata alone,
 *     before a single body is counted. The current page, portfolio and
 *     fact sheet — what the player is looking at *right now* — are never
 *     touched by any tier; a long-past, already-triaged inbox row is the
 *     lowest-value content left once (1) and (2) are gone.
 *
 * Every tier only ever removes content that was already inside the §1
 * fairness boundary — truncation never reaches for anything on the
 * exclusion list, because that content was never constructed in the first
 * place.
 */
function truncateToBudget(
  context: AssistantContext,
  removableBodyIndexes: number[],
  oldestFirstRows: AssistantInboxRow[],
): AssistantContext {
  const bodyQueue = [...removableBodyIndexes];
  while (jsonByteLength(context) > MAX_BYTES && bodyQueue.length > 0) {
    const index = bodyQueue.shift();
    if (index === undefined) break;
    delete context.inbox[index].body;
  }
  while (jsonByteLength(context) > MAX_BYTES && context.wealthTrend.length > 0) {
    context.wealthTrend.shift();
  }
  const rowQueue = [...oldestFirstRows];
  while (jsonByteLength(context) > MAX_BYTES && rowQueue.length > 0) {
    const row = rowQueue.shift();
    if (!row) break;
    const at = context.inbox.indexOf(row);
    if (at !== -1) context.inbox.splice(at, 1);
  }
  return context;
}

export function buildAssistantContext(state: GameState, route: AssistantRoute): AssistantContext {
  const summary = monthSummary(state);
  const alloc = currentAllocation(state);

  const holdings: AssistantHolding[] = holdingsList(state).map((h) => ({
    name: VEHICLES[h.vehicleId].name,
    value: h.value,
    targetPct: Math.round(alloc.byVehicle[h.vehicleId] ?? 0),
    feesPaid: h.feesPaid,
  }));

  // Visible inbox only (§10.2 — expired/deleted/accepted mail already gone
  // from what the player can see). Bodies attach only to opened mail. Both
  // the body-bearing rows and every row's own arrival month are tracked
  // (oldest first) to drive the truncateToBudget tiers above.
  const removableBodyIndexes: { index: number; arrivedMonth: MonthIndex }[] = [];
  const rowsByAge: { row: AssistantInboxRow; arrivedMonth: MonthIndex }[] = [];
  const inbox: AssistantInboxRow[] = state.inbox
    .filter((m) => m.status === 'unread' || m.status === 'read')
    .map((m, index) => {
      const row: AssistantInboxRow = {
        from: m.from,
        subject: m.subject,
        expiresDays: daysUntilExpiry(m, state.month),
        unread: m.status === 'unread',
      };
      if (m.status !== 'unread') {
        const body = MAIL_MESSAGES[m.contentId]?.body;
        if (body) {
          row.body = body;
          removableBodyIndexes.push({ index, arrivedMonth: m.arrivedMonth });
        }
      }
      rowsByAge.push({ row, arrivedMonth: m.arrivedMonth });
      return row;
    });
  removableBodyIndexes.sort((a, b) => a.arrivedMonth - b.arrivedMonth);
  rowsByAge.sort((a, b) => a.arrivedMonth - b.arrivedMonth);

  const context: AssistantContext = {
    date: monthLabelTitle(state.month),
    era: state.flags.era,
    cash: state.cash,
    monthlyPay: MONTHLY_PAY,
    expenses: {
      total: summary.breakdown.total,
      breakdown: {
        rent: summary.breakdown.rent,
        food: summary.breakdown.food,
        bills: summary.breakdown.bills,
        transport: summary.breakdown.transport,
        other: summary.breakdown.other,
      },
    },
    holdings,
    portfolio: {
      netWorth: netWorth(state),
      investedValue: investedValue(state),
      cashPct: Math.round(alloc.cashPct),
    },
    wealthTrend: state.wealthHistory.slice(-12),
    inbox,
    // Titles only (plan §5 / §1) — never the popup's contentId, vehicleId,
    // or its §20.5 `imitatesDialog` tell.
    popups: state.popups.map((p) => ({ title: p.title })),
    page: { url: route.url, title: route.title },
    factSheet: resolveFactSheetContext(route.url),
    stats: {
      feesPaidToDate: totalFeesPaid(state),
      forcedSales: state.stats.forcedSales,
    },
  };

  return truncateToBudget(
    context,
    removableBodyIndexes.map((r) => r.index),
    rowsByAge.map((r) => r.row),
  );
}
