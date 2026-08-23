/**
 * `/money` — portfolio and allocation (Step 23, §22.5).
 *
 * §12.1: two-way % sliders over total wealth (cash + every unlocked
 * vehicle), always totalling 100, free rebalance. §12.2 governs the drag
 * behaviour this file implements as pure, independently-testable functions
 * (`redistribute`, `toggleLock`, `roundToIntegerAllocation`) so the
 * allocation maths can be verified without mounting React:
 *
 *  - dragging a row redistributes the remainder **proportionally** across
 *    every other *unlocked* row, by their existing relative weight;
 *  - a locked row never moves until unlocked;
 *  - the whole row set always sums to exactly 100 (integer percentage
 *    points, largest-remainder rounding — never a fencepost 99 or 101);
 *  - slider targets are a persistent UI draft until
 *    `[ Rebalance Now ]` is confirmed, at which point exactly one
 *    `{ type: 'rebalance' }` Decision is dispatched (§25.2 replay log).
 *    Executing the buys/sells is the sim's job (Step 24, `src/sim/tick.ts`)
 *    — this page only *previews* what they would be, for the confirm step;
 *  - `MoneyDraftProvider` lives above the router's remounted page content,
 *    so navigating away cannot silently discard an unconfirmed draft.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useEngine } from '../ui/engine';
import { Money } from '../ui/Money';
import { GameLink } from '../chrome/router';
import { VEHICLES } from '../sim/vehicles';
import { currentAllocation, holdingsList, netWorth } from '../sim/selectors';
import { monthLabel } from '../sim/month';
import type { Decision, GameState, Holding, MonthIndex, VehicleId } from '../sim/types';
import './money.css';

/* ------------------------------------------------------------------ *
 * Pure allocation maths — no React, no GameState mutation. Exported for
 * Money.test.ts.
 * ------------------------------------------------------------------ */

export interface DraftRow {
  id: VehicleId; // VehicleId includes 'cash' (src/sim/ids.ts)
  label: string;
  /** Draft target allocation, 0..100 integer. Not yet executed (§12.2). */
  pct: number;
  /** §12.2 — pins this row's pct while others redistribute. */
  locked: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Largest-remainder rounding: turns fractional shares of `target` into
 * integers that sum to exactly `target`, rather than drifting to 99 or 101
 * the way naive per-element `Math.round` does. §12.1 "must total 100%. The
 * UI enforces this" — this function is the enforcement.
 */
export function roundToIntegerAllocation(raw: number[], target = 100): number[] {
  if (raw.length === 0) return [];
  const clamped = raw.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const floors = clamped.map(Math.floor);
  const used = floors.reduce((a, b) => a + b, 0);
  let remainder = Math.round(target) - used;
  const order = clamped
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++) {
    result[order[k].i] += 1;
    remainder -= 1;
  }
  // Defensive only — every real caller below drives `remainder` to exactly
  // 0 through the loop above; this exists so a pathological input (e.g.
  // every weight 0 with a nonzero target) still sums correctly rather than
  // silently under/over-shooting §12.1's "must total 100%".
  if (remainder !== 0) result[0] += remainder;
  return result;
}

/** Builds the draft row set from the sim's actual current allocation
 * (§12.4 row list: cash first, then every unlocked vehicle in holding
 * order) — used both to seed the draft and to implement `[ Reset ]`,
 * which "restores the current actual allocation" (§12.2). */
export function buildDraftRows(state: GameState): DraftRow[] {
  const alloc = currentAllocation(state);
  const holdings = holdingsList(state);
  const ids: VehicleId[] = ['cash', ...holdings.map((h) => h.vehicleId)];
  const raw = ids.map((id) => (id === 'cash' ? alloc.cashPct : (alloc.byVehicle[id] ?? 0)));
  const pcts = roundToIntegerAllocation(raw, 100);
  return ids.map((id, i) => ({
    id,
    label: id === 'cash' ? 'Cash' : VEHICLES[id].name,
    pct: pcts[i],
    // Locks are a page-local draft concern (no Decision toggles them —
    // §23's Decision union only carries 'rebalance'); Holding.locked is
    // read here only as a starting point in case Step 24 ever seeds it.
    locked: id === 'cash' ? false : Boolean(state.holdings[id]?.locked),
  }));
}

