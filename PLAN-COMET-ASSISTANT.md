# PLAN — The Comet Assistant

An AI helper built into the browser chrome: a small period-styled character in
the top-right corner of the toolbar that offers infrequent, non-obstructive
hints, and opens into a chat panel where the player can ask questions about the
game, their finances, and how to proceed. Powered by the Claude API through a
Cloudflare Pages Function, with a fully authored offline fallback so the demo
cannot die on stage.

This plan is written for subagents. Each step has a file list, acceptance
criteria, and the spec/docs updates it owes. **Read CLAUDE.md and your step's
spec sections (§n references) before writing code.** Steps are ordered so that
every step lands with `npm run check` green and the game fully playable.

---

## 0. Decisions already made (do not relitigate)

These were confirmed with the project owner on 2026-08-28:

1. **Real LLM with authored offline fallback.** Claude API via a Cloudflare
   Pages Function (the site already deploys to Cloudflare Pages; the key stays
   server-side). If the network call fails for any reason, the widget degrades
   to deterministic authored hint/answer content. This is a recorded Deviation
   from §25.4 / CLAUDE.md rule 8 ("fully offline") — see §10 below.
2. **Diegetic period framing.** The assistant is **the Comet Assistant**, a
   desktop-assistant character in the Clippy/BonziBuddy/Ask-Jeeves lineage,
   built into Comet Navigator's chrome. The AI is real; it wears a 1998
   costume. The Jan 2002 era switch upgrades its look like everything else.
3. **Coach method, never verdicts.** The assistant teaches the player *how to
   check* — fact sheets, the address bar, the status-bar URL preview, the
   paused-clock test — but never says "X is a scam", "buy Y", or "decline
   that offer". This preserves the fairness contract (§11.2, §21) and the
   game's core lesson.
4. **Structured state as context, no screenshots.** Each question carries a
   compact JSON serialization of the game state and current page. No
   html2canvas, no image payloads.

## 1. The one structural principle

**The assistant sees only what the player can see.**

The context serializer (Step C3) is the enforcement point. It must never emit:

- `VehicleDef.isScam`, `collapseMonth`, `sellableAfterCollapse`, or `tier`
- any `ScriptEvent` with `month > state.month` (the future)
- the contents of unopened mail (subject lines and senders are visible in the
  inbox list, so those are fine; bodies of `status: 'unread'` items are not)
- `PopupItem.imitatesDialog` (§20.5 — the fake dialog must stay undetectable
  except by the three player-checkable tells)

This is not just a prompt rule — it is a *data* rule, unit-tested (see C3).
The model cannot spoil what it was never given. The system prompt adds a second
layer of policy on top, but the serializer is the one that must hold.

Corollary: the assistant is read-only. It never calls `dispatch()` with a game
decision, so the §25.2 determinism contract (a run is fully described by
(script, decisions)) is untouched. The only engine interaction permitted is
`setTimeRate` on panel open/close (see C5), which is an already-typed,
already-recorded decision.

## 2. Where it lives in the chrome (§18.1)

The right end of the toolbar row — the exact spot where IE4 kept its animated
throbber logo. The Comet Assistant *is* the throbber: a small pixel-art comet
with a face, drawn as inline SVG with tokened colours only (same rules as
`src/chrome/Toolbar.tsx` icons — no external assets, no hex outside
`tokens.css`).

- **Idle:** sits at the right edge of the toolbar, sized by
  `--assistant-button-size`. Era A: bevelled-out square, large like the other
  Era A toolbar buttons. Era B: small flat button like Era B toolbar icons.
  All differences are tokens; the component never asks which era it is in
  (CLAUDE.md rule 3).
- **Hint:** a small speech balloon anchored below the button, top-right over
  the content area. It covers no interactive element the player currently
  needs, never blocks input, and auto-dismisses after
  `--assistant-hint-duration` (a token; motion snaps, §23 — the balloon
  appears and disappears instantly, no easing). A `✕` on the balloon dismisses
  it early.
