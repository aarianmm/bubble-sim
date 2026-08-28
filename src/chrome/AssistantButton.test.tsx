// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AssistantButton } from './AssistantButton';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.removeAttribute('data-era');
  document.documentElement.removeAttribute('data-ui-year');
});

function renderUnderMilestone(era: 'a' | 'b', uiYear: '1996' | '1998' | '2000') {
  document.documentElement.setAttribute('data-era', era);
  document.documentElement.setAttribute('data-ui-year', uiYear);
  act(() => {
    root.render(<AssistantButton />);
  });
  return container.querySelector('.comet-assistant')?.outerHTML;
}

describe('AssistantButton — zero component-level era branching (CLAUDE.md rule 3)', () => {
  it('renders byte-identical markup in 1996, 1998 and 2000 — only tokens.css may differ', () => {
    const at1996 = renderUnderMilestone('a', '1996');
    const at1998 = renderUnderMilestone('a', '1998');
    const at2000 = renderUnderMilestone('b', '2000');

    expect(at1996).toBeTruthy();
    expect(at1998).toBe(at1996);
    expect(at2000).toBe(at1996);
  });
});

describe('AssistantButton — panel toggle', () => {
  it('opens the panel on click and closes it on a second click', () => {
    act(() => {
      root.render(<AssistantButton />);
    });
    const button = container.querySelector('button')!;
    expect(container.querySelector('.comet-assistant-panel')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');

    act(() => button.click());
    expect(container.querySelector('.comet-assistant-panel')).not.toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    act(() => button.click());
    expect(container.querySelector('.comet-assistant-panel')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on the panel’s ✕ button', () => {
    act(() => {
      root.render(<AssistantButton />);
    });
    const button = container.querySelector('button')!;
    act(() => button.click());
    expect(container.querySelector('.comet-assistant-panel')).not.toBeNull();

    const closeBtn = container.querySelector<HTMLButtonElement>('.comet-assistant-panel__close')!;
    act(() => closeBtn.click());
    expect(container.querySelector('.comet-assistant-panel')).toBeNull();
  });

  it('closes on Escape', () => {
    act(() => {
      root.render(<AssistantButton />);
    });
    const button = container.querySelector('button')!;
    act(() => button.click());
    expect(container.querySelector('.comet-assistant-panel')).not.toBeNull();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(container.querySelector('.comet-assistant-panel')).toBeNull();
  });

  it('notifies onOpenChange without ceding ownership of the open state', () => {
    const calls: boolean[] = [];
    act(() => {
      root.render(<AssistantButton onOpenChange={(open) => calls.push(open)} />);
    });
    const button = container.querySelector('button')!;
    act(() => button.click());
    act(() => button.click());
    expect(calls).toEqual([true, false]);
  });
});