/**
 * §12.2 — "Dragging one slider redistributes the difference proportionally
 * across the others, with a lock toggle per row to pin one in place."
 *
 * Implemented as: clamp the dragged row to the room left by locked rows,
 * then hand whatever budget remains to the unlocked others in proportion
 * to their *existing* weight (equal split if they're all currently 0).
 * This is exactly the delta-proportional redistribution the spec
 * describes, but phrased as "split the remaining budget" instead of "move
 * the delta" — the remaining budget is never negative, so it needs no
 * separate negative-clamping/re-distribution pass and can never produce a
 * row below 0%.
 */
export function redistribute(rows: DraftRow[], draggedId: VehicleId, rawPct: number): DraftRow[] {
  const draggedIdx = rows.findIndex((r) => r.id === draggedId);
  if (draggedIdx === -1 || rows[draggedIdx].locked) return rows;

  const otherIdxs = rows.map((_, i) => i).filter((i) => i !== draggedIdx && !rows[i].locked);
  const lockedSum = rows.reduce((s, r, i) => (i !== draggedIdx && r.locked ? s + r.pct : s), 0);
  const maxAllowed = clamp(100 - lockedSum, 0, 100);
  // If every other row is locked there is nowhere for slack to go — the
  // dragged row is pinned too, at whatever room the locks leave.
  const newPct = otherIdxs.length === 0 ? maxAllowed : Math.round(clamp(rawPct, 0, maxAllowed));

  const remaining = maxAllowed - newPct; // always >= 0
  const sumOthersCurrent = otherIdxs.reduce((s, i) => s + rows[i].pct, 0);
  const othersRaw = otherIdxs.map((i) =>
    sumOthersCurrent > 0 ? remaining * (rows[i].pct / sumOthersCurrent) : remaining / otherIdxs.length,
  );
  const othersInt = roundToIntegerAllocation(othersRaw, remaining);

  const result = rows.map((r) => ({ ...r }));
  result[draggedIdx].pct = newPct;
  otherIdxs.forEach((i, k) => {
    result[i].pct = othersInt[k];
  });
  return result;
}

export function toggleLock(rows: DraftRow[], id: VehicleId): DraftRow[] {
  return rows.map((r) => (r.id === id ? { ...r, locked: !r.locked } : r));
}

/**
 * Keeps an in-progress draft valid when a newly accepted vehicle joins the
 * portfolio. Existing targets and locks survive; a new row starts at 0%, so
 * the invariant remains 100% without silently changing the player's draft.
 */
export function reconcileDraftRows(rows: DraftRow[], state: GameState): DraftRow[] {
  const actualRows = buildDraftRows(state);
  const existing = new Map(rows.map((row) => [row.id, row]));
  const reconciled = actualRows.map((actual) => {
    const saved = existing.get(actual.id);
    if (!saved) return { ...actual, pct: 0 };
    if (actual.id === 'cash') return { ...actual, pct: saved.pct, locked: saved.locked };

    const holding = state.holdings[actual.id];
    if (!holding?.collapsed) return { ...actual, pct: saved.pct, locked: saved.locked };
    const pct = VEHICLES[actual.id].sellableAfterCollapse
      ? Math.min(saved.pct, actual.pct)
      : actual.pct;
    return { ...actual, pct, locked: false };
  });
  const cash = reconciled.find((row) => row.id === 'cash');
  const nonCashTotal = reconciled.reduce((sum, row) => sum + (row.id === 'cash' ? 0 : row.pct), 0);
  if (!cash || nonCashTotal < 0 || nonCashTotal > 100) return actualRows;
  cash.pct = 100 - nonCashTotal;
  return reconciled;
}

