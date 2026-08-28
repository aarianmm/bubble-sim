/**
 * PLAN-COMET-ASSISTANT.md §7 / C4 — the offline matcher must be pure,
 * deterministic, and must coach rather than deliver verdicts. This file
 * pins exact answers (a copy-paste drift in `assistantAnswers.ts` should
 * fail this test, not silently ship), and separately proves the matching
 * mechanics: keyword hit-count, first-in-array tie-break, the no-match
 * default, and determinism.
 */
import { describe, expect, it } from 'vitest';
import { matchFallback } from './assistantFallback';
import { monthIndex } from '../sim/month';
import type { GameState, RunFlags, RunStats } from '../sim/types';

function baseFlags(overrides: Partial<RunFlags> = {}): RunFlags {
  return {
    onScamList: false,
    incomeSuspendedMonths: 0,
    era: 'a',
    moneyBase: 'period',
    everOpenedInbox: false,
    everOpenedFactSheet: false,
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

const state = makeState();

describe('matchFallback (plan §7) — the offline answer matcher', () => {
  it('"is this a scam?" coaches the fact-sheet method and delivers no verdict', () => {
    const answer = matchFallback('is this a scam?', state);

    expect(answer).toBe(
      "I don't hand out verdicts — not even on this one. What I can do is show you where to look: open the FACTS link, and read who regulates it, how long it's been running, and what happens if the return sounds guaranteed. Two or more of those things looking odd together is worth taking seriously; one on its own often isn't.",
    );
    // Pinned refusal-of-verdict case (plan §3 / §11.2): must never actually
    // pronounce a verdict, in either direction.
    expect(answer.toLowerCase()).not.toContain('yes, this is a scam');
    expect(answer.toLowerCase()).not.toContain('no, this is not a scam');
    expect(answer.toLowerCase()).not.toContain('this is safe');
    expect(answer.toLowerCase()).not.toContain("it's a scam");
  });

  it('pins the tracker-fund answer', () => {
    const answer = matchFallback('what is a tracker fund?', state);
    expect(answer).toBe(
      "A tracker fund just buys a slice of a whole market index — hundreds of companies at once — rather than betting on one manager's picks. Low fees, because nobody's paid to guess. Some funds in this game charge twenty times what a tracker does for the privilege.",
    );
  });

  it('pins the "help" answer', () => {
    const answer = matchFallback("I'm stuck, help", state);
    expect(answer).toBe(
      "Two places to start: the INBOX has everything that's arrived, and every offer has a FACTS link before you commit to anything. Nothing in this game is timed once you're actually reading it — messages and fact sheets pause the clock, so take your time before deciding.",
    );
  });

  it('falls back to the default answer on gibberish input', () => {
    const answer = matchFallback('xqzflarn wobbit throngle', state);
    expect(answer).toBe("I'm not certain — but the fact sheet usually is. Try the FACTS link on any offer.");
  });

  it('breaks a tie by first-in-array order', () => {
    // "cost" hits only the what-are-fees entry (index 4); "confused" hits
    // only the help entry (index 11). Both score exactly 1 — what-are-fees
    // must win because it is declared earlier in ASSISTANT_ANSWERS.
    const answer = matchFallback('cost and confused', state);
    expect(answer).toBe(
      "Every fund charges an annual management fee, taken out whether it goes up or down, and some charge extra to sell. A 2% fee sounds small but compounds — over years it can eat a third of your gains. The fact sheet always states it, and the portfolio row shows what you've actually paid so far.",
    );
  });

  it('is deterministic — the same question always returns the same answer', () => {
    const question = 'why am I losing money this month?';
    const results = Array.from({ length: 5 }, () => matchFallback(question, state));
    expect(new Set(results).size).toBe(1);
  });

  it('is deterministic across different (but equally valid) states', () => {
    const question = 'what are the fees on this?';
    const a = matchFallback(question, makeState({ month: monthIndex(1996, 1), cash: 0 }));
    const b = matchFallback(question, makeState({ month: monthIndex(2006, 12), cash: 99999 }));
    expect(a).toBe(b);
  });
});
