/**
 * Deterministic offline matcher (PLAN-COMET-ASSISTANT.md §7, C4). Used
 * whenever the live model is unreachable — `fetch` rejects, times out,
 * returns non-2xx, or the stream errors mid-reply (that wiring is C6's
 * job; this file only owns the matching itself).
 *
 * Deterministic by construction (CLAUDE.md rule 1 — no `Math.random()`
 * anywhere, ever): lowercase the question, sum keyword substring hits per
 * `ASSISTANT_ANSWERS` entry, highest score wins, ties broken by array
 * order (first entry defined in assistantAnswers.ts wins). No `Date`. Same
 * input always produces the same output.
 */
import type { GameState } from '../sim/types';
import { ASSISTANT_ANSWERS, ASSISTANT_DEFAULT_ANSWER } from '../content/assistantAnswers';

/**
 * `state` is part of the signature (plan §7: "matchFallback(question,
 * state) -> string") so a later pass can personalise an answer lightly
 * (e.g. current month, cash) without touching call sites. It is
 * intentionally unread today: every answer below is a fixed, pinned
 * string, which keeps this matcher trivially deterministic and testable,
 * and — because the matcher never reads `state` — it structurally cannot
 * leak anything on the `assistantContext.ts` §1 exclusion list even by
 * accident.
 */
export function matchFallback(question: string, _state: GameState): string {
  const q = question.toLowerCase();

  let bestScore = 0;
  let bestAnswer: string | null = null;
  for (const entry of ASSISTANT_ANSWERS) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (q.includes(keyword)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = entry.answer;
    }
  }

  return bestAnswer ?? ASSISTANT_DEFAULT_ANSWER;
}
