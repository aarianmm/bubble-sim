// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Notifications, POPUP_GAP_MS, popupPresentationDurationMs } from './Notifications';
import { EngineContext, useEngine, type Engine } from './engine';
import { EngineProvider } from './EngineProvider';
import { RouterProvider, useRouter, type RouterValue } from '../chrome/router';
import { HOME_URL, MAIL_URL, MONEY_URL } from '../pages/registry';
import { popupOffset } from '../chrome/popupPlacement';
import { OFFER_PAGES } from '../content/offerpages';
import type { GameState, PopupItem } from '../sim/types';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makePopup(overrides: Partial<PopupItem> = {}): PopupItem {
  return {
    id: 'ev.test.offer',
    eventId: 'ev.test.offer',
    title: 'Test offer',
    contentId: 'pop.cavendish-1998-03',
    vehicleId: 'cavendish-tech',
    cls: 'scam',
    openedMonth: 26,
    closesMonth: 28,
    x: 20,
    y: 30,
    width: 300,
    height: 250,
    ...overrides,
  };
}

const baseState = { month: 26, dialogs: [] } as unknown as GameState;

function makeEngine(overrides: Partial<Engine> = {}): Engine {
  return {
    state: baseState,
    paused: false,
    autoPaused: false,
    timeRate: 1,
    popupPresentation: { active: makePopup(), pending: [], phase: 'showing' },
    dispatch: vi.fn(),
    setPaused: vi.fn(),
    setAutoPaused: vi.fn(),
    setEvolutionPaused: vi.fn(),
    setTimeRate: vi.fn(),
    closePresentedPopup: vi.fn(),
    filePresentedPopup: vi.fn(),
    deferPresentedPopup: vi.fn(),
    finishPopupGap: vi.fn(),
    jumpToMonth: vi.fn(),
    forceEvent: vi.fn(),
    loadPreset: vi.fn(),
    showDeathCard: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;
let routerHandle: RouterValue | null;

function RouterProbe() {
  routerHandle = useRouter();
  return null;
}

let liveEngineHandle: Engine | null;

function LiveProbe() {
  liveEngineHandle = useEngine();
  routerHandle = useRouter();
  return null;
}

function renderLive(initialUrl: string) {
  act(() => {
    root.render(
      <EngineProvider>
        <RouterProvider initialUrl={initialUrl}>
          <LiveProbe />
          <Notifications />
        </RouterProvider>
      </EngineProvider>,
    );
  });
}

function render(engine: Engine, initialUrl = HOME_URL) {
  act(() => {
    root.render(
      <EngineContext.Provider value={engine}>
        <RouterProvider initialUrl={initialUrl}>
          <RouterProbe />
          <Notifications />
        </RouterProvider>
      </EngineContext.Provider>,
    );
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  routerHandle = null;
  liveEngineHandle = null;
});

afterEach(() => {
  act(() => root.unmount());
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('popup presentation timing', () => {
  it('uses fixed 3.5s / 9s / 11s durations by category', () => {
    expect(popupPresentationDurationMs(makePopup({ cls: 'junk', vehicleId: undefined }))).toBe(3500);
    expect(popupPresentationDurationMs(makePopup({ cls: 'social', vehicleId: undefined }))).toBe(9000);
    expect(popupPresentationDurationMs(makePopup())).toBe(11000);
    expect(popupPresentationDurationMs(makePopup({ cls: 'security', vehicleId: undefined }))).toBe(9000);
  });

  it('renders the Meadowbank phishing popup X-only with no offer CTA', () => {
    const active = makePopup({
      id: 'ev.2005-09.meadowbank-phishing',
      eventId: 'ev.2005-09.meadowbank-phishing',
      contentId: 'pop.meadowbank-phishing-2005-09',
      cls: 'security',
      vehicleId: undefined,
    });
    render(makeEngine({ popupPresentation: { active, pending: [], phase: 'showing' } }));
    expect(document.querySelector('.comet-popup')?.textContent).toContain('ACCOUNT VERIFICATION REQUIRED');
    expect(document.querySelector('.comet-popup__close')).not.toBeNull();
    expect(document.querySelector('.comet-popup__cta')).toBeNull();
  });

  it('renders only the active popup and expires it after 11 seconds', () => {
    const closePresentedPopup = vi.fn();
    const active = makePopup();
    render(makeEngine({ popupPresentation: { active, pending: [makePopup({ id: 'pending' })], phase: 'showing' }, closePresentedPopup }));
    expect(document.querySelectorAll('.comet-popup')).toHaveLength(1);
    act(() => vi.advanceTimersByTime(10999));
    expect(closePresentedPopup).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(closePresentedPopup).toHaveBeenCalledWith(active.id);
  });

  it.each([
    ['Mail', MAIL_URL],
    ['My Money', MONEY_URL],
  ])('hides and defers an active popup on %s', (_label, url) => {
    const deferPresentedPopup = vi.fn();
    const active = makePopup();
    render(
      makeEngine({
        popupPresentation: { active, pending: [], phase: 'showing' },
        deferPresentedPopup,
      }),
      url,
    );
    expect(document.querySelector('.comet-popup')).toBeNull();
    expect(deferPresentedPopup).toHaveBeenCalledWith(active.id);
  });

  it('keeps Home popup placement on the default deterministic path', () => {
    const active = makePopup();
    render(makeEngine({ popupPresentation: { active, pending: [], phase: 'showing' } }), HOME_URL);
    const popup = document.querySelector<HTMLElement>('.comet-popup')!;
    const expected = popupOffset(active.openedMonth, 0, 834, 558, active.width, active.height);
    expect(Number.parseInt(popup.style.top, 10)).toBe(expected.y);
    expect(Number.parseInt(popup.style.left, 10)).toBe(expected.x);
  });

  it('waits 1.75 seconds in the gap before promotion', () => {
    const finishPopupGap = vi.fn();
    render(makeEngine({ popupPresentation: { active: null, pending: [makePopup()], phase: 'gap' }, finishPopupGap }));
    expect(document.querySelector('.comet-popup')).toBeNull();
    act(() => vi.advanceTimersByTime(POPUP_GAP_MS - 1));
    expect(finishPopupGap).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(finishPopupGap).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['Mail', MAIL_URL],
    ['My Money', MONEY_URL],
    ['offer', 'http://www.cavendish-am.co.uk/opportunity'],
    ['fact sheet', 'http://www.cavendish-am.co.uk/opportunity/factsheet'],
    ['accept', 'http://www.cavendish-am.co.uk/opportunity/accept'],
    ['unknown route', 'http://unknown.example/not-a-neutral-page'],
  ])('pauses the popup gap on a busy %s route', (_label, url) => {
    const finishPopupGap = vi.fn();
    render(
      makeEngine({ popupPresentation: { active: null, pending: [makePopup()], phase: 'gap' }, finishPopupGap }),
      url,
    );
    act(() => vi.advanceTimersByTime(POPUP_GAP_MS * 2));
    expect(finishPopupGap).not.toHaveBeenCalled();
  });

  it('queues a new arrival throughout a real offer flow and presents it after returning Home', () => {
    const offerUrl = OFFER_PAGES['cavendish-tech'].url;
    renderLive(offerUrl);

    act(() => liveEngineHandle!.forceEvent('ev.1999-06.halcyon'));
    expect(document.querySelector('.comet-popup')).toBeNull();
    expect(liveEngineHandle!.popupPresentation.active).toBeNull();
    expect(liveEngineHandle!.popupPresentation.pending.map((popup) => popup.contentId)).toEqual([
      'pop.halcyon-1999-06',
    ]);

    act(() => routerHandle!.navigate(`${offerUrl}/factsheet`));
    act(() => vi.advanceTimersByTime(POPUP_GAP_MS * 2));
    expect(document.querySelector('.comet-popup')).toBeNull();

    act(() => routerHandle!.navigate(HOME_URL));
    act(() => vi.advanceTimersByTime(POPUP_GAP_MS - 1));
    expect(document.querySelector('.comet-popup')).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(document.querySelector('.comet-popup')?.textContent).toContain('private reserve');
  });

  it('resumes the remaining popup gap only on Home', () => {
    const finishPopupGap = vi.fn();
    const engine = makeEngine({
      popupPresentation: { active: null, pending: [makePopup()], phase: 'gap' },
      finishPopupGap,
    });
    render(engine);
    act(() => vi.advanceTimersByTime(750));
    act(() => routerHandle!.navigate('http://www.cavendish-am.co.uk/opportunity/factsheet'));
    act(() => vi.advanceTimersByTime(5000));
    expect(finishPopupGap).not.toHaveBeenCalled();
    act(() => routerHandle!.navigate(HOME_URL));
    act(() => vi.advanceTimersByTime(999));
    expect(finishPopupGap).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(finishPopupGap).toHaveBeenCalledTimes(1);
  });

  it('pauses and resumes the active timeout while a blocking dialog freezes time', () => {
    const closePresentedPopup = vi.fn();
    const engine = makeEngine({ closePresentedPopup });
    render(engine);
    act(() => vi.advanceTimersByTime(4000));
    render({ ...engine, timeRate: 0 });
    act(() => vi.advanceTimersByTime(20000));
    expect(closePresentedPopup).not.toHaveBeenCalled();
    render(engine);
    act(() => vi.advanceTimersByTime(6999));
    expect(closePresentedPopup).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(closePresentedPopup).toHaveBeenCalledTimes(1);
  });

  it('forwards CTA filing through the active snapshot', () => {
    const filePresentedPopup = vi.fn();
    const active = makePopup();
    render(makeEngine({ popupPresentation: { active, pending: [], phase: 'showing' }, filePresentedPopup }));
    act(() => document.querySelector<HTMLButtonElement>('.comet-popup__cta')!.click());
    expect(filePresentedPopup).toHaveBeenCalledWith(active);
  });

  it('clears its active timer on unmount', () => {
    const closePresentedPopup = vi.fn();
    render(makeEngine({ closePresentedPopup }));
    act(() => root.unmount());
    act(() => vi.advanceTimersByTime(20000));
    expect(closePresentedPopup).not.toHaveBeenCalled();
    root = createRoot(container);
  });
});
