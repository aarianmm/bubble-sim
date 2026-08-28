/**
 * Copy for the Comet Assistant (PLAN-COMET-ASSISTANT.md). Plain data — no
 * JSX, no components — following the idiom of every other file in
 * src/content.
 *
 * Voice (plan §3): chirpy but understated late-90s desktop-assistant helper,
 * in the Clippy/BonziBuddy/Ask-Jeeves lineage. UK setting (£, gilts,
 * building societies). Two sentences maximum per hint. Period voice
 * throughout — no modern references, no acknowledgment that the assistant is
 * anachronistic (that's the plan's own §10 Deviation 3, recorded in the
 * spec, not something the copy ever winks at).
 *
 * COACH METHOD, NEVER VERDICTS (plan §3, §4): every line below teaches *how
 * to check* — the fact sheet, the address bar, the status bar's link-hover
 * preview, closing a popup for free — never "X is a scam", never "buy Y",
 * never "decline that". §5.1 content law: only this game's fictional firms
 * and real indices; no real company is ever named, let alone as a scam.
 */

/* ------------------------------------------------------------------ *
 * Hints (Step C2) — keyed by HintDef.contentId in src/script/hints.ts.
 * ------------------------------------------------------------------ */

export const ASSISTANT_HINT_COPY: Record<string, string> = {
  'hint.check-inbox':
    "You've got post — the INBOX link is on the left whenever you fancy a look. No rush, but it won't triage itself.",
  'hint.read-fact-sheet':
    'Every offer keeps a FACT SHEET one click from the accept button. Ten fields, always the same ten — worth a read before anything moves.',
  'hint.idle-cash':
    "Cash sitting still doesn't stand still — rent does. The fact sheet on any offer you've had will tell you what it actually pays.",
  'hint.popups-are-optional':
    "Those little windows can be dragged out of the way, or shut with the ✕ — either costs you nothing. If one's selling something, the fact sheet will tell you more than the marquee text will.",
  'hint.address-bar-check':
    "Before you click something you're excited about, a glance at the address bar takes a second. A copycat spelling is the easiest thing in the world to miss, and the easiest to catch once you're looking for it.",
  'hint.debt-caution':
    "That card's promotional rate doesn't run forever — the offer spells out exactly when it ends. Worth knowing the date, not just the headline number.",
  'hint.status-bar-hover':
    'Hovering a link shows you where it actually goes, down in the bar at the bottom, before you ever click it. A habit worth having.',
  'hint.concentrated-holdings':
    "Most of what you hold sits in one place at the moment — MY MONEY will show you the split. Spreading it about is one of the oldest tricks in the book, precisely because it works.",
};

/* ------------------------------------------------------------------ *
 * Fallback answers (Step C4) — ASSISTANT_ANSWERS slots in here next, same
 * file, same voice and coach-method rules as the hints above. Leave this
 * section for that step; do not pre-declare its shape here.
 * ------------------------------------------------------------------ */
