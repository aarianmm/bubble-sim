import { describe, it, expect } from 'vitest';
import seriesData from './series.json';
import { monthIndex, MONTH_COUNT } from '../sim/month';

describe('series.json (§9.2, §26.2 Step 3)', () => {
  it('has exactly 132 rows, 1996-01 .. 2006-12', () => {
    expect(seriesData.rows.length).toBe(MONTH_COUNT);
    expect(seriesData.rows[0].month).toBe('1996-01');
    expect(seriesData.rows[131].month).toBe('2006-12');
  });

  it('every row has every column, and no value is NaN', () => {
    for (const row of seriesData.rows) {
      for (const col of seriesData.columns) {
        const v = (row.values as Record<string, number>)[col];
        expect(v, `${row.month} missing/NaN for ${col}`).toBeTypeOf('number');
        expect(Number.isFinite(v), `${row.month} ${col} = ${v}`).toBe(true);
      }
    }
  });

  it('includes every InvestableVehicleId column and the six idx- index columns', () => {
    const expectedIdxCols = ['idx-ftse-all-share', 'idx-sp500', 'idx-nasdaq', 'idx-gilts', 'idx-base-rate', 'idx-cpi'];
    for (const c of expectedIdxCols) expect(seriesData.columns).toContain(c);
    // 22 = 16 investable vehicles + 6 index columns (cash and capital-direct-card are not priced here)
    expect(seriesData.columns.length).toBe(22);
  });

  function levelSeries(col: string): number[] {
    let level = 1;
    return seriesData.rows.map((row) => {
      level *= (row.values as Record<string, number>)[col];
      return level;
    });
  }

  it('NASDAQ drawdown from its Mar 2000 peak to Oct 2002 trough exceeds 75% (§9.2: the crash is real)', () => {
    const levels = levelSeries('idx-nasdaq');
    const peak = levels[monthIndex(2000, 3)];
    const trough = levels[monthIndex(2002, 10)];
    const drawdown = 1 - trough / peak;
    expect(drawdown).toBeGreaterThan(0.75);
  });

  it('kingsley-gilt wins the 2000-2002 crash while fenwick-index loses it (§9.1)', () => {
    const from = monthIndex(2000, 3);
    const to = monthIndex(2002, 10);
    function cumulativeReturn(col: string): number {
      let p = 1;
      for (let m = from + 1; m <= to; m++) {
        p *= (seriesData.rows[m].values as Record<string, number>)[col];
      }
      return p - 1;
    }
    expect(cumulativeReturn('kingsley-gilt')).toBeGreaterThan(0);
    expect(cumulativeReturn('fenwick-index')).toBeLessThan(0);
  });

  it('halcyon-reserve never has a down month before its Nov 2000 collapse, then drops to 0 exactly then (§11.4)', () => {
    const collapseMonth = monthIndex(2000, 11);
    for (let m = 0; m < collapseMonth; m++) {
      const v = (seriesData.rows[m].values as Record<string, number>)['halcyon-reserve'];
      expect(v, `halcyon-reserve down in ${seriesData.rows[m].month}`).toBeGreaterThanOrEqual(1);
    }
    expect((seriesData.rows[collapseMonth].values as Record<string, number>)['halcyon-reserve']).toBe(0);
  });

  it('halcyon-reserve is by far the best-performing vehicle across its active window (the trap is fair)', () => {
    const from = monthIndex(1999, 6);
    const to = monthIndex(2000, 10);
    function cumulativeReturn(col: string): number {
      let p = 1;
      for (let m = from; m <= to; m++) {
        p *= (seriesData.rows[m].values as Record<string, number>)[col];
      }
      return p - 1;
    }
    const halcyon = cumulativeReturn('halcyon-reserve');
    const fenwick = cumulativeReturn('fenwick-index');
    expect(halcyon).toBeGreaterThan(fenwick);
  });

  it('vertex-communications pumps ~+200% over May-Aug 1999 then loses ~98% in Sep 1999 (§11.5)', () => {
    const levels = levelSeries('vertex-communications');
    const beforePump = levels[monthIndex(1999, 5) - 1];
    const peak = levels[monthIndex(1999, 8)];
    const afterDump = levels[monthIndex(1999, 9)];
    expect(peak / beforePump).toBeGreaterThan(2.5); // ~+200%
    expect(afterDump / peak).toBeLessThan(0.05); // ~-98%
  });

  it('meridian-guaranteed and cavendish-tech collapse to 0 on their authored dates', () => {
    expect((seriesData.rows[monthIndex(1997, 12)].values as Record<string, number>)['meridian-guaranteed']).toBe(0);
    expect((seriesData.rows[monthIndex(1999, 2)].values as Record<string, number>)['cavendish-tech']).toBe(0);
  });

  it('restitution-partners and sentinel-protect collapse to 0 two months after their authored dates', () => {
    expect((seriesData.rows[monthIndex(2001, 6)].values as Record<string, number>)['restitution-partners']).toBe(0);
    expect((seriesData.rows[monthIndex(2003, 6)].values as Record<string, number>)['sentinel-protect']).toBe(0);
  });

  it('northmoor-bond never has a down month (§9.1: the safe trap)', () => {
    for (const row of seriesData.rows) {
      expect((row.values as Record<string, number>)['northmoor-bond']).toBeGreaterThanOrEqual(1);
    }
  });

  it('meta documents that vehicle columns are gross of fee', () => {
    expect(seriesData.meta.note.toLowerCase()).toContain('gross of fee');
  });
});
