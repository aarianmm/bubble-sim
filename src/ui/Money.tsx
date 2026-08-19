/**
 * BUBBLE — the dual money display (Step 16, §19.4).
 *
 * "Every figure appears twice: period-accurate, and in 1996 purchasing
 * power." This is the one component every page imports for every £ figure
 * in the game — net worth, salary, expense lines, portfolio rows, offers,
 * shocks, the death card. There is exactly one global toggle
 * (`state.flags.moneyBase`, flipped by `{ type: 'toggle-money-base' }`) and
 * it lives on GameState, not in any component's local state, so flipping it
 * anywhere — the `View > Money as 1996 £` menu item (src/App.tsx) or a
 * click on a headline figure here — swaps every mounted <Money> at once.
 *
 * Base year is 1996 (§19.4: "comparing to your own starting point... makes
 * the erosion personal"), via sim/selectors.ts's `to1996` — never
 * recomputed here.
 */
import { useEngine } from './engine';
import { to1996 } from '../sim/selectors';
import { monthLabelTitle, type MonthIndex } from '../sim/month';
import './money.css';

export type MoneyVariant = 'headline' | 'inline' | 'table-cell';

export interface MoneyProps {
  /** Amount in period-accurate pounds, priced at `month`. */
  amount: number;
  /** Which month's prices `amount` is denominated in. Defaults to the
   * engine's current month — right for salary, this-month expenses and net
   * worth; pass the event's own month for a shock, offer or death-card
   * figure struck at a different point in the decade. */
  month?: MonthIndex;
  variant?: MoneyVariant;
  /**
   * Render only the toggle-appropriate figure, with no second line beneath
   * it — for contexts (a comparison aside, a dense inline mention) where
   * the full primary/secondary pairing would be noise. Defaults to true:
   * every figure gets its pair unless a caller opts out.
   */
  paired?: boolean;
  /**
   * Click toggles the global display base (§19.4: "by clicking the
   * headline figure on /home"). Defaults to true for `variant="headline"`,
   * false otherwise — any figure can opt in or out explicitly.
   */
  interactive?: boolean;
  className?: string;
}

/** Courier-styled £, comma-grouped, minus sign (not a hyphen) on negatives —
 * the same formatting rule for every money literal in the product. Exported
 * so callers that need a bare figure (no pairing, no toggle) stay consistent
 * with what <Money> itself renders. */
export function formatPounds(amount: number): string {
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded).toLocaleString('en-GB');
  return rounded < 0 ? `−£${abs}` : `£${abs}`;
}

export function Money({
  amount,
  month,
  variant = 'inline',
  paired = true,
  interactive,
  className,
}: MoneyProps) {
  const { state, dispatch } = useEngine();
  const atMonth = month ?? state.month;
  const baseIs1996 = state.flags.moneyBase === '1996';
  const in1996 = to1996(amount, atMonth);
  const primaryAmount = baseIs1996 ? in1996 : amount;
  const secondaryAmount = baseIs1996 ? amount : in1996;
  const clickable = interactive ?? variant === 'headline';

  const secondaryLabel =
    variant === 'headline'
      ? baseIs1996
        ? `in ${monthLabelTitle(atMonth)} money`
        : 'in 1996 money'
      : null;

  function handleClick() {
    dispatch({ type: 'toggle-money-base', month: state.month });
  }

  const classes = ['money', `money--${variant}`, clickable && 'money--interactive', className]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <span className="money__primary">{formatPounds(primaryAmount)}</span>
      {paired && (
        <span className="money__secondary">
          {formatPounds(secondaryAmount)}
          {secondaryLabel && <span className="money__secondary-label"> {secondaryLabel}</span>}
        </span>
      )}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        className={classes}
        onClick={handleClick}
        aria-pressed={baseIs1996}
        aria-label="Toggle money display between period-accurate and 1996 pounds"
      >
        {body}
      </button>
    );
  }

  return <div className={classes}>{body}</div>;
}
