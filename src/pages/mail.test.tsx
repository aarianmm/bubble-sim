/**
 * @vitest-environment jsdom
 *
 * Step 18 done-condition (§26.2): "Junk, legit and scam rows are
 * pixel-identical; time runs at 0.4x while open."
 *
 * No `@testing-library/react` in this repo (see package.json) — this file
 * renders with `react-dom/client` + `react-dom/test-utils`'s `act`
 * directly, which is all a from-scratch mount/interact/assert loop needs.
 *
 * The engine and router are faked here rather than pulled from
 * `EngineProvider`/`RouterProvider`: those own the real scheduler seam
 * (Step 24, not yet wired — see the Step 18 brief) and the real load-timer
 * machinery, neither of which this page's contract depends on. Faking them
 * keeps this suite fast, deterministic and scoped to exactly what Mail.tsx
 * is responsible for: reading `GameState.inbox` through the Step 2/§25.1
 * selectors and dispatching the right `Decision`s (§25.2).
 */
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it, vi, afterEach } from 'vitest';

// react-dom/test-utils's `act` gates on this flag; without it React logs a
// spurious "not configured to support act()" warning on every render. Set
// once, module-wide — this file owns its own render harness (no
// `@testing-library/react` in this repo) so it also owns this switch.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { Mail } from './Mail';
import { EngineContext, RATE_INBOX, RATE_NORMAL, type Engine } from '../ui/engine';
import { RouterProvider } from '../chrome/router';
import { monthIndex } from '../sim/month';
import type { GameState, MailItem, RunFlags, RunStats, Decision } from '../sim/types';

/* ------------------------------------------------------------------ *
 * Fixtures — mirrors the `makeState`/`makeHolding` shape src/sim/tick.test.ts
 * already uses, so this file needs no help from /sim to stay in sync with
 * the real GameState shape.
 * ------------------------------------------------------------------ */

function baseFlags(overrides: Partial<RunFlags> = {}): RunFlags {
  return {
    onScamList: false,
    incomeSuspendedMonths: 0,
    era: 'a',
    moneyBase: 'period',
    everOpenedInbox: false,
    everOpenedFactSheet: false,
    ...overrides,
  };
}

function baseStats(overrides: Partial<RunStats> = {}): RunStats {
  return {
    peakWealth: 0,
    peakWealth1996: 0,
    finalWealth: 0,
    feesPaid: 0,
    trackerCounterfactualFees: 0,
    scamsFunded: 0,
    scamsDodged: 0,
    forcedSales: 0,
    monthsUnderwater: 0,
    scamsFundedIds: [],
    scamsDodgedIds: [],
    redFlagsMissed: [],
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    month: monthIndex(1998, 9),
    status: 'running',
    cash: 500,
    holdings: {},
    unlocked: [],
    debt: null,
    inbox: [],
    popups: [],
    dialogs: [],
    flags: baseFlags(),
    stats: baseStats(),
    wealthHistory: [],
    marketHistory: [],
    deathMonth: null,
    deathCauseId: null,
    decisions: [],
    ...overrides,
  };
}

function makeMail(overrides: Partial<MailItem> = {}): MailItem {
  return {
    id: 'm1',
    eventId: 'ev.m1',
    from: 'Cavendish Asset Mgmt',
    subject: 'A once-in-a-generation opportunity',
    contentId: 'msg.cavendish-tech',
    cls: 'scam',
    arrivedMonth: monthIndex(1998, 9),
    expiresMonth: monthIndex(1998, 10),
    status: 'unread',
    ...overrides,
  };
}

