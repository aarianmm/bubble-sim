# DEMO.md — the operator's card (§25.5)

One playthrough, ~8 minutes with fast-forward, rehearsed. §25.5's own rule:
**"the failure mode of a scripted demo is not the software, it is the
operator hunting for a button."** Everything you need to press is on this
page. Rehearse it end to end at least three times before you're in front of
judges.

## The one thing to get right before anything else

**Play the whole path in one continuous run.** The clock (▶ / ⏸ and the
hold-to-fast-forward button in the left nav) advances real simulated time
and keeps every decision you've made. No presenter/debug panel ships in the
application, so the public controls are the demo controls.

Pace reference: the clock runs 1.2s/month normally, 0.3s/month held at 4×
(the in-game fast-forward button). A blocking dialog (shocks, year-turns,
the crash, the Halcyon suspension) **pauses the clock itself** the instant
it's due — you cannot fast-forward past one by accident. The Jan 1998 and
Jan 2000 interface welcomes also
hold the clock through their loading pages; `[ Continue ]` starts the load,
not the clock.

---

## 1. The demo path — beat by beat

Start at Jan 1996 by loading the app or using `[ Run it again ]` after a run.
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
| 4a | **Jan 1998** | The clock stops on the old grey interface. Let the compact **WELCOME TO 1998** beat register, click **Continue**, and let its stepped blue loading page finish | The new blue IE4/Win98 coolbar appears only after the load. The controls never move. |
| 5 | **Jun 1999** | The Halcyon popup arrives — click its CTA to open the site. **This is the money shot** — see §2 below. Open the fact sheet, then `[ Back ]` (never `[ Accept ]`) | Slow down here. |
| 6 | **Jan 2000** | The clock stops — read the year-turn line, then **Go on**. Let the cleaner **WELCOME TO 2000** beat register; click **Continue** and watch the metallic-blue setup page finish | *"This year, your pay covers your life exactly. From here it doesn't."* The cool metallic IE5 rebar and newly shaded toolbar icons arrive only after the second pause completes; hover one to show the full-colour hot image. |
| 7 | **Mar 2000** | The crash dialog stops the clock first — **Go on**. The boiler dialog follows immediately, same month — **Sell to cover**. With Northmoor + Fenwick actually held (beats 1 and 3), this triggers a real forced sale — follow whatever the sale panel shows | The NASDAQ falls, then the boiler goes, same month. Narrate the sale panel as it appears: what's being sold, at what loss, to cover a £900 bill. |
| 8 | **Nov 2000** | The clock stops — Halcyon suspended. Click **Go on** | *"Seventeen months of returns, and then nothing. Your balance is £0."* You don't have a balance in it — you declined in beat 5. Land this line and the room has understood the game. |
| 9 | **2001 → 2006** | Nothing scripted left to narrate. Hold fast-forward and let it run to the end | Keep talking over this — it's the fastest stretch, not a pause in the demo. |
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

## 3. Rehearsal and recovery

The deployed application intentionally has no Presenter Tools dialog, no
`?dev=1` unlock, and no hidden About-click unlock. Rehearse the same public
flow a player will use. The `?visual=1` gallery remains available for visual
QA of the 1996, 1998 and 2000 chrome, but it is not a gameplay shortcut.

Between rehearsals, reload the page before starting or use `[ Run it again ]`
after reaching the death card. If a beat is missed during a rehearsal, restart
the run; there is no event-forcing or saved-state UI in the shipped app.

---

## 4. If it goes wrong

- **Wrong page, wrong popup, stuck menu** — click `HOME` in the left nav.
  It's always live, even mid-run.
- **A dialog won't go away** — it isn't supposed to (§20.1: no dismiss, no
  later). Pick a button; both always resolve it.
- **You missed a beat's mail/popup and it expired** — restart the rehearsal;
  the shipped app has no event-forcing shortcut.
- **Lost the thread entirely** — reload the page and start again at Jan 1996.
- **Between judges** — reload before the next run, or use `[ Run it again ]`
  after the death card.
- **A judge asks "what if I fund the Ponzi?"** — explain the authored outcome
  or demonstrate it in a separate full run; no saved-state preset ships.
- **A judge asks about the perfect-play path** — the honest answer is that the
  best decision list found so far dies Feb 2005 (band IMPRESSIVE, not the full
  decade). It is a documented calibration gap (`KNOWN-ISSUES.md` #1), not a
  bug to conceal during the demo.

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
