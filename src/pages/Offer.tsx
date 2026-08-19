/**
 * §22.3 — the external offer site, reached by clicking a message or a
 * popup CTA. One component, driven entirely by `siteStyle` from
 * src/content/offerpages.ts — never by whether the vehicle is a scam
 * (§21). The fact sheet (Step 19's other half, src/ui/FactSheet.tsx) lives
 * one <GameLink> away from every one of these pages, always in the same
 * position (§22.3's stated educational goal).
 *
 * URL scheme: a vehicle's page lives at its authored `url`. Its fact sheet
 * lives at `${url}/factsheet`; its accept action lives at `${url}/accept`.
 * Both are real navigations through <GameLink>, so §19.3's status-bar
 * hover preview (see the §22.3 mock-up: "http://…/accept ← on link
 * hover") works for both without any page reimplementing it.
 */
import { useEffect, type ReactNode } from 'react';
import { GameLink, useRouter } from '../chrome/router';
import { useEngine } from '../ui/engine';
import { FactSheet, ReturnSparkline } from '../ui/FactSheet';
import { FACT_SHEETS } from '../content/factsheets';
import { OFFER_PAGES, type OfferPage } from '../content/offerpages';
import type { VehicleId } from '../sim/ids';
import { HOME_URL } from './registry';
import './offer.css';

// §23 explicitly keeps `<marquee>` on the motion allow-list ("Marquee text,
// real and scrolling"), but @types/react's IntrinsicElements never carried
// this legacy tag — the DOM itself (lib.dom.d.ts's HTMLMarqueeElement)
// still does. This augmentation only adds the missing entry back.
declare module 'react' {
  // The `namespace` keyword here is the ambient module-augmentation shape
  // TS requires for JSX.IntrinsicElements, not a real namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      marquee: DetailedHTMLProps<HTMLAttributes<HTMLMarqueeElement>, HTMLMarqueeElement>;
    }
  }
}

type OfferVehicleId = Exclude<VehicleId, 'cash'>;
type OfferView = 'offer' | 'factsheet' | 'accept';

interface ResolvedOffer {
  id: OfferVehicleId;
  page: OfferPage;
  view: OfferView;
}

const OFFER_ENTRIES = Object.entries(OFFER_PAGES) as [OfferVehicleId, OfferPage][];

/** Exact-match URL resolution — no prefix guessing, so a lookalike domain
 * the player hasn't actually visited can never accidentally resolve. */
export function resolveOfferUrl(url: string): ResolvedOffer | null {
  for (const [id, page] of OFFER_ENTRIES) {
    if (url === page.url) return { id, page, view: 'offer' };
    if (url === `${page.url}/factsheet`) return { id, page, view: 'factsheet' };
    if (url === `${page.url}/accept`) return { id, page, view: 'accept' };
  }
  return null;
}

/** §25.1 — "anything that looks random is derived from the current month."
 * The hit counter is authored page furniture with no gameplay meaning, so
 * it only needs to be *stable and non-random*, not meaningful: same
 * vehicle, same month, same number, forever. */
export function hitCounterFor(vehicleId: string, month: number): number {
  let seed = 0;
  for (let i = 0; i < vehicleId.length; i++) seed += vehicleId.charCodeAt(i);
  return (seed * 37 + month * 91) % 999999;
}

export function Offer() {
  const { url, navigate } = useRouter();
  const { state, dispatch } = useEngine();
  const resolved = resolveOfferUrl(url);

  useEffect(() => {
    if (!resolved) return;
    if (resolved.view === 'accept') {
      // §6 decision 3: accept != invest. This unlocks the vehicle onto
      // /money at £0; it never allocates money itself (another agent's
      // page). §11.1's setup fee and scam-list flag are the scheduler's
      // job (Step 24) once it applies this decision.
      dispatch({
        type: 'accept-offer',
        month: state.month,
        vehicleId: resolved.id,
        source: url,
      });
      navigate(HOME_URL);
    } else if (resolved.view === 'factsheet') {
      // §11.2 rule 5 / §26.1: the death card names the flags the player
      // could have read — this is what lets it know the sheet was seen.
      dispatch({ type: 'open-fact-sheet', month: state.month, vehicleId: resolved.id });
    }
    // Re-run only when the URL itself changes — this fires exactly once
    // per navigation into /accept or /factsheet, not on every clock tick.
  }, [url]);

  if (!resolved) {
    return (
      <div className="offer-page offer-page--unknown">
        <p>This page cannot be displayed.</p>
      </div>
    );
  }

  const sheet = FACT_SHEETS[resolved.id];
  const factSheetHref = `${resolved.page.url}/factsheet`;
  const acceptHref = `${resolved.page.url}/accept`;

  if (resolved.view === 'factsheet') {
    return (
      <div className="offer-page offer-page--factsheet">
        <FactSheet sheet={sheet} backHref={resolved.page.url} acceptHref={acceptHref} />
      </div>
    );
  }

  if (resolved.view === 'accept') {
    // The effect above redirects immediately; this is only what paints in
    // the instant before it does (§23: everything snaps, no fade needed).
    return <div className="offer-page offer-page--redirect">Thank you. Redirecting…</div>;
  }

  const ctaBar = (
    <div className="offer-cta-bar">
      <GameLink href={factSheetHref} className="offer-cta offer-cta--factsheet">
        [ FUND FACT SHEET ]
      </GameLink>
      <GameLink href={acceptHref} className="offer-cta offer-cta--accept">
        {resolved.page.ctaLabel}
      </GameLink>
    </div>
  );

  switch (resolved.page.siteStyle) {
    case 'loud':
      return <LoudOffer page={resolved.page} vehicleId={resolved.id} month={state.month} ctaBar={ctaBar} />;
    case 'plain':
      return <PlainOffer page={resolved.page} ctaBar={ctaBar} />;
    case 'slick':
      return <SlickOffer page={resolved.page} sheet={sheet} ctaBar={ctaBar} />;
  }
}

