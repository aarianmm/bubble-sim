// @vitest-environment jsdom
import { act } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StatusBar } from './StatusBar';

const tokensCss = readFileSync(resolve(process.cwd(), 'src/chrome/tokens.css'), 'utf8');

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
});

describe('the evolving status bar (§18.1)', () => {
  it('keeps later-era decoration mounted without changing truthful status data', () => {
    act(() => {
      root.render(
        <StatusBar
          loadState={{ kind: 'opening', url: 'http://portal.bubble/home' }}
          progressPct={135}
          zoneLabel="Internet"
        />,
      );
    });

    expect(container.querySelector('.comet-statusbar__state-text')?.textContent).toBe(
      'Opening page http://portal.bubble/home',
    );
    expect(container.querySelector('.comet-statusbar__progress')?.getAttribute('aria-valuenow')).toBe(
      '100',
    );
    expect(container.querySelector('.comet-statusbar__connection-label')?.textContent).toBe(
      'ONLINE',
    );
    expect(container.querySelectorAll('.comet-statusbar__signal span')).toHaveLength(3);
    const millenniumStart = tokensCss.indexOf(":root[data-era='b'][data-ui-year='2000'] {");
    const millenniumEnd = tokensCss.indexOf('\n}', millenniumStart);
    const millenniumTokens = tokensCss.slice(millenniumStart, millenniumEnd);
    expect(millenniumTokens).toContain('--popup-blocker-display: flex;');
  });
});
