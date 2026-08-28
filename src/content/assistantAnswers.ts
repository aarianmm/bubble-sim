/**
 * The Comet Assistant's offline answer library (PLAN-COMET-ASSISTANT.md §7,
 * C4). Used by `src/ui/assistantFallback.ts` whenever the live model is
 * unavailable — every failure path in the panel lands here within 8
 * seconds, so this table has to stand on its own as a complete, honest
 * assistant, not a degraded placeholder.
 *
 * NOTE ON FILE PLACEMENT: the plan (§7 / C4) names this table
 * `src/content/assistant.ts`. A concurrently-running agent owns that exact
 * path for the hint copy (C2), so this answer library lives at
 * `src/content/assistantAnswers.ts` instead — a deliberate, disjoint-file
 * departure from the plan's literal file list, made to allow both steps to
 * build in parallel without a merge conflict. Record this in BUILD STATUS's
 * Deviations at integration (CLAUDE.md rule 11).
 *
 * Copy policy (plan §3, §11.2, §5.1) — every entry below is checked against
 * this list:
 *  - Coach method, never verdicts. Never call a product a scam or a safe
 *    bet; never tell the player to accept, decline, buy or sell a specific
 *    thing; never predict market movements. Teach the checks instead: the
 *    fact sheet's ten fields, the §11.3 red-flag vocabulary, hovering a
 *    link to read the status bar, checking the address bar for a lookalike
 *    domain, and that real system dialogs pause the clock.
 *  - General financial literacy (trackers, fees, diversification, gilts,
 *    inflation, the monthly surplus) is encouraged — that's the
 *    educational payload the assistant exists to deliver.
 *  - §5.1: only the game's own fictional firms and real indices are named.
 *    No real company is ever described as a scam or a bad investment.
 *  - Voice: chirpy but understated late-90s browser helper. UK setting (£,
 *    gilts, building societies). Two to four sentences. No modern
 *    references, no acknowledgment that the assistant is anachronistic.
 *  - Anything about what to do with money in this game is framed as "in
 *    this game" — matching `Help > This is not financial advice`.
 */

export interface AssistantAnswerEntry {
  id: string;
  /** Lowercase keywords/phrases matched as substrings by `matchFallback`. */
  keywords: string[];
  answer: string;
}

/** ~20 authored entries, ordered so the tie-break test in
 * `assistantFallback.test.ts` (first-in-array wins) has real, meaningful
 * ordering behind it — not an arbitrary list. */
