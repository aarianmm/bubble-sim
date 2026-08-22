// @vitest-environment jsdom
/**
 * §20.3 — Tier 3, the inbox badge. The quietest notification in the game:
 * a count, a single 200ms bold flash, a transient status line, and nothing
 * else. Nothing covers content and nothing demands a click.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { UNREAD_FLASH_MS, useUnreadNotice, YearSpine } from './Nav';
import { EngineContext, type Engine } from '../ui/engine';
import type { GameState, MailItem } from '../sim/types';
import { monthIndex } from '../sim/month';

function mail(id: string): MailItem {
  return {
    id,
    eventId: 'e',
    from: 'Northmoor Building Society',
    subject: 'Your savings bond',
    contentId: 'c',
    cls: 'legit',
    arrivedMonth: 0,
    expiresMonth: null,
    status: 'unread',
  };
}

function engineWith(inbox: MailItem[], month = 0): Engine {
  return {
    state: { inbox, month } as unknown as GameState,
    paused: false,
    timeRate: 1,
    dispatch: () => undefined,
    setPaused: () => undefined,
    setEvolutionPaused: () => undefined,
    setTimeRate: () => undefined,
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

function render(inbox: MailItem[]) {
  act(() => {
    root.render(
      <EngineContext.Provider value={engineWith(inbox)}>
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
  it('flashes and announces when the unread count rises', () => {
    render([]);
    expect(seen.flashing).toBe(false);

    render([mail('a')]);
    expect(seen.count).toBe(1);
    expect(seen.flashing).toBe(true);
    expect(seen.statusLine).toBe('1 new message');
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
  });

  it('lets the status line lapse back to the load state', () => {
    render([]);
    render([mail('a')]);
    expect(seen.statusLine).toBe('1 new message');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(seen.statusLine).toBeNull();
  });
});

describe('the year timeline (§22.1)', () => {
  it('distinguishes completed, current and upcoming years while preserving all eleven years', () => {
    act(() => {
      root.render(
        <EngineContext.Provider value={engineWith([], monthIndex(2000, 6))}>
          <YearSpine />
        </EngineContext.Provider>,
      );
    });

    const rows = Array.from(container.querySelectorAll<HTMLElement>('.comet-nav__spine-row'));
    expect(rows).toHaveLength(11);

    const completed = rows.find((row) => row.getAttribute('aria-label') === '1999: completed');
    const current = rows.find((row) => row.getAttribute('aria-label') === '2000: current year');
    const upcoming = rows.find((row) => row.getAttribute('aria-label') === '2001: upcoming');

    expect(completed?.classList.contains('comet-nav__spine-row--past')).toBe(true);
    expect(completed?.querySelector('.comet-nav__spine-status')?.textContent).toBe('✓');
    expect(current?.getAttribute('aria-current')).toBe('date');
    expect(current?.querySelector('.comet-nav__spine-status')?.textContent).toBe('NOW');
    expect(current?.querySelector('.comet-nav__spine-bar')?.textContent).toBe('▓▓▓▓▓');
    expect(current?.querySelector('.comet-nav__spine-marker')?.textContent?.trim()).toBe('◄');
    expect(upcoming?.classList.contains('comet-nav__spine-row--future')).toBe(true);
  });
});
