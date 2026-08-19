/**
 * The shape of the generated data files. Both are emitted by
 * `scripts/build-series.ts` and are NEVER hand-edited (§26.2 rule 7).
 *
 * Convention: **a vehicle's series column name is its `VehicleId`.** That is the
 * whole interface between the data generator and the content that names funds —
 * no lookup table, nothing to keep in sync.
 */

import type { InvestableVehicleId } from '../sim/ids';

/** Raw index columns, carried alongside the vehicle columns. */
export type IndexColumn =
  | 'idx-ftse-all-share'
  | 'idx-sp500'
  | 'idx-nasdaq'
  | 'idx-gilts'
  | 'idx-base-rate'
  | 'idx-cpi';

export type SeriesColumn = InvestableVehicleId | IndexColumn;

/** One row per month, 132 of them, Jan 1996 .. Dec 2006 (§9.2). */
export interface MarketSeriesRow {
  /** "1996-01" */
  month: string;
  /**
   * Monthly multiplier. 1.0142 means +1.42% that month. A collapsed vehicle
   * carries 0 in its collapse month and 1 thereafter (§11.4).
   * `idx-base-rate` and `idx-cpi` carry levels, not multipliers.
   */
  values: Record<SeriesColumn, number>;
}

export interface MarketSeriesFile {
  meta: {
    generatedBy: string;
    generatedFrom: string;
    /** Provenance for every series. §5.1: real indices, cited. */
    sources: string[];
    note: string;
  };
  columns: SeriesColumn[];
  rows: MarketSeriesRow[];
}

/* ------------------------------------------------------------------ */

/**
 * The expense basket's underlying series (§8.2). Annual index levels,
 * 1996 = 100. The blended rate is an OUTPUT of the basket, never an input —
 * this is the single most important defensive fact in the project.
 */
export interface BasketSeriesFile {
  meta: {
    generatedBy: string;
    sources: string[];
    note: string;
  };
  /** 1996 .. 2006 */
  years: number[];
  /** component -> index level per year, 1996 = 100 */
  levels: {
    rent: number[];
    food: number[];
    bills: number[];
    transport: number[];
    other: number[];
    /** Headline CPI, for the dual-money deflator (§19.4). */
    cpi: number[];
  };
}
