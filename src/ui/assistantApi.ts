/**
 * The Comet Assistant's streaming client (PLAN-COMET-ASSISTANT.md, Step C6;
 * plan §6/§7). Talks to the Pages Function at `POST /api/assistant`
 * (`functions/api/assistant.ts`) and turns its SSE stream into an
 * async-iterable of typed events.
 *
 * This module owns exactly one job: get a reply from the network, or fail
 * distinguishably fast. It does not know about the authored fallback
 * library, `matchFallback`, or the panel UI — plan §6's Step C6 brief is
 * explicit that the integration step (C5's `useAssistant.ts`, already
 * built) wires this in behind the same interface `matchFallback` uses.
 * Every failure path here — a rejected fetch, a non-2xx response, the
 * 8-second timeout, or an upstream stream that ends without its `done`
 * marker — resolves to an `AssistantFailure` event so the caller has one
 * thing to check before falling back, never a thrown exception to catch.
 */

/** One turn of the transcript sent to the backend. */
export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Why a request failed to produce a usable reply. */
export type AssistantFailureReason =
  | 'timeout'
  | 'network'
  | 'http_error'
  | 'stream_error';

export interface AssistantDeltaEvent {
  type: 'delta';
  text: string;
}

export interface AssistantDoneEvent {
  type: 'done';
}

export interface AssistantFailureEvent {
  type: 'failure';
  reason: AssistantFailureReason;
}

export type AssistantStreamEvent = AssistantDeltaEvent | AssistantDoneEvent | AssistantFailureEvent;

/** Plan §7: fallback triggers if the network hasn't produced a reply within 8s. */
export const ASSISTANT_TIMEOUT_MS = 8000;

const ASSISTANT_ENDPOINT = '/api/assistant';

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

type ParsedSseEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error' };

/**
 * Parses one `data: {...}` SSE record (already split on the blank-line
 * separator) into the wire shape `functions/api/assistant.ts` emits. Any
 * line that doesn't match — a keep-alive comment, a malformed payload — is
 * silently ignored, matching how SSE consumers are expected to behave.
 */
function parseSseEvent(raw: string): ParsedSseEvent | null {
  const dataLine = raw.split('\n').find((line) => line.startsWith('data:'));
  if (!dataLine) return null;
  const jsonText = dataLine.slice(5).trim();
  if (!jsonText) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || !('type' in parsed)) return null;
  const record = parsed as { type: unknown; text?: unknown };

  if (record.type === 'delta' && typeof record.text === 'string') {
    return { type: 'delta', text: record.text };
  }
  if (record.type === 'done') return { type: 'done' };
  if (record.type === 'error') return { type: 'error' };
  return null;
}

/**
 * Streams the Comet Assistant's reply to `messages` (transcript, last turn
 * must be the player's question) given an opaque `context` blob (owned by
 * `src/ui/assistantContext.ts`, Step C3 — this module never looks inside
 * it). Yields `delta` events as text arrives, then either a terminal `done`
 * or a terminal `failure` — never both, and never a `done` after a
 * `failure`. On `failure`, the caller must discard any text accumulated
 * from prior `delta` events: the reply is partial, and plan §7 requires
 * falling back to authored content rather than showing a truncated answer.
 */
export async function* streamAssistantReply(
  context: unknown,
  messages: AssistantMessage[],
): AsyncGenerator<AssistantStreamEvent, void, void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ASSISTANT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(ASSISTANT_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ context, messages }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    yield { type: 'failure', reason: isAbortError(err) ? 'timeout' : 'network' };
    return;
  }

  if (!response.ok || !response.body) {
    clearTimeout(timer);
    yield { type: 'failure', reason: 'http_error' };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let settled = false;

  try {
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (err) {
        yield { type: 'failure', reason: isAbortError(err) ? 'timeout' : 'stream_error' };
        return;
      }

      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });

      let sepIndex: number;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        const event = parseSseEvent(rawEvent);
        if (!event) continue;

        if (event.type === 'delta') {
          yield event;
        } else if (event.type === 'done') {
          settled = true;
          yield { type: 'done' };
          return;
        } else {
          // event.type === 'error' — an upstream failure surfaced mid-stream.
          settled = true;
          yield { type: 'failure', reason: 'stream_error' };
          return;
        }
      }
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }

  if (!settled) {
    // The connection closed before a `done` or `error` event arrived —
    // still a mid-stream failure (plan §7: "the stream errors mid-reply
    // (discard partial, show fallback)").
    yield { type: 'failure', reason: 'stream_error' };
  }
}
