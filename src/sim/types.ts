/**
 * BUBBLE — the shared type contract (Step 2).
 *
 * Everything in /sim, /script, /content, /chrome, /pages and /ui codes against
 * this file. It holds no logic. All money is GBP, expressed as a plain `number`
 * of pounds; rounding happens at the display edge, never in the sim.
 *
 * §25.1 hard rule: the simulation is pure, headless and React-free. No DOM,
 * no Date.now(), no randomness.
 */

import type { MonthIndex } from './month';
import type { ContentId, EventId, VehicleId } from './ids';

export type { MonthIndex } from './month';
export type { ContentId, EventId, VehicleId, InvestableVehicleId } from './ids';

/* ------------------------------------------------------------------ *
 * Vehicles (§9.1)
 * ------------------------------------------------------------------ */

export type VehicleTier =
  | 'default'
  | 'safe'
  | 'correct'
  | 'reasonable'
  | 'mediocre'
  | 'concentrated'
  | 'fatal'
  | 'negative';

/** §21 — the visual band of the vehicle's website. A hint, never a verdict. */
export type SiteStyle = 'loud' | 'plain' | 'slick';

export interface VehicleDef {
  id: VehicleId;
  /** Fund name as it appears on the fact sheet. Invented (§5.1). */
  name: string;
  /** Fictional manager / provider. */
  manager: string;
  tier: VehicleTier;
  /** Column in /data/series.json carrying this vehicle's monthly multiplier. */
  seriesColumn: string;
  /** Annual management fee, percent. Deducted pro-rata monthly (§9.3). */
  annualFeePct: number;
  /** Charged on sale, percent. */
  exitFeePct: number;
  /** §9.1 "managed portfolio": 20% of gains. 0 for everything else. */
  performanceFeePct: number;
  /** True for the six §11.5 scams. */
  isScam: boolean;
  /** One-off admin/setup fee charged the moment the player accepts (§11.1). */
  acceptFee: number;
  /** Month the vehicle's value goes to zero, or is marked unsellable. */
  collapseMonth: MonthIndex | null;
  /** After collapse: can the player still sell what is left? (The pump cannot.) */
  sellableAfterCollapse: boolean;
  /** Style band of the offer page (§21). */
  siteStyle: SiteStyle;
  /** URL shown in the address bar. Lookalike domains are a mechanic (§17.1). */
  url: string;
  factSheet: FactSheet;
}

/* ------------------------------------------------------------------ *
 * The fact sheet (§22.4) — ten fields, identical on every vehicle.
 * "Empty is never blank, it is `— none —`."
 * ------------------------------------------------------------------ */

export const NONE = '— none —';

export interface FactSheet {
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
  /** Sparkline for the 12-month return row. Ponzi = no down months (§11.4). */
  returnChart: number[];
  /** §11.3 flags actually present on this sheet. Scams carry >= 2. */
  redFlags: RedFlag[];
}

/** §11.3 — the reusable red-flag vocabulary. */
export type RedFlag =
  | 'slightly-high-fee'
  | 'short-track-record'
  | 'unsolicited-approach'
  | 'urgency'
  | 'concentrated-holdings'
  | 'very-high-fee'
  | 'track-record-under-12-months'
  | 'guaranteed-returns'
  | 'no-regulator'
  | 'lookalike-domain'
  | 'implausible-return'
  | 'introducer-commission';

/** The near-diagnostic and diagnostic end of §11.3. */
export const STRONG_RED_FLAGS: readonly RedFlag[] = [
  'track-record-under-12-months',
  'guaranteed-returns',
  'no-regulator',
  'lookalike-domain',
  'implausible-return',
  'introducer-commission',
];

/* ------------------------------------------------------------------ *
 * The script (§14.2)
 * ------------------------------------------------------------------ */

/** MAIL = badge only. POP = popup window. DLG = blocking dialog. */
export type Channel = 'MAIL' | 'POP' | 'DLG' | 'NONE';

/** §10.1 message classes, plus the non-message beats the script also carries. */
export type EventClass =
  | 'junk'
  | 'legit'
  | 'mediocre'
  | 'scam'
  | 'life-admin'
  | 'windfall'
  | 'credit'
  | 'social'
  | 'flavour'
  | 'shock'
  | 'job-loss'
  | 'market'
  | 'year-turn'
  | 'era-switch'
  | 'scam-payload'
  | 'win'
  | 'start';

export interface ScriptEvent {
  id: EventId;
  /** "1996-04" */
  date: string;
  month: MonthIndex;
  channel: Channel;
  cls: EventClass;
  /** Body copy / offer page / dialog text, in /content. */
  contentId: ContentId;
  /** Set on every offer: what accepting unlocks. */
  vehicleId?: VehicleId;
  /** Shock cost, windfall size, or redundancy payout. Positive numbers. */
  amount?: number;
  /** Months of lost income (job loss). */
  incomeLostMonths?: number;
  /** Visible expiry on the inbox row, in simulated days. null = never (`—`). */
  expiresDays?: number | null;
  /** POP ×2 / POP ×3 — how many windows open together (max 3, §20.2). */
  count?: number;
  /**
   * Deterministic junk content for slots after the event's primary popup.
   * Keeps authored mixed batches (offer + noise) inside the existing POP
   * event without turning companion junk into separate timeline beats.
   */
  popupCompanionContentIds?: ContentId[];
  /** True for DLG: time is paused until the player chooses (§20.1). */
  blocksTime: boolean;
  /** Beyond the Step 1–28 MVP boundary (§26.1); scheduled but inert. */
  mvpDeferred?: boolean;
  notes?: string;
}

