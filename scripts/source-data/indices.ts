/**
 * Real-world index data underlying /src/data/series.json (§9.2, §26.2 Step 3).
 *
 * PROVENANCE — read before touching a number:
 *
 * These are NOT a live feed and NOT a claimed tick-by-tick archive. This build
 * runs fully offline (§25.1/§25.4: no network at runtime, no CDN, no fetch).
 * The levels below are **historical month-end figures reconstructed from
 * public record to the nearest reasonable precision** — anchored at quarterly
 * (and, through the volatile 1999-2003 window, monthly) checkpoints matching
 * widely published closing levels for each index, then interpolated between
 * checkpoints. They are for gameplay shape and magnitude, not for citation as
 * exact historical closes.
 *
 * Sources for the anchor checkpoints (public, widely republished figures):
 *  - FTSE All-Share Index — London Stock Exchange / FTSE Russell, monthly closes.
 *  - S&P 500 — Standard & Poor's, monthly closes.
 *  - NASDAQ Composite — Nasdaq OMX, monthly closes. Peak ~5048 (10 Mar 2000),
 *    trough ~1114 (9 Oct 2002) are the two figures most load-bearing for this
 *    game and are reproduced directly (§9.2: "the crash is not tuned").
 *  - Bank of England official Bank Rate — boe.co.uk/monetary-policy history,
 *    the actual policy decisions, spaced as they occurred.
 *  - UK gilt total return: NOT a reconstruction of a published gilt index
 *    (e.g. FTSE Actuaries UK Gilts All Stocks) — we don't have one to hand
 *    offline to the needed precision. Instead it is an explicitly-labelled
 *    PROXY, modelled in build-series.ts from this file's Bank Rate path using
 *    a constant-duration approximation (duration ≈ 7 years) plus running
 *    coupon carry. That is a standard bond-fund approximation technique, and
 *    it is why kingsley-gilt (§9.1 "wins during the crash") does exactly
 *    that: yields fell sharply in 2000-2003, so a ~7-year-duration book gains.
 *
 * Between anchors, levels are interpolated log-linearly (smooth compounding)
 * and given a small deterministic wiggle so equity series don't read as
 * piecewise-flat between checkpoints — real indices have monthly texture.
 * The wiggle is a fixed function of the month index (sin/cos), never
 * `Math.random()` (banned everywhere, §25.1) and never wall-clock.
 */

export type Anchor = readonly [monthIndex: number, level: number];

/** FTSE All-Share, month-end index level. Peaks Dec 1999/Jan 2000, bottoms Mar 2003. */
export const FTSE_ALL_SHARE_ANCHORS: readonly Anchor[] = [
  [0, 1621], [3, 1665], [6, 1700], [9, 1790], [11, 1874],
  [14, 1980], [17, 2070], [20, 2150], [23, 2216],
  [26, 2350], [29, 2480], [31, 2100], [35, 2373],
  [38, 2410], [41, 2477], [44, 2500], [47, 2867],
  [48, 2933], [50, 2900], [53, 2750], [56, 2600], [59, 2400],
  [62, 2150], [65, 2050], [68, 1780], [71, 1950],
  [74, 1900], [77, 1780], [80, 1650], [81, 1630], [83, 1700],
  [86, 1580],
  [89, 1780], [92, 1850], [95, 1980],
  [98, 2020], [101, 2060], [104, 2050], [107, 2150],
  [110, 2180], [113, 2230], [116, 2280], [119, 2350],
  [122, 2450], [125, 2750], [128, 2950], [131, 3221],
] as const;

/** S&P 500, month-end index level. Peaks Mar 2000, first bottoms Oct 2002. */
export const SP500_ANCHORS: readonly Anchor[] = [
  [0, 636], [3, 645], [6, 640], [9, 705], [11, 741],
  [14, 776], [17, 885], [20, 947], [23, 970],
  [26, 1102], [29, 1134], [31, 957], [35, 1229],
  [38, 1286], [41, 1373], [44, 1283], [47, 1469],
  [49, 1366], [50, 1499], [53, 1454], [56, 1437], [59, 1320],
  [62, 1160], [65, 1224], [68, 1041], [71, 1148],
  [74, 1147], [77, 990], [80, 815], [81, 800], [83, 880],
  [86, 848],
  [89, 975], [92, 996], [95, 1112],
  [98, 1126], [101, 1141], [104, 1115], [107, 1212],
  [110, 1181], [113, 1191], [116, 1229], [119, 1248],
  [122, 1295], [125, 1270], [128, 1336], [131, 1418],
] as const;

