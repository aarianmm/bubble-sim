// @vitest-environment jsdom
/**
 * §22.3 — the offer page template. Most of this file renders to a markup
 * string (works fine under jsdom too) and checks structure; the accept/
 * fact-sheet flows at the bottom mount for real via createRoot + act, so
 * the useEffect that dispatches a Decision and navigates actually runs —
 * that behaviour can't be observed from a static render.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { RouterProvider, useRouter } from '../chrome/router';
import { EngineProvider } from '../ui/EngineProvider';
import { useEngine } from '../ui/engine';
import { Offer, resolveOfferUrl, hitCounterFor } from './Offer';
import { OFFER_PAGES } from '../content/offerpages';
import { VEHICLE_IDS } from '../sim/ids';
import type { VehicleId } from '../sim/ids';

// React 18's act() only suppresses its "not configured" warning when this
// flag is set — there's no test-runner integration (no @testing-library)
// telling it this is a real act()-aware environment otherwise.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const HALCYON_URL = OFFER_PAGES['halcyon-reserve'].url;
const NORTHMOOR_URL = OFFER_PAGES['northmoor-bond'].url;
const CAVENDISH_URL = OFFER_PAGES['cavendish-tech'].url;

function renderAt(url: string): string {
  return renderToStaticMarkup(
    <EngineProvider>
      <RouterProvider initialUrl={url}>
        <Offer />
      </RouterProvider>
    </EngineProvider>,
  );
}

describe('resolveOfferUrl (§17.1 — the address bar is a gameplay element)', () => {
  it('resolves a vehicle at its authored URL to the offer view', () => {
    expect(resolveOfferUrl(HALCYON_URL)).toEqual({
      id: 'halcyon-reserve',
      page: OFFER_PAGES['halcyon-reserve'],
      view: 'offer',
    });
  });

  it('resolves the /factsheet and /accept sub-paths to their own views', () => {
    expect(resolveOfferUrl(`${HALCYON_URL}/factsheet`)?.view).toBe('factsheet');
    expect(resolveOfferUrl(`${HALCYON_URL}/accept`)?.view).toBe('accept');
  });

  it('does not resolve an unrelated or partially-matching URL', () => {
    expect(resolveOfferUrl('http://www.bubble.net/home')).toBeNull();
    expect(resolveOfferUrl(`${HALCYON_URL}x`)).toBeNull();
  });
});

describe('hitCounterFor (§25.1 — derived from the month, never Math.random)', () => {
  it('is a pure, deterministic function of vehicle and month', () => {
    expect(hitCounterFor('cavendish-tech', 40)).toBe(hitCounterFor('cavendish-tech', 40));
  });

  it('changes across months, so it still reads as "incrementing" furniture', () => {
    expect(hitCounterFor('cavendish-tech', 40)).not.toBe(hitCounterFor('cavendish-tech', 41));
  });
});

describe('the FUND FACT SHEET button (§22.3 — "same position, same size, always")', () => {
  it('appears on every one of the 17 offer pages, same label, same CTA classes', () => {
    for (const id of VEHICLE_IDS) {
      if (id === 'cash') continue;
      const html = renderAt(OFFER_PAGES[id as Exclude<VehicleId, 'cash'>].url);
      expect(html, id).toContain('offer-cta-bar');
      expect(html, id).toContain('offer-cta--factsheet');
      expect(html, id).toContain('[ FUND FACT SHEET ]');
    }
  });

  it('links to the real per-vehicle fact-sheet URL, so §19.3 hover preview shows it truthfully', () => {
    const html = renderAt(HALCYON_URL);
    expect(html).toContain(`href="${HALCYON_URL}/factsheet"`);
  });
});

describe('§21 style bands — style never depends on isScam', () => {
  it('Halcyon (the Ponzi) renders in the slick band', () => {
    const html = renderAt(HALCYON_URL);
    expect(html).toContain('offer-page--slick');
    expect(html).not.toContain('<marquee');
  });

  it('Northmoor (completely legitimate) renders in the plain band', () => {
    const html = renderAt(NORTHMOOR_URL);
    expect(html).toContain('offer-page--plain');
  });

  it('a loud page carries the real §22.3 furniture: marquee and a hit counter', () => {
    const html = renderAt(CAVENDISH_URL);
    expect(html).toContain('offer-page--loud');
    expect(html).toContain('<marquee');
    expect(html).toMatch(/visitors: \d{6}/);
  });

  it('slick and plain pages carry none of the loud furniture', () => {
    expect(renderAt(HALCYON_URL)).not.toMatch(/visitors: \d{6}/);
    expect(renderAt(NORTHMOOR_URL)).not.toMatch(/visitors: \d{6}/);
  });
});

describe('the fact-sheet sub-view', () => {
  it('renders the FactSheet component at the /factsheet URL, wired back to the same offer', () => {
    const html = renderAt(`${HALCYON_URL}/factsheet`);
    expect(html).toContain('FUND FACT SHEET');
    expect(html).toContain(`href="${HALCYON_URL}"`); // [ Back ]
    expect(html).toContain(`href="${HALCYON_URL}/accept"`); // [ Accept ]
  });
});

/* ------------------------------------------------------------------ *
 * Real mounts: the useEffect that dispatches a Decision and (for accept)
 * navigates away only runs once React actually commits, which a static
 * string render never does.
 * ------------------------------------------------------------------ */

let container: HTMLDivElement | null = null;
let root: Root | null = null;

afterEach(() => {
  if (root) act(() => root!.unmount());
  if (container) container.remove();
  container = null;
  root = null;
});

function mountAt(url: string) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  function Harness() {
    const { state } = useEngine();
    const { url: currentUrl } = useRouter();
    return (
      <div>
        <div data-testid="decision-count">{state.decisions.length}</div>
        <div data-testid="last-decision">{state.decisions.at(-1)?.type ?? ''}</div>
        <div data-testid="current-url">{currentUrl}</div>
        <Offer />
      </div>
    );
  }

  act(() => {
    root!.render(
      <EngineProvider>
        <RouterProvider initialUrl={url}>
          <Harness />
        </RouterProvider>
      </EngineProvider>,
    );
  });
}

function text(testId: string): string {
  return container!.querySelector(`[data-testid="${testId}"]`)!.textContent ?? '';
}

describe('accepting (§6 decision 3 — accept != invest)', () => {
  it('dispatches accept-offer and sends the player to the allocator, without touching the portfolio', () => {
    mountAt(`${HALCYON_URL}/accept`);
    expect(text('decision-count')).toBe('1');
    expect(text('last-decision')).toBe('accept-offer');
    expect(text('current-url')).toBe('http://www.bubble.net/money');
  });
});

describe('opening the fact sheet (§11.2 rule 5 — the death card names what you could have read)', () => {
  it('dispatches open-fact-sheet and stays on the fact-sheet URL', () => {
    mountAt(`${HALCYON_URL}/factsheet`);
    expect(text('decision-count')).toBe('1');
    expect(text('last-decision')).toBe('open-fact-sheet');
    expect(text('current-url')).toBe(`${HALCYON_URL}/factsheet`);
  });
});
