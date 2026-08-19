// @vitest-environment jsdom
/**
 * Step 21's stated done-condition: "closing a popup does not delete the
 * inbox copy." Popup.tsx never touches an inbox at all — `onClose` and
 * `onCtaClick` are two entirely separate callbacks, so this is provable
 * structurally: closing fires only `onClose`; filing a copy only ever
 * happens as a *result* of `onCtaClick`, which closing never calls.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { Popup } from './Popup';
import type { PopupItem } from '../sim/types';

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

function makePopup(overrides: Partial<PopupItem> = {}): PopupItem {
  return {
    id: 'ev.1998-03.cavendish',
    eventId: 'ev.1998-03.cavendish',
    title: 'A once-in-a-generation opportunity',
    contentId: 'pop.cavendish-1998-03',
    vehicleId: 'cavendish-tech',
    cls: 'scam',
    openedMonth: 26,
    closesMonth: 28,
    x: 40,
    y: 20,
    width: 300,
    height: 250,
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
  // Popup.tsx creates a shared #bubble-popup-layer the first time it
  // mounts and reuses it after — clear it between tests so one test's
  // leftover DOM can't leak into the next's assertions.
  document.getElementById('bubble-popup-layer')?.remove();
  document.body.innerHTML = '';
});

describe('Popup — closing is free, safe, and never touches an inbox copy (§10 rule 2, §20.2)', () => {
  it('calls only onClose when the ✕ is clicked, never onCtaClick', () => {
    const onClose = vi.fn();
    const onCtaClick = vi.fn();
    mount(
      <Popup
        popup={makePopup()}
        body={['Guaranteed 40% p.a.']}
        cta={{ label: 'INVEST NOW', url: 'http://example.invalid/offer' }}
        onClose={onClose}
        onCtaClick={onCtaClick}
      />,
    );
    const closeBtn = document.querySelector('.comet-popup__close') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    act(() => {
      closeBtn.click();
    });
    expect(onClose).toHaveBeenCalledWith('ev.1998-03.cavendish');
    expect(onCtaClick).not.toHaveBeenCalled();
  });

  it('clicking the CTA reports the click without closing the popup', () => {
    const onClose = vi.fn();
    const onCtaClick = vi.fn();
    const cta = { label: 'INVEST NOW', url: 'http://example.invalid/offer' };
    mount(<Popup popup={makePopup()} body={['x']} cta={cta} onClose={onClose} onCtaClick={onCtaClick} />);
    const ctaBtn = document.querySelector('.comet-popup__cta') as HTMLButtonElement;
    act(() => {
      ctaBtn.click();
    });
    expect(onCtaClick).toHaveBeenCalledTimes(1);
    expect(onCtaClick.mock.calls[0][0]).toMatchObject({ id: 'ev.1998-03.cavendish' });
    expect(onCtaClick.mock.calls[0][1]).toEqual(cta);
    expect(onClose).not.toHaveBeenCalled();
    // The popup is still in the document — a "copy filed" gesture never
    // implies a close.
    expect(document.querySelector('.comet-popup')).toBeTruthy();
  });

  it('renders with no CTA at all when none is given (plain junk, no offer)', () => {
    const onClose = vi.fn();
    const onCtaClick = vi.fn();
    mount(<Popup popup={makePopup()} body={['Forward this to 10 friends.']} onClose={onClose} onCtaClick={onCtaClick} />);
    expect(document.querySelector('.comet-popup__cta')).toBeNull();
  });
});

describe('Popup — chromeless (§20.2)', () => {
  it('renders no menu bar, address bar or status bar of its own', () => {
    mount(<Popup popup={makePopup()} body={['x']} onClose={vi.fn()} onCtaClick={vi.fn()} />);
    expect(document.querySelector('.comet-menubar')).toBeNull();
    expect(document.querySelector('.comet-addressbar')).toBeNull();
    expect(document.querySelector('.comet-statusbar')).toBeNull();
  });

  it('renders at the given x/y and never calls Math.random to do so', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    mount(<Popup popup={makePopup({ x: 123, y: 45 })} body={['x']} onClose={vi.fn()} onCtaClick={vi.fn()} />);
    const el = document.querySelector('.comet-popup') as HTMLElement;
    expect(el.style.left).toBe('123px');
    expect(el.style.top).toBe('45px');
    expect(randomSpy).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });
});
