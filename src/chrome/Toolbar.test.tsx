// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Toolbar } from './Toolbar';

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

describe('Toolbar Mail notice', () => {
  it('keeps the unread badge and renders the transient notice inside the Mail button', () => {
    act(() => {
      root.render(<Toolbar unreadCount={3} newMailNotice="New Mail — 3 messages" />);
    });

    const mailButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Mail'),
    );
    expect(mailButton?.querySelector('.comet-toolbar__badge')?.textContent).toBe('3');
    expect(mailButton?.querySelector('.comet-toolbar__mail-notice')?.textContent).toBe('New Mail — 3 messages');
    expect(mailButton?.hasAttribute('aria-label')).toBe(false);
    expect(mailButton?.textContent).toContain('Mail');
    expect(mailButton?.textContent).toContain('3');
    expect(mailButton?.textContent).toContain('New Mail — 3 messages');
  });

  it('does not render a notice when no new arrival is being announced', () => {
    act(() => {
      root.render(<Toolbar unreadCount={2} newMailNotice={null} />);
    });
    expect(container.querySelector('.comet-toolbar__badge')?.textContent).toBe('2');
    expect(container.querySelector('.comet-toolbar__mail-notice')).toBeNull();
  });
});
