/**
 * The month tick (§7.3, Step 7). Six sub-steps, in order — order matters
 * ("it determines whether a player dies before or after their investments
 * have a chance to save them"). Pure, no React, no DOM, no `Date`, no
 * `Math.random()`.
 *
 * Each sub-step is its own exported function so it can be unit-tested in
 * isolation (Step 7's stated done-condition); `tick()` is just their
 * composition in the §7.3 order.
 *
 * DESIGN NOTES ON TWO PLACES §7.3's PROSE UNDERDETERMINES THE MECHANICS:
 *
 * 1. Windfalls (§8.5) are MAIL events carrying an `amount` but no
 *    `vehicleId` — there's nothing to "accept". The cash lands only when the
 *    player opens that mail (`open-mail`); deleting it (or never opening the
 *    inbox at all) forfeits it, per §22.1's "[ Delete all ]... will also
 *    delete a windfall" and the cash-only calibration story (§8.4): a
 *    cash-only player who never opens the inbox never sees the windfall
 *    cash, which is the whole mechanism that makes March 2000 the death
 *    month instead of some arithmetically-cushioned later date.
 *
 * 2. `[ Pay from cash ]` vs `[ Sell to cover ]` (§12.3) converge to the same
 *    state here: both simply deduct the shock from cash. If cash goes
 *    negative, step 6 (solvency check) performs the actual forced
 *    liquidation, unconditionally, regardless of which button was pressed —
 *    "the trade is forced by the calendar, not by an exit fee" either way.
 *    A player with enough cash never triggers a sale under either button; a
 *    player without enough cash is forced into one under either button. This
 *    keeps the two dialog actions from needing separate liquidation paths
 *    while preserving the §12.3 lesson exactly.
 */

import type {
  GameState,
  Holding,
  DialogItem,
  MailItem,
  ScriptEvent,
  Decision,
  DialogAction,
  RunFlags,
} from './types';
import { MONTHLY_PAY } from './types';
import type { VehicleId } from './ids';
import { expensesFor } from './basket';
import { netWorth, investedValue, TRACKER_FEE_PCT_PER_MONTH } from './selectors';
import type { MonthIndex } from './month';
import { VEHICLES } from './vehicles';
import { DIALOGS } from '../content/dialogs';
import { POPUP_MESSAGES } from '../content/messages';
import { materializeMail, materializePopups, materializeDialog, sweepExpired, MAX_CONCURRENT_POPUPS } from './scheduler';
import seriesFile from '../data/series.json';
import type { MarketSeriesFile } from '../data/schema';

const SERIES = seriesFile as unknown as MarketSeriesFile;

/** Row-index-aligned with `MonthIndex` — see `src/data/schema.ts`. */
function seriesRowFor(month: MonthIndex): Record<string, number> {
  return SERIES.rows[month].values as unknown as Record<string, number>;
}

/* ------------------------------------------------------------------ *
 * 1. Pay in (§7.3.1)
 * ------------------------------------------------------------------ */

export function payIn(state: GameState): GameState {
  if (state.flags.incomeSuspendedMonths > 0) {
    return {
      ...state,
      flags: { ...state.flags, incomeSuspendedMonths: state.flags.incomeSuspendedMonths - 1 },
    };
  }
  return { ...state, cash: state.cash + MONTHLY_PAY };
}

/* ------------------------------------------------------------------ *
 * 2. Expenses out (§7.3.2, §8.1-8.3)
 * ------------------------------------------------------------------ */

export function expensesOut(state: GameState): GameState {
  return { ...state, cash: state.cash - expensesFor(state.month).total };
}

/* ------------------------------------------------------------------ *
 * 3. Market moves (§7.3.3, §11.4 collapse)
 * ------------------------------------------------------------------ */

export function marketMove(state: GameState): GameState {
  const row = seriesRowFor(state.month);
  const holdings = { ...state.holdings };
  for (const id of state.unlocked) {
    const h = holdings[id];
    if (!h) continue;
    const vehicle = VEHICLES[id];
    const multiplier = row[vehicle.seriesColumn];
    if (typeof multiplier !== 'number') continue; // cash / the card aren't priced from series.json
    // §11.4/§11.5: series.json already carries 0 in a vehicle's collapse
    // month and 1 thereafter, so multiplying is the whole mechanism — a
    // collapsed vehicle simply stays at whatever's left, permanently.
    const collapsed = h.collapsed || (vehicle.collapseMonth !== null && state.month >= vehicle.collapseMonth);
    holdings[id] = { ...h, value: h.value * multiplier, collapsed };
  }
  return { ...state, holdings };
}

