// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { EngineProvider } from './EngineProvider';
import { Money, formatPounds } from './Money';
import { monthIndex } from '../sim/month';

// React 18's act() checks this global rather than inferring a test renderer.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('formatPounds (§19.1 — Courier-styled £, real minus sign)', () => {
  it('groups thousands', () => {
    expect(formatPounds(2140)).toBe('£2,140');
    expect(formatPounds(59)).toBe('£59');
  });

  it('renders negatives with a real minus sign, not a hyphen', () => {
    expect(formatPounds(-701)).toBe('−£701');
    expect(formatPounds(-701)).not.toContain('-£'); // ASCII hyphen would sneak past the eye
  });

  it('rounds to the nearest pound', () => {
    expect(formatPounds(115.6)).toBe('£116');
    expect(formatPounds(-0.4)).toBe('£0');
  });
});

describe('<Money> — the global dual-money toggle (§19.4)', () => {
  let container: HTMLDivElement;
  let root: Root;

  function mount(children: ReactNode) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(<EngineProvider>{children}</EngineProvider>);
    });
  }

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('starts with period money primary (state.flags.moneyBase === "period")', () => {
    mount(<Money amount={2140} month={monthIndex(1998, 9)} variant="headline" />);
    const primary = container.querySelector('.money__primary');
    expect(primary?.textContent).toBe('£2,140');
  });

  it('a click on the headline flips every mounted <Money> at once — not just itself', () => {
    mount(
      <>
        <Money amount={2140} month={monthIndex(1998, 9)} variant="headline" />
        <Money amount={701} month={monthIndex(1998, 9)} variant="table-cell" />
        <Money amount={59} month={monthIndex(1998, 9)} variant="inline" />
      </>,
    );

    const primaries = () =>
      Array.from(container.querySelectorAll('.money__primary')).map((el) => el.textContent);

    const before = primaries();
    expect(before).toEqual(['£2,140', '£701', '£59']);

    const headlineButton = container.querySelector('button.money--headline');
    expect(headlineButton).not.toBeNull();
    act(() => {
      headlineButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const after = primaries();
    // Every figure — not only the one clicked — swapped to its 1996 value.
    expect(after[0]).not.toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
    expect(after[2]).not.toBe(before[2]);
    for (const value of after) expect(value?.startsWith('£')).toBe(true);

    // Clicking again (any instance is wired to the same global dispatch)
    // restores the original period-accurate figures exactly.
    act(() => {
      headlineButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(primaries()).toEqual(before);
  });

  it('a non-interactive figure never toggles on click (only the global menu/headline do)', () => {
    mount(<Money amount={100} variant="inline" interactive={false} />);
    expect(container.querySelector('button.money')).toBeNull();
    expect(container.querySelector('div.money')).not.toBeNull();
  });

  it('paired={false} renders only the primary line — for compact, non-headline mentions', () => {
    mount(<Money amount={115} variant="inline" paired={false} interactive={false} />);
    expect(container.querySelector('.money__primary')).not.toBeNull();
    expect(container.querySelector('.money__secondary')).toBeNull();
  });
});