export interface AllocationConstraint {
  maxPct: number;
  disabled: boolean;
  message: string | null;
}

/**
 * Suspended investments cannot accept new money. A sellable suspended holding
 * may only move left as the player exits it; an unsellable one is frozen at its
 * current allocation. The pure simulation enforces the same rule in tick.ts.
 */
export function allocationConstraint(state: GameState, row: DraftRow): AllocationConstraint {
  if (row.id === 'cash') return { maxPct: 100, disabled: false, message: null };
  const holding = state.holdings[row.id];
  if (!holding?.collapsed) return { maxPct: 100, disabled: false, message: null };

  const currentPct = buildDraftRows(state).find((actual) => actual.id === row.id)?.pct ?? 0;
  const vehicle = VEHICLES[row.id];
  if (!vehicle.sellableAfterCollapse) {
    return {
      maxPct: currentPct,
      disabled: true,
      message: `Frozen at ${currentPct}% — this suspended holding cannot be bought or sold.`,
    };
  }
  if (currentPct <= 0) {
    return {
      maxPct: 0,
      disabled: true,
      message: 'Suspended — new allocations are unavailable.',
    };
  }
  return {
    maxPct: currentPct,
    disabled: false,
    message: `Suspended — you may reduce this holding, but cannot increase it above ${currentPct}%.`,
  };
}

/**
 * Applies the ordinary proportional slider rule without allowing that
 * redistribution to increase a suspended row behind the player's back.
 * Temporary locks are calculation-only; the visible editor pins are restored
 * unchanged in the returned rows.
 */
export function redistributeForState(
  state: GameState,
  rows: DraftRow[],
  draggedId: VehicleId,
  rawPct: number,
): DraftRow[] {
  const dragged = rows.find((row) => row.id === draggedId);
  if (!dragged) return rows;
  const draggedConstraint = allocationConstraint(state, dragged);
  if (draggedConstraint.disabled) return rows;

  const calculationRows = rows.map((row) => {
    if (row.id === draggedId || row.locked) return row;
    return allocationConstraint(state, row).maxPct < 100 ? { ...row, locked: true } : row;
  });
  const redistributed = redistribute(
    calculationRows,
    draggedId,
    Math.min(rawPct, draggedConstraint.maxPct),
  );
  const originalLocks = new Map(rows.map((row) => [row.id, row.locked]));
  return redistributed.map((row) => ({ ...row, locked: originalLocks.get(row.id) ?? false }));
}

type MoneyDraftContextValue = {
  draft: DraftRow[] | null;
  setDraft: Dispatch<SetStateAction<DraftRow[] | null>>;
};

const MoneyDraftContext = createContext<MoneyDraftContextValue | null>(null);

/**
 * Route content is remounted whenever the faux browser navigates. Keeping the
 * draft one level above that content prevents an unconfirmed allocation from
 * silently reverting to 100% cash, while GameState remains untouched until the
 * explicit confirm step.
 */
export function MoneyDraftProvider({ children }: { children: ReactNode }) {
  const engine = useEngine();
  const [draft, setDraft] = useState<DraftRow[] | null>(null);
  const resetKey = engine.mailNoticeResetKey ?? 0;
  const portfolioKey = engine.state.unlocked
    .map((id) => `${id}:${engine.state.holdings[id]?.collapsed ? 'suspended' : 'open'}`)
    .join(',');

  useEffect(() => setDraft(null), [resetKey]);
  useEffect(() => {
    setDraft((current) => (current ? reconcileDraftRows(current, engine.state) : null));
    // Only portfolio membership or a suspension should reconcile a pending
    // draft. Ordinary monthly price updates must not overwrite targets the
    // player is reviewing.
  }, [portfolioKey]);

  return <MoneyDraftContext.Provider value={{ draft, setDraft }}>{children}</MoneyDraftContext.Provider>;
}

function useMoneyDraft(): MoneyDraftContextValue {
  const context = useContext(MoneyDraftContext);
  if (!context) throw new Error('MoneyPage must be rendered inside <MoneyDraftProvider>');
  return context;
}

