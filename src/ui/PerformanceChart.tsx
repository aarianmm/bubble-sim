import { MONTH_COUNT, monthIndex, monthLabelTitle, type MonthIndex } from '../sim/month';
import './performance-chart.css';

const WIDTH = 600;
const PAD_X = 14;
const PAD_Y = 12;

export interface PerformanceSeries {
  id: string;
  label: string;
  values: readonly number[];
  tone: 'market' | 'player' | 'real';
}

export interface ChartAnnotation {
  month: MonthIndex;
  label: string;
}

function finiteValues(values: readonly number[]): number[] {
  return values.filter(Number.isFinite);
}

export function chartPath(
  values: readonly number[],
  width: number,
  height: number,
  domain: { min: number; max: number },
): string {
  if (values.length === 0) return '';
  const range = domain.max - domain.min || 1;
  const stepX = (width - PAD_X * 2) / (MONTH_COUNT - 1);
  return values.map((value, index) => {
    const x = PAD_X + index * stepX;
    const y = height - PAD_Y - ((value - domain.min) / range) * (height - PAD_Y * 2);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

/** The area is always mounted so era CSS—not React—decides when charts gain
 * depth. The 1996 tokens make it invisible; later interfaces progressively
 * reveal it without changing data or component structure. */
export function chartAreaPath(
  values: readonly number[],
  width: number,
  height: number,
  domain: { min: number; max: number },
): string {
  const line = chartPath(values, width, height, domain);
  if (!line) return '';
  const lastX = PAD_X + ((values.length - 1) / (MONTH_COUNT - 1)) * (width - PAD_X * 2);
  const baseline = height - PAD_Y;
  return `${line} L${lastX.toFixed(1)},${baseline.toFixed(1)} L${PAD_X},${baseline.toFixed(1)} Z`;
}

function domainFor(series: readonly PerformanceSeries[]): { min: number; max: number } {
  const values = finiteValues(series.flatMap((item) => [...item.values]));
  if (values.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.08, Math.abs(max) * 0.02, 1);
  return { min: min - padding, max: max + padding };
}

export function PerformanceChart({
  series,
  height = 120,
  ariaLabel,
  annotations = [],
  scale = 'shared',
}: {
  series: readonly PerformanceSeries[];
  height?: number;
  ariaLabel: string;
  annotations?: readonly ChartAnnotation[];
  scale?: 'shared' | 'independent';
}) {
  const sharedDomain = domainFor(series);
  const plotWidth = WIDTH - PAD_X * 2;
  const visibleAnnotations = annotations.filter((item) => series.some((line) => line.values.length > item.month));
  const hasData = series.some((line) => line.values.length > 0);
  const years = [1996, 1998, 2000, 2002, 2004, 2006];

  return (
    <div className="performance-chart">
      <div className="performance-chart__legend" aria-hidden="true">
        {series.map((item) => (
          <span key={item.id}><i className={`performance-chart__key performance-chart__key--${item.tone}`} />{item.label}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${height + 20}`} role="img" aria-label={ariaLabel}>
        <rect
          className="performance-chart__plot"
          x={PAD_X}
          y={PAD_Y}
          width={plotWidth}
          height={height - PAD_Y * 2}
        />
        <g className="performance-chart__grid" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line key={ratio} x1={PAD_X} x2={WIDTH - PAD_X} y1={PAD_Y + ratio * (height - PAD_Y * 2)} y2={PAD_Y + ratio * (height - PAD_Y * 2)} />
          ))}
        </g>
        <g className="performance-chart__year-grid" aria-hidden="true">
          {years.map((year) => {
            const month = monthIndex(year, 1);
            const x = PAD_X + (month / (MONTH_COUNT - 1)) * plotWidth;
            return <line key={year} x1={x} x2={x} y1={PAD_Y} y2={height - PAD_Y} />;
          })}
        </g>
        {series.map((item) => {
          const domain = scale === 'independent' ? domainFor([item]) : sharedDomain;
          const area = chartAreaPath(item.values, WIDTH, height, domain);
          return area
            ? <path key={`${item.id}-area`} d={area} className={`performance-chart__area performance-chart__area--${item.tone}`} />
            : null;
        })}
        {visibleAnnotations.map((annotation) => {
          const x = PAD_X + (annotation.month / (MONTH_COUNT - 1)) * plotWidth;
          return (
            <g key={`${annotation.month}-${annotation.label}`} className="performance-chart__annotation">
              <line x1={x} x2={x} y1={PAD_Y} y2={height - PAD_Y} />
              <text x={x + 4} y={PAD_Y + 8}>{annotation.label}</text>
            </g>
          );
        })}
        {series.map((item) => {
          const domain = scale === 'independent' ? domainFor([item]) : sharedDomain;
          const path = chartPath(item.values, WIDTH, height, domain);
          if (!path) return null;
          const lastIndex = item.values.length - 1;
          const lastValue = item.values[lastIndex];
          const range = domain.max - domain.min || 1;
          const x = PAD_X + (lastIndex / (MONTH_COUNT - 1)) * plotWidth;
          const y = height - PAD_Y - ((lastValue - domain.min) / range) * (height - PAD_Y * 2);
          return (
            <g key={item.id}>
              <path d={path} className={`performance-chart__line performance-chart__line--${item.tone}`} />
              <circle cx={x} cy={y} r="6" className={`performance-chart__point-halo performance-chart__point-halo--${item.tone}`} />
              <circle cx={x} cy={y} r="3" className={`performance-chart__point performance-chart__point--${item.tone}`} />
            </g>
          );
        })}
        {years.map((year) => {
          const month = monthIndex(year, 1);
          const x = PAD_X + (month / (MONTH_COUNT - 1)) * plotWidth;
          return <text key={year} x={x} y={height + 14} className="performance-chart__year">{String(year).slice(2)}</text>;
        })}
      </svg>
      {!hasData && <p className="performance-chart__empty">The first point appears when January 1996 closes.</p>}
      <span className="performance-chart__sr-only">
        {series.map((item) => {
          const lastIndex = item.values.length - 1;
          return lastIndex >= 0
            ? `${item.label}: ${item.values[lastIndex].toFixed(1)} at ${monthLabelTitle(lastIndex)}.`
            : `${item.label}: no data yet.`;
        }).join(' ')}
      </span>
    </div>
  );
}
