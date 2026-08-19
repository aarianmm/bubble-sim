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
 *  - nothing here touches `GameState` — sliders are a draft until
 *    `[ Rebalance Now ]` is confirmed, at which point exactly one
 *    `{ type: 'rebalance' }` Decision is dispatched (§25.2 replay log).
 *    Executing the buys/sells is the sim's job (Step 24, `src/sim/tick.ts`)
 *    — this page only *previews* what they would be, for the confirm step.
 *
 * SEAM: the scheduler that unlocks vehicles (Step 24) isn't merged into
 * this worktree, so `state.holdings` is empty at every date in the real
 * app right now — this page renders correctly with just a 100%-cash row,
 * and `Money.test.ts` exercises the slider maths against fixture holdings
 * instead (see that file's header).
 *
 * SEAM: `src/chrome/Dialog.tsx` (Step 20) is being built in parallel and
 * does not exist on this branch either. `RebalanceConfirmPanel` is a
 * page-level panel, not a real dialog — styled with the bevel primitives
 * and structured (title strip / scrollable body / action row) so it can be
 * lifted into `Dialog.tsx` wholesale once that lands.
 */
import { useEffect, useState } from 'react';
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
  state,
  onDrag,
  onToggleLock,
}: {
  row: DraftRow;
  state: GameState;
  onDrag: (pct: number) => void;
  onToggleLock: () => void;
}) {
  const isCash = row.id === 'cash';
  const holding = isCash ? undefined : state.holdings[row.id];
  const vehicle = VEHICLES[row.id];
  const value = isCash ? state.cash : (holding?.value ?? 0);

  return (
    <div className="money-row">
      <div className="money-row__top">
        <span className="money-row__name">
          {row.label}
          {holding && <ReturnBadge holding={holding} />}
          {holding?.collapsed && <span className="money-row__suspended"> (suspended)</span>}
        </span>
        <MoneyFigure amount={value} month={state.month} className="money-row__value" />
        <span className="money-row__pct">{row.pct}%</span>
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
          className="bevel-out chrome money-row__lock"
          onClick={onToggleLock}
          aria-label={row.locked ? `Unlock ${row.label}` : `Lock ${row.label}`}
          title={
            row.locked
              ? 'Locked — pinned while other rows redistribute'
              : 'Unlocked — redistributes when other rows are dragged'
          }
        >
          {row.locked ? '\u{1F512}' : '\u{1F513}'}
        </button>
        <input
          type="range"
          className="win-slider money-row__range"
          min={0}
          max={100}
          step={1}
          value={row.pct}
          disabled={row.locked}
          onChange={(e) => onDrag(Number(e.target.value))}
          aria-label={`${row.label} target allocation, percent`}
        />
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

  const [draft, setDraft] = useState<DraftRow[]>(() => buildDraftRows(state));
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Resync the row *set* (not in-progress edits) when a vehicle unlocks or
  // is fully exited — a live drag never changes state.unlocked, so this
  // can't clobber a mid-drag draft. SEAM: unreachable in the real app
  // today (Step 24 not merged, state.unlocked always []); exercised via
  // fixtures in Money.test.ts instead.
  const unlockedKey = state.unlocked.join(',');
  useEffect(() => {
    setDraft(buildDraftRows(state));
    // Deliberately keyed only on the row-membership signature (below) — see
    // comment above. `state` itself changes every tick (price/date), which
    // must NOT reset an in-progress draft, so it is intentionally left out
    // of the dependency array. No react-hooks lint plugin is configured in
    // this repo (eslint.config.js), so this needs no disable comment.
  }, [unlockedKey]);

  const netWorthNow = netWorth(state);
  const totalPct = draft.reduce((sum, r) => sum + r.pct, 0);
  const actualRows = buildDraftRows(state);
  const isDirty =
    draft.length !== actualRows.length || draft.some((r, i) => r.pct !== actualRows[i]?.pct);
  const canRebalance = isDirty && totalPct === 100;

  function handleReset() {
    setDraft(buildDraftRows(state));
  }

  function handleConfirm() {
    // §25.2: the rebalance decision joins the replay log here. Execution —
    // actually moving state.cash/state.holdings — is Step 24's tick.ts.
    engine.dispatch(buildRebalanceDecision(state, draft));
    setConfirmOpen(false);
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

      <div className="money-rows bevel-in">
        {draft.map((row) => (
          <PortfolioRow
            key={row.id}
            row={row}
            state={state}
            onDrag={(pct) => setDraft((rows) => redistribute(rows, row.id, pct))}
            onToggleLock={() => setDraft((rows) => toggleLock(rows, row.id))}
          />
        ))}
      </div>

      <div className="money-footer">
        <span className={`money-footer__total ${totalPct === 100 ? '' : 'money-footer__total--bad'}`}>
          Total {totalPct}%
        </span>
        <div className="money-footer__actions">
          <button type="button" className="bevel-out chrome" onClick={handleReset}>
            [ Reset ]
          </button>
          <button
            type="button"
            className="bevel-out chrome"
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