/** NASDAQ Composite, month-end index level. Peak ~5048 Mar 2000, trough ~1114 Oct 2002. */
export const NASDAQ_ANCHORS: readonly Anchor[] = [
  [0, 1005], [3, 1128], [6, 1042], [9, 1222], [11, 1291],
  [14, 1222], [17, 1442], [20, 1686], [23, 1570],
  [26, 1836], [29, 1895], [31, 1499], [35, 2193],
  [38, 2461], [41, 2686], [44, 2746], [47, 4069],
  [49, 4697], [50, 5048], [53, 3966], [56, 3673], [59, 2471],
  [62, 1840], [65, 2161], [68, 1499], [71, 1950],
  [74, 1845], [77, 1463], [80, 1172], [81, 1114], [83, 1336],
  [86, 1341],
  [89, 1623], [92, 1787], [95, 2003],
  [98, 1994], [101, 1974], [104, 1897], [107, 2175],
  [110, 1999], [113, 2057], [116, 2152], [119, 2205],
  [122, 2340], [125, 2172], [128, 2258], [131, 2415],
] as const;

/**
 * Bank of England official Bank Rate, percent p.a., at each checkpoint. Real
 * policy decisions, spaced roughly as they occurred (cuts 1998, 1999, 2001-03;
 * rises 1997, 2004-06).
 */
export const BASE_RATE_ANCHORS: readonly Anchor[] = [
  [0, 6.25], [5, 5.75], [11, 6.0],
  [17, 6.5], [23, 7.25],
  [29, 7.5], [35, 6.25],
  [41, 5.0], [47, 5.5],
  [50, 6.0], [59, 6.0],
  [65, 5.25], [71, 4.0],
  [77, 4.0], [83, 4.0],
  [89, 3.75], [95, 3.75],
  [101, 4.5], [107, 4.75],
  [113, 4.75], [119, 4.5],
  [125, 4.5], [131, 5.0],
] as const;

/** Headline CPI growth used for both idx-cpi (series.json) and basket.json's cpi column (§8.2). */
export const HEADLINE_CPI_ANNUAL_RATE = 0.025;

function findBracket(sorted: readonly Anchor[], m: number): [Anchor, Anchor] {
  if (m <= sorted[0][0]) return [sorted[0], sorted[0]];
  if (m >= sorted[sorted.length - 1][0]) {
    const last = sorted[sorted.length - 1];
    return [last, last];
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i][0] <= m && m <= sorted[i + 1][0]) return [sorted[i], sorted[i + 1]];
  }
  const last = sorted[sorted.length - 1];
  return [last, last];
}

/**
 * Deterministic monthly texture — a fixed function of month index, never
 * `Math.random()` (§25.1). Two incommensurate sine frequencies so it doesn't
 * repeat with a short visible period.
 */
function wiggle(m: number): number {
  return Math.sin(m * 0.9) * 0.6 + Math.sin(m * 2.37 + 1.1) * 0.4;
}

/**
 * Expand sparse anchor checkpoints to one level per month via log-linear
 * (smooth compounding) interpolation, plus a small deterministic wiggle for
 * monthly texture. `wiggleAmplitude` is a fraction (e.g. 0.006 = 0.6%) kept
 * small enough never to threaten an anchor's headline shape (§9.2: the crash
 * magnitude comes from the anchors, not from the texture).
 */
export function expandLevelsLog(
  anchors: readonly Anchor[],
  monthCount: number,
  wiggleAmplitude: number,
): number[] {
  const sorted = [...anchors].sort((a, b) => a[0] - b[0]);
  const out: number[] = [];
  for (let m = 0; m < monthCount; m++) {
    const [lo, hi] = findBracket(sorted, m);
    let level: number;
    if (lo[0] === hi[0]) {
      level = lo[1];
    } else {
      const t = (m - lo[0]) / (hi[0] - lo[0]);
      level = lo[1] * Math.pow(hi[1] / lo[1], t);
    }
    out.push(level * (1 + wiggleAmplitude * wiggle(m)));
  }
  return out;
}

/** Linear interpolation between checkpoints — used for Bank Rate (a percent, not a price). */
export function expandLevelsLinear(anchors: readonly Anchor[], monthCount: number): number[] {
  const sorted = [...anchors].sort((a, b) => a[0] - b[0]);
  const out: number[] = [];
  for (let m = 0; m < monthCount; m++) {
    const [lo, hi] = findBracket(sorted, m);
    if (lo[0] === hi[0]) {
      out.push(lo[1]);
    } else {
      const t = (m - lo[0]) / (hi[0] - lo[0]);
      out.push(lo[1] + (hi[1] - lo[1]) * t);
    }
  }
  return out;
}
