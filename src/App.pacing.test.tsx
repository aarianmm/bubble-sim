// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SimulationRoutePause } from './App';
import { RouterProvider, useRouter, type RouterValue } from './chrome/router';
import { OFFER_PAGES } from './content/offerpages';
import {
  HOME_URL,
  MAIL_URL,
  MONEY_URL,
  resolveRoute,
  shouldAutoPauseSimulationUrl,
} from './pages/registry';
import { EngineProvider } from './ui/EngineProvider';
import { MS_PER_MONTH, RATE_FAST, RATE_NORMAL, RATE_PRESENTER, useEngine, type Engine } from './ui/engine';
import { Notifications } from './ui/Notifications';
import { MoneyDraftProvider } from './pages/Money';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;
let engine: Engine | null = null;
let router: RouterValue | null = null;

function Probe() {
  const nextEngine = useEngine();
  const nextRouter = useRouter();
  const engineRef = useRef(nextEngine);
  const routerRef = useRef(nextRouter);
  engineRef.current = nextEngine;
  routerRef.current = nextRouter;
  engine = nextEngine;
  router = nextRouter;
  return null;
}

function Surface() {
  const currentRouter = useRouter();
  const Page = resolveRoute(currentRouter.url).component;
  return (
    <>
      <SimulationRoutePause />
      <Probe />
      <MoneyDraftProvider>
        <Page />
      </MoneyDraftProvider>
      <Notifications />
    </>
  );
}

function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(
      <EngineProvider>
        <RouterProvider initialUrl={HOME_URL}>
          <Surface />
        </RouterProvider>
      </EngineProvider>,
    );
  });
}

function navigate(url: string) {
  act(() => router!.navigate(url));
}

