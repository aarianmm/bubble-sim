// @vitest-environment jsdom
import { act } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppShell } from '../App';
import { RouterProvider } from '../chrome/router';
import { HOME_URL } from './registry';
import { monthIndex } from '../sim/month';
import { netWorth } from '../sim/selectors';
import { EngineProvider } from '../ui/EngineProvider';
import { useEngine, type Engine } from '../ui/engine';

const tokensCss = readFileSync(resolve(process.cwd(), 'src/chrome/tokens.css'), 'utf8');
const moneyCss = readFileSync(resolve(process.cwd(), 'src/pages/money.css'), 'utf8');

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let engineHandle: Engine | null;

function EngineProbe() {
  engineHandle = useEngine();
  return null;
}

function Harness() {
  return (
    <EngineProvider>
      <RouterProvider initialUrl={HOME_URL}>
        <AppShell />
        <EngineProbe />
      </RouterProvider>
    </EngineProvider>
  );
}

function clickButton(label: string) {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((candidate) =>
    candidate.textContent?.includes(label),
  );
  if (!button) throw new Error(`button not found: ${label}`);
  act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

function slider(label: string): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(`input[aria-label="${label} target allocation, percent"]`);
  if (!input) throw new Error(`allocation slider not found: ${label}`);
  return input;
}

function pinButton(label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')).find((candidate) =>
    candidate.getAttribute('aria-label')?.includes(label),
  );
  if (!button) throw new Error(`allocation pin not found: ${label}`);
  return button;
}

function statusText(): string {
  return container.querySelector<HTMLElement>('.money-footer__status')?.textContent ?? '';
}

function drag(input: HTMLInputElement, value: number) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function cssBlock(selector: string): string {
  const start = tokensCss.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`CSS selector not found: ${selector}`);
  const end = tokensCss.indexOf('\n}', start);
  if (end < 0) throw new Error(`CSS block not closed: ${selector}`);
  return tokensCss.slice(start, end);
}

function cssToken(block: string, name: string): string {
  const value = block.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim();
  if (!value) throw new Error(`CSS token not found: ${name}`);
  return value;
}

