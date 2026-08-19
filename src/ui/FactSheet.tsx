/**
 * §22.4 — the fact sheet. "Identical layout for every vehicle, legit or
 * otherwise... The layout is the lesson." This one component renders every
 * one of the 17 vehicles from src/content/factsheets.ts; only the field
 * values differ, never the markup shape, never the colours (§21 rule 3 —
 * the sheet is the one page element that cannot be styled by siteStyle).
 *
 * §11.2 rule 2: the sheet is one click from the accept button, free and
 * untimed — `backHref`/`acceptHref` are real URLs so <GameLink> gives the
 * §19.3 status-bar hover preview for free, same as every other CTA in the
 * game.
 */
import { GameLink } from '../chrome/router';
import type { FactSheet as FactSheetData } from '../sim/types';
import './factsheet.css';

export interface FactSheetProps {
  sheet: FactSheetData;
  /** URL the [ Back ] link returns to — the offer page itself. */
  backHref: string;
  /** URL the [ Accept ] link points at — same destination the offer
   * page's own accept CTA uses, so the decision fires identically
   * whichever button the player used. */
  acceptHref: string;
}

interface FieldRow {
  label: string;
  value: string;
}

function fieldRows(sheet: FactSheetData): { identity: FieldRow[]; terms: FieldRow[] } {
  return {
    identity: [
      { label: 'Name', value: sheet.name },
      { label: 'Manager', value: sheet.manager },
    ],
    terms: [
      { label: 'Annual fee', value: sheet.annualFee },
      { label: 'Exit fee', value: sheet.exitFee },
      { label: 'Holdings', value: sheet.holdings },
      { label: 'Launched', value: sheet.launched },
      { label: 'Regulated by', value: sheet.regulatedBy },
      { label: 'Minimum return', value: sheet.minimumReturn },
      { label: 'Introducer commission', value: sheet.introducerCommission },
    ],
  };
}

/**
 * §11.4 — compounds the monthly-return series into a cumulative value line
 * before plotting, so "no down months" reads as a literal property of the
 * drawn line (it never slopes down) rather than something asserted in
 * copy. A real fund's sheet, plotted the same way, shows real dips.
 */
function cumulativeSeries(monthlyPct: number[]): number[] {
  let v = 100;
  const series = [v];
  for (const pct of monthlyPct) {
    v = v * (1 + pct / 100);
    series.push(v);
  }
  return series;
}

export interface ReturnSparklineProps {
  returnChart: number[];
  width?: number;
  height?: number;
  className?: string;
}

/** Exported so the slick offer band (§21 rule 1) can reuse the exact same
 * drawing logic at a larger size — the tell is real everywhere it appears,
 * including on the best-looking page in the game. */
export function ReturnSparkline({
  returnChart,
  width = 96,
  height = 22,
  className,
}: ReturnSparklineProps) {
  const pad = 2;
  const series = cumulativeSeries(returnChart);
  let d: string;
  if (series.length < 2) {
    d = `M${pad},${height / 2} L${width - pad},${height / 2}`;
  } else {
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const stepX = (width - pad * 2) / (series.length - 1);
    const points = series.map((v, i) => {
      const x = pad + i * stepX;
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    d = `M${points.join(' L')}`;
  }
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export function FactSheet({ sheet, backHref, acceptHref }: FactSheetProps) {
  const { identity, terms } = fieldRows(sheet);
  return (
    <div className="factsheet">
      <h2 className="factsheet__title">FUND FACT SHEET</h2>
      <table className="factsheet__table">
        <tbody>
          {identity.map((row) => (
            <tr key={row.label}>
              <td className="factsheet__label">{row.label}</td>
              <td className="factsheet__value">{row.value}</td>
            </tr>
          ))}
          <tr className="factsheet__divider">
            <td colSpan={2} />
          </tr>
          <tr className="factsheet__return-row">
            <td className="factsheet__label">12-month return</td>
            <td className="factsheet__value">
              <span>{sheet.twelveMonthReturn}</span>
              <ReturnSparkline
                returnChart={sheet.returnChart}
                className="factsheet__sparkline"
              />
            </td>
          </tr>
          {terms.map((row) => (
            <tr key={row.label}>
              <td className="factsheet__label">{row.label}</td>
              <td className="factsheet__value">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="factsheet__actions">
        <GameLink href={backHref} className="factsheet__button">
          [ Back ]
        </GameLink>
        <GameLink href={acceptHref} className="factsheet__button">
          [ Accept ]
        </GameLink>
      </div>
    </div>
  );
}