function click(element: Element | null) {
  if (!element) throw new Error('Expected element to exist');
  act(() => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}

function forceNorthmoorMail() {
  act(() => engine!.forceEvent('ev.1996-04.northmoor-bond'));
}

function openNorthmoorMail() {
  const row = container!.querySelector('[data-testid="mail-row-ev.1996-04.northmoor-bond"]');
  if (!row) throw new Error('Northmoor Mail row not found');
  act(() => row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(Date.now()), 16));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
  mount();
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  container = null;
  root = null;
  engine = null;
  router = null;
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('context-aware reading and decision pause', () => {
  it('does not change the base, fast-forward, or presenter timing constants', () => {
    expect(MS_PER_MONTH).toBe(1200);
    expect(RATE_NORMAL).toBe(1);
    expect(RATE_FAST).toBe(4);
    expect(RATE_PRESENTER).toBe(20);
  });

  it('pauses the Mail inbox and an open message, then resumes only on Home', () => {
    forceNorthmoorMail();
    navigate(MAIL_URL);
    const pausedMonth = engine!.state.month;
    expect(engine!.autoPaused).toBe(true);
    expect(engine!.timeRate).toBe(0);
    advance(MS_PER_MONTH * 2 + 100);
    expect(engine!.state.month).toBe(pausedMonth);

    openNorthmoorMail();
    expect(engine!.autoPaused).toBe(true);
    expect(engine!.timeRate).toBe(0);
    advance(MS_PER_MONTH * 4);
    expect(engine!.state.month).toBe(pausedMonth);

    click(Array.from(container!.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('[ Back ]')) ?? null);
    expect(engine!.autoPaused).toBe(true);
    expect(engine!.timeRate).toBe(0);

    navigate(HOME_URL);
    expect(engine!.autoPaused).toBe(false);
    expect(engine!.timeRate).toBe(RATE_NORMAL);
    advance(MS_PER_MONTH * 2 + 100);
    expect(engine!.state.month).toBeGreaterThan(pausedMonth);
  });

  it('keeps manual pause authoritative across Mail reading and the inbox', () => {
    forceNorthmoorMail();
    act(() => engine!.setPaused(true));
    navigate(MAIL_URL);
    openNorthmoorMail();
    expect(engine!.autoPaused).toBe(true);
    click(Array.from(container!.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('[ Back ]')) ?? null);
    expect(engine!.autoPaused).toBe(true);
    navigate(HOME_URL);
    expect(engine!.autoPaused).toBe(false);
    expect(engine!.paused).toBe(true);
    expect(engine!.timeRate).toBe(0);
  });

  it('clears Mail auto-pause if the open message disappears from the visible inbox', () => {
    forceNorthmoorMail();
    navigate(MAIL_URL);
    openNorthmoorMail();
    const openMail = engine!.state.inbox.find((item) => item.eventId === 'ev.1996-04.northmoor-bond')!;
    expect(engine!.autoPaused).toBe(true);
    expect(container!.querySelector('.mail-message')).not.toBeNull();

    act(() => engine!.dispatch({ type: 'delete-mail', month: engine!.state.month, mailId: openMail.id }));

    expect(container!.querySelector('.mail-message')).toBeNull();
    expect(container!.querySelector('.mail-table')).not.toBeNull();
    expect(engine!.autoPaused).toBe(true);
    expect(engine!.timeRate).toBe(0);
    navigate(HOME_URL);
    expect(engine!.autoPaused).toBe(false);
    expect(engine!.timeRate).toBe(RATE_NORMAL);
  });

  it('pauses My Money during allocation work and resumes on Home', () => {
    navigate(MONEY_URL);
    const month = engine!.state.month;
    expect(engine!.autoPaused).toBe(true);
    act(() => engine!.dispatch({ type: 'rebalance', month, targets: {}, cashPct: 100 }));
    advance(MS_PER_MONTH * 3);
    expect(engine!.state.month).toBe(month);
    navigate(HOME_URL);
    expect(engine!.autoPaused).toBe(false);
    expect(engine!.timeRate).toBe(RATE_NORMAL);
  });

  it('keeps Mail message, offer, fact sheet and offer transitions continuously paused', () => {
    forceNorthmoorMail();
    navigate(MAIL_URL);
    openNorthmoorMail();
    const month = engine!.state.month;

    const offerLink = container!.querySelector('.mail-message__offer-link');
    click(offerLink);
    expect(router!.url).toBe(OFFER_PAGES['northmoor-bond'].url);
    expect(engine!.timeRate).toBe(0);
    advance(MS_PER_MONTH + 100);
    expect(engine!.state.month).toBe(month);

    click(container!.querySelector('.offer-cta--factsheet'));
    expect(router!.url).toBe(`${OFFER_PAGES['northmoor-bond'].url}/factsheet`);
    expect(engine!.timeRate).toBe(0);
    advance(MS_PER_MONTH + 100);
    expect(engine!.state.month).toBe(month);

    click(container!.querySelector('.factsheet__button'));
    expect(router!.url).toBe(OFFER_PAGES['northmoor-bond'].url);
    expect(engine!.timeRate).toBe(0);
  });

  it('holds the accept decision at the current month before returning Home', () => {
    const offer = OFFER_PAGES['fenwick-index'].url;
    const month = engine!.state.month;
    navigate(`${offer}/accept`);
    expect(router!.url).toBe(HOME_URL);
    expect(engine!.state.month).toBe(month);
    expect(engine!.state.decisions.at(-1)).toMatchObject({
      type: 'accept-offer',
      month,
      vehicleId: 'fenwick-index',
    });
  });

  it('defaults unknown routes to paused', () => {
    navigate('http://unknown.example/not-a-gameplay-route');
    expect(engine!.autoPaused).toBe(true);
    expect(engine!.timeRate).toBe(0);
  });

  it.each([
    ['Home', HOME_URL, false],
    ['Mail inbox', MAIL_URL, true],
    ['My Money', MONEY_URL, true],
    ['offer/company page', OFFER_PAGES['northmoor-bond'].url, true],
    ['fact sheet', `${OFFER_PAGES['northmoor-bond'].url}/factsheet`, true],
    ['accept decision', `${OFFER_PAGES['northmoor-bond'].url}/accept`, true],
    ['unknown route', 'http://unknown.example/future-screen', true],
  ])('%s follows the Home-only running policy', (_label, url, expected) => {
    expect(shouldAutoPauseSimulationUrl(url)).toBe(expected);
  });

  it('preserves one popup and its remaining timeout across paused routes, then resumes on Home', () => {
    act(() => engine!.forceEvent('ev.1998-03.cavendish'));
    const popupId = engine!.popupPresentation.active?.id;
    expect(popupId).toBeTruthy();
    expect(document.querySelectorAll('.comet-popup')).toHaveLength(1);
    advance(4000);

    navigate(MAIL_URL);
    expect(engine!.autoPaused).toBe(true);
    advance(20000);
    expect(engine!.popupPresentation.active?.id).toBe(popupId);
    expect(document.querySelectorAll('.comet-popup')).toHaveLength(1);

    navigate(MONEY_URL);
    advance(20000);
    expect(engine!.popupPresentation.active?.id).toBe(popupId);
    expect(document.querySelectorAll('.comet-popup')).toHaveLength(1);

    navigate(HOME_URL);
    advance(6999);
    expect(engine!.popupPresentation.active?.id).toBe(popupId);
    advance(1);
    expect(engine!.popupPresentation.active).toBeNull();
    expect(document.querySelector('.comet-popup')).toBeNull();
  });

  it('retains manual pause after leaving My Money for Home', () => {
    act(() => engine!.setPaused(true));
    navigate(MONEY_URL);
    navigate(HOME_URL);
    expect(engine!.autoPaused).toBe(false);
    expect(engine!.paused).toBe(true);
    expect(engine!.timeRate).toBe(0);
  });

  it('preserves a manual-pause change made while already auto-paused', () => {
    navigate(MONEY_URL);
    expect(engine!.autoPaused).toBe(true);
    act(() => engine!.setPaused(true));
    navigate(HOME_URL);
    expect(engine!.autoPaused).toBe(false);
    expect(engine!.paused).toBe(true);
    expect(engine!.timeRate).toBe(0);
  });

  it('reset and route reset clear temporary pause state for a fresh run', () => {
    navigate(MONEY_URL);
    expect(engine!.autoPaused).toBe(true);
    act(() => {
      engine!.reset();
      router!.resetTo(HOME_URL);
    });
    expect(engine!.autoPaused).toBe(false);
    expect(engine!.paused).toBe(false);
    expect(engine!.timeRate).toBe(RATE_NORMAL);
  });
});