/* ------------------------------------------------------------------ *
 * §21: ~70% scam, ~30% legitimate-but-aggressive. Small damage either way
 * — the amateur band. Tiled background, WordArt heading, a real marquee,
 * a hit counter. Never the giveaway on its own (Technova, Quicksilver and
 * the credit card sit here too, and are not scams).
 * ------------------------------------------------------------------ */
function LoudOffer({
  page,
  vehicleId,
  month,
  ctaBar,
}: {
  page: OfferPage;
  vehicleId: OfferVehicleId;
  month: number;
  ctaBar: ReactNode;
}) {
  const hits = String(hitCounterFor(vehicleId, month)).padStart(6, '0');
  return (
    <div className="offer-page offer-page--loud">
      <h1 className="offer-loud__heading">{page.headline}</h1>
      <marquee>
        ★ {page.headline} ★ {page.ctaLabel} ★ PLACES CLOSE FRIDAY ★
      </marquee>
      <p className="offer-loud__copy">{page.subCopy}</p>
      {ctaBar}
      <p className="offer-loud__footer">
        🚧 This site is under construction 🚧&nbsp;&nbsp;&nbsp;visitors: {hits}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * §21: ~15% scam, mostly institutional and dull-correct. Unstyled Times
 * New Roman, a naive HTML table, no images. Northmoor lives here —
 * completely real, paying 5.2%, and authentically dreadful to look at.
 * ------------------------------------------------------------------ */
function PlainOffer({ page, ctaBar }: { page: OfferPage; ctaBar: ReactNode }) {
  return (
    <div className="offer-page offer-page--plain">
      <table>
        <tbody>
          <tr>
            <td>
              <p className="offer-plain__heading">{page.headline}</p>
              <p className="offer-plain__copy">{page.subCopy}</p>
            </td>
          </tr>
        </tbody>
      </table>
      {ctaBar}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * §21: ~35% scam — and this is where the Ponzi lives. "The most dangerous
 * vehicle in the game always has the best-looking website." Restrained
 * layout, a wordmark, testimonials, a clean returns chart — built from
 * nothing but the same web-safe accent set the loud band uses, restraint
 * coming from how sparingly it's spent, not from a wider palette.
 * ------------------------------------------------------------------ */
function SlickOffer({
  page,
  sheet,
  ctaBar,
}: {
  page: OfferPage;
  sheet: (typeof FACT_SHEETS)[OfferVehicleId];
  ctaBar: ReactNode;
}) {
  const initial = sheet.manager.charAt(0).toUpperCase();
  return (
    <div className="offer-page offer-page--slick">
      <header className="offer-slick__header">
        <span className="offer-slick__logo" aria-hidden="true">
          {initial}
        </span>
        <span className="offer-slick__wordmark">{sheet.manager}</span>
      </header>
      <div className="offer-slick__hero">
        <h1 className="offer-slick__heading">{page.headline}</h1>
        <p className="offer-slick__copy">{page.subCopy}</p>
      </div>
      <div className="offer-slick__chart">
        <ReturnSparkline
          returnChart={sheet.returnChart}
          width={220}
          height={48}
          className="offer-slick__chart-svg"
        />
        <span className="offer-slick__chart-label">12-month performance</span>
      </div>
      <div className="offer-slick__testimonials">
        <blockquote>
          “Straightforward and professional, exactly as described.”
          <footer>— a private client</footer>
        </blockquote>
        <blockquote>
          “I moved my whole allowance across within the week.”
          <footer>— a private client, since {sheet.launched}</footer>
        </blockquote>
      </div>
      {ctaBar}
    </div>
  );
}
