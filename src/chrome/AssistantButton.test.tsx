// @vitest-environment jsdom
/**
 * Step C5 (plan §9) converted AssistantButton from an uncontrolled component
 * that owned its own open/closed state (and rendered AssistantPanel itself)
 * into a plain controlled button — see Chrome.types.ts's AssistantButtonProps
 * comment for why. Panel-toggle behaviour now belongs to whoever composes
 * button + panel (App.tsx's AppShell, exercised end to end in
 * useAssistant.test.tsx); this file only has to prove the button itself:
 * renders identically across eras, reflects the `open` prop, and calls
 * `onToggle` on click.
 */
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
    root.render(<AssistantButton open={false} onToggle={() => {}} />);
  });
  return container.querySelector('.comet-assistant__btn')?.outerHTML;
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

describe('AssistantButton — controlled component (Step C5)', () => {
  it('reflects the open prop via aria-expanded without owning any state itself', () => {
    act(() => {
      root.render(<AssistantButton open={false} onToggle={() => {}} />);
    });
    const button = container.querySelector('button')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    act(() => {
      root.render(<AssistantButton open={true} onToggle={() => {}} />);
    });
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('calls onToggle on click and does not flip aria-expanded itself', () => {
    const calls: number[] = [];
    act(() => {
      root.render(<AssistantButton open={false} onToggle={() => calls.push(1)} />);
    });
    const button = container.querySelector('button')!;
    act(() => button.click());
    expect(calls).toEqual([1]);
    // No local state: the prop is still `false`, so aria-expanded stays put
    // until the parent re-renders with a new `open` value.
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders inert defaults when mounted without props (VisualGallery.tsx)', () => {
    act(() => {
      root.render(<AssistantButton />);
    });
    const button = container.querySelector('button')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    act(() => button.click()); // must not throw with no onToggle supplied
  });
});