/** §12.4 "return since purchase". Basis = net cash ever put in and not
 * taken back out; undefined (and displayed flat) before any money has
 * gone in. */
export function returnSincePurchase(h: Holding): number {
  const basis = h.contributed - h.withdrawn;
  if (basis <= 0) return 0;
  return ((h.value - basis) / basis) * 100;
}

/* ------------------------------------------------------------------ *
 * The confirm-step preview (§12.2 "exit fees... itemised in the confirm
 * step before commitment"; Step 23's done-condition: "confirm itemises
 * every buy, sell, realised P&L and exit fee before executing").
 *
 * This is a PREVIEW only, computed at current (period) prices — it does
 * not execute anything. The actual buy/sell/fee application is
 * src/sim/tick.ts's job via the dispatched Decision (Step 24).
 * ------------------------------------------------------------------ */

export interface RebalanceItem {
  id: VehicleId;
  label: string;
  kind: 'buy' | 'sell' | 'cash' | 'unchanged';
  /** buy/sell: positive £ moved. cash: signed £ delta (+in / -out). */
  amount: number;
  /** Sells only — proportional share of the position's unrealised gain. */
  realisedGain?: number;
  /** Sells only — §9.3/§12.4 exit fee, itemised before commitment. */
  exitFee?: number;
}

export interface RebalancePreview {
  items: RebalanceItem[];
  totalBuys: number;
  totalSells: number;
  totalExitFees: number;
  totalRealisedGain: number;
  netWorth: number;
}

const NEGLIGIBLE = 0.5; // sub-50p differences aren't a trade, they're rounding

export function buildRebalancePreview(state: GameState, rows: DraftRow[]): RebalancePreview {
  const total = netWorth(state);
  const items: RebalanceItem[] = [];
  let totalBuys = 0;
  let totalSells = 0;
  let totalExitFees = 0;
  let totalRealisedGain = 0;

  for (const row of rows) {
    const targetValue = (row.pct / 100) * total;
    const currentValue = row.id === 'cash' ? state.cash : (state.holdings[row.id]?.value ?? 0);
    const diff = targetValue - currentValue;

    if (row.id === 'cash') {
      items.push({
        id: row.id,
        label: row.label,
        kind: Math.abs(diff) < NEGLIGIBLE ? 'unchanged' : 'cash',
        amount: diff,
      });
      continue;
    }

    if (Math.abs(diff) < NEGLIGIBLE) {
      items.push({ id: row.id, label: row.label, kind: 'unchanged', amount: 0 });
      continue;
    }

    if (diff > 0) {
      items.push({ id: row.id, label: row.label, kind: 'buy', amount: diff });
      totalBuys += diff;
      continue;
    }

    const sellAmount = -diff;
    const holding = state.holdings[row.id];
    let realisedGain = 0;
    let exitFee = 0;
    if (holding && holding.value > 0) {
      const fraction = Math.min(1, sellAmount / holding.value);
      const unrealisedGain = holding.value - (holding.contributed - holding.withdrawn);
      realisedGain = unrealisedGain * fraction;
      exitFee = sellAmount * (VEHICLES[row.id].exitFeePct / 100);
    }
    items.push({ id: row.id, label: row.label, kind: 'sell', amount: sellAmount, realisedGain, exitFee });
    totalSells += sellAmount;
    totalExitFees += exitFee;
    totalRealisedGain += realisedGain;
  }

  return { items, totalBuys, totalSells, totalExitFees, totalRealisedGain, netWorth: total };
}

/** The one Decision this whole page dispatches (§25.2 replay log). Step 24
 * reads `targets`/`cashPct` off it to actually move money; this page never
 * touches `state.cash` or `state.holdings` directly. */
