/**
 * Runtime `VehicleDef` registry (Step 7 seam — owned by this step, since tick.ts
 * needs a single typed lookup of fees, collapse months and site style per
 * vehicle). Built by joining three sources that must never drift apart:
 *
 *  - `scripts/source-data/vehicles.ts` — the fee/collapse SOURCE OF TRUTH (§9.3).
 *  - `src/content/factsheets.ts` — name, manager, isScam-relevant flags, the
 *    fact sheet itself (§22.4).
 *  - `src/content/offerpages.ts` — site style and URL (§21).
 *
 * Two fields have no upstream source and are authored here, within the
 * ranges the spec sets:
 *  - `acceptFee` (§11.1: "£25-£150" admin fee charged the moment a SCAM is
 *    accepted; legit/mediocre vehicles charge nothing to accept — the cost of
 *    those is the annual fee, already covered). Restitution Partners and
 *    Sentinel Protect quote their own admin/protection fee on the fact sheet
 *    (§11.5's damage column) so those two numbers are taken verbatim from
 *    `factsheets.ts` rather than invented twice.
 *  - `sellableAfterCollapse` (§11.5): false only for Vertex Communications —
 *    "the pump, +200% then -98% and unsellable." Every other vehicle,
 *    including the two that go all the way to £0 (Meridian, Cavendish,
 *    Halcyon), is left sellable — selling £0 is a no-op, so this only ever
 *    matters for Vertex.
 */

import type { VehicleDef, VehicleTier } from './types';
import type { VehicleId } from './ids';
import { VEHICLE_IDS } from './ids';
import { VEHICLE_FEES } from '../../scripts/source-data/vehicles';
import { FACT_SHEETS } from '../content/factsheets';
import { OFFER_PAGES } from '../content/offerpages';
import { SCAM_VEHICLE_IDS } from '../script/timeline';

const TIERS: Record<VehicleId, VehicleTier> = {
  cash: 'default',
  'northmoor-bond': 'safe',
  'fenwick-index': 'correct',
  'fenwick-world': 'correct',
  'kingsley-gilt': 'reasonable',
  'marlow-corporate-bond': 'reasonable',
  'brightwell-pension': 'reasonable',
  'technova-growth': 'mediocre',
  'ashcombe-managed': 'mediocre',
  'granville-plc': 'concentrated',
  'quicksilver-com': 'concentrated',
  'meridian-guaranteed': 'fatal',
  'cavendish-tech': 'fatal',
  'halcyon-reserve': 'fatal',
  'vertex-communications': 'fatal',
  'restitution-partners': 'fatal',
  'sentinel-protect': 'fatal',
  'capital-direct-card': 'negative',
};

/** §11.1 admin fee, £25-£150, authored per scam (see file header). */
const SCAM_ACCEPT_FEES: Record<string, number> = {
  'meridian-guaranteed': 25, // "the amateur one" (§11.5) — cheapest entry
  'cavendish-tech': 75,
  'halcyon-reserve': 100,
  'vertex-communications': 50,
  // These two quote their own fee on the fact sheet (§11.5 damage column) —
  // taken from there verbatim, not re-authored.
  'restitution-partners': 150,
  'sentinel-protect': 45,
};

const FEE_LOOKUP = new Map(VEHICLE_FEES.map((f) => [f.id, f]));

function buildVehicle(id: VehicleId): VehicleDef {
  const sheet = FACT_SHEETS[id];
  const fees = FEE_LOOKUP.get(id as never);
  const page = id === 'cash' ? undefined : OFFER_PAGES[id as Exclude<VehicleId, 'cash'>];
  const isScam = SCAM_VEHICLE_IDS.has(id);

  return {
    id,
    name: sheet.name,
    manager: sheet.manager,
    tier: TIERS[id],
    // Cash and the card aren't priced from series.json (§9.2); the id itself
    // is a harmless, never-looked-up placeholder for those two.
    seriesColumn: fees?.id ?? id,
    annualFeePct: fees?.annualFeePct ?? 0,
    exitFeePct: fees?.exitFeePct ?? 0,
    performanceFeePct: fees?.performanceFeePct ?? 0,
    isScam,
    acceptFee: isScam ? (SCAM_ACCEPT_FEES[id] ?? 0) : 0,
    collapseMonth: fees?.collapseMonth ?? null,
    sellableAfterCollapse: id !== 'vertex-communications',
    siteStyle: page?.siteStyle ?? 'plain',
    url: page?.url ?? 'about:cash',
    factSheet: sheet,
  };
}

export const VEHICLES: Record<VehicleId, VehicleDef> = Object.fromEntries(
  VEHICLE_IDS.map((id) => [id, buildVehicle(id)]),
) as Record<VehicleId, VehicleDef>;