/* ------------------------------------------------------------------ *
 * Messages in flight
 * ------------------------------------------------------------------ */

export type MailStatus = 'unread' | 'read' | 'accepted' | 'deleted' | 'expired';

export interface MailItem {
  id: string;
  eventId: EventId;
  from: string;
  subject: string;
  contentId: ContentId;
  vehicleId?: VehicleId;
  cls: EventClass;
  arrivedMonth: MonthIndex;
  /** null = never expires; shown as `—` (§10.2). */
  expiresMonth: MonthIndex | null;
  status: MailStatus;
  /**
   * Windfall size (§8.5), copied from the originating ScriptEvent at
   * materialization (Step 7, §7.3 step 5). Added because a windfall's cash
   * lands only when its mail is opened (§8.5 — a cash-only player who never
   * opens the inbox never receives it) and the tick needs the amount at
   * open-time without re-querying the whole timeline. `undefined` for every
   * non-windfall message.
   */
  amount?: number;
}

export interface PopupItem {
  id: string;
  eventId: EventId;
  title: string;
  contentId: ContentId;
  vehicleId?: VehicleId;
  cls: EventClass;
  openedMonth: MonthIndex;
  /** Short simulated bookkeeping expiry; UI presentation has its own timer. */
  closesMonth: MonthIndex;
  /** Deterministic offset over the content area — derived from month, not RNG. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** §20.5 — the 2003 popup that imitates a system dialog. Exactly one. */
  imitatesDialog?: boolean;
}

export type DialogButton = {
  label: string;
  action: DialogAction;
  isDefault?: boolean;
};

export type DialogAction =
  | 'acknowledge'
  | 'pay-from-cash'
  | 'sell-to-cover'
  | 'use-the-card'
  | 'restart'
  /**
   * §12.3's "[ Sell something else ]" path, ui/ForcedSale.tsx only. Never
   * reaches applyDecision/the sim — ForcedSale's own onResolve wrapper
   * intercepts it to swap which holding the plan proposes selling, then
   * dispatches a real 'sell-to-cover'/'rebalance' once the player commits.
   * Exists purely so Dialog.tsx's generic button plumbing has a typed
   * action to wire the second button to.
   */
  | 'sell-something-else';

export interface DialogItem {
  id: string;
  eventId: EventId;
  title: string;
  contentId: ContentId;
  cls: EventClass;
  raisedMonth: MonthIndex;
  amount?: number;
  buttons: DialogButton[];
}

/* ------------------------------------------------------------------ *
 * Player state
 * ------------------------------------------------------------------ */

export interface Holding {
  vehicleId: VehicleId;
  /** Current £ value at this month's prices. */
  value: number;
  /** £ put in, cumulative. */
  contributed: number;
  /** £ taken out, cumulative. */
  withdrawn: number;
  /** £ of management, performance and exit fees paid to date (§12.4). */
  feesPaid: number;
  /** Target allocation, 0..100. All targets plus cash total exactly 100. */
  targetPct: number;
  /** Row lock on /money — pins this slider while others redistribute. */
  locked: boolean;
  unlockedMonth: MonthIndex;
  /** Collapsed: Halcyon suspended, Vertex unsellable (§11.5). */
  collapsed: boolean;
}

/** §13 — arrives by message, sits at £0 until used. */
export interface DebtState {
  limit: number;
  balance: number;
  /** 0% until this month, 29.8% APR after (§13). */
  promoEndsMonth: MonthIndex;
  aprPct: number;
  interestPaid: number;
}

export interface RunFlags {
  /** Accepting a scam puts you on a list: scam volume rises (§11.1). */
  onScamList: boolean;
  /** Months of income remaining to skip (job loss, §14.1). */
  incomeSuspendedMonths: number;
  /** Era A until the Jan 2002 switch (§18.2). */
  era: 'a' | 'b';
  /** Dual money display: which figure is primary (§19.4). */
  moneyBase: 'period' | '1996';
  /** The player opened the inbox at least once. Feeds a death line. */
  everOpenedInbox: boolean;
  /** The player opened at least one fact sheet. Feeds a death line. */
  everOpenedFactSheet: boolean;
}

