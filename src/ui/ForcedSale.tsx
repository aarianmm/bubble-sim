/**
 * §12.3 forced-sale flow, Step 25. "Free rebalancing doesn't kill the death
 * spiral, because expense shocks don't ask about the sliders." When a
 * shock's cash shortfall would force sim/tick.ts's solvencyCheck (§7.3
 * sub-step 6) to liquidate holdings automatically, EngineProvider.tsx
 * intercepts BEFORE that trial result is shown as real — this component is
 * what the player sees instead: what will be sold, and at what loss, in
 * both money terms (§19.4's <Money>), with a genuine [ Sell something else ]
 * path rather than a silent fait accompli.
 *
 * Built on the real src/chrome/Dialog.tsx (§20.1: time frozen, no dismiss,
 * max two buttons) via its `bodyOverride` prop — the itemized list below is
 * computed from live GameState, not authored copy, so there is no
 * `contentId` for Dialog's usual string lookup to resolve.
 */
import { useState, type ReactNode } from 'react';
import { Dialog } from '../chrome/Dialog';
import { Money } from './Money';
import { VEHICLES } from '../sim/vehicles';
import type { GameState, VehicleId } from '../sim/types';
import './forcedsale.css';

export interface ForcedSaleItem {
  vehicleId: VehicleId;
  label: string;
  /** £ sold at this month's (bad) prices — the whole point of §12.3. */
  soldAmount: number;
  exitFee: number;
}

/**
 * Pure diff, not a reimplementation: compares holdings before and after a
 * trial tick() to reconstruct exactly what tick.ts's own `liquidate()` sold
 * and at what exit fee. This is deliberate — the preview can never drift
 * from what actually gets committed, because it's read off the real result
 * rather than computed by separate logic that could disagree with it.
 */
export function diffForcedSale(before: GameState, after: GameState): ForcedSaleItem[] {
  const items: ForcedSaleItem[] = [];
  for (const id of before.unlocked) {
    const b = before.holdings[id];
    const a = after.holdings[id];
    if (!b || !a) continue;
    const soldAmount = a.withdrawn - b.withdrawn;
    if (soldAmount > 0.005) {
      items.push({
        vehicleId: id,
        label: VEHICLES[id].name,
        soldAmount,
        exitFee: Math.max(0, a.feesPaid - b.feesPaid),
      });
    }
  }
  return items;
}

export interface ForcedSaleAlternative {
  vehicleId: VehicleId;
  label: string;
  value: number;
}

export interface ForcedSaleProps {
  /** State immediately before the trial liquidation — supplies the month
   * (for period-accurate pricing) and is never mutated here. */
  before: GameState;
  /** The default plan — what tick.ts's own solvencyCheck already computed. */
  items: ForcedSaleItem[];
  shortfall: number;
  /** Other still-sellable holdings not already in the default plan (§12.3's
   * "[ Sell something else ]"). Empty once nothing remains. */
  alternatives: ForcedSaleAlternative[];
  /** Vertex unsellable, Halcyon at £0, everything else exhausted — nothing
   * left. The run ends; this is that state, not an error. */
  nothingLeft: boolean;
  /** Commits the plan currently shown (the default plan, unless the player
   * picked an alternative — see onPickAlternative). */
  onConfirm: () => void;
  /** Re-tries the sale prioritising this vehicle instead of the default
   * order (§12.3: a real choice, not a report of a fait accompli). */
  onPickAlternative: (vehicleId: VehicleId) => void;
}

export function ForcedSale({
  before,
  items,
  shortfall,
  alternatives,
  nothingLeft,
  onConfirm,
  onPickAlternative,
}: ForcedSaleProps) {
  const [choosing, setChoosing] = useState(false);
  const totalRaised = items.reduce((sum, i) => sum + i.soldAmount - i.exitFee, 0);

  let body: ReactNode;
  let buttons: { label: string; action: 'sell-to-cover' | 'sell-something-else' | 'acknowledge'; isDefault?: boolean }[];

  if (nothingLeft) {
    body = (
      <div className="forced-sale">
        <p className="comet-dialog__text">
          There is nothing left to sell. The shortfall cannot be covered.
        </p>
      </div>
    );
    buttons = [{ label: 'Continue', action: 'acknowledge', isDefault: true }];
  } else if (choosing) {
    body = (
      <div className="forced-sale">
        <p className="comet-dialog__text">Sell which holding instead?</p>
        <ul className="forced-sale__list">
          {alternatives.map((a) => (
            <li key={a.vehicleId}>
              <button
                type="button"
                className="bevel-out forced-sale__pick"
                onClick={() => onPickAlternative(a.vehicleId)}
              >
                {a.label} — <Money amount={a.value} month={before.month} variant="inline" paired={false} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
    buttons = [{ label: 'Back', action: 'acknowledge', isDefault: true }];
  } else {
    body = (
      <div className="forced-sale">
        <p className="comet-dialog__text">
          This bill outstrips your cash. At today&rsquo;s prices, this is what covers it.
        </p>
        <ul className="forced-sale__list">
          {items.map((i) => (
            <li key={i.vehicleId} className="forced-sale__item">
              Sell <Money amount={i.soldAmount} month={before.month} variant="inline" paired={false} /> of{' '}
              {i.label}
              {i.exitFee > 0 && (
                <>
                  {' '}
                  (exit fee <Money amount={i.exitFee} month={before.month} variant="inline" paired={false} />)
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="forced-sale__totals">
          Shortfall <Money amount={shortfall} month={before.month} variant="inline" paired={false} /> &middot;
          raised <Money amount={totalRaised} month={before.month} variant="inline" paired={false} />
        </div>
      </div>
    );
    buttons = [
      { label: 'Sell to cover', action: 'sell-to-cover', isDefault: true },
      ...(alternatives.length > 0
        ? [{ label: 'Sell something else', action: 'sell-something-else' as const }]
        : []),
    ];
  }

  return (
    <Dialog
      dialog={{
        id: 'forced-sale',
        eventId: 'forced-sale',
        title: 'Forced sale',
        contentId: 'forced-sale',
        cls: 'shock',
        raisedMonth: before.month,
        amount: shortfall,
        buttons,
      }}
      bodyOverride={body}
      onResolve={(action) => {
        if (action === 'sell-something-else') {
          setChoosing(true);
          return;
        }
        if (choosing && action === 'acknowledge') {
          setChoosing(false);
          return;
        }
        onConfirm();
      }}
    />
  );
}
