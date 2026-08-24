// @vitest-environment jsdom
/**
 * Step 20's stated done-condition: "there is no code path that closes a
 * dialog without a choice." These tests fire every plausible dismissal —
 * the disabled ✕, Escape, clicking outside — and assert `onResolve` is
 * never called by any of them; the only way it fires is a real button
 * click, asserted separately with the right action.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { Dialog } from './Dialog';
import type { DialogItem } from '../sim/types';
import { TIMELINE } from '../script/timeline';

beforeAll(() => {
  // jsdom, opted into per-file via the pragma above — React 18 needs this
  // flag set explicitly outside its own test-renderer setup for `act` to
  // batch updates instead of warning on every one.
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

function makeDialog(overrides: Partial<DialogItem> = {}): DialogItem {
  return {
    id: 'dlg-test-1',
    eventId: 'ev.test',
    title: 'Deposit top-up and a phone bill',
    contentId: 'dlg.shock-1997-09',
    cls: 'shock',
    raisedMonth: 20,
    amount: 600,
    buttons: [
      { label: 'Pay from cash', action: 'pay-from-cash', isDefault: true },
      { label: 'Sell to cover', action: 'sell-to-cover' },
    ],
    ...overrides,
  };
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount(ui: Parameters<Root['render']>[0]) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(ui);
  });
}

afterEach(() => {
  if (root) {
    act(() => {
      root!.unmount();
    });
  }
  container?.remove();
  container = null;
  root = null;
  document.body.innerHTML = '';
});

describe('Dialog — no code path closes it without a choice (§20.1)', () => {
  it('renders the ✕ as a real, disabled button with no click handler', () => {
    const onResolve = vi.fn();
    mount(<Dialog dialog={makeDialog()} onResolve={onResolve} />);
    const closeBtn = document.querySelector('.comet-dialog__close') as HTMLButtonElement;
    expect(document.querySelector('.comet-dialog__title')?.textContent).toBe('Bubble Navigator');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.disabled).toBe(true);
    act(() => {
      closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onResolve).not.toHaveBeenCalled();
    // A disabled button stays in the document — "drawn but disabled", not removed.
    expect(document.querySelector('.comet-dialog')).toBeTruthy();
  });

  it('does not close on Escape', () => {
    const onResolve = vi.fn();
    mount(<Dialog dialog={makeDialog()} onResolve={onResolve} />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onResolve).not.toHaveBeenCalled();
    expect(document.querySelector('.comet-dialog')).toBeTruthy();
  });

  it('does not close on clicking the dimmed backdrop', () => {
    const onResolve = vi.fn();
    mount(<Dialog dialog={makeDialog()} onResolve={onResolve} />);
    const backdrop = document.querySelector('.comet-dialog-backdrop') as HTMLElement;
    const overlay = document.querySelector('.comet-dialog-overlay') as HTMLElement;
    expect(backdrop).toBeTruthy();
    act(() => {
      backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onResolve).not.toHaveBeenCalled();
    expect(document.querySelector('.comet-dialog')).toBeTruthy();
  });

  it('resolves with the exact action of the button the player clicked', () => {
    const onResolve = vi.fn();
    mount(<Dialog dialog={makeDialog()} onResolve={onResolve} />);
    const buttons = document.querySelectorAll('.comet-dialog__btn');
    expect(buttons.length).toBe(2);
    act(() => {
      (buttons[1] as HTMLButtonElement).click();
    });
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith('sell-to-cover');
  });

  it('never renders more than two buttons, even given more', () => {
    const onResolve = vi.fn();
    mount(
      <Dialog
        dialog={makeDialog({
          buttons: [
            { label: 'One', action: 'acknowledge', isDefault: true },
            { label: 'Two', action: 'pay-from-cash' },
            { label: 'Three', action: 'sell-to-cover' },
          ],
        })}
        onResolve={onResolve}
      />,
    );
    expect(document.querySelectorAll('.comet-dialog__btn').length).toBe(2);
  });

  it('gives exactly the default button an extra focus ring', () => {
    const onResolve = vi.fn();
    mount(<Dialog dialog={makeDialog()} onResolve={onResolve} />);
    const ringed = document.querySelectorAll('.comet-dialog__btn--default');
    expect(ringed.length).toBe(1);
    expect(ringed[0].textContent).toBe('Pay from cash');
  });

  it('auto-focuses the default button so Enter alone resolves it', () => {
    const onResolve = vi.fn();
    mount(<Dialog dialog={makeDialog()} onResolve={onResolve} />);
    const defaultBtn = document.querySelector('.comet-dialog__btn--default');
    expect(document.activeElement).toBe(defaultBtn);
  });
});

describe('Dialog — cannot be constructed with an offer/vehicle payload (§20.4)', () => {
  it('DialogItem has no vehicleId field — a compile-time guarantee, not just a convention', () => {
    const dialog = makeDialog();
    // @ts-expect-error DialogItem intentionally carries no vehicleId (see
    // sim/types.ts). If this line stops erroring, someone added one, and
    // that's the regression this test exists to catch — `npm run
    // typecheck` fails on an unused `@ts-expect-error` directive.
    const withVehicle: DialogItem = { ...dialog, vehicleId: 'halcyon-reserve' };
    expect(withVehicle.title).toBe(dialog.title);
  });
});

describe('§20.4 trust hierarchy — no offer-class event ever reaches the DLG channel', () => {
  // Duplicated from (not imported from) script/timeline.ts's internal
  // OFFER_CLASSES so this assertion doesn't silently stop checking anything
  // if that constant is ever renamed or narrowed there.
  const OFFER_CLASSES = new Set(['legit', 'mediocre', 'scam', 'credit']);

  it('never schedules an offer-class event on the blocking DLG channel', () => {
    for (const e of TIMELINE) {
      if (e.channel === 'DLG') {
        expect(OFFER_CLASSES.has(e.cls), `${e.id} is DLG but cls="${e.cls}"`).toBe(false);
      }
    }
  });
});