/** §15 secondary stats — for bragging and teaching, never for scoring. */
export interface RunStats {
  peakWealth: number;
  peakWealth1996: number;
  finalWealth: number;
  feesPaid: number;
  /** What a 0.4% tracker would have charged on the same contributions (§9.3). */
  trackerCounterfactualFees: number;
  scamsFunded: number;
  scamsDodged: number;
  forcedSales: number;
  monthsUnderwater: number;
  /** Vehicles the player put money into that later went to zero. */
  scamsFundedIds: VehicleId[];
  /** Scam offers the player saw and declined or let expire. */
  scamsDodgedIds: VehicleId[];
  redFlagsMissed: RedFlag[];
}

export type RunStatus = 'running' | 'dead' | 'survived';

export interface GameState {
  month: MonthIndex;
  status: RunStatus;
  cash: number;
  /** Only unlocked vehicles appear. Cash is tracked separately. */
  holdings: Partial<Record<VehicleId, Holding>>;
  unlocked: VehicleId[];
  debt: DebtState | null;
  inbox: MailItem[];
  popups: PopupItem[];
  /** Blocking dialogs waiting on a choice. Time is frozen while non-empty. */
  dialogs: DialogItem[];
  flags: RunFlags;
  stats: RunStats;
  /** Every month's net worth, for the death-card decade graph (§22.6). */
  wealthHistory: number[];
  /** The market line on the same graph. */
  marketHistory: number[];
  deathMonth: MonthIndex | null;
  deathCauseId: DeathCauseId | null;
  /** Ordered, timestamped decision log — a run replay is this list (§25.2). */
  decisions: Decision[];
}

/* ------------------------------------------------------------------ *
 * Decisions (§25.2) — a run is fully described by (script, decisions).
 * ------------------------------------------------------------------ */

export type Decision =
  | { type: 'open-mail'; month: MonthIndex; mailId: string }
  | { type: 'delete-mail'; month: MonthIndex; mailId: string }
  | { type: 'delete-all-mail'; month: MonthIndex }
  | { type: 'open-fact-sheet'; month: MonthIndex; vehicleId: VehicleId }
  | { type: 'accept-offer'; month: MonthIndex; vehicleId: VehicleId; source: string }
  | { type: 'decline-offer'; month: MonthIndex; vehicleId: VehicleId }
  | { type: 'close-popup'; month: MonthIndex; popupId: string }
  /**
   * §10 rule 3 / §20.2 — clicking a popup's CTA navigates the main window
   * to the offer's site AND files a copy in the inbox, so nothing is
   * permanently lost by exploring. Files the popup's content as an unread,
   * never-expiring MailItem (see popupToMailItem in chrome/popupPlacement.ts,
   * the pure shape this mirrors) and removes the popup — the UI performs
   * the actual navigation separately, since that's chrome/router state, not
   * sim state.
   */
  | { type: 'file-popup-as-mail'; month: MonthIndex; popup: PopupItem }
  | { type: 'navigate'; month: MonthIndex; url: string }
  | { type: 'rebalance'; month: MonthIndex; targets: Partial<Record<VehicleId, number>>; cashPct: number }
  | { type: 'resolve-dialog'; month: MonthIndex; dialogId: string; action: DialogAction }
  | { type: 'toggle-money-base'; month: MonthIndex }
  | { type: 'set-time-rate'; month: MonthIndex; rate: number };

/* ------------------------------------------------------------------ *
 * Endgame (§15, §22.6)
 * ------------------------------------------------------------------ */

export type Band = 'OUCH' | 'OKAY' | 'SOLID' | 'IMPRESSIVE' | 'LEGENDARY';

/** Keys into the §22.6 cause-of-death line library. */
export type DeathCauseId =
  | 'broke-as-bubble-peaked'
  | 'ground-down-by-rent'
  | 'funded-a-scam'
  | 'sold-at-the-bottom'
  | 'eaten-by-fees'
  | 'the-card-ate-you'
  | 'the-fake-dialog'
  | 'survived';

export interface RunResult {
  status: RunStatus;
  /** null if the player survived the decade. */
  deathMonth: MonthIndex | null;
  band: Band;
  causeId: DeathCauseId;
  causeLine: string;
  /** The supporting sentence beneath the headline cause. */
  detailLine: string;
  stats: RunStats;
  wealthHistory: number[];
  marketHistory: number[];
}

/* ------------------------------------------------------------------ *
 * The market table (/data/series.json)
 * ------------------------------------------------------------------ */

export interface SeriesRow {
  /** "1996-01" */
  month: string;
  /** Monthly multiplier per vehicle column, e.g. 1.0142 = +1.42% that month. */
  [column: string]: number | string;
}

export interface SeriesTable {
  meta: {
    generatedBy: string;
    sources: string[];
    note: string;
  };
  columns: string[];
  rows: SeriesRow[];
}

/* ------------------------------------------------------------------ *
 * The expense basket (§8.1, §8.2)
 * ------------------------------------------------------------------ */

export type BasketComponent = 'rent' | 'food' | 'bills' | 'transport' | 'other';

export interface BasketBreakdown {
  rent: number;
  food: number;
  bills: number;
  transport: number;
  other: number;
  total: number;
}

/** Fixed nominal take-home pay. Never rises. This is the whole game (§4). */
export const MONTHLY_PAY = 760;