/* ------------------------------------------------------------------ *
 * 4. Interest and fees (§7.3.4, §9.3, §13)
 * ------------------------------------------------------------------ */

export function interestAndFees(state: GameState): GameState {
  const row = seriesRowFor(state.month);
  const holdings = { ...state.holdings };
  let feesThisMonth = 0;

  for (const id of state.unlocked) {
    const h = holdings[id];
    if (!h || h.value <= 0) continue;
    const vehicle = VEHICLES[id];
    let fee = 0;
    if (vehicle.annualFeePct > 0) {
      fee += h.value * (vehicle.annualFeePct / 100 / 12);
    }
    if (vehicle.performanceFeePct > 0) {
      // §9.1 Ashcombe: "20% of gains." Gains are this month's market move —
      // reconstructed from the same multiplier step 3 just applied.
      const multiplier = row[vehicle.seriesColumn];
      if (typeof multiplier === 'number' && multiplier > 1) {
        const preMoveValue = h.value / multiplier;
        fee += (h.value - preMoveValue) * (vehicle.performanceFeePct / 100);
      }
    }
    if (fee > 0) {
      holdings[id] = { ...h, value: h.value - fee, feesPaid: h.feesPaid + fee };
      feesThisMonth += fee;
    }
  }

  // §13 debt interest — the seam for Step 31. No card is ever unlocked in
  // the MVP (§26.1), so `state.debt` is always null in a Step 9 run; this
  // exists so a later step can wire the card in without touching tick.ts.
  let debt = state.debt;
  if (debt && debt.balance > 0 && state.month >= debt.promoEndsMonth) {
    const interest = debt.balance * (debt.aprPct / 100 / 12);
    debt = { ...debt, balance: debt.balance + interest, interestPaid: debt.interestPaid + interest };
  }

  // Cash interest: the default vehicle pays 0% (§9.1) — no-op, but the
  // sub-step exists explicitly so this fact is a decision, not an omission.

  return {
    ...state,
    holdings,
    debt,
    stats: { ...state.stats, feesPaid: state.stats.feesPaid + feesThisMonth },
  };
}

/* ------------------------------------------------------------------ *
 * 5. Scheduled events fire (§7.3.5) — the seam for Step 24's UI scheduler.
 * ------------------------------------------------------------------ */

function defaultActionFor(dialog: DialogItem): DialogAction {
  const copy = DIALOGS[dialog.contentId];
  const button = copy?.buttons.find((b) => b.isDefault) ?? copy?.buttons[0];
  return button?.action ?? 'acknowledge';
}

function resolveDialog(state: GameState, dialog: DialogItem, action: DialogAction): GameState {
  if (action === 'pay-from-cash' || action === 'sell-to-cover') {
    // See the file header: both converge on "deduct from cash," and step 6
    // is the sole forced-liquidation path if that leaves cash short.
    return typeof dialog.amount === 'number' ? { ...state, cash: state.cash - dialog.amount } : state;
  }
  if (action === 'use-the-card') {
    if (state.debt && typeof dialog.amount === 'number') {
      const draw = Math.min(dialog.amount, Math.max(0, state.debt.limit - state.debt.balance));
      return {
        ...state,
        cash: state.cash + draw - dialog.amount,
        debt: { ...state.debt, balance: state.debt.balance + draw },
      };
    }
    // No card unlocked (MVP boundary, §26.1) — falls back to cash.
    return typeof dialog.amount === 'number' ? { ...state, cash: state.cash - dialog.amount } : state;
  }
  if (action === 'restart') return state; // the caller starts a fresh run
  // 'acknowledge'
  let next = state;
  if (dialog.cls === 'era-switch') next = { ...next, flags: { ...next.flags, era: 'b' } };
  if (dialog.cls === 'win') next = { ...next, status: 'survived' };
  return next;
}

function unlockVehicle(state: GameState, vehicleId: VehicleId): GameState {
  if (state.unlocked.includes(vehicleId)) return state;
  const holding: Holding = {
    vehicleId,
    value: 0,
    contributed: 0,
    withdrawn: 0,
    feesPaid: 0,
    targetPct: 0,
    locked: false,
    unlockedMonth: state.month,
    collapsed: false,
  };
  return {
    ...state,
    unlocked: [...state.unlocked, vehicleId],
    holdings: { ...state.holdings, [vehicleId]: holding },
  };
}

