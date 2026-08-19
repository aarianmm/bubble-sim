// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { EngineProvider } from '../ui/EngineProvider';
import { Home } from './Home';

// React 18's act() checks this global rather than inferring a test renderer.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('/home (§22.1)', () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function mount() {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <EngineProvider>
          <Home />
        </EngineProvider>,
      );
    });
  }

  it('renders the masthead, headline pairing, THIS MONTH panel and disclaimer', () => {
    mount();
    expect(container.textContent).toContain('BUBBLE');
    expect(container.textContent).toContain('Y O U R');
    expect(container.textContent).toContain('THIS MONTH');
    expect(container.textContent).toContain('Pay in');
    expect(container.textContent).toContain('Left over');
    expect(container.textContent).toContain('was');
    expect(container.textContent).toContain('This is not financial advice');
    // §5.1 — fictional funds only, never a real one, are the ones this game
    // invents; the disclaimer line itself must be present verbatim-ish.
    expect(container.textContent).toContain('Historical data is real');
  });

  it('the headline pairing shows period money primary, 1996 money secondary, at start', () => {
    mount();
    const headline = container.querySelector('.money--headline')!;
    const primary = headline.querySelector('.money__primary')!.textContent;
    const secondary = headline.querySelector('.money__secondary')!.textContent;
    // Month 0 (Jan 1996): net worth is £0, and 1996 money is quoted as such.
    expect(primary).toBe('£0');
    expect(secondary).toContain('£0');
    expect(secondary).toContain('in 1996 money');
  });

  it('clicking the headline figure toggles dual money for the whole page (§19.4, §22.1)', () => {
    mount();
    const headlineButton = container.querySelector('button.money--headline')!;
    expect(headlineButton.getAttribute('aria-pressed')).toBe('false');
    act(() => {
      headlineButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(headlineButton.getAttribute('aria-pressed')).toBe('true');
    const secondary = headlineButton.querySelector('.money__secondary')!.textContent;
    // Now period money is the secondary line, labelled by the current month.
    expect(secondary).toContain('in January 1996 money');
  });

  it('the ticker carries this year\'s real headlines (§22.1, §5.1)', () => {
    mount();
    // state starts at month 0 = Jan 1996.
    expect(container.textContent).toContain('Bank of England base rate holds around 6%');
  });
});
