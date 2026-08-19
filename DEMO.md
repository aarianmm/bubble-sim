# DEMO.md — the operator's card (§25.5)

One playthrough, ~8 minutes with fast-forward, rehearsed. §25.5's own rule:
**"the failure mode of a scripted demo is not the software, it is the
operator hunting for a button."** Everything you need to press is on this
page. Rehearse it end to end at least three times before you're in front of
judges.

## The one thing to get right before anything else

**Play the whole path in one continuous run — never use "Jump to date"
between beats.** The clock (▶ / ⏸ and the hold-to-fast-forward button in
the left nav, always on screen, no `?dev=1` needed) advances real
simulated time and keeps every decision you've made. The Presenter's
**"Jump to date"** tool does something different and easy to reach for by
mistake: it always replays from Jan 1996 with **zero decisions** — a clean
re-run of the script, not a fast-forward of the run you're in. Use it
between beats and you'd arrive at the crash owning nothing, with nothing
real to sell. It's for rehearsing one beat in isolation, recovering if
you've gotten lost, or skipping the whole narrative to show only the death
card — never for stringing beats together. See §3 below.

Pace reference: the clock runs 1.2s/month normally, 0.3s/month held at 4×
(the in-game fast-forward button), 60ms/month at the Presenter's 20× (for
the quiet 2001–2006 stretch after the last scripted beat, once you're done
narrating and just want the death card). A blocking dialog (shocks,
year-turns, the crash, the Halcyon suspension) **pauses the clock itself**
the instant it's due — you cannot fast-forward or jump past one by
accident, at any speed.

---

## 1. The demo path — beat by beat

Start at Jan 1996 (boot state, or Presenter Tools > `Reset to Jan 1996`).
Play (▶) and hold-fast-forward (▶▶) through the quiet stretches; watch the
date readout in the left nav. Nothing here requires split-second timing —
mail sits in the inbox until you open it, and every dialog below stops the
clock on its own the moment it's due.

