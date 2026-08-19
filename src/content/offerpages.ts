/**
 * §22.3 — the offer page: what's reached by clicking a message or popup CTA.
 * Per vehicle: headline, sub-copy, CTA label, the URL shown in the address
 * bar, and a §21 siteStyle band.
 *
 * §21 is binding and easy to break by accident:
 *  - the most dangerous vehicle in the game (Halcyon Reserve) has the
 *    BEST-looking page — 'slick'.
 *  - Northmoor (completely legitimate, 5.2%) has one of the WORST —
 *    'plain', authentically dreadful.
 *  - Cavendish's URL is the lookalike from §17.1 / §22.3 verbatim. Meridian
 *    carries a second lookalike domain, so the address-bar mechanic isn't a
 *    one-off. Every legitimate vehicle gets a clean, boring, real-looking
 *    domain.
 *  - 'loud' is not a verdict: several genuinely legitimate/legal vehicles
 *    (Quicksilver, Technova, the credit card) sit in the loud band too,
 *    same as a real 1999 discount broker did.
 */

import type { SiteStyle } from '../sim/types';
import type { VehicleId } from '../sim/ids';

export interface OfferPage {
  headline: string;
  subCopy: string;
  ctaLabel: string;
  /** Shown in the faux address bar (§22.3). Lookalike domains are a mechanic. */
  url: string;
  siteStyle: SiteStyle;
}

export const OFFER_PAGES: Record<Exclude<VehicleId, 'cash'>, OfferPage> = {
  'northmoor-bond': {
    headline: 'Northmoor Building Society — 3 Year Fixed Rate Bond',
    subCopy:
      'A savings bond for members. Fixed term, fixed rate. Open the fact sheet for full details.',
    ctaLabel: 'Open an account',
    url: 'http://www.northmoorbs.co.uk/savings/fixedbond',
    // §21 rule 2: the hideous, completely legitimate site.
    siteStyle: 'plain',
  },

  'fenwick-index': {
    headline: 'Fenwick Index Trust',
    subCopy: 'Tracks the FTSE All-Share. Low cost. Nothing clever happens here.',
    ctaLabel: 'View the fund',
    url: 'http://www.fenwickfunds.co.uk/index-trust',
    siteStyle: 'plain',
  },

  'fenwick-world': {
    headline: 'Fenwick World Trust',
    subCopy: 'Tracks global developed markets. The same idea, further afield.',
    ctaLabel: 'View the fund',
    url: 'http://www.fenwickfunds.co.uk/world-trust',
    siteStyle: 'plain',
  },

  'kingsley-gilt': {
    headline: 'Kingsley Gilt Income Fund',
    subCopy: 'UK government gilts, various maturities. Steady income, low drama.',
    ctaLabel: 'View the fund',
    url: 'http://www.kingsleyam.co.uk/gilt-income',
    siteStyle: 'plain',
  },

  'marlow-corporate-bond': {
    headline: 'Marlow Corporate Bond Fund',
    subCopy: 'Investment-grade corporate bonds. Applications close soon this quarter.',
    ctaLabel: 'View the fund',
    url: 'http://www.marlowinvestments.co.uk/corporate-bond',
    siteStyle: 'plain',
  },

  'brightwell-pension': {
    headline: 'Brightwell Ltd — Workplace Pension Scheme',
    subCopy: 'Your employer contributes too. Opting in costs you a slider, not a decision.',
    ctaLabel: 'Opt in',
    url: 'http://intranet.brightwell.co.uk/pensions/enrol',
    siteStyle: 'plain',
  },

  'technova-growth': {
    headline: 'TECHNOVA GROWTH — Backing Tomorrow, Today',
    subCopy: '58 hand-picked technology companies. Actively managed. Actively priced.',
    ctaLabel: 'Invest now',
    url: 'http://www.technova-growth.co.uk/invest',
    siteStyle: 'loud',
  },

  'ashcombe-managed': {
    headline: 'Ashcombe Managed Portfolio',
    subCopy: 'A discretionary service for clients who prefer not to choose. We choose for you.',
    ctaLabel: 'Speak to a manager',
    url: 'http://www.ashcombewealth.co.uk/managed-portfolio',
    siteStyle: 'slick',
  },

  'granville-plc': {
    headline: 'Granville plc — Ordinary Shares',
    subCopy: 'A FTSE-listed manufacturer. Buy shares directly through your broker.',
    ctaLabel: 'Buy shares',
    url: 'http://www.granville-plc.co.uk/investors',
    siteStyle: 'plain',
  },

  'quicksilver-com': {
    headline: 'QUICKSILVER.COM — The Future Is Now',
    subCopy: 'Just listed. Just funded. Just getting started. (Places are, in fact, limited.)',
    ctaLabel: 'Buy shares',
    url: 'http://www.quicksilver.com/investors',
    siteStyle: 'loud',
  },

  'meridian-guaranteed': {
    headline: '★ MERIDIAN CAPITAL ★ GUARANTEED 30% GROWTH ★',
    subCopy: 'Guaranteed returns. No downside. Limited places for new investors this month!!!',
    ctaLabel: '>> INVEST NOW <<',
    // A second lookalike domain — the trick isn't unique to Cavendish.
    url: 'http://www.meridian-capital.co.uk.growthfunds.net/guaranteed',
    siteStyle: 'loud',
  },

  'cavendish-tech': {
    // §22.3's own worked example — text and URL match the mock-up.
    headline: 'CAVENDISH TECHNOLOGY OPPORTUNITIES',
    subCopy:
      'Our fund has returned 64% in twelve months with a guaranteed minimum of 40% per annum for early participants.',
    ctaLabel: '>> ACCEPT <<',
    url: 'http://www.cavendish-assets.co.uk.offers.net/tech-fund',
    siteStyle: 'loud',
  },

  'halcyon-reserve': {
    headline: 'Halcyon Reserve',
    subCopy:
      'A private reserve fund for discerning investors. Consistent performance, since inception.',
    ctaLabel: 'Request an introduction',
    // §11.4 / §11.5 — a .gg (Guernsey) domain, hiding the flag in plain sight.
    url: 'http://www.halcyonreserve.gg/private-clients',
    // §21 rule 1: the most dangerous vehicle in the game, best-looking site.
    siteStyle: 'slick',
  },

  'vertex-communications': {
    headline: 'VERTEX COMMUNICATIONS — UP 200% AND CLIMBING',
    subCopy: 'Insider tip. Ground floor. This one won’t stay quiet much longer.',
    ctaLabel: 'Buy now',
    url: 'http://www.vertexcomms-invest.net/shares',
    siteStyle: 'loud',
  },

  'restitution-partners': {
    headline: 'Restitution Partners',
    subCopy: 'Lost money in a fund that collapsed? We specialise in recovering client losses.',
    ctaLabel: 'Start my claim',
    url: 'http://www.restitution-partners.org.uk/claim',
    siteStyle: 'plain',
  },

  'sentinel-protect': {
    headline: 'SECURITY ALERT: Your savings are at risk',
    subCopy: 'Immediate action required. Click Protect Now to secure your account.',
    ctaLabel: 'Protect now',
    url: 'http://www.sentinel-protect-alert.com/secure',
    siteStyle: 'loud',
  },

  'capital-direct-card': {
    headline: 'CAPITAL DIRECT GOLD CARD — 0% FOR 6 MONTHS',
    subCopy: '£2,000 limit. 0% introductory rate. 29.8% APR representative thereafter.',
    ctaLabel: 'Apply now',
    url: 'http://www.capitaldirect.co.uk/gold-card',
    siteStyle: 'loud',
  },
};
