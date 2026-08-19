/**
 * Identity for everything the script can point at.
 *
 * OWNER: the content/script agent (Steps 5 & 6). Other agents import from here
 * and never edit it — that is what keeps the typed id the only interface
 * between content and code (§26.2 rule 6).
 *
 * §5.1: every firm, fund and manager below is INVENTED. Real indices are used
 * for the underlying series; no real company appears anywhere in this file.
 */

export type VehicleId =
  // Default (§9.1)
  | 'cash'
  // Safe
  | 'northmoor-bond'
  // Correct
  | 'fenwick-index'
  | 'fenwick-world'
  // Reasonable
  | 'kingsley-gilt'
  | 'marlow-corporate-bond'
  | 'brightwell-pension'
  // Mediocre
  | 'technova-growth'
  | 'ashcombe-managed'
  // Concentrated
  | 'granville-plc'
  | 'quicksilver-com'
  // Fatal (§11.5)
  | 'meridian-guaranteed'
  | 'cavendish-tech'
  | 'halcyon-reserve'
  | 'vertex-communications'
  | 'restitution-partners'
  | 'sentinel-protect'
  // Negative (§13)
  | 'capital-direct-card';

/** Every vehicle id, in taxonomy order. Kept in sync with the union above. */
export const VEHICLE_IDS = [
  'cash',
  'northmoor-bond',
  'fenwick-index',
  'fenwick-world',
  'kingsley-gilt',
  'marlow-corporate-bond',
  'brightwell-pension',
  'technova-growth',
  'ashcombe-managed',
  'granville-plc',
  'quicksilver-com',
  'meridian-guaranteed',
  'cavendish-tech',
  'halcyon-reserve',
  'vertex-communications',
  'restitution-partners',
  'sentinel-protect',
  'capital-direct-card',
] as const satisfies readonly VehicleId[];

/** Vehicles that hold money and are priced from /data/series.json. */
export type InvestableVehicleId = Exclude<VehicleId, 'cash' | 'capital-direct-card'>;

/** id of a message body / offer page / dialog copy block in /content. */
export type ContentId = string;

/** id of a row in /script/timeline.ts. */
export type EventId = string;
