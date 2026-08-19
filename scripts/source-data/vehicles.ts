/**
 * Per-vehicle fee schedule and collapse month — the SINGLE SOURCE OF TRUTH for
 * fee rates (§9.3, §11.5). `build-series.ts` imports it to know which vehicles
 * get a collapse month zeroed in the multiplier series; the content agent's
 * fact sheets (Step 6) and the sim's fee deduction (Step 7, §7.3 step 4) must
 * both read fee numbers from here rather than re-authoring them, so the fact
 * sheet and the actual deduction never drift apart.
 *
 * Fees are deducted PRO RATA MONTHLY IN THE SIM, never baked into
 * series.json's multipliers (§9.3) — this file is data, not computation.
 *
 * `collapseMonth` is the month index whose multiplier is forced to 0 (or, for
 * vertex-communications, the month the crash lands even though it doesn't
 * fall all the way to zero — see build-series.ts). `null` = never collapses.
 */

import type { InvestableVehicleId } from '../../src/sim/ids';
import { monthIndex } from '../../src/sim/month';

export interface VehicleFeeSchedule {
  id: InvestableVehicleId;
  annualFeePct: number;
  exitFeePct: number;
  performanceFeePct: number;
  collapseMonth: number | null;
}

export const VEHICLE_FEES: readonly VehicleFeeSchedule[] = [
  // Safe
  { id: 'northmoor-bond', annualFeePct: 0, exitFeePct: 0, performanceFeePct: 0, collapseMonth: null },
  // Correct
  { id: 'fenwick-index', annualFeePct: 0.4, exitFeePct: 0, performanceFeePct: 0, collapseMonth: null },
  { id: 'fenwick-world', annualFeePct: 0.5, exitFeePct: 0, performanceFeePct: 0, collapseMonth: null },
  // Reasonable
  { id: 'kingsley-gilt', annualFeePct: 0.5, exitFeePct: 0, performanceFeePct: 0, collapseMonth: null },
  { id: 'marlow-corporate-bond', annualFeePct: 0.6, exitFeePct: 0, performanceFeePct: 0, collapseMonth: null },
  { id: 'brightwell-pension', annualFeePct: 0.75, exitFeePct: 0, performanceFeePct: 0, collapseMonth: null },
  // Mediocre — "legitimate, and still terrible" (§9.1)
  { id: 'technova-growth', annualFeePct: 5.0, exitFeePct: 1.0, performanceFeePct: 0, collapseMonth: null },
  { id: 'ashcombe-managed', annualFeePct: 3.0, exitFeePct: 0, performanceFeePct: 20, collapseMonth: null },
  // Concentrated
  { id: 'granville-plc', annualFeePct: 0, exitFeePct: 0, performanceFeePct: 0, collapseMonth: null },
  { id: 'quicksilver-com', annualFeePct: 0, exitFeePct: 0, performanceFeePct: 0, collapseMonth: null },
  // Fatal (§11.5) — collapse dates are exact, authored, not tuned.
  { id: 'meridian-guaranteed', annualFeePct: 0, exitFeePct: 0, performanceFeePct: 0, collapseMonth: monthIndex(1997, 12) },
  { id: 'cavendish-tech', annualFeePct: 8.0, exitFeePct: 0, performanceFeePct: 0, collapseMonth: monthIndex(1999, 2) },
  { id: 'halcyon-reserve', annualFeePct: 0, exitFeePct: 0, performanceFeePct: 0, collapseMonth: monthIndex(2000, 11) },
  // Vertex doesn't fall to zero (-98%, then unsellable) — collapseMonth marks
  // the crash month; sellableAfterCollapse: false lives in the VehicleDef
  // (Step 6, owned by the content agent), not here.
  { id: 'vertex-communications', annualFeePct: 0, exitFeePct: 0, performanceFeePct: 0, collapseMonth: monthIndex(1999, 9) },
  { id: 'restitution-partners', annualFeePct: 0, exitFeePct: 0, performanceFeePct: 0, collapseMonth: monthIndex(2001, 6) },
  { id: 'sentinel-protect', annualFeePct: 0, exitFeePct: 0, performanceFeePct: 0, collapseMonth: monthIndex(2003, 6) },
] as const;
