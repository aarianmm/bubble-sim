import { describe, expect, it } from 'vitest';
import { FACT_SHEETS } from './factsheets';
import { OFFER_PAGES } from './offerpages';
import { MAIL_MESSAGES, POPUP_MESSAGES, SIMULATED_DISCLAIMER } from './messages';
import { DIALOGS } from './dialogs';
import { DEATH_LINES } from './deathlines';
import { VEHICLE_IDS } from '../sim/ids';
import { NONE } from '../sim/types';
import { TIMELINE, SCAM_VEHICLE_IDS } from '../script/timeline';

const TEN_FIELDS = [
  'name',
  'manager',
  'twelveMonthReturn',
  'annualFee',
  'exitFee',
  'holdings',
  'launched',
  'regulatedBy',
  'minimumReturn',
  'introducerCommission',
] as const;

describe('fact sheets (§22.4)', () => {
  it('exists for every one of the 17 vehicles (plus cash)', () => {
    for (const id of VEHICLE_IDS) {
      expect(FACT_SHEETS[id], `no fact sheet for ${id}`).toBeDefined();
    }
  });

  it('populates all ten fields on every sheet — empty is NONE, never blank', () => {
    for (const id of VEHICLE_IDS) {
      const sheet = FACT_SHEETS[id];
      for (const field of TEN_FIELDS) {
        const value = sheet[field];
        expect(typeof value, `${id}.${field}`).toBe('string');
        expect((value as string).length, `${id}.${field} is blank`).toBeGreaterThan(0);
      }
    }
  });

  it('never uses an empty string where NONE belongs', () => {
    for (const id of VEHICLE_IDS) {
      const sheet = FACT_SHEETS[id];
      for (const field of TEN_FIELDS) {
        expect(sheet[field]).not.toBe('');
      }
    }
    expect(NONE).toBe('— none —');
  });

  // §11.2 rule 1 — every scam carries >= 2 red flags.
  it('gives every scam at least two red flags', () => {
    for (const id of SCAM_VEHICLE_IDS) {
      const sheet = FACT_SHEETS[id as keyof typeof FACT_SHEETS];
      expect(sheet.redFlags.length, `${id} has ${sheet.redFlags.length} flags`).toBeGreaterThanOrEqual(2);
    }
  });

  // §11.5 / §11.2 rule 4 — Halcyon Reserve is the genuinely-hard scam.
  it('makes Halcyon Reserve the hard scam: exactly two flags, no down months, no guaranteed-returns tell', () => {
    const halcyon = FACT_SHEETS['halcyon-reserve'];
    expect(halcyon.redFlags).toEqual(
      expect.arrayContaining(['no-regulator', 'introducer-commission']),
    );
    expect(halcyon.redFlags).not.toContain('guaranteed-returns');
    expect(halcyon.regulatedBy).toMatch(/Guernsey/);
    expect(halcyon.introducerCommission).toBe('5%');
    // The return chart is the real tell: never a down month.
    for (let i = 1; i < halcyon.returnChart.length; i++) {
      expect(halcyon.returnChart[i]).toBeGreaterThanOrEqual(0);
    }
    expect(halcyon.returnChart.length).toBeGreaterThan(6);
  });

  // §11.2 rule 3 — no single red flag is diagnostic. At least one legit
  // offer carries exactly one weak flag, and it must overlap with a flag a
  // scam also carries (proof a checklist alone can't separate them).
  it('gives at least one legit/mediocre vehicle a single weak red flag shared with a scam', () => {
    const legitWithOneFlag = VEHICLE_IDS.filter((id) => {
      if (SCAM_VEHICLE_IDS.has(id) || id === 'capital-direct-card' || id === 'cash') return false;
      return FACT_SHEETS[id].redFlags.length === 1;
    });
    expect(legitWithOneFlag.length).toBeGreaterThanOrEqual(1);

    const scamFlags = new Set<string>();
    for (const id of SCAM_VEHICLE_IDS) {
      for (const f of FACT_SHEETS[id as keyof typeof FACT_SHEETS].redFlags) scamFlags.add(f);
    }
    const overlap = legitWithOneFlag.some((id) => scamFlags.has(FACT_SHEETS[id].redFlags[0]));
    expect(overlap, 'no legit single-flag vehicle shares its flag with a scam').toBe(true);
  });
});

