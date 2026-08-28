// @vitest-environment jsdom
/**
 * PLAN-COMET-ASSISTANT.md §9 — Step C5 acceptance test. Mounts the same
 * assembly App.tsx's AppShell mounts (useAssistant() + AssistantButton +
 * AssistantPanel + AssistantBalloon) against a mocked engine and a mocked
 * `fetch`, so the whole chat path — open, ask, stream/fallback, close — is
 * exercised end to end exactly as a player would drive it, not just the
 * hook in isolation.
 *
 * `fetch` is stubbed the same way `assistantApi.test.ts` (Step C6) already
 * does — this file doesn't re-test `streamAssistantReply`'s own contract,
 * only that `useAssistant`/`AssistantPanel` react to it correctly.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useAssistant } from './useAssistant';
import { AssistantButton } from '../chrome/AssistantButton';
import { AssistantPanel } from '../chrome/AssistantPanel';
import { AssistantBalloon } from '../chrome/AssistantBalloon';
import { EngineContext, RATE_ASSISTANT, RATE_NORMAL, type Engine } from './engine';
import { monthIndex } from '../sim/month';
import type { GameState, RunFlags, RunStats } from '../sim/types';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* ------------------------------------------------------------------ *
 * Fixtures — this file owns them (§26.2 rule 3: no shared fixture file),
 * mirroring assistantContext.test.ts's baseState/baseFlags/baseStats.
 * ------------------------------------------------------------------ */

function baseFlags(overrides: Partial<RunFlags> = {}): RunFlags {
  return {
    onScamList: false,
    incomeSuspendedMonths: 0,
    era: 'a',
    moneyBase: 'period',
    everOpenedInbox: true,
    everOpenedFactSheet: true,
    ...overrides,
  };
}

function baseStats(overrides: Partial<RunStats> = {}): RunStats {
  return {
    peakWealth: 0,
    peakWealth1996: 0,
    finalWealth: 0,
    feesPaid: 0,
    trackerCounterfactualFees: 0,
    scamsFunded: 0,
    scamsDodged: 0,
    forcedSales: 0,
    monthsUnderwater: 0,
    scamsFundedIds: [],
    scamsDodgedIds: [],
    redFlagsMissed: [],
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    month: monthIndex(1998, 9),
    status: 'running',
    cash: 500,
    holdings: {},
    unlocked: [],
    debt: null,
    inbox: [],
    popups: [],
    dialogs: [],
    flags: baseFlags(),
    stats: baseStats(),
    wealthHistory: [],
    marketHistory: [],
    deathMonth: null,
    deathCauseId: null,
    decisions: [],
    ...overrides,
  };
}

function makeEngine(state: GameState, mailNoticeResetKey = 0, overrides: Partial<Engine> = {}): Engine {
  return {
    state,
    paused: false,
    autoPaused: false,
    timeRate: 1,
    popupPresentation: { active: null, pending: [], phase: 'showing' },
    mailNoticeResetKey,
    dispatch: vi.fn(),
    setPaused: vi.fn(),
    setAutoPaused: vi.fn(),
    setEvolutionPaused: vi.fn(),
    setTimeRate: vi.fn(),
    closePresentedPopup: vi.fn(),
    filePresentedPopup: vi.fn(),
    deferPresentedPopup: vi.fn(),
    finishPopupGap: vi.fn(),
    jumpToMonth: vi.fn(),
    forceEvent: vi.fn(),
    loadPreset: vi.fn(),
    showDeathCard: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

/** A fake SSE `Response` from a list of already-formatted event bodies —
 * same construction as assistantApi.test.ts's `sseResponse`. */
function sseResponse(events: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${event}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, { status });
}

const ROUTE = { url: 'http://www.bubble.net/', title: 'Bubble Navigator' };

function Harness() {
  const assistant = useAssistant();
  return (
    <div className="chrome comet-assistant">
      <AssistantButton open={assistant.open} onToggle={() => assistant.setOpen(!assistant.open)} />
      {assistant.open && (
        <AssistantPanel
          onClose={() => assistant.setOpen(false)}
          transcript={assistant.transcript}
          inFlight={assistant.inFlight}
          offline={assistant.offline}
          onSend={(question) => assistant.send(question, ROUTE)}
        />
      )}
      {assistant.balloon && (
        <AssistantBalloon text={assistant.balloon.text} onDismiss={assistant.dismissBalloon} />
      )}
    </div>
  );
}

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
  vi.unstubAllGlobals();
});

function render(engine: Engine) {
  act(() => {
    root.render(
      <EngineContext.Provider value={engine}>
        <Harness />
      </EngineContext.Provider>,
    );
  });
}

function rerender(engine: Engine) {
  act(() => {
    root.render(
      <EngineContext.Provider value={engine}>
        <Harness />
      </EngineContext.Provider>,
    );
  });
}

function openButton(): HTMLButtonElement {
  return container.querySelector('.comet-assistant__btn')!;
}