function applyDecision(state: GameState, decision: Decision): GameState {
  switch (decision.type) {
    case 'open-mail': {
      const item = state.inbox.find((m) => m.id === decision.mailId);
      let next: GameState = { ...state, flags: { ...state.flags, everOpenedInbox: true } };
      if (!item) return next;
      next = { ...next, inbox: next.inbox.map((m) => (m.id === item.id ? { ...m, status: 'read' } : m)) };
      // §8.5 — windfall cash lands only when the mail carrying it is opened.
      if (item.cls === 'windfall' && item.status === 'unread') {
        next = { ...next, cash: next.cash + (item.amount ?? 0) };
      }
      return next;
    }

    case 'delete-mail':
      return { ...state, inbox: state.inbox.map((m) => (m.id === decision.mailId ? { ...m, status: 'deleted' } : m)) };

    case 'delete-all-mail':
      return {
        ...state,
        inbox: state.inbox.map((m) => (m.status === 'unread' || m.status === 'read' ? { ...m, status: 'deleted' } : m)),
      };

    case 'open-fact-sheet':
      return { ...state, flags: { ...state.flags, everOpenedFactSheet: true } };

    case 'close-popup':
      return { ...state, popups: state.popups.filter((p) => p.id !== decision.popupId) };

    case 'file-popup-as-mail': {
      // §10 rule 3 / §20.2 — clicking a popup's CTA never loses it: a copy
      // is filed in the inbox (unread, never expiring — mirrors
      // chrome/popupPlacement.ts's popupToMailItem exactly) and the popup
      // itself closes, same as the main window navigating away from it.
      const popup = decision.popup;
      if (state.inbox.some((item) => item.id === `${popup.id}.filed`)) return state;
      const msg = POPUP_MESSAGES[popup.contentId];
      const filed: MailItem = {
        id: `${popup.id}.filed`,
        eventId: popup.eventId,
        from: msg?.from ?? '',
        subject: popup.title,
        contentId: popup.contentId,
        vehicleId: popup.vehicleId,
        cls: popup.cls,
        arrivedMonth: state.month,
        expiresMonth: null,
        status: 'unread',
      };
      return {
        ...state,
        inbox: [...state.inbox, filed],
        popups: state.popups.filter((p) => p.id !== popup.id),
      };
    }

    case 'decline-offer':
      return {
        ...state,
        inbox: state.inbox.map((m) => (m.vehicleId === decision.vehicleId ? { ...m, status: 'deleted' } : m)),
        popups: state.popups.filter((p) => p.vehicleId !== decision.vehicleId),
      };

    case 'accept-offer': {
      const vehicle = VEHICLES[decision.vehicleId];
      let next = unlockVehicle(state, decision.vehicleId);
      // §11.1 — the setup/admin fee, charged immediately, whether or not the
      // player ever funds it. 0 for every legit/mediocre vehicle (§9.1).
      if (vehicle.acceptFee > 0) next = { ...next, cash: next.cash - vehicle.acceptFee };
      if (vehicle.isScam) next = { ...next, flags: { ...next.flags, onScamList: true } };
      next = {
        ...next,
        inbox: next.inbox.map((m) => (m.vehicleId === decision.vehicleId ? { ...m, status: 'accepted' } : m)),
        popups: next.popups.filter((p) => p.vehicleId !== decision.vehicleId),
      };
      return next;
    }

    case 'rebalance': {
      const total = netWorth(state);
      if (total <= 0) return state;
      let next = state;

      // Pass 1 — sells first, so pass 2's buys never dip cash negative.
      for (const id of next.unlocked) {
        const h = next.holdings[id];
        if (!h) continue;
        const vehicle = VEHICLES[id];
        const targetPct = decision.targets[id] ?? 0;
        const targetValue = total * (targetPct / 100);
        const diff = targetValue - h.value;
        if (diff < -0.005) {
          const unsellable = h.collapsed && !vehicle.sellableAfterCollapse; // §11.5 Vertex
          const sellAmount = unsellable ? 0 : Math.min(h.value, -diff);
          if (sellAmount > 0) {
            const exitFee = sellAmount * (vehicle.exitFeePct / 100);
            next = {
              ...next,
              cash: next.cash + (sellAmount - exitFee),
              holdings: {
                ...next.holdings,
                [id]: { ...h, targetPct, value: h.value - sellAmount, withdrawn: h.withdrawn + sellAmount, feesPaid: h.feesPaid + exitFee },
              },
              stats: { ...next.stats, feesPaid: next.stats.feesPaid + exitFee },
            };
            continue;
          }
        }
        next = { ...next, holdings: { ...next.holdings, [id]: { ...h, targetPct } } };
      }

      // Pass 2 — buys, funded by whatever cash pass 1 raised.
      for (const id of next.unlocked) {
        const h = next.holdings[id];
        if (!h) continue;
        const vehicle = VEHICLES[id];
        const targetValue = total * (h.targetPct / 100);
        const diff = targetValue - h.value;
        if (diff > 0.005) {
          const buyAmount = Math.min(diff, Math.max(0, next.cash));
          if (buyAmount > 0) {
            const wasFunded = h.contributed > 0;
            next = {
              ...next,
              cash: next.cash - buyAmount,
              holdings: { ...next.holdings, [id]: { ...h, value: h.value + buyAmount, contributed: h.contributed + buyAmount } },
            };
            if (!wasFunded && vehicle.isScam) {
              next = {
                ...next,
                stats: {
                  ...next.stats,
                  scamsFunded: next.stats.scamsFunded + 1,
                  scamsFundedIds: [...next.stats.scamsFundedIds, id],
                },
              };
            }
          }
        }
      }
      return next;
    }

    case 'resolve-dialog': {
      const dialog = state.dialogs.find((d) => d.id === decision.dialogId);
      if (!dialog) return state;
      const next = resolveDialog(state, dialog, decision.action);
      return { ...next, dialogs: next.dialogs.filter((d) => d.id !== decision.dialogId) };
    }

    case 'toggle-money-base':
      return { ...state, flags: { ...state.flags, moneyBase: state.flags.moneyBase === 'period' ? '1996' : 'period' } };

    case 'navigate':
    case 'set-time-rate':
      return state; // chrome-only; no sim effect

    default:
      return state;
  }
}

