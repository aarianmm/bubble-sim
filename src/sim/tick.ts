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
  PopupItem,
  ScriptEvent,
  Decision,
  DialogAction,
  RunFlags,
} from './types';
import { MONTHLY_PAY } from './types';
import type { VehicleId } from './ids';
import { expensesFor } from './basket';
import { netWorth } from './selectors';
import { DAYS_PER_MONTH, type MonthIndex } from './month';
import { VEHICLES } from './vehicles';
import { DIALOGS } from '../content/dialogs';
import { MAIL_MESSAGES, POPUP_MESSAGES } from '../content/messages';
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
  let next = state;

  for (const event of monthEvents) {
    if (event.mvpDeferred) continue; // scheduled but inert (§26.1)

    if (event.channel === 'MAIL') {
      const msg = MAIL_MESSAGES[event.contentId];
      const item: MailItem = {
        id: event.id,
        eventId: event.id,
        from: msg?.from ?? '',
        subject: msg?.subject ?? '',
        contentId: event.contentId,
        vehicleId: event.vehicleId,
        cls: event.cls,
        arrivedMonth: state.month,
        expiresMonth: event.expiresDays == null ? null : state.month + Math.ceil(event.expiresDays / DAYS_PER_MONTH),
        status: 'unread',
        amount: event.amount,
      };
      next = { ...next, inbox: [...next.inbox, item] };
    } else if (event.channel === 'POP') {
      const msg = POPUP_MESSAGES[event.contentId];
      const item: PopupItem = {
        id: event.id,
        eventId: event.id,
        title: msg?.subject ?? '',
        contentId: event.contentId,
        vehicleId: event.vehicleId,
        cls: event.cls,
        openedMonth: state.month,
        closesMonth: state.month + Math.ceil(45 / DAYS_PER_MONTH),
        // Deterministic, not random (§25.1) — Step 20's UI is free to derive
        // a richer placement from the month index; the sim doesn't care.
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
      next = { ...next, popups: [...next.popups, item] };
    } else if (event.channel === 'DLG') {
      const copy = DIALOGS[event.contentId];
      const item: DialogItem = {
        id: event.id,
        eventId: event.id,
        title: copy?.title ?? '',
        contentId: event.contentId,
        cls: event.cls,
        raisedMonth: state.month,
        amount: event.amount,
        buttons: copy?.buttons ?? [],
      };
      next = { ...next, dialogs: [...next.dialogs, item] };
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
  return next;
}