- **Panel:** clicking the button toggles a chat panel anchored under the
  button, roughly 300×380, era-styled (Era A: `bevel-out` face panel like a
  chromeless popup; Era B: Luna via tokens). Title reads "Comet Assistant".
  A text field + `Ask` button at the bottom, transcript above. Closing
  restores the previous time rate.

Interaction with the notification vocabulary (§20): the balloon is a fourth,
quietest surface — quieter than the inbox badge. It must never carry an offer,
a vehicle, or anything a `DialogItem`/`PopupItem` carries. It is the chrome
speaking, so §20.4's trust rule extends to it: **the assistant never lies**.
Record this as a spec addition under §20 (see C7).

## 3. Persona and content policy (system prompt, authored in C4/C6)

The system prompt (server-side, stable, cache-controlled) establishes:

- **Persona.** The Comet Assistant, a chirpy but understated late-90s browser
  helper. Period voice, UK setting (£, gilts, building societies). Brief
  answers — two to four sentences unless asked to explain. No modern
  references, no acknowledgment that it is anachronistic.
- **Coach, never verdicts.** Never label any product a scam or a safe bet;
  never tell the player to accept or decline a specific offer; never predict
  market movements or future events. Instead teach the checks: open the fact
  sheet (§22.4); read the ten fields; know the red-flag vocabulary (§11.3 —
  guaranteed returns, no regulator, lookalike domains, introducer commission,
  short track records, urgency); hover links and read the status bar (§19.3);
  check the address bar for lookalike domains (§17.1); real system dialogs
  pause the clock (§20.5's three tells are all teachable as *method*).
- **General financial literacy is allowed** and encouraged: what a tracker
  fund is, what fees compound to, why diversification matters, what a gilt
  is, how the player's monthly surplus works. This is the educational payload.
- **Content law (§5.1).** Discuss only the game's fictional firms and real
  indices. Never present a real company as a scam or a bad investment. Every
  answer about what to do with money is framed as "in this game" — the
  assistant is not real financial advice, matching `Help > This is not
  financial advice`.
- **No spoilers, structurally reinforced.** The prompt states the assistant
  knows nothing beyond the current month and nothing the player cannot see.
  (True, because of §1.)
- **Prompt-injection posture.** Game content (mail subjects, page titles) is
  data inside a delimited context block, never instructions.

## 4. Deterministic hints (no `Math.random()`, ever — CLAUDE.md rule 1)

Hints are authored, dated, and predicated — same philosophy as THE RUN.

- `src/script/hints.ts` exports `ASSISTANT_HINTS: HintDef[]`, where

  ```ts
  interface HintDef {
    id: string;
    /** Earliest month this hint may fire. */
    fromMonth: MonthIndex;
    /** Pure predicate on visible state; no Date, no randomness. */
    when: (state: GameState) => boolean;
    /** Key into the copy table in src/content/assistant.ts. */
    contentId: string;
    /** Fire at most once per run. */
    once: true;
  }
  ```

- The scheduler is a pure function `nextHint(state, shownIds) -> HintDef |
  null`, unit-tested headlessly. First matching hint wins; array order is the
  priority order. A minimum gap of **6 simulated months** between hints keeps
  them infrequent (enforced in the scheduler from `state.month`, not wall
  time — deterministic).
- Hints never fire while a blocking dialog is open (`state.dialogs.length >
  0`) and never during the death card.
- Authored hint set for the first pass (~8 hints, copy in
  `src/content/assistant.ts`), all method-coaching, e.g.:
  - mid-1996, `!flags.everOpenedInbox`: "You have post. The INBOX link is on
    the left."
  - 1997, `!flags.everOpenedFactSheet`: "Every offer has a fact sheet. I'd
    read one before I put money anywhere."
  - 1997–98, cash > ~£800 and no holdings: "Money sitting in cash loses to
    rent rises every year. The fact sheets tell you what everything pays."
  - 1998, first popup shown: "You can drag those out of the way. Or close
    them. Nothing good ever arrived by popup."
  - 1999, holdings concentrated >70% in one vehicle: "All your eggs are in
    one basket. That's a thing people say for a reason."
  - after a hover-preview URL mismatch has been on screen: "The bar at the
    bottom shows where a link really goes. Worth a glance before you click."

  Copy is the content agent's domain; these are placeholders for tone.

## 5. Context serialization (`src/ui/assistantContext.ts`)

`buildAssistantContext(state: GameState, route: {url, title}): AssistantContext`
— a pure function over the engine's state plus the current chrome route.
Emits, capped at ~4 KB of JSON:

- date (month rendered as "September 1998"), era
- cash, monthly pay (£760), last month's expense total and breakdown
- holdings: name, current value, target %, fees paid — by *display name*, and
  only fields the `/money` page shows (§12.4)
- portfolio totals, wealth trend (last 12 entries of `wealthHistory`)
- inbox summary: per visible row — from, subject, expiry, read/unread; bodies
  only for opened mail
- open popups: titles only
- current page URL + title (the address bar is a gameplay element — the model
  should see exactly the string the player sees, lookalike domain included)
- if the current page is an offer page or fact sheet: the ten public
  `FactSheet` fields and its `redFlags` **names are NOT included** — red flags
  are derivable from the visible fields (that derivation is the skill being
  taught); include only the raw fields the player can read
- run stats the player could compute: fees paid to date, forced sales count

Explicitly excluded (asserted by test): everything in §1's list, plus
`stats.scamsFundedIds`/`scamsDodgedIds`, `deathCauseId`, and the script
itself.

## 6. Backend (`functions/api/assistant.ts` — Cloudflare Pages Function)

- **Route:** `POST /api/assistant`. Cloudflare Pages auto-mounts `functions/`;
  no other infra. The static build is untouched.
- **SDK:** `@anthropic-ai/sdk` (new runtime dependency; fetch-based, works in
  the workers runtime). Key from `env.ANTHROPIC_API_KEY` (Pages project
  secret — set in the dashboard; never in the repo). Model from
  `env.ASSISTANT_MODEL`, defaulting to `claude-opus-5`.
- **Request body:** `{ context: AssistantContext, messages: {role, content}[] }`
  where `messages` is the transcript, client-trimmed to the last 12 turns.
- **Response:** streamed SSE of text deltas (use `client.messages.stream()`
  and pipe `text` events through a `TransformStream`). Streaming keeps the
  panel feeling alive over conference wifi.
- **Request shape:**
  - `system`: the stable persona/policy prompt (§3) as a text block with
    `cache_control: {type: 'ephemeral'}` — byte-identical every call, so it
    caches. The volatile game context goes in the final user turn as a
    delimited block, *after* the cached prefix, never in `system`.
  - `max_tokens: 1024` (deliberately short chat replies), `output_config:
    {effort: 'low'}` — latency-sensitive, non-intelligence-sensitive route;
    thinking stays on by default (Claude Opus 5), which is correct.
- **Guardrails:** reject bodies > 32 KB or single messages > 2,000 chars with
  400; cap transcript at 12 turns server-side too; same-origin only (check
  `Origin` against the deployment host, allow the `*.pages.dev` previews).
  For abuse control beyond that, note in the README that a Cloudflare rate
  limiting rule on `/api/assistant` is the right tool — do not build state
  into the function.
- **Errors:** any non-2xx or network failure surfaces to the client as a
  distinguishable failure so it can fall back (C5). Never leak the API error
  body to the client.
- **Local dev:** add `wrangler` as a devDependency and a script
  `"dev:functions": "wrangler pages dev --proxy 5173 -- npm run dev"` (or the
  current wrangler equivalent). Plain `npm run dev` has no function — the
  widget then exercises the offline fallback, which is itself useful.

## 7. Offline / failure fallback (`src/content/assistant.ts` + matcher in `src/ui`)

- The copy table exports hint copy (see §4) **and** an authored answer
  library: ~20 entries, each `{id, keywords: string[], answer: string}`
  covering the questions a player actually asks: "is this a scam", "what
  should I buy", "what is a tracker", "why am I losing money", "what are
  fees", "should I sell", "what does the fact sheet mean", "help".
- `matchFallback(question, state) -> string` is deterministic: lowercase,
  keyword hit-count, first-in-array tiebreak. No randomness. The "is this a
  scam" entry coaches the fact-sheet method, same policy as the live model.
  A no-match default: "I'm not certain — but the fact sheet usually is. Try
  the FACTS link on any offer."
- Fallback triggers when: `fetch` rejects, times out (8s), returns non-2xx,
  or the stream errors mid-reply (discard partial, show fallback). The panel
  shows a small status line, period-voiced: `⚠ Working offline — answers from
  the built-in help file.` The switch is visible but not alarming, and the
  demo never shows a spinner that hangs.
- Fallback answers render identically to live answers otherwise.

## 8. UI state (`src/ui/useAssistant.ts`)

A hook owning: open/closed, transcript (in-memory only, cleared on
`engine.reset()`), in-flight state, shown-hint ids, and `send()` implementing
fetch-with-fallback. On open: `engine.setTimeRate(RATE_INBOX)` (reading the
inbox slows time to 0.4×, §10.3 — chatting with the assistant is the same kind
of attention; reuse the existing constant and decision type). On close:
restore `RATE_NORMAL`. Never pause — pausing is reserved for Tier 1 dialogs
(§20.1).

Hint scheduling plugs in here: an effect watches `state.month`, runs
`nextHint`, and shows/dismisses the balloon. All timing derives from the
simulated clock and tokens.

## 9. Implementation steps

Rules for every step (CLAUDE.md): stay inside the file list; `npm run check`
green before finishing; **update the spec's BUILD STATUS in the same commit**;
new problems go to `KNOWN-ISSUES.md`; no hex outside `tokens.css`; no
`Math.random()`; no React/DOM/Date in anything under `src/sim` (this plan
touches `/sim` in no step — if you think a step needs to, stop and say so).

### C1 — Tokens, throbber button, empty panel shell
**Files:** `src/chrome/tokens.css`, `src/chrome/AssistantButton.tsx`,
`src/chrome/AssistantPanel.tsx`, `src/chrome/assistant.css`,
`src/chrome/AssistantButton.test.tsx`, `src/chrome/Chrome.types.ts` (props
only), plus the one mount point in the existing toolbar row (extend
`Toolbar.tsx` with an optional right-aligned slot).
**Do:** add `--assistant-*` tokens to **both** era blocks (button size, panel
w/h, balloon max-width, hint duration, panel title styling). Pixel comet SVG
with tokened colours. Button toggles an empty panel; panel closes on `✕` and
on Escape. VisualGallery gets an entry so both eras can be eyeballed.
**Accept:** button renders in both eras with zero component-level era checks;
panel opens/closes; check green.

### C2 — Deterministic hint system
**Files:** `src/script/hints.ts`, `src/content/assistant.ts` (hint copy),
`src/chrome/AssistantBalloon.tsx` (+ css in `assistant.css`),
`src/script/hints.test.ts`, `src/ui/useAssistant.ts` (scheduling half).
**Do:** `HintDef`, `ASSISTANT_HINTS` (~8 authored hints), pure `nextHint`
with the 6-month gap and once-per-run rules, balloon UI wired to the clock.
**Accept:** headless test drives a scripted run through `nextHint` and asserts
the exact fire months; balloon suppressed while `dialogs.length > 0`; no
randomness anywhere (lint enforces).

### C3 — Context serializer + no-spoiler tests
**Files:** `src/ui/assistantContext.ts`, `src/ui/assistantContext.test.ts`.
**Do:** `buildAssistantContext` per §5. The test constructs a state containing
a scam vehicle, unread mail, future-dated knowledge and the fake dialog, then
asserts the serialized JSON string contains **none** of: `isScam`,
`collapseMonth`, `imitatesDialog`, `tier`, unread bodies, red-flag ids, or any
date beyond the current month. Also asserts the ≤4 KB cap.
**Accept:** the no-spoiler test is the deliverable; it is the fairness
contract in executable form.

### C4 — Fallback answer library + matcher
**Files:** `src/content/assistant.ts` (answers), `src/ui/assistantFallback.ts`
(matcher), `src/ui/assistantFallback.test.ts`.
**Do:** ~20 authored Q&A entries per §7, deterministic matcher, tests pinning
exact answers for representative questions including "is this a scam?" (must
coach, not answer) and gibberish (default answer).
**Accept:** matcher is pure and tested; copy follows §3's policy and §5.1.

### C5 — Chat panel wired to fallback (assistant works fully offline)
**Files:** `src/ui/useAssistant.ts`, `src/chrome/AssistantPanel.tsx`,
`src/chrome/assistant.css`, `src/ui/useAssistant.test.tsx`.
**Do:** transcript UI, input, send-on-Enter, time-rate slowdown on open /
restore on close, transcript cleared by reset, `send()` calling
`matchFallback` directly (network arrives in C6 behind the same interface).
**Accept:** jsdom test: open panel → ask "what is a tracker" → authored
answer renders; time rate asserted 0.4×/1× around open/close. The game is
shippable in this state — that is the point of doing fallback before network.

### C6 — Pages Function + streaming client
**Files:** `functions/api/assistant.ts`, `src/ui/assistantApi.ts` (fetch +
SSE reader + timeout), `package.json` (add `@anthropic-ai/sdk`, `wrangler`
dev-dep, `dev:functions` script), `src/ui/assistantApi.test.ts` (mock fetch:
success stream, non-2xx, timeout → fallback signal).
**Do:** per §6. `send()` tries `assistantApi`, falls back per §7 with the
offline status line. The system prompt text lives in the function file (it is
server content, not game content).
**Accept:** unit tests for the client path; function typechecks under the
workers types; failure of *any* kind lands in the authored fallback within 8s.
Manual: `dev:functions` with a real key streams answers; plain `npm run dev`
falls back cleanly.

### C7 — Integration, spec, docs
**Files:** `bubble-design-requirements.md` (BUILD STATUS + a short §20/§18
addition for the assistant surface), `KNOWN-ISSUES.md`, `DEMO.md` (one
operator note: what to do if the assistant is asked something odd on stage;
how to demo it offline), `README`/CLAUDE.md note for the
`ANTHROPIC_API_KEY` Pages secret, `src/chrome/MenuBar.tsx` (add
`Help > Comet Assistant` opening the panel), final `App.demo.test.tsx` touch
if the demo path changes.
**Do:** the Deviations entries (§10 below), the operator card note, the
secret-setup note. Sweep: every earlier step's spec debt actually landed.
**Accept:** spec, KNOWN-ISSUES and DEMO agree with the build; check green;
`npm run verify` still green (it must be — nothing here touches `/sim`).

## 10. Deviations to record in BUILD STATUS (verbatim starting points)

1. **§25.4 / rule 8 (fully offline):** The Comet Assistant makes runtime
   network calls to `/api/assistant` (Claude API via a Pages Function).
   Decided by the project owner 2026-08-28. Mitigation: every failure path
   lands in an authored, deterministic fallback within 8 seconds, so the
   demo's offline guarantee holds for everything the judges see; the
   assistant is additive and degradable. No other feature gained a network
   dependency.
2. **§20 (three tiers):** The hint balloon is a new fourth surface, quieter
   than Tier 3. It never carries offers or vehicles and inherits §20.4's
   "the chrome never lies" rule.
3. **§17 (period conceit):** An AI assistant is anachronistic; it is costumed
   as a period desktop assistant (Clippy/BonziBuddy lineage) and never breaks
   character. Judged an acceptable, deliberate wink — the one place the
   interface knows it's 2026.
4. **§25.2 (determinism):** Live LLM replies are the one nondeterministic
   surface in the product. Game state is never written by the assistant, so
   run outcomes, replays, and `npm run verify` are unaffected. Hints and
   fallback answers remain fully deterministic.

## 11. Explicitly out of scope

- Screenshot/vision context (decided against).
- Voice, sound effects for the assistant (Tier 1's chord stays unique, §20).
- Assistant-initiated actions on game state (never).
- Conversation persistence across runs or reloads.
- Server-side abuse state (rate limiting is a Cloudflare dashboard rule).
- Animating the throbber during page loads (nice later; §23 motion rules
  apply if attempted — snap frames, no easing).