beforeEach(() => {
  window.history.pushState({}, '', '/');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  engineHandle = null;
  act(() => root.render(<Harness />));
  act(() => engineHandle!.setPaused(true));
  act(() => engineHandle!.jumpToMonth(monthIndex(1996, 4)));
  act(() => {
    engineHandle!.dispatch({
      type: 'accept-offer',
      month: engineHandle!.state.month,
      vehicleId: 'northmoor-bond',
      source: 'money-page-regression',
    });
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = '';
  window.history.pushState({}, '', '/');
});

describe('/money allocation lifecycle', () => {
  it('keeps a draft across navigation, then persists the confirmed investment in GameState', () => {
    clickButton('MY MONEY');
    drag(slider('Northmoor 3-Year Fixed Bond'), 40);

    expect(slider('Cash').value).toBe('60');
    expect(slider('Northmoor 3-Year Fixed Bond').value).toBe('40');
    expect(statusText()).toContain('DRAFT ONLY');
    expect(container.querySelector('.money-allocation-chart')?.textContent).toContain('Northmoor 3-Year Fixed Bond 40%');
    expect(container.querySelector('.money-allocation-chart__center')?.textContent).toContain('DRAFT');
    expect(container.querySelector('.money-allocation-chart__orbit')).toBeTruthy();

    // This is the reported regression: routing unmounted MoneyPage and its
    // page-local useState draft, so returning silently showed 100% cash.
    clickButton('INBOX');
    clickButton('MY MONEY');
    expect(slider('Cash').value).toBe('60');
    expect(slider('Northmoor 3-Year Fixed Bond').value).toBe('40');
    clickButton('Refresh');
    expect(slider('Cash').value).toBe('60');
    expect(slider('Northmoor 3-Year Fixed Bond').value).toBe('40');
    clickButton('Back');
    clickButton('Forward');
    expect(slider('Cash').value).toBe('60');
    expect(slider('Northmoor 3-Year Fixed Bond').value).toBe('40');

    const wealthBefore = netWorth(engineHandle!.state);
    clickButton('Rebalance Now');
    clickButton('Confirm rebalance');

    expect(engineHandle!.state.holdings['northmoor-bond']!.value).toBeCloseTo(wealthBefore * 0.4, 6);
    expect(engineHandle!.state.cash).toBeCloseTo(wealthBefore * 0.6, 6);
    expect(engineHandle!.state.decisions.at(-1)).toMatchObject({
      type: 'rebalance',
      targets: { 'northmoor-bond': 40 },
      cashPct: 60,
    });
    expect(slider('Cash').value).toBe('60');
    expect(slider('Northmoor 3-Year Fixed Bond').value).toBe('40');
    expect(statusText()).toContain('ALLOCATION APPLIED');
    expect(container.querySelector('.money-allocation-chart__center')?.textContent).toContain('APPLIED');

    clickButton('HOME');
    expect(engineHandle!.state.holdings['northmoor-bond']!.value).toBeCloseTo(wealthBefore * 0.4, 6);
    expect(engineHandle!.state.cash).toBeCloseTo(wealthBefore * 0.6, 6);
    clickButton('MY MONEY');
    expect(slider('Cash').value).toBe('60');
    expect(slider('Northmoor 3-Year Fixed Bond').value).toBe('40');
  });

  it('makes editor pins explicit, preserves them across a new offer, and redistributes around them', () => {
    clickButton('MY MONEY');
    drag(slider('Northmoor 3-Year Fixed Bond'), 40);

    const northmoorPin = pinButton('Northmoor 3-Year Fixed Bond');
    expect(northmoorPin.getAttribute('aria-pressed')).toBe('false');
    clickButton('PIN 40%');
    expect(pinButton('Northmoor 3-Year Fixed Bond').getAttribute('aria-pressed')).toBe('true');
    expect(pinButton('Northmoor 3-Year Fixed Bond').textContent).toContain('PINNED 40%');
    expect(slider('Northmoor 3-Year Fixed Bond').disabled).toBe(true);
    expect(container.querySelector('.money-row--pinned')?.textContent).toContain('Pinned at 40% while editing');

    act(() => {
      engineHandle!.dispatch({
        type: 'accept-offer',
        month: engineHandle!.state.month,
        vehicleId: 'fenwick-index',
        source: 'money-pin-regression',
      });
    });
    expect(slider('Northmoor 3-Year Fixed Bond').value).toBe('40');
    expect(slider('Fenwick Index Trust').value).toBe('0');

    drag(slider('Fenwick Index Trust'), 30);
    expect(slider('Northmoor 3-Year Fixed Bond').value).toBe('40');
    expect(slider('Fenwick Index Trust').value).toBe('30');
    expect(slider('Cash').value).toBe('30');

    clickButton('PINNED 40%');
    expect(pinButton('Northmoor 3-Year Fixed Bond').getAttribute('aria-pressed')).toBe('false');
    expect(slider('Northmoor 3-Year Fixed Bond').disabled).toBe(false);
  });

  it('keeps a cancelled review as a draft, while Reset and a new run clear it safely', () => {
    clickButton('MY MONEY');
    drag(slider('Northmoor 3-Year Fixed Bond'), 55);
    clickButton('Rebalance Now');
    clickButton('Cancel');
    expect(slider('Northmoor 3-Year Fixed Bond').value).toBe('55');
    expect(statusText()).toContain('DRAFT ONLY');

    clickButton('Reset');
    expect(slider('Cash').value).toBe('100');
    expect(slider('Northmoor 3-Year Fixed Bond').value).toBe('0');
    expect(statusText()).toContain('CURRENT ALLOCATION');

    drag(slider('Northmoor 3-Year Fixed Bond'), 25);
    act(() => engineHandle!.reset());
    expect(slider('Cash').value).toBe('100');
    expect(container.querySelector('[aria-label="Northmoor 3-Year Fixed Bond target allocation, percent"]')).toBeNull();
  });

  it('switches allocation control tokens at the 1998 and 2000 system milestones', () => {
    const era1996 = cssBlock(":root[data-era='a']");
    const era1998 = cssBlock(":root[data-era='a'][data-ui-year='1998']");
    const era2000 = cssBlock(":root[data-era='b'][data-ui-year='2000']");

    act(() => engineHandle!.jumpToMonth(monthIndex(1998, 1)));
    expect(document.documentElement.getAttribute('data-ui-year')).toBe('1998');

    act(() => engineHandle!.jumpToMonth(monthIndex(2000, 1)));
    expect(document.documentElement.getAttribute('data-ui-year')).toBe('2000');

    expect([
      cssToken(era1996, '--money-slider-fill'),
      cssToken(era1998, '--money-slider-fill'),
      cssToken(era2000, '--money-slider-fill'),
    ]).toEqual(['var(--selection-bg)', '#0097b0', '#68b72c']);
    expect([
      cssToken(era1996, '--money-radius'),
      cssToken(era1998, '--money-radius'),
      cssToken(era2000, '--money-radius'),
    ]).toEqual(['0', '2px', '8px']);
    expect([
      cssToken(era1996, '--chart-area-opacity'),
      cssToken(era1998, '--chart-area-opacity'),
      cssToken(era2000, '--chart-area-opacity'),
    ]).toEqual(['0', '0.08', '0.16']);
    expect([
      cssToken(era1996, '--chart-line-width'),
      cssToken(era1998, '--chart-line-width'),
      cssToken(era2000, '--chart-line-width'),
    ]).toEqual(['1.5', '2', '2.7']);
    expect([
      cssToken(era1996, '--chart-ring-cap'),
      cssToken(era1998, '--chart-ring-cap'),
      cssToken(era2000, '--chart-ring-cap'),
    ]).toEqual(['butt', 'square', 'round']);

    // Motion is intentionally stepped for the period UI and must respect the
    // user's reduced-motion preference.
    expect(moneyCss).toContain('steps(');
    expect(moneyCss).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