| # | Around | Do this | Say / show |
|---|---|---|---|
| 1 | **Apr 1996** | `INBOX` → open the Northmoor mail → its link → Northmoor's site → `[ FUND FACT SHEET ]` → `[ Accept ]` → `MY MONEY` → drag the Northmoor slider to 100% → `[ Rebalance Now ]` → `[ Confirm rebalance ]` | The inbox, the fact sheet, the sliders — three surfaces in under a minute. Point out the fact sheet's ten fields; note the site is plain and ugly *and completely real*. |
| 2 | **Mar 1997** | Two Meridian popups arrive together (same offer, twice — §20.2's cap). Read one aloud, then close both with their `✕` — free, no penalty. `INBOX` → open "Your child savings account has matured" (the windfall) to bank it | *"Guaranteed 30%, no downside, limited places — three red flags before you've even opened the fact sheet."* Declining costs nothing. |
| 3 | **Jul 1997** | `INBOX` → open the Fenwick Index Trust mail → its link → fact sheet → `[ Accept ]` → `MY MONEY` → **two drags, in this order:** Northmoor's slider to 0% first, *then* Fenwick's to 70% → `[ Rebalance Now ]` → confirm | *"The correct play, made to look boring on purpose."* Plain site, 0.4% fee, tracks the index. Dragging Fenwick straight to 70% in one go leaves 30% stranded in Northmoor instead of cash — the slider redistributes proportionally by current weight (§12.2), so zero out Northmoor first. |
| 4 | **Sep 1997** | The clock stops on its own — a £600 shock dialog. Click **Pay from cash** | No `[Later]`, no working `✕` — a real dialog is never optional. |
| 5 | **Jun 1999** | The Halcyon popup arrives — click its CTA to open the site. **This is the money shot** — see §2 below. Open the fact sheet, then `[ Back ]` (never `[ Accept ]`) | Slow down here. |
| 6 | **Jan 2000** | The clock stops — the year-turn dialog. Read the line on screen, then **Go on** | *"This year, your pay covers your life exactly. From here it doesn't."* Let it sit before clicking through. |
| 7 | **Mar 2000** | The crash dialog stops the clock first — **Go on**. The boiler dialog follows immediately, same month — **Sell to cover**. With Northmoor + Fenwick actually held (beats 1 and 3), this triggers a real forced sale — follow whatever the sale panel shows | The NASDAQ falls, then the boiler goes, same month. Narrate the sale panel as it appears: what's being sold, at what loss, to cover a £900 bill. |
| 8 | **Nov 2000** | The clock stops — Halcyon suspended. Click **Go on** | *"Seventeen months of returns, and then nothing. Your balance is £0."* You don't have a balance in it — you declined in beat 5. Land this line and the room has understood the game. |
| 9 | **2001 → 2006** | Nothing scripted left to narrate. Hold fast-forward, or open Presenter Tools and click **20×** under Time-rate override, and let it run to the end | Keep talking over this — it's the fastest stretch, not a pause in the demo. |
| 10 | **End of run** | The death card appears on its own the instant the run ends | The decade graph, the fee line, the band — reflecting the actual choices you just made, not a scripted result. |
| 11 | — | `[ Run it again ]` on the death card | One click, back to Jan 1996, fresh state — the closing shot. |

---

## 2. The money shot (Jun 1999 — Halcyon)

Say it roughly like this while the Halcyon site is on screen:

> "This is the best-looking page in the entire build. Restrained layout,
> a real logo, testimonials, a clean returns chart with no down months.
> It looks like real money — because that's what the money bought.
> [open fact sheet] Same ten fields as every other page in the game,
> including the ugly Northmoor one from a minute ago. That's the whole
> thesis: style tells you where to look harder, it never tells you the
> answer. [click Back, not Accept] I'm declining. In seventeen months
> this collapses to zero — you'll see it happen later in this run, and
> you'll see that I dodged it."

---

## 3. Presenter Tools — rehearsal and recovery only

Behind `?dev=1` (append to the URL) or `Help > About` clicked five times.
**Everything here except Time-rate override replaces your current run with
a fresh, decision-free one** — reach for it between demos, during
rehearsal, or if you've genuinely lost the thread mid-run, not as a way to
skip between beats 1–8 above.

**Jump to date** — the month dropdown, or the two quick buttons
(`Mar 2000 — the crash`, `Dec 2006 — the win card`). Replays from Jan 1996
with zero decisions every time — useful for rehearsing a single beat in
isolation, or for showing a judge "what does the crash look like" on its
own without playing the whole path first.

**Load a saved state** — a full decision-carrying run landed at a specific
point:
- `Start (Jan 1996)`
- `Just before the crash` (Feb 2000, mail opened, nothing funded)
- `Holding the Ponzi` (Jun 2000, Halcyon actually funded — useful if a
  judge asks "what happens if I fund it instead?")
- `About to be forced to sell` (Aug 2001)
- `Cash-only, Mar 2000` (the one number the whole game rests on)
- `Survived to 2006` (the longest real run the build currently produces —
  see the caveat in §4)

**Force any event** — type an event id from `src/script/timeline.ts`
(table below) and click `Force`. Fires it into its real channel right now,
on top of whatever run you're currently in, regardless of the authored
date. Useful mid-demo if a dialog/popup was missed and you don't want to
lose the run to get it back.

**Instant death card** — pick any band and cause line, click `Show death
card now`. Guaranteed, no arithmetic required — your safety net, not a
shortcut you should need if beats 1–11 go to plan.

**Time-rate override** — `1×` / `4×` / `20×`. The one Presenter control
that's safe to use mid-narrative: it sets the *live* clock's speed and
touches nothing else. This is what beat 9 above actually uses.

**Reset** — `Reset to Jan 1996`. One click, between judges.

### Event ids for beats 1–8, if you need `Force any event`

| Beat | Event id |
|---|---|
| Northmoor bond mail | `ev.1996-04.northmoor-bond` |
| Windfall #1 | `ev.1997-02.windfall-1` |
| Meridian scam popup | `ev.1997-03.meridian` |
| Fenwick tracker mail | `ev.1997-07.fenwick-index` |
| Sep 1997 £600 shock | `ev.1997-09.shock` |
| Halcyon popup | `ev.1999-06.halcyon` |
| Jan 2000 year-turn | `ev.2000-01.year-turn` |
| The crash | `ev.2000-03.crash` |
| The boiler shock | `ev.2000-03.shock-boiler` |
| Halcyon suspended | `ev.2000-11.halcyon-suspended` |

---

## 4. If it goes wrong

- **Wrong page, wrong popup, stuck menu** — click `HOME` in the left nav.
  It's always live, even mid-run.
- **A dialog won't go away** — it isn't supposed to (§20.1: no dismiss, no
  later). Pick a button; both always resolve it.
- **You missed a beat's mail/popup and it's expired** — Presenter Tools >
  **Force any event** with that beat's id (table above). This fires it into
  the live run you're already in — it does not reset anything.
- **Lost the thread entirely** — Presenter Tools > **`Reset to Jan 1996`**,
  start the path again from beat 1. Faster than trying to recover in place.
- **Need the death card *right now*, arithmetic be damned** — Presenter
  Tools > **Instant death card** > pick a band/cause > `Show death card
  now`.
- **Between judges** — `Reset to Jan 1996`, nothing else. No confirmation
  dialog, no reload.
- **A judge asks "what if I fund the Ponzi?"** — load the
  `Holding the Ponzi` preset, walk to `MY MONEY` to show the position, then
  `Reset to Jan 1996` to get back on script.
- **A judge asks about the perfect-play path** — `Survived to 2006` is the
  honest answer today: the best decision list the build has found still
  dies Feb 2005 (band IMPRESSIVE, not the full decade). It's a documented,
  known calibration gap (`KNOWN-ISSUES.md` #1), not a bug in front of you —
  say so plainly if asked, don't reach for Instant Death Card to paper over
  it unless you specifically need the closing shot to look a certain way.

---

## 5. Known, deliberate limits — say these plainly if asked, don't dodge

- **The market data is reconstructed, not archival** (`KNOWN-ISSUES.md` #3).
  Crash timing and magnitude are real; month-to-month texture between
  anchor points is interpolated, stated in `series.json`'s own `meta.note`.
- **Perfect play dies Feb 2005, not Dec 2006** (`KNOWN-ISSUES.md` #1) —
  deprioritised by design, not hidden.
- **Bond-only currently outlives tracker-only** (`KNOWN-ISSUES.md` #2),
  the reverse of §8.4's illustrative table — a real effect of the 2000–02
  crash hitting a drawdown, not a bug, and open as a design call.
- These three are decided and parked — don't re-litigate them live, just
  own them if asked.