function makeEngine(state: GameState, dispatch: (d: Decision) => void = vi.fn()): Engine {
  return {
    state,
    paused: false,
    timeRate: RATE_NORMAL,
    popupPresentation: { active: null, pending: [], phase: 'showing' },
    dispatch,
    setPaused: vi.fn(),
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
  };
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount(state: GameState, dispatch?: (d: Decision) => void): { engine: Engine } {
  container = document.createElement('div');
  document.body.appendChild(container);
  const engine = makeEngine(state, dispatch);
  root = createRoot(container);
  act(() => {
    root!.render(
      <EngineContext.Provider value={engine}>
        <RouterProvider initialUrl="http://www.bubble.net/mail">
          <Mail />
        </RouterProvider>
      </EngineContext.Provider>,
    );
  });
  return { engine };
}

afterEach(() => {
  if (root && container) {
    act(() => root!.unmount());
  }
  container?.remove();
  container = null;
  root = null;
});

/* ------------------------------------------------------------------ *
 * §10.3 / §22.2 — the binding constraint: class must not leak into markup.
 * ------------------------------------------------------------------ */

describe('row class-indistinguishability (§10.3, §22.2)', () => {
  it('renders byte-identical row markup for junk, legit and scam, holding every other field constant', () => {
    const shared = {
      id: 'shared-id',
      eventId: 'ev.shared',
      from: 'Example Sender',
      subject: 'Exactly the same subject line',
      contentId: 'msg.whatever',
      arrivedMonth: monthIndex(1998, 9),
      expiresMonth: monthIndex(1998, 10),
      status: 'unread' as const,
    };

    const classes = ['junk', 'legit', 'scam'] as const;
    const rowHtmls = classes.map((cls) => {
      const state = makeState({ inbox: [makeMail({ ...shared, cls })] });
      mount(state);
      const row = container!.querySelector(`[data-testid="mail-row-shared-id"]`);
      expect(row).not.toBeNull();
      const html = row!.outerHTML;
      act(() => root!.unmount());
      container!.remove();
      container = null;
      root = null;
      return html;
    });

    expect(rowHtmls[0]).toBe(rowHtmls[1]);
    expect(rowHtmls[1]).toBe(rowHtmls[2]);
  });

  it('never renders the raw class name anywhere in a row (no leaked "scam"/"junk"/"legit" text or attribute)', () => {
    const state = makeState({
      inbox: [
        makeMail({ id: 'a', cls: 'scam', from: 'Cavendish Asset Mgmt', subject: 'Opportunity' }),
        makeMail({ id: 'b', cls: 'junk', from: 'Prize Post', subject: 'You may already have won' }),
        makeMail({ id: 'c', cls: 'legit', from: 'Northmoor Building Society', subject: 'Your statement' }),
      ],
    });
    mount(state);
    for (const id of ['a', 'b', 'c']) {
      const row = container!.querySelector(`[data-testid="mail-row-${id}"]`)!;
      expect(row.outerHTML).not.toMatch(/\bscam\b|\bjunk\b|\blegit\b/);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Columns and expiry (§10.2, §22.2)
 * ------------------------------------------------------------------ */

describe('columns', () => {
  it('shows the unread dot only for unread rows, From, Subject and a derived Expires column', () => {
    const state = makeState({
      inbox: [
        makeMail({ id: 'u', status: 'unread', expiresMonth: monthIndex(1998, 10) }), // +1 month = 30d
        makeMail({ id: 'r', status: 'read', expiresMonth: null }),
      ],
    });
    mount(state);
    const unreadRow = container!.querySelector('[data-testid="mail-row-u"]')!;
    const readRow = container!.querySelector('[data-testid="mail-row-r"]')!;
    expect(unreadRow.querySelector('.mail-col-dot')!.textContent).toBe('●');
    expect(readRow.querySelector('.mail-col-dot')!.textContent).toBe('');
    expect(unreadRow.querySelector('.mail-col-expires')!.textContent).toBe('30d');
    expect(readRow.querySelector('.mail-col-expires')!.textContent).toBe('—');
  });

  it('floors expiry at 1d rather than showing 0d for a message due this month', () => {
    const state = makeState({
      month: monthIndex(1998, 9),
      inbox: [makeMail({ id: 'x', expiresMonth: monthIndex(1998, 9) })],
    });
    mount(state);
    const row = container!.querySelector('[data-testid="mail-row-x"]')!;
    expect(row.querySelector('.mail-col-expires')!.textContent).toBe('1d');
  });

  it('sorts by clicking a column header, and reverses on a second click', () => {
    const state = makeState({
      inbox: [
        makeMail({ id: 'z', from: 'Zebra Assets' }),
        makeMail({ id: 'a', from: 'Aardvark Savings' }),
      ],
    });
    mount(state);
    const fromHeader = Array.from(container!.querySelectorAll('button.mail-th')).find((b) =>
      b.textContent?.includes('From'),
    ) as HTMLButtonElement;
    act(() => fromHeader.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    let rows = Array.from(container!.querySelectorAll('tbody tr'));
    expect(rows[0].getAttribute('data-message-id')).toBe('a');

    act(() => fromHeader.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    rows = Array.from(container!.querySelectorAll('tbody tr'));
    expect(rows[0].getAttribute('data-message-id')).toBe('z');
  });
});

/* ------------------------------------------------------------------ *
 * Actions dispatch the §25.2 replay-log decisions
 * ------------------------------------------------------------------ */

describe('actions', () => {
  it('dispatches open-mail for the selected row and shows its body', () => {
    const dispatch = vi.fn();
    const state = makeState({
      inbox: [
        makeMail({
          id: 'm1',
          contentId: 'msg.northmoor-bond',
          from: 'Northmoor Building Society',
          subject: 'Your savings, working harder',
        }),
      ],
    });
    mount(state, dispatch);
    const row = container!.querySelector('[data-testid="mail-row-m1"]') as HTMLTableRowElement;
    act(() => row.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const openBtn = Array.from(container!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Open'),
    ) as HTMLButtonElement;
    act(() => openBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(dispatch).toHaveBeenCalledWith({ type: 'open-mail', month: state.month, mailId: 'm1' });
    expect(container!.textContent).toContain('Northmoor Building Society is pleased to offer');
  });

  it('links an offer message through to the vehicle URL, without building the offer page', () => {
    const dispatch = vi.fn();
    const state = makeState({
      inbox: [
        makeMail({
          id: 'm1',
          vehicleId: 'fenwick-index',
          contentId: 'msg.fenwick-index',
          cls: 'legit',
        }),
      ],
    });
    mount(state, dispatch);
    const row = container!.querySelector('[data-testid="mail-row-m1"]') as HTMLTableRowElement;
    act(() => row.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const openBtn = Array.from(container!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Open'),
    ) as HTMLButtonElement;
    act(() => openBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    const link = container!.querySelector('.mail-message__offer-link') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('http://www.fenwickfunds.co.uk/index-trust');
  });

  it('does not expose an offer CTA for informational Capital Direct Mail', () => {
    const dispatch = vi.fn();
    const state = makeState({
      inbox: [makeMail({
        id: 'capital',
        from: 'Capital Direct',
        subject: '0% on purchases for 6 months',
        contentId: 'msg.capital-direct-card-1998-05',
        cls: 'credit',
        vehicleId: undefined,
      })],
    });
    mount(state, dispatch);
    const row = container!.querySelector('[data-testid="mail-row-capital"]') as HTMLTableRowElement;
    act(() => row.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const openBtn = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent?.includes('Open'))!;
    act(() => openBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(container!.textContent).toContain('29.8% APR representative');
    expect(container!.querySelector('.mail-message__offer-link')).toBeNull();
  });

  it('dispatches delete-mail for the selected row', () => {
    const dispatch = vi.fn();
    const state = makeState({ inbox: [makeMail({ id: 'm1' })] });
    mount(state, dispatch);
    const row = container!.querySelector('[data-testid="mail-row-m1"]') as HTMLTableRowElement;
    act(() => row.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const delBtn = Array.from(container!.querySelectorAll('button')).find(
      (b) => b.textContent === '[ Delete ]',
    ) as HTMLButtonElement;
    act(() => delBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(dispatch).toHaveBeenCalledWith({ type: 'delete-mail', month: state.month, mailId: 'm1' });
  });

  it('[ Delete all ] dispatches immediately, with no confirmation prompt of any kind', () => {
    const dispatch = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const state = makeState({
      inbox: [
        makeMail({ id: 'm1', cls: 'windfall', subject: 'Your child savings account has matured' }),
        makeMail({ id: 'm2', cls: 'junk' }),
      ],
    });
    mount(state, dispatch);
    const delAllBtn = Array.from(container!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Delete all'),
    ) as HTMLButtonElement;
    act(() => delAllBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(dispatch).toHaveBeenCalledWith({ type: 'delete-all-mail', month: state.month });
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });
});

/* ------------------------------------------------------------------ *
 * §10.3 — the 0.4x rate, set on mount and guaranteed to unstick on unmount
 * ------------------------------------------------------------------ */

describe('triage-pressure time rate (§10.3)', () => {
  it('sets RATE_INBOX on mount and restores RATE_NORMAL on unmount, even mid-read', () => {
    const state = makeState({ inbox: [makeMail({ id: 'm1' })] });
    const { engine } = mount(state);
    expect(engine.setTimeRate).toHaveBeenCalledWith(RATE_INBOX);

    // simulate "navigating away mid-read": open a message, then unmount
    // without ever clicking Back.
    const row = container!.querySelector('[data-testid="mail-row-m1"]') as HTMLTableRowElement;
    act(() => row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })));

    act(() => root!.unmount());
    expect(engine.setTimeRate).toHaveBeenLastCalledWith(RATE_NORMAL);
  });
});
