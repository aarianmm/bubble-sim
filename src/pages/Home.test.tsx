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

  it('the headline pairing shows period money primary and 2026 money secondary at start', () => {
    mount();
    const headline = container.querySelector('.money--headline')!;
    const primary = headline.querySelector('.money__primary')!.textContent;
    const secondary = headline.querySelector('.money__secondary')!.textContent;
    // Month 0 (Jan 1996): net worth is £0 in either purchasing-power base.
    expect(primary).toBe('£0');
    expect(secondary).toContain('£0');
    expect(secondary).toContain('in 2026 money');
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

  it('shows separate accessible NASDAQ and personal wealth charts', () => {
    mount();
    expect(container.textContent).toContain('NASDAQ COMPOSITE');
    expect(container.textContent).toContain('YOUR WEALTH PATH');
    const charts = container.querySelectorAll('svg[role="img"]');
    expect(charts).toHaveLength(2);
    expect(charts[0].getAttribute('aria-label')).toContain('NASDAQ Composite path');
    expect(charts[1].getAttribute('aria-label')).toContain('2026 money');
    // These invariant SVG layers are progressively revealed by the 1996,
    // 1998 and 2000 token sets rather than by branching in React.
    expect(container.querySelectorAll('.performance-chart__plot')).toHaveLength(2);
    expect(container.querySelectorAll('.performance-chart__year-grid line')).toHaveLength(12);
  });

  it('the ticker carries this year\'s real headlines (§22.1, §5.1)', () => {
    mount();
    // state starts at month 0 = Jan 1996.
    expect(container.textContent).toContain('Bank of England base rate holds around 6%');
  });
});
