// @vitest-environment jsdom
/**
 * §20.3 — Tier 3, the inbox badge. The quietest notification in the game:
 * a count, a single 200ms bold flash, a transient status line, and nothing
 * else. Nothing covers content and nothing demands a click.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { UNREAD_FLASH_MS, useUnreadNotice } from './Nav';
import { EngineContext, type Engine } from '../ui/engine';
import type { GameState, MailItem } from '../sim/types';
import { EVENTS_BY_ID, materializeMail } from '../sim/scheduler';

function mail(id: string, status: MailItem['status'] = 'unread'): MailItem {
  return {
    id,
    eventId: 'e',
    from: 'Northmoor Building Society',
    subject: 'Your savings bond',
    contentId: 'c',
    cls: 'legit',
    arrivedMonth: 0,
    expiresMonth: null,
    status,
  };
}

function engineWith(inbox: MailItem[], mailNoticeResetKey = 0): Engine {
  return {
    state: { inbox } as unknown as GameState,
    paused: false,
    autoPaused: false,
    timeRate: 1,
    popupPresentation: { active: null, pending: [], phase: 'showing' },
    mailNoticeResetKey,
    dispatch: () => undefined,
    setPaused: () => undefined,
    setAutoPaused: () => undefined,
    setTimeRate: () => undefined,
    closePresentedPopup: () => undefined,
    filePresentedPopup: () => undefined,
    deferPresentedPopup: () => undefined,
    finishPopupGap: () => undefined,
    jumpToMonth: () => undefined,
    forceEvent: () => undefined,
    loadPreset: () => undefined,
    showDeathCard: () => undefined,
    reset: () => undefined,
  };
}

let container: HTMLDivElement;
let root: Root;
let seen: ReturnType<typeof useUnreadNotice>;

function Probe() {
  seen = useUnreadNotice();
  return null;
}

function render(inbox: MailItem[], mailNoticeResetKey = 0) {
  act(() => {
    root.render(
      <EngineContext.Provider value={engineWith(inbox, mailNoticeResetKey)}>
        <Probe />
      </EngineContext.Provider>,
    );
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe('the inbox badge (§20.3)', () => {
  it('does not announce unread Mail that already exists when the UI mounts', () => {
    render([mail('existing')]);
    expect(seen.count).toBe(1);
    expect(seen.flashing).toBe(false);
    expect(seen.statusLine).toBeNull();
    expect(seen.bannerText).toBeNull();
  });

  it('does not replay historical arrivals when reset or presenter navigation rebuilds state', () => {
    render([]);
    render([mail('historical')], 1);
    expect(seen.count).toBe(1);
    expect(seen.flashing).toBe(false);
    expect(seen.statusLine).toBeNull();
    expect(seen.bannerText).toBeNull();
  });

  it('flashes and announces when the unread count rises', () => {
    render([]);
    expect(seen.flashing).toBe(false);

    render([mail('a')]);
    expect(seen.count).toBe(1);
    expect(seen.flashing).toBe(true);
    expect(seen.statusLine).toBe('1 new message');
    expect(seen.bannerText).toBe('New Mail — 1 message');
  });

  it('uses the existing notice for each new late-game educational Mail arrival', () => {
    render([]);
    const arrivals: MailItem[] = [];
    for (const id of [
      'ev.2002-06.investor-bulletin',
      'ev.2005-02.investment-charges',
      'ev.2006-08.long-term-planning',
    ]) {
      const event = EVENTS_BY_ID[id];
      arrivals.push(materializeMail(event, event.month));
      render(arrivals);
      expect(seen.count).toBe(arrivals.length);
      expect(seen.bannerText).toBe('New Mail — 1 message');
    }
  });

  it('stops flashing after 200ms — a flash, not a state', () => {
    render([]);
    render([mail('a')]);
    expect(seen.flashing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(UNREAD_FLASH_MS);
    });
    expect(seen.flashing).toBe(false);
  });

  it('pluralises a batch arriving together', () => {
    render([]);
    render([mail('a'), mail('b'), mail('c')]);
    expect(seen.statusLine).toBe('3 new messages');
    expect(seen.bannerText).toBe('New Mail — 3 messages');
  });

  it('stays completely silent when the count FALLS', () => {
    // Reading or deleting mail must never flash. §20.3's tier only ever
    // reports arrival; anything else would make it demand attention it has
    // not earned, which is the one thing this tier must never do.
    render([mail('a'), mail('b')]);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(seen.flashing).toBe(false);

    render([mail('a')]);
    expect(seen.count).toBe(1);
    expect(seen.flashing).toBe(false);
    expect(seen.statusLine).toBeNull();
    expect(seen.bannerText).toBeNull();
  });

  it('hides the active banner immediately when the newly arrived Mail is read', () => {
    render([]);
    render([mail('a')]);
    expect(seen.bannerText).toBe('New Mail — 1 message');

    render([mail('a', 'read')]);
    expect(seen.count).toBe(0);
    expect(seen.flashing).toBe(false);
    expect(seen.statusLine).toBeNull();
    expect(seen.bannerText).toBeNull();
  });

  it('hides the active banner immediately when the newly arrived Mail is deleted', () => {
    render([]);
    render([mail('a')]);
    expect(seen.bannerText).toBe('New Mail — 1 message');

    render([mail('a', 'deleted')]);
    expect(seen.count).toBe(0);
    expect(seen.statusLine).toBeNull();
    expect(seen.bannerText).toBeNull();
  });

  it('shows a fresh banner for a later genuinely new arrival after the count reached zero', () => {
    render([]);
    render([mail('a')]);
    render([mail('a', 'read')]);
    expect(seen.count).toBe(0);
    expect(seen.bannerText).toBeNull();

    render([mail('a', 'read'), mail('b')]);
    expect(seen.count).toBe(1);
    expect(seen.statusLine).toBe('1 new message');
    expect(seen.bannerText).toBe('New Mail — 1 message');
  });

  it('lets the status line lapse back to the load state', () => {
    render([]);
    render([mail('a')]);
    expect(seen.statusLine).toBe('1 new message');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(seen.statusLine).toBeNull();
    expect(seen.bannerText).toBeNull();
  });

});