export function fireScheduledEvents(state: GameState, monthEvents: ScriptEvent[], monthDecisions: Decision[]): GameState {
  // §10.2 / §20.2 — expiry is real: a message or popup past its own
  // expiresMonth/closesMonth disappears silently before anything new for
  // this month is even materialized.
  const swept = sweepExpired(state.inbox, state.popups, state.month);
  let next: GameState = { ...state, inbox: swept.inbox, popups: swept.popups };

  for (const event of monthEvents) {
    // §26.1's MVP boundary is explicit about how the two mvpDeferred credit
    // offers and the mvpDeferred Apr 2003 fake-dialog scam behave: "deliver
    // them as ordinary mail that cannot be funded" / "deliver it as an
    // ordinary loud popup" — i.e. they materialize exactly like any other
    // event; only the DEFERRED MECHANIC is missing (there is no `state.debt`
    // creation path anywhere in this file, so "accepting" the card can
    // never actually unlock a working credit facility — `use-the-card`
    // below falls back to cash precisely because `state.debt` stays null
    // forever; the fake-dialog behaviour (§20.5) simply isn't built, so the
    // popup just reads as an ordinary loud one). Nothing here is skipped.

    if (event.channel === 'MAIL') {
      next = { ...next, inbox: [...next.inbox, materializeMail(event, state.month)] };
    } else if (event.channel === 'POP') {
      // §20.2: never more than three. Offers outrank lightweight junk;
      // within a tier newer popups win, with stable source order breaking
      // ties. This prevents stale junk from evicting a current offer while
      // keeping the result entirely authored and deterministic.
      let popups = [...next.popups, ...materializePopups(event, state.month)];
      if (popups.length > MAX_CONCURRENT_POPUPS) {
        const ranked = popups
          .map((popup, index) => ({ popup, index }))
          .sort((a, b) => {
            const importance = Number(b.popup.cls !== 'junk') - Number(a.popup.cls !== 'junk');
            if (importance !== 0) return importance;
            const recency = b.popup.openedMonth - a.popup.openedMonth;
            if (recency !== 0) return recency;
            return a.index - b.index;
          })
          .slice(0, MAX_CONCURRENT_POPUPS)
          .sort((a, b) => a.index - b.index);
        popups = ranked.map(({ popup }) => popup);
      }
      next = { ...next, popups };
    } else if (event.channel === 'DLG') {
      next = { ...next, dialogs: [...next.dialogs, materializeDialog(event, state.month)] };
    }

    // Job loss is involuntary — nobody "accepts" it (§14.1: "the big one").
    if (event.cls === 'job-loss' && event.incomeLostMonths) {
      const flags: RunFlags = { ...next.flags, incomeSuspendedMonths: event.incomeLostMonths };
      next = { ...next, flags };
    }
  }

  for (const decision of monthDecisions) {
    next = applyDecision(next, decision);
  }

  // Nobody left to click in a headless run — resolve whatever's still open
  // (this month's, or an earlier month's carried-over dialog) with its
  // scripted default (§20.1 `isDefault`).
  if (next.dialogs.length > 0) {
    for (const dialog of next.dialogs) {
      next = resolveDialog(next, dialog, defaultActionFor(dialog));
    }
    next = { ...next, dialogs: [] };
  }

  return next;
}

