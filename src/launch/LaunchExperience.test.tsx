// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LaunchExperience } from './LaunchExperience';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function button(container: HTMLElement, label: string): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((item) =>
    item.textContent?.includes(label),
  );
  if (!match) throw new Error(`button not found: ${label}`);
  return match;
}

describe('modern launch experience', () => {
  let container: HTMLDivElement;
  let root: Root;

  function mount(onLaunch = vi.fn()) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<LaunchExperience onLaunch={onLaunch} />));
    return onLaunch;
  }

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('opens on a clear product overview with every requested functional tab', () => {
    mount();
    expect(container.textContent).toContain('Can your money survive the bubble?');
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(5);

    act(() => button(container, 'Simulation').click());
    expect(container.textContent).toContain('How to play');
    expect(container.textContent).toContain('fact sheet');

    act(() => button(container, 'Leaderboard').click());
    expect(container.textContent).toContain('does not rank wealth');
    act(() => button(container, 'User reports').click());
    expect(container.textContent).toContain('No report yet');
    act(() => button(container, 'Settings').click());
    expect(container.textContent).toContain('fully offline');
  });

  it('offers exactly one unlocked decade and runs the retro transition before launch', () => {
    const onLaunch = mount();
    act(() => button(container, 'Start simulation').click());
    const decadeCards = Array.from(container.querySelectorAll<HTMLButtonElement>('.decade-card'));
    expect(decadeCards).toHaveLength(4);
    expect(decadeCards.filter((item) => !item.disabled)).toHaveLength(1);
    expect(decadeCards[0].textContent).toContain('1996–2006');
    expect(decadeCards.slice(1).every((item) => item.textContent?.includes('LOCKED'))).toBe(true);

    act(() => decadeCards[0].click());
    expect(container.querySelector('.retro-transition')).toBeTruthy();
    expect(container.textContent).toContain('Reconstructing the market');
    expect(onLaunch).not.toHaveBeenCalled();
    act(() => button(container, 'Skip intro').click());
    expect(onLaunch).toHaveBeenCalledTimes(1);
  });

  it('automatically enters the game when the authored transition completes', () => {
    vi.useFakeTimers();
    const onLaunch = mount();
    act(() => button(container, 'Start simulation').click());
    act(() => container.querySelector<HTMLButtonElement>('.decade-card--available')!.click());
    act(() => vi.advanceTimersByTime(3800));
    expect(onLaunch).toHaveBeenCalledTimes(1);
  });
});