export const ASSISTANT_ANSWERS: AssistantAnswerEntry[] = [
  {
    id: 'is-it-a-scam',
    keywords: ['scam', 'fraud', 'ponzi', 'dodgy', 'trust', 'legit', 'legitimate'],
    answer:
      "I don't hand out verdicts — not even on this one. What I can do is show you where to look: open the FACTS link, and read who regulates it, how long it's been running, and what happens if the return sounds guaranteed. Two or more of those things looking odd together is worth taking seriously; one on its own often isn't.",
  },
  {
    id: 'what-should-i-buy',
    keywords: ['buy', 'invest', 'which fund', 'recommend', 'pick', 'choose'],
    answer:
      "I won't pick for you in this game — that bit's yours. What I will say is: read the fact sheet before you put a penny in, and remember the fee line matters as much as the return line. A boring 0.4% a year beats a flashy 8% a year more often than it looks.",
  },
  {
    id: 'what-is-a-tracker',
    keywords: ['tracker', 'index fund', 'index tracker'],
    answer:
      "A tracker fund just buys a slice of a whole market index — hundreds of companies at once — rather than betting on one manager's picks. Low fees, because nobody's paid to guess. Some funds in this game charge twenty times what a tracker does for the privilege.",
  },
  {
    id: 'why-am-i-losing-money',
    keywords: ['losing money', 'going down', 'worse off', 'running out', 'broke', 'poor'],
    answer:
      "In this game your pay is fixed but rent and bills creep up every year — that alone eats a cash-only balance over time. Fees and a badly timed sale add to it. Have a look at /money: the fee line and the allocation both tell you where it's going.",
  },
  {
    id: 'what-are-fees',
    keywords: ['fee', 'fees', 'charge', 'charges', 'cost'],
    answer:
      "Every fund charges an annual management fee, taken out whether it goes up or down, and some charge extra to sell. A 2% fee sounds small but compounds — over years it can eat a third of your gains. The fact sheet always states it, and the portfolio row shows what you've actually paid so far.",
  },
  {
    id: 'should-i-sell',
    keywords: ['sell', 'sell now', 'get out', 'cash out'],
    answer:
      "That decision's yours — I'm not going to tell you to sell or hold. What I'd check first: has anything about the fund itself changed, or is it just the price moving? The fact sheet and your return-since-purchase figure on /money are the two honest numbers to look at.",
  },
  {
    id: 'what-does-the-fact-sheet-mean',
    keywords: ['fact sheet', 'factsheet', 'what does it mean', 'read the sheet'],
    answer:
      "Every fund's fact sheet has the same ten rows, in the same order, however the rest of the page looks. Name, manager, twelve-month return, fees, holdings, when it launched, who regulates it, minimum return, and any introducer commission. Get used to reading it top to bottom — once you know where 'Regulated by' sits, you'll always find it.",
  },
  {
    id: 'what-is-a-gilt',
    keywords: ['gilt', 'gilts', 'government bond'],
    answer:
      "A gilt is a UK government bond — you lend the Treasury money and it pays you interest, then gives the capital back on a fixed date. About as safe as lending gets, because the government sets its own tax to pay you back. Lower return than shares, usually, but far steadier.",
  },
  {
    id: 'what-is-inflation',
    keywords: ['inflation', 'cpi', 'prices rising', 'cost of living'],
    answer:
      "Inflation is prices rising faster than your money does. Your pay in this game is fixed — it never rises — while rent and the weekly shop quietly do. That gap is most of what makes cash-only such a losing strategy here.",
  },
  {
    id: 'why-cant-i-afford-anything',
    keywords: ["can't afford", 'cannot afford', 'no money left', 'short of cash', 'tight this month'],
    answer:
      "Rent, food and bills come straight off your pay before anything else, and none of those three ever get cheaper. If there's nothing left over some months, that's the game being honest about the period, not a fault. Check the breakdown on /home to see exactly where it's going.",
  },
  {
    id: 'what-is-diversification',
    keywords: ['diversif', 'eggs in one basket', 'spread the risk', 'all in one'],
    answer:
      "Diversification means not putting everything into one company or one fund — spreading it about so one bad outcome doesn't take the lot. A tracker fund is diversified by design, holding hundreds of companies at once. A single share, however good the story, is the opposite.",
  },
  {
    id: 'help',
    keywords: ['help', 'stuck', 'what do i do', 'how does this work', 'confused'],
    answer:
      "Two places to start: the INBOX has everything that's arrived, and every offer has a FACTS link before you commit to anything. Nothing in this game is timed once you're actually reading it — messages and fact sheets pause the clock, so take your time before deciding.",
  },
  {
    id: 'red-flags',
    keywords: ['red flag', 'warning sign', 'tell', 'giveaway', 'how do i spot'],
    answer:
      "Look for guaranteed returns, no named regulator, a web address that's almost-but-not-quite the real one, and anything pushing you to act fast. One of those on its own can be nothing. Two or more together, on the same fact sheet, is worth being properly cautious about.",
  },
  {
    id: 'building-society',
    keywords: ['building society', 'what is a building society'],
    answer:
      "A building society is a bit like a bank, but owned by its own savers rather than shareholders — historically the plain, unglamorous home for a savings account. Nothing showy about the website usually means nothing showy about the risk, in my experience.",
  },
  {
    id: 'status-bar',
    keywords: ['status bar', 'bottom of the screen', 'where does this link go'],
    answer:
      "Hover any link before you click it and the bar at the bottom of the window shows exactly where it actually goes. It's the same trick in every browser of the day — worth a glance before committing, especially on anything urging you to hurry.",
  },
  {
    id: 'address-bar',
    keywords: ['address bar', 'url', 'web address', 'domain'],
    answer:
      "The address bar at the top always shows exactly where you are — worth a proper look, not just a glance. A site pretending to be somewhere trustworthy will usually get the spelling of the domain almost right, but not quite.",
  },
  {
    id: 'system-dialog',
    keywords: ['dialog', 'dialogue box', 'pop up or real', 'is this real', 'popup real'],
    answer:
      "A genuine system message pauses the whole game until you answer it — nothing else moves while it's up. A popup window never does that; time carries on regardless. If the clock's still running, whatever's on screen is asking, not telling.",
  },
  {
    id: 'how-much-save',
    keywords: ['how much should i save', 'how much to invest', 'how much to put in'],
    answer:
      "I won't give you a number — it depends on what you can afford to have tied up for a while. What I'd say generally: keep enough cash to cover a shock, and don't put money anywhere you haven't read the fact sheet for first.",
  },
  {
    id: 'what-is-a-pension',
    keywords: ['pension', 'retirement fund'],
    answer:
      "A pension is money set aside now that you can't easily touch until much later, usually with some tax relief for locking it away. Slow and unglamorous, but that's rather the point — it's built for decades, not months.",
  },
  {
    id: 'compounding',
    keywords: ['compound', 'compounding', 'compound interest', 'add up over time'],
    answer:
      "Compounding is interest earning interest — small differences early on become large ones given enough years. It cuts both ways: a low fee saved every year compounds into real money by the end of the decade, and a high fee compounds just as reliably against you.",
  },
];

/** Returned by `matchFallback` when nothing in the table scores above zero. */
export const ASSISTANT_DEFAULT_ANSWER =
  "I'm not certain — but the fact sheet usually is. Try the FACTS link on any offer.";