/* ------------------------------------------------------------------ *
 * 6. Solvency check (§7.3.6, §12.3)
 * ------------------------------------------------------------------ */

function liquidate(state: GameState, shortfall: number): GameState {
  let next = state;
  let remaining = shortfall;
  let sold = false;

  for (const id of next.unlocked) {
    if (remaining <= 0) break;
    const h = next.holdings[id];
    if (!h || h.value <= 0) continue;
    const vehicle = VEHICLES[id];
    if (h.collapsed && !vehicle.sellableAfterCollapse) continue; // §11.5 Vertex
    const grossNeeded = remaining / (1 - vehicle.exitFeePct / 100);
    const sellAmount = Math.min(h.value, grossNeeded);
    if (sellAmount <= 0) continue;
    const exitFee = sellAmount * (vehicle.exitFeePct / 100);
    const proceeds = sellAmount - exitFee;
    next = {
      ...next,
      cash: next.cash + proceeds,
      holdings: {
        ...next.holdings,
        [id]: { ...h, value: h.value - sellAmount, withdrawn: h.withdrawn + sellAmount, feesPaid: h.feesPaid + exitFee },
      },
      stats: { ...next.stats, feesPaid: next.stats.feesPaid + exitFee },
    };
    remaining -= proceeds;
    sold = true;
  }

  if (sold) next = { ...next, stats: { ...next.stats, forcedSales: next.stats.forcedSales + 1 } };
  return next;
}

export function solvencyCheck(state: GameState): GameState {
  if (state.cash >= 0 || state.status !== 'running') return state;
  const next = liquidate(state, -state.cash);
  if (next.cash < 0) {
    // §13/§26.1 — no card is ever unlocked in the MVP, so there is never
    // credit here; this is the seam Step 31 fills in.
    const hasCredit = next.debt !== null && next.debt.balance < next.debt.limit;
    if (!hasCredit) {
      return { ...next, status: 'dead', deathMonth: next.month };
    }
  }
  return next;
}

/* ------------------------------------------------------------------ *
 * The tick (§7.3) — composition, in order. Order matters.
 * ------------------------------------------------------------------ */

export function tick(state: GameState, monthEvents: ScriptEvent[], monthDecisions: Decision[]): GameState {
  if (state.status !== 'running') return state;
  let next = payIn(state);
  next = expensesOut(next);
  next = marketMove(next);
  next = interestAndFees(next);
  next = fireScheduledEvents(next, monthEvents, monthDecisions);
  next = solvencyCheck(next);
  // §9.3's death-card fee line ("the tracker would have charged you £X") reads
  // `state.stats.trackerCounterfactualFees`. sim/run.ts's headless aggregator
  // has always accumulated this itself, outside tick() — fine for a
  // headless run, but the live engine (ui/EngineProvider.tsx) has no
  // equivalent loop and calls tick() directly, so on a live run this stat
  // stayed 0 forever and the line quietly read "£0". Accumulating it here,
  // once per tick, off the fully-settled post-tick state (same formula, same
  // point in the month as run.ts's own `investedValue(state)` call), fixes
  // the live path and leaves run.ts's identical separately-computed total to
  // simply overwrite this with the same number, so neither path can drift.
  next = {
    ...next,
    stats: {
      ...next.stats,
      trackerCounterfactualFees: next.stats.trackerCounterfactualFees + investedValue(next) * TRACKER_FEE_PCT_PER_MONTH,
    },
  };
  return next;
}
