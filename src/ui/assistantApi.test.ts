/**
 * PLAN-COMET-ASSISTANT.md Step C6's acceptance test: the client path with a
 * mocked `fetch`. No real network call — the Pages Function itself has no
 * test harness here (no key in CI); this file only exercises
 * `streamAssistantReply`'s contract against a fake `/api/assistant`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ASSISTANT_TIMEOUT_MS, streamAssistantReply } from './assistantApi';
import type { AssistantStreamEvent } from './assistantApi';

/** Builds a fake SSE `Response` from a list of already-formatted events. */
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

/** Drains the generator, returning every event in order. */
async function collect(gen: AsyncGenerator<AssistantStreamEvent>): Promise<AssistantStreamEvent[]> {
  const events: AssistantStreamEvent[] = [];
  for await (const event of gen) {
    events.push(event);
  }
  return events;
}

describe('streamAssistantReply', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('yields the expected concatenated text on a successful SSE stream', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        JSON.stringify({ type: 'delta', text: 'Every offer has a ' }),
        JSON.stringify({ type: 'delta', text: 'fact sheet.' }),
        JSON.stringify({ type: 'done' }),
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    const events = await collect(
      streamAssistantReply({}, [{ role: 'user', content: 'is this a scam?' }]),
    );

    const text = events
      .filter((e): e is { type: 'delta'; text: string } => e.type === 'delta')
      .map((e) => e.text)
      .join('');
    expect(text).toBe('Every offer has a fact sheet.');
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/assistant',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('resolves to a failure signal on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'upstream_error' }), { status: 502 })),
    );

    const events = await collect(streamAssistantReply({}, [{ role: 'user', content: 'help' }]));

    expect(events).toEqual([{ type: 'failure', reason: 'http_error' }]);
  });

  it('resolves to a failure signal within the 8s budget on timeout', async () => {
    vi.useFakeTimers();
    // Never resolves on its own — only the AbortController's abort() (fired
    // by the client's own timeout) rejects it, exactly like a real hung
    // connection under conference wifi.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }),
      ),
    );

    const gen = streamAssistantReply({}, [{ role: 'user', content: 'help' }]);
    const nextPromise = gen.next();

    await vi.advanceTimersByTimeAsync(ASSISTANT_TIMEOUT_MS);
    const result = await nextPromise;

    expect(result.done).toBe(false);
    expect(result.value).toEqual({ type: 'failure', reason: 'timeout' });
  });

  it('discards the partial reply and signals failure on a mid-stream error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        JSON.stringify({ type: 'delta', text: 'Money sitting in cash' }),
        JSON.stringify({ type: 'error' }),
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    const events = await collect(streamAssistantReply({}, [{ role: 'user', content: 'help' }]));

    // The partial delta is observable on the stream (a caller could render
    // it live), but the contract is that it must never be treated as a
    // finished answer: no `done` ever follows a `failure`, so a caller that
    // only commits text on `done` correctly discards the partial.
    expect(events).toEqual([
      { type: 'delta', text: 'Money sitting in cash' },
      { type: 'failure', reason: 'stream_error' },
    ]);
    expect(events.some((e) => e.type === 'done')).toBe(false);
  });

  it('signals a mid-stream failure when the connection closes without a done event', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        sseResponse([JSON.stringify({ type: 'delta', text: 'Boring, dull-looking, correct' })]),
      ),
    );

    const events = await collect(streamAssistantReply({}, [{ role: 'user', content: 'what is a tracker' }]));

    expect(events).toEqual([
      { type: 'delta', text: 'Boring, dull-looking, correct' },
      { type: 'failure', reason: 'stream_error' },
    ]);
  });
});