export function buildRebalanceDecision(state: GameState, rows: DraftRow[]): Decision {
  const targets: Partial<Record<VehicleId, number>> = {};
  let cashPct = 0;
  for (const row of rows) {
    if (row.id === 'cash') cashPct = row.pct;
    else targets[row.id] = row.pct;
  }
  return { type: 'rebalance', month: state.month, targets, cashPct };
}

/* ------------------------------------------------------------------ *
 * Display helpers
 * ------------------------------------------------------------------ */

function formatGBP(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '−' : '';
  return `${sign}£${Math.abs(rounded).toLocaleString('en-GB')}`;
}

/**
 * Adapter over the shared dual-money component (§19.4). Every figure on this
 * page renders in both period and 1996 money, and the global toggle swaps
 * which is primary everywhere at once.
 */
function MoneyFigure({
  amount,
  month,
  inline,
  suffix,
  className,
}: {
  amount: number;
  month: MonthIndex;
  inline?: boolean;
  suffix?: string;
  className?: string;
}) {
  return (
    <>
      <Money
        amount={amount}
        month={month}
        variant={inline ? 'inline' : 'table-cell'}
        className={className}
      />
      {suffix ?? ''}
    </>
  );
}

function ReturnBadge({ holding }: { holding: Holding }) {
  const pct = returnSincePurchase(holding);
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '—';
  return (
    <span className="money-row__return">
      {' '}
      {arrow} {Math.abs(Math.round(pct))}%
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Rows
 * ------------------------------------------------------------------ */

function PortfolioRow({
  row,
  actualPct,
  state,
  onDrag,
  onToggleLock,
}: {
  row: DraftRow;
  actualPct: number;
  state: GameState;
  onDrag: (pct: number) => void;
  onToggleLock: () => void;
}) {
  const isCash = row.id === 'cash';
  const holding = isCash ? undefined : state.holdings[row.id];
  const vehicle = VEHICLES[row.id];
  const value = isCash ? state.cash : (holding?.value ?? 0);
  const constraint = allocationConstraint(state, row);
  const isDraft = row.pct !== actualPct;
  const pinUnavailable = constraint.disabled && !row.locked;
  const stateId = `money-row-state-${row.id}`;

  return (
    <div
      className={[
        'money-row',
        row.locked ? 'money-row--pinned' : '',
        isDraft ? 'money-row--draft' : '',
        holding?.collapsed ? 'money-row--suspended' : '',
      ].filter(Boolean).join(' ')}
      data-allocation-state={holding?.collapsed ? 'suspended' : row.locked ? 'pinned' : isDraft ? 'draft' : 'applied'}
    >
      <div className="money-row__top">
        <span className="money-row__name">
          {row.label}
          {holding && <ReturnBadge holding={holding} />}
          {holding?.collapsed && <span className="money-row__suspended"> SUSPENDED</span>}
          {row.locked && <span className="money-row__pin-badge">PINNED {row.pct}%</span>}
        </span>
        <MoneyFigure amount={value} month={state.month} className="money-row__value" />
        <span className="money-row__pct" aria-label={`${row.label} target ${row.pct} percent`}>
          {row.pct}%
        </span>
      </div>

      {holding && (
        <div className="money-row__fee">
          fee {vehicle.annualFeePct.toFixed(1)}% &middot; {formatGBP(holding.feesPaid)} paid to date
          {/* §11.3 "very high fee (>5%)" — visible on the row, not just the
           * fact sheet (§9.3). A hint about the row's own cost, not a
           * verdict on the vehicle (§11.2 rule 6 is about site style; a fee
           * number is just the fee number). */}
          {vehicle.annualFeePct > 5 && <span className="money-row__fee-warn"> ⚠</span>}
          <GameLink href={vehicle.url} className="money-row__factsheet">
            [ fact sheet ]
          </GameLink>
        </div>
      )}

      <div className="money-row__slider">
        <button
          type="button"
          className={`bevel-out chrome money-row__lock${row.locked ? ' money-row__lock--active' : ''}`}
          onClick={onToggleLock}
          disabled={pinUnavailable}
          aria-pressed={row.locked}
          aria-label={row.locked ? `Unpin ${row.label} at ${row.pct} percent` : `Pin ${row.label} at ${row.pct} percent`}
          aria-describedby={stateId}
          title={
            row.locked
              ? `Pinned at ${row.pct}% while you edit other targets. This does not auto-rebalance future months.`
              : `Pin ${row.pct}% while editing other targets. This does not auto-rebalance future months.`
          }
        >
          <span className="money-row__pin-light" aria-hidden="true" />
          {row.locked ? `PINNED ${row.pct}%` : `PIN ${row.pct}%`}
        </button>
        <input
          type="range"
          className="win-slider money-row__range"
          min={0}
          max={constraint.maxPct}
          step={1}
          value={row.pct}
          disabled={row.locked || constraint.disabled}
          onChange={(e) => onDrag(Number(e.target.value))}
          aria-label={`${row.label} target allocation, percent`}
          aria-valuetext={`${row.pct}% target allocation`}
          aria-describedby={stateId}
          style={{ '--money-pct': `${row.pct}%` } as CSSProperties}
        />
      </div>
      <div id={stateId} className="money-row__state" aria-live="polite">
        {constraint.message ?? (row.locked
          ? `Pinned at ${row.pct}% while editing. Other sliders rebalance around this target.`
          : `Adjustable. Pin ${row.pct}% to keep it fixed while editing another target.`)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Confirm step
 * ------------------------------------------------------------------ */

function RebalanceConfirmPanel({
  preview,
  month,
  onCancel,
  onConfirm,
}: {
  preview: RebalancePreview;
  month: MonthIndex;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const actionable = preview.items.filter((i) => i.kind !== 'unchanged');

  return (
    <div className="money-confirm">
      {/* chrome, not the page's institutional body font — this reads as a
       * system dialog (§20.1), which is exactly what it becomes once lifted
       * into Dialog.tsx. */}
      <div className="chrome bevel-out money-confirm__panel">
        <div className="money-confirm__titlebar">Confirm rebalance</div>
        <div className="money-confirm__body sunken-field win-scrollbar">
          {actionable.length === 0 ? (
            <p>No change — the draft matches your current holdings.</p>
          ) : (
            <ul className="money-confirm__list">
              {actionable.map((item) => (
                <li key={item.id} className="money-confirm__item">
                  {item.kind === 'buy' && (
                    <>
                      BUY <MoneyFigure amount={item.amount} month={month} inline /> into{' '}
                      {item.label}
                    </>
                  )}
                  {item.kind === 'sell' && (
                    <>
                      SELL <MoneyFigure amount={item.amount} month={month} inline /> of{' '}
                      {item.label}
                      {' — realised '}
                      {(item.realisedGain ?? 0) >= 0 ? 'gain' : 'loss'} {formatGBP(Math.abs(item.realisedGain ?? 0))}
                      {item.exitFee ? `, exit fee ${formatGBP(item.exitFee)}` : ''}
                    </>
                  )}
                  {item.kind === 'cash' && (
                    <>
                      Cash {item.amount >= 0 ? '+' : '−'}
                      <MoneyFigure amount={Math.abs(item.amount)} month={month} inline />
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="money-confirm__totals">
            <div>
              Total bought <MoneyFigure amount={preview.totalBuys} month={month} inline />
            </div>
            <div>
              Total sold <MoneyFigure amount={preview.totalSells} month={month} inline />
            </div>
            <div>
              Total exit fees <MoneyFigure amount={preview.totalExitFees} month={month} inline />
            </div>
            <div>
              Total realised gain/loss{' '}
              <MoneyFigure amount={preview.totalRealisedGain} month={month} inline />
            </div>
          </div>
        </div>
        <div className="money-confirm__actions">
          <button type="button" className="bevel-out" onClick={onCancel}>
            [ Cancel ]
          </button>
          <button type="button" className="bevel-out" onClick={onConfirm}>
            [ Confirm rebalance ]
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export function MoneyPage() {
  const engine = useEngine();
  const { state } = engine;
  const { draft: persistedDraft, setDraft } = useMoneyDraft();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [appliedRevision, setAppliedRevision] = useState(0);

  const netWorthNow = netWorth(state);
  const actualRows = buildDraftRows(state);
  const actualPctById = new Map(actualRows.map((row) => [row.id, row.pct]));
  const draft = persistedDraft ?? actualRows;
  const totalPct = draft.reduce((sum, r) => sum + r.pct, 0);
  const isDirty =
    draft.length !== actualRows.length || draft.some((r, i) => r.pct !== actualRows[i]?.pct);
  const canRebalance = isDirty && totalPct === 100;

  function handleReset() {
    setDraft(null);
    setConfirmOpen(false);
    setAppliedRevision(0);
  }

  function handleConfirm() {
    // §25.2: the rebalance decision joins the replay log here. Execution —
    // actually moving state.cash/state.holdings — is Step 24's tick.ts.
    engine.dispatch(buildRebalanceDecision(state, draft));
    setDraft(null);
    setConfirmOpen(false);
    setAppliedRevision((revision) => revision + 1);
  }

  const preview = confirmOpen ? buildRebalancePreview(state, draft) : null;

  return (
    <div className="money-page">
      <div className="money-header">
        <h1 className="money-title">MY MONEY</h1>
        <span className="money-date">{monthLabel(state.month)}</span>
      </div>

      <div className="money-total">
        <span className="money-total__label">Total</span>
        <MoneyFigure
          amount={netWorthNow}
          month={state.month}
          suffix=" in 1996 money"
        />
      </div>

      <div className="money-guide" aria-label="How allocation editing works">
        <span><b>1</b> Set targets</span>
        <span><b>2</b> Pin a percentage only if it must stay fixed while editing</span>
        <span><b>3</b> Rebalance Now, then confirm to move money</span>
      </div>

      <div className="money-rows bevel-in">
        {draft.map((row) => (
          <PortfolioRow
            key={row.id}
            row={row}
            actualPct={actualPctById.get(row.id) ?? 0}
            state={state}
            onDrag={(pct) => {
              setAppliedRevision(0);
              setDraft((rows) => redistributeForState(state, rows ?? buildDraftRows(state), row.id, pct));
            }}
            onToggleLock={() =>
              setDraft((rows) => toggleLock(rows ?? buildDraftRows(state), row.id))
            }
          />
        ))}
      </div>

      <div className="money-footer">
        <p
          key={isDirty ? 'draft' : `applied-${appliedRevision}`}
          className={`money-footer__status ${isDirty ? 'money-footer__status--pending' : 'money-footer__status--applied'}`}
          role="status"
          data-state={isDirty ? 'draft' : 'applied'}
        >
          <span className="money-footer__status-light" aria-hidden="true" />
          {isDirty ? (
            <>DRAFT ONLY — no money has moved. Select Rebalance Now and confirm.</>
          ) : appliedRevision > 0 ? (
            <>ALLOCATION APPLIED — cash and holdings are updated.</>
          ) : (
            <>CURRENT ALLOCATION — these percentages are applied.</>
          )}
        </p>
        <span className={`money-footer__total ${totalPct === 100 ? '' : 'money-footer__total--bad'}`}>
          Total {totalPct}%
        </span>
        <div className="money-footer__actions">
          <button type="button" className="bevel-out chrome money-action money-action--reset" onClick={handleReset}>
            [ Reset ]
          </button>
          <button
            type="button"
            className="bevel-out chrome money-action money-action--rebalance"
            disabled={!canRebalance}
            title={!isDirty ? 'No changes to apply' : totalPct !== 100 ? 'Allocation must total 100%' : undefined}
            onClick={() => setConfirmOpen(true)}
          >
            [ Rebalance Now ]
          </button>
        </div>
      </div>

      {confirmOpen && preview && (
        <RebalanceConfirmPanel
          preview={preview}
          month={state.month}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
