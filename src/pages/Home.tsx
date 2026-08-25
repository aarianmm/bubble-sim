/**
 * BUBBLE — /home, the dashboard (Step 17, §22.1).
 *
 * "The headline number is the emotional core of the screen." Everything
 * else here — the masthead, the THIS MONTH panel, the ticker — is built
 * around giving that pairing room: a growing nominal figure over a
 * changing 2026 purchasing-power figure is the game's thesis rendered as
 * typography, not explained in a sentence.
 *
 * Pure presentation over selectors — no game logic lives here. `netWorth`
 * and `monthSummary` (src/sim/selectors.ts) are the only source of the
 * numbers; <Money> (src/ui/Money.tsx) is the only thing that formats one.
 */
import type { ComponentType, HTMLAttributes } from 'react';
import { useEngine } from '../ui/engine';
import { Money, formatPounds } from '../ui/Money';
import { netWorth, monthSummary, to2026 } from '../sim/selectors';
import { monthLabel, monthIndex, yearOf, type MonthIndex } from '../sim/month';
import { MONTHLY_PAY } from '../sim/types';
import { tickerTextForMonth } from '../content/ticker';
import { PerformanceChart } from '../ui/PerformanceChart';
import './home.css';

interface MarqueeProps extends HTMLAttributes<HTMLElement> {
  behavior?: 'scroll' | 'slide' | 'alternate';
  direction?: 'left' | 'right' | 'up' | 'down';
  scrollamount?: number;
  scrolldelay?: number;
  loop?: number | 'infinite';
}

// <marquee> has no entry in React's JSX.IntrinsicElements (it's obsolete),
// but it's still a real, functioning element, and §23 names it explicitly as
// one of the five things in the product allowed to move.
const Marquee = 'marquee' as unknown as ComponentType<MarqueeProps>;

type Trend = 'flat' | 'up' | 'down';

function trendOf(current: number, previous: number): Trend {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}

const TREND_GLYPH: Record<Trend, string> = { flat: '──', up: '▲', down: '▼' };

function TrendArrow({ trend }: { trend: Trend }) {
  return (
    <span className={`home-month__trend home-month__trend--${trend}`} aria-hidden="true">
      {TREND_GLYPH[trend]}
    </span>
  );
}

/** Jan of the year before `month`'s year — the same reference point
 * `monthSummary().wasLeftOver` (src/sim/selectors.ts) is struck at, clamped
 * to month 0 exactly as that selector clamps it. Recomputed here only to
 * know *which month* the figure belongs to, so <Money> can convert it to
 * 2026 pounds correctly — the pound value itself still comes from the
 * selector, never recalculated. */
function priorYearReferenceMonth(month: MonthIndex): MonthIndex {
  const firstOfThisYear = monthIndex(yearOf(month), 1);
  return Math.max(0, firstOfThisYear - 12);
}

export function Home() {
  const { state } = useEngine();
  const worth = netWorth(state);
  const summary = monthSummary(state);
  const wasMonth = priorYearReferenceMonth(state.month);
  // §22.1's "was £X" is the flip side of wasLeftOver: what the same
  // decade-fixed pay minus that January's basket left over.
  const wasOut = MONTHLY_PAY - summary.wasLeftOver;

  const payTrend = trendOf(summary.payIn, MONTHLY_PAY);
  const outTrend = trendOf(summary.out, wasOut);
  const leftOverTrend = trendOf(summary.leftOver, summary.wasLeftOver);
  const marketLevel = state.marketHistory.at(-1) ?? 100;
  const marketChange = marketLevel - 100;
  const realWealthHistory = state.wealthHistory.map((value, month) => to2026(value, month));

  return (
    <div className="home-page">
      <header className="home-masthead">
        <span className="home-masthead__brand">BUBBLE</span>
        <span className="home-masthead__month">{monthLabel(state.month)}</span>
      </header>
      <hr className="home-masthead__rule" />

      <div className="home-headline">
        <p className="home-headline__label">Y O U R&nbsp;&nbsp;&nbsp;M O N E Y</p>
        <Money amount={worth} variant="headline" className="home-headline__figure" />
      </div>

      <div className="home-dashboard">
        <section className="home-month bevel-out" aria-label="This month">
          <h2 className="home-month__title">THIS MONTH</h2>

          <div className="home-month__row">
            <span className="home-month__label">Pay in</span>
            <Money
              amount={summary.payIn}
              variant="inline"
              paired={false}
              interactive={false}
              className="home-month__value"
            />
            <TrendArrow trend={payTrend} />
          </div>

          <div className="home-month__row">
            <span className="home-month__label">Out</span>
            <Money
              amount={-summary.out}
              variant="inline"
              paired={false}
              interactive={false}
              className="home-month__value"
            />
            <TrendArrow trend={outTrend} />
          </div>

          <hr className="home-month__divider" />

          <div className="home-month__row">
            <span className="home-month__label">Left over</span>
            <Money
              amount={summary.leftOver}
              variant="inline"
              paired={false}
              interactive={false}
              className="home-month__value"
            />
            <TrendArrow trend={leftOverTrend} />
          </div>

          <div className="home-month__was">
            was{' '}
            <Money
              amount={summary.wasLeftOver}
              month={wasMonth}
              variant="inline"
              paired={false}
              interactive={false}
              className="home-month__was-value"
            />
          </div>
        </section>

        <div className="home-charts">
          <section className="home-chart bevel-in" aria-labelledby="home-market-title">
            <div className="home-chart__header">
              <div><span>MARKET</span><h2 id="home-market-title">NASDAQ COMPOSITE</h2></div>
              <strong>{marketLevel.toFixed(1)} <small>{marketChange >= 0 ? '+' : ''}{marketChange.toFixed(1)}%</small></strong>
            </div>
            <PerformanceChart
              series={[{ id: 'nasdaq', label: 'NASDAQ · Jan 1996 = 100', values: state.marketHistory, tone: 'market' }]}
              height={104}
              annotations={[{ month: monthIndex(2000, 3), label: 'MAR 00 PEAK' }]}
              ariaLabel={`NASDAQ Composite path through ${monthLabel(state.month)}, currently indexed at ${marketLevel.toFixed(1)} against 100 in January 1996`}
            />
          </section>

          <section className="home-chart bevel-in" aria-labelledby="home-wealth-title">
            <div className="home-chart__header">
              <div><span>PERSONAL</span><h2 id="home-wealth-title">YOUR WEALTH PATH</h2></div>
              <strong>{formatPounds(worth)} <small>{formatPounds(to2026(worth, state.month))} in 2026</small></strong>
            </div>
            <PerformanceChart
              series={[
                { id: 'wealth-period', label: 'period £', values: state.wealthHistory, tone: 'player' },
                { id: 'wealth-real', label: '2026 £', values: realWealthHistory, tone: 'real' },
              ]}
              height={104}
              ariaLabel={`Your wealth path through ${monthLabel(state.month)}: ${formatPounds(worth)} in period money, worth ${formatPounds(to2026(worth, state.month))} in 2026 money`}
            />
          </section>
        </div>
      </div>

      <footer className="home-ticker">
        <Marquee className="home-ticker__marquee" behavior="scroll" scrollamount={3}>
          {tickerTextForMonth(state.month)}
        </Marquee>
      </footer>

      <p className="home-disclaimer">
        Simulated. Historical data is real; every company and fund in this game is invented. This
        is not financial advice.
      </p>
    </div>
  );
}