function askInput(): HTMLInputElement {
  return container.querySelector('.comet-assistant-panel__input')!;
}

function askButton(): HTMLButtonElement {
  return container.querySelector('.comet-assistant-panel__ask')!;
}

function typeQuestion(question: string) {
  const input = askInput();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(input, question);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function waitFor(check: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitFor timed out; last transcript: ${container.textContent}`);
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
}

const TRACKER_ANSWER =
  "A tracker fund just buys a slice of a whole market index — hundreds of companies at once — rather than betting on one manager's picks. Low fees, because nobody's paid to guess. Some funds in this game charge twenty times what a tracker does for the privilege.";

describe('useAssistant + AssistantPanel (Step C5) — offline-first, read-only', () => {
  it('opens the panel, asks a question, and (fetch failing) renders the authored fallback with the offline status line', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 502 })));
    const engine = makeEngine(makeState());
    render(engine);

    expect(container.querySelector('.comet-assistant-panel')).toBeNull();
    act(() => openButton().click());
    expect(container.querySelector('.comet-assistant-panel')).not.toBeNull();

    typeQuestion('what is a tracker fund?');
    act(() => askButton().click());

    await waitFor(() => container.textContent?.includes(TRACKER_ANSWER) ?? false);

    expect(container.textContent).toContain('⚠ Working offline — answers from the built-in help file.');
    expect(engine.dispatch).not.toHaveBeenCalled();
  });

  it('sets time rate to 0.4x on open and restores 1x on close, and never pauses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 502 })));
    const engine = makeEngine(makeState());
    render(engine);

    act(() => openButton().click());
    expect(engine.setTimeRate).toHaveBeenLastCalledWith(RATE_ASSISTANT);

    act(() => container.querySelector<HTMLButtonElement>('.comet-assistant-panel__close')!.click());
    expect(engine.setTimeRate).toHaveBeenLastCalledWith(RATE_NORMAL);

    expect(engine.setPaused).not.toHaveBeenCalled();
    expect(engine.setAutoPaused).not.toHaveBeenCalled();
  });

  it('restores the time rate if the panel is left open and the component unmounts', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 502 })));
    const engine = makeEngine(makeState());
    render(engine);

    act(() => openButton().click());
    expect(engine.setTimeRate).toHaveBeenLastCalledWith(RATE_ASSISTANT);

    act(() => root.unmount());
    expect(engine.setTimeRate).toHaveBeenLastCalledWith(RATE_NORMAL);
  });

  it('renders a successful streamed reply as accumulated deltas, with no offline banner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        sseResponse([
          JSON.stringify({ type: 'delta', text: 'Every offer keeps a fact sheet ' }),
          JSON.stringify({ type: 'delta', text: 'one click away.' }),
          JSON.stringify({ type: 'done' }),
        ]),
      ),
    );
    const engine = makeEngine(makeState());
    render(engine);

    act(() => openButton().click());
    typeQuestion('help');
    act(() => askButton().click());

    await waitFor(() =>
      (container.textContent ?? '').includes('Every offer keeps a fact sheet one click away.'),
    );

    expect(container.textContent).not.toContain('Working offline');
    expect(engine.dispatch).not.toHaveBeenCalled();
  });

  it('discards a mid-stream partial and shows the authored fallback plus the offline status line', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        sseResponse([
          JSON.stringify({ type: 'delta', text: 'Some half-finished sente' }),
          JSON.stringify({ type: 'error' }),
        ]),
      ),
    );
    const engine = makeEngine(makeState());
    render(engine);

    act(() => openButton().click());
    typeQuestion('what is a tracker fund?');
    act(() => askButton().click());

    await waitFor(() => container.textContent?.includes(TRACKER_ANSWER) ?? false);

    // The partial never survives as the committed answer (plan §7: discard
    // on any failure, never mix streamed and fallback content).
    expect(container.textContent).not.toContain('Some half-finished sente');
    expect(container.textContent).toContain('⚠ Working offline — answers from the built-in help file.');
  });

  it('clears the transcript when engine.reset() rebuilds state (mailNoticeResetKey changes)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 502 })));
    const engine = makeEngine(makeState(), 0);
    render(engine);

    act(() => openButton().click());
    typeQuestion('help');
    act(() => askButton().click());
    await waitFor(() => (container.textContent ?? '').includes('INBOX'));

    expect(container.querySelector('.comet-assistant-panel__transcript-empty')).toBeNull();

    const resetEngine = makeEngine(makeState(), 1, { setTimeRate: engine.setTimeRate });
    rerender(resetEngine);

    expect(container.querySelector('.comet-assistant-panel__transcript-empty')).not.toBeNull();
  });

  it('empty input is a no-op — Ask stays disabled and Enter sends nothing', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 502 })));
    const engine = makeEngine(makeState());
    render(engine);

    act(() => openButton().click());
    expect(askButton().disabled).toBe(true);

    act(() => {
      askInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(container.querySelector('.comet-assistant-panel__transcript-empty')).not.toBeNull();
  });
});