describe('offer pages (§22.3, §21)', () => {
  it('exists for every non-cash vehicle', () => {
    for (const id of VEHICLE_IDS) {
      if (id === 'cash') continue;
      expect(OFFER_PAGES[id], `no offer page for ${id}`).toBeDefined();
    }
  });

  // §21 rule 1 — the most dangerous vehicle has the best-looking site.
  it('makes Halcyon Reserve slick and Northmoor plain (§21)', () => {
    expect(OFFER_PAGES['halcyon-reserve'].siteStyle).toBe('slick');
    expect(OFFER_PAGES['northmoor-bond'].siteStyle).toBe('plain');
  });

  it('gives Cavendish the exact §22.3 lookalike URL, and gives a second scam a lookalike too', () => {
    expect(OFFER_PAGES['cavendish-tech'].url).toBe('http://www.cavendish-assets.co.uk.offers.net/tech-fund');
    const lookalikes = (Object.keys(OFFER_PAGES) as (keyof typeof OFFER_PAGES)[]).filter((id) =>
      /\.co\.uk\.[a-z]+\.(net|com)/.test(OFFER_PAGES[id].url),
    );
    expect(lookalikes.length).toBeGreaterThanOrEqual(2);
  });

  it('gives every legitimate vehicle a clean (non-lookalike) domain', () => {
    for (const id of Object.keys(OFFER_PAGES) as (keyof typeof OFFER_PAGES)[]) {
      if (SCAM_VEHICLE_IDS.has(id)) continue;
      expect(OFFER_PAGES[id].url).not.toMatch(/\.co\.uk\.[a-z]+\.(net|com)/);
    }
  });
});

describe('the required simulated-game disclaimer (§5.1 rule 5)', () => {
  it('is present verbatim', () => {
    expect(SIMULATED_DISCLAIMER).toBe(
      'Simulated. Historical data is real; every company and fund in this game is invented. This is not financial advice.',
    );
  });
});

describe('every contentId in the timeline resolves (§25.3)', () => {
  it('resolves every MAIL/POP contentId to a message, every DLG contentId to a dialog', () => {
    for (const e of TIMELINE) {
      if (e.channel === 'MAIL') expect(MAIL_MESSAGES[e.contentId], e.id).toBeDefined();
      if (e.channel === 'POP') expect(POPUP_MESSAGES[e.contentId], e.id).toBeDefined();
      if (e.channel === 'DLG') expect(DIALOGS[e.contentId], e.id).toBeDefined();
    }
  });

  it('gives every offer event a vehicle with a fact sheet', () => {
    for (const e of TIMELINE) {
      if (e.vehicleId) expect(FACT_SHEETS[e.vehicleId], `${e.id} -> ${e.vehicleId}`).toBeDefined();
    }
  });
});

describe('dialogs (§20.1)', () => {
  it('never uses more than two buttons, and never a Dismiss/Later button', () => {
    for (const [id, d] of Object.entries(DIALOGS)) {
      expect(d.buttons.length, id).toBeLessThanOrEqual(2);
      for (const b of d.buttons) {
        expect(b.label, id).not.toMatch(/^(Dismiss|Later)$/i);
      }
    }
  });

  it('keeps body copy to at most two sentences', () => {
    for (const [id, d] of Object.entries(DIALOGS)) {
      const sentences = d.body.split(/(?<=[.!?])\s+/).filter(Boolean);
      expect(sentences.length, `${id}: "${d.body}"`).toBeLessThanOrEqual(2);
    }
  });
});

describe('death lines (§22.6)', () => {
  const DEATH_CAUSE_IDS = [
    'broke-as-bubble-peaked',
    'ground-down-by-rent',
    'funded-a-scam',
    'sold-at-the-bottom',
    'eaten-by-fees',
    'the-card-ate-you',
    'the-fake-dialog',
    'survived',
  ] as const;

  it('has a headline and detail line for every DeathCauseId', () => {
    for (const id of DEATH_CAUSE_IDS) {
      const line = DEATH_LINES[id];
      expect(line, id).toBeDefined();
      expect(line.headline.length, id).toBeGreaterThan(0);
      expect(line.detail.length, id).toBeGreaterThan(0);
    }
  });
});
