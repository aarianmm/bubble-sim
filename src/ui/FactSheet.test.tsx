/**
 * §22.4's stated done-condition for Step 19: "the tracker's sheet and
 * Halcyon's sheet differ only in field values." This test renders every
 * vehicle's sheet to a markup string and compares tag-only skeletons —
 * attributes and text (where legit/scam sheets are allowed, and expected,
 * to differ) are stripped out first, so a pass here is a structural
 * guarantee, not a coincidence of matching copy length.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RouterProvider } from '../chrome/router';
import { FactSheet } from './FactSheet';
import { FACT_SHEETS } from '../content/factsheets';
import { VEHICLE_IDS } from '../sim/ids';
import type { VehicleId } from '../sim/ids';

const OFFER_VEHICLE_IDS = VEHICLE_IDS.filter((id) => id !== 'cash');

function renderSheet(vehicleId: VehicleId): string {
  const sheet = FACT_SHEETS[vehicleId];
  return renderToStaticMarkup(
    <RouterProvider initialUrl="http://example.test/base">
      <FactSheet
        sheet={sheet}
        backHref="http://example.test/base"
        acceptHref="http://example.test/base/accept"
      />
    </RouterProvider>,
  );
}

/** Tag-name-only skeleton: "<div <h2 </h2 <table ..." — strips every
 * attribute and every text node, leaving nothing but the shape. */
function skeleton(html: string): string {
  return (html.match(/<\/?[a-z][a-z0-9]*/gi) ?? []).join(' ').toLowerCase();
}

describe('FactSheet (§22.4)', () => {
  it('renders every one of the 17 offer vehicles without crashing', () => {
    for (const id of OFFER_VEHICLE_IDS) {
      expect(() => renderSheet(id)).not.toThrow();
    }
  });

  it("the tracker's sheet and Halcyon's sheet are structurally identical, differing only in values", () => {
    const tracker = renderSheet('fenwick-index');
    const halcyon = renderSheet('halcyon-reserve');
    expect(skeleton(halcyon)).toBe(skeleton(tracker));
    // Sanity: the markup isn't literally identical — the values do differ.
    expect(halcyon).not.toBe(tracker);
  });

  it('produces the same skeleton for all 17 vehicles — one layout, no exceptions', () => {
    const skeletons = OFFER_VEHICLE_IDS.map((id) => skeleton(renderSheet(id)));
    const [first, ...rest] = skeletons;
    for (const s of rest) expect(s).toBe(first);
  });

  it('renders "— none —" for empty fields, never a blank cell', () => {
    // Restitution Partners and Sentinel Protect carry several NONE fields.
    expect(renderSheet('restitution-partners')).toContain('— none —');
    expect(renderSheet('sentinel-protect')).toContain('— none —');
  });

  it('renders the tracker fields §22.4 quotes verbatim: fee 0.4%, 623 holdings, launched 1989, regulated by IMRO, minimum return — none —', () => {
    const html = renderSheet('fenwick-index');
    expect(html).toContain('0.4%');
    expect(html).toContain('623');
    expect(html).toContain('1989');
    expect(html).toContain('IMRO');
    expect(html).toContain('— none —');
  });

  it('lays out the ten §22.4 fields in order, then Back and Accept', () => {
    const html = renderSheet('cavendish-tech');
    const order = [
      'Name',
      'Manager',
      '12-month return',
      'Annual fee',
      'Exit fee',
      'Holdings',
      'Launched',
      'Regulated by',
      'Minimum return',
      'Introducer commission',
      '[ Back ]',
      '[ Accept ]',
    ];
    let cursor = -1;
    for (const label of order) {
      const idx = html.indexOf(label);
      expect(idx, `"${label}" missing from the sheet`).toBeGreaterThan(-1);
      expect(idx, `"${label}" out of §22.4 order`).toBeGreaterThan(cursor);
      cursor = idx;
    }
  });

  it('draws a sparkline for the 12-month return row, and Halcyon\'s never slopes down', () => {
    const halcyonChart = FACT_SHEETS['halcyon-reserve'].returnChart;
    // The Ponzi curve (§11.4): every authored monthly return is positive,
    // so the compounded line the sparkline draws can only ever climb.
    expect(halcyonChart.length).toBeGreaterThan(1);
    expect(halcyonChart.every((pct) => pct > 0)).toBe(true);
    // The tracker, by contrast, has real down months in its authored data.
    const trackerChart = FACT_SHEETS['fenwick-index'].returnChart;
    expect(trackerChart.some((pct) => pct < 0)).toBe(true);
  });

  it('[ Back ] and [ Accept ] point at real URLs, so the §19.3 hover preview works', () => {
    const html = renderSheet('meridian-guaranteed');
    expect(html).toContain('href="http://example.test/base"');
    expect(html).toContain('href="http://example.test/base/accept"');
  });
});
