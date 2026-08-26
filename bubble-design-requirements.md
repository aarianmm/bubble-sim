# BUBBLE — Design Requirements

**Status:** authoritative. This document supersedes all earlier drafts.
**Hackathon:** London fintech hackathon (London Foundation for Banking & Finance brief)
**Build method:** agent-built, step by step — see §26 for the ordered plan and the MVP boundary
**Target:** a **demo build** — one authored playthrough, hand-scripted end to end
**For:** the build team and the design agent

> Working name: **BUBBLE**. Alternates if it clashes: *Nine Nine*, *Dial-Up*, *The Long Run*. Treat the name as changeable, not load-bearing.

**How to read this.** Part I is the idea and the pitch — it explains *why*. Part II is the game — mechanics, numbers, systems. Part III is the visual design — the faux-browser conceit, and every screen and button drawn inside it. Part IV is the build. Parts II–III are binding on implementation; Part I is binding on tone and on anything shown to a judge. **BUILD STATUS**, between Parts III and IV, records what is built, what is outstanding, and every place the implementation deviates from this document.

> ## ⚠ THIS IS A DEMO BUILD
>
> **We are building one playthrough. Everything is hardcoded.**
>
> There is no generator, no RNG, no seed, no difficulty system, no procedural content. The market is a precomputed table. The inbox, the popups, the scams, the shocks, the windfalls and the year turns are a **fixed, hand-authored timeline with exact dates** — see §14.2, which is the master script and the single source of truth for run content.
>
> **What this buys us:** every beat lands where we put it, the demo is identical every time we run it on stage, and the whole content layer can be written and tuned in a spreadsheet by someone who isn't a programmer.
>
> **What this costs us:** replay value. The second run is the same run. For a hackathon demo that is the correct trade, and it is not a compromise we need to explain to a judge — the pitch never claims otherwise.
>
> **What it does NOT change:** the numbers still have to be real and the arithmetic still has to work. Authoring the events by hand does not exempt us from §8. A scripted run whose economics don't add up is worse than a generated one, because there's nowhere to hide.
>
> Anywhere this document describes a rate, a probability, a frequency or a distribution, read it as **design intent that has already been resolved into specific authored events**. The percentages explain why the script looks the way it does; the script is what ships.

---
---

# PART I — THE IDEA

## 1. One line

**A survival game where you live a decade of financial life in twenty minutes — and inflation is what kills you.**

Long form: BUBBLE drops a 15–18 year old into their own near-future. You're 18, you've got a job, a flat and a salary that never goes up. The world around you gets more expensive every year — using real historical inflation, not numbers we invented. You have one lever: what you do with the money left over at the end of the month. Most people don't survive the decade. How far you get is the score.

## 2. Why this exists

The brief's own numbers: fewer than one in five 15–18 year olds can answer three basic questions on interest, inflation and risk. Two thirds feel anxiety about money. Most have never had a meaningful lesson on it — and most want one.

But the sharper fact is in the brief's second paragraph, and almost nobody is building for it: **it does not improve at 18.** Student debt, first salary, tenancy deposit, credit file, pension — the highest-stakes decisions of a financial life all arrive at once, at the exact moment support disappears.

You cannot practise being eighteen. You get one run at it, with no save file, and the consequences compound for decades.

**BUBBLE is the practice run.** Not a curriculum, not a chatbot, not an app that nags you at checkout. A game you lose, learn from, and play again — so that when the real decade starts, it isn't the first time you've seen it.

The brief asks for prevention rather than cure for this age group. This is what prevention actually looks like: rehearsal.

## 3. Audience

**15–18. Committed, single audience.**

The reasoning matters and should survive into the pitch: 18–25 year olds already live in the financial world. A simulation of it teaches them nothing they aren't already learning the hard way. For 15–18 year olds it's genuinely novel — and it lands in the window where habits form and stakes are still low. We're building the context they'll need the week they graduate into it.

Secondary consequence: they have no money, so nothing here touches real funds. That's a feature. No Open Banking, no transaction history, no regulated surface area.

## 4. The core idea — inflation is the eagle

This is the single most important thing in the design and everything else is downstream of it.

Crossy Road works because standing still gets you killed by the eagle. Tetris works because the board fills whether you place pieces or not. Endless runners are only games when **passivity is fatal**.

In BUBBLE, passivity is fatal, and the thing that kills you is inflation:

- Your salary is **fixed in nominal terms**. It never rises.
- Your rent, food, bills and transport rise every year at **real historical rates**.
- So your monthly surplus shrinks, year after year, until it goes negative. Then you're eating savings. Then you're bankrupt.

A player who hoards cash does not survive. They cannot. They are on a timer from the first turn, and the timer is arithmetic.

That's the lesson the whole game exists to deliver, and it's delivered as a game-over screen rather than a lecture: *doing nothing with your money is a decision, and it has a cost.*

**Calibration requirement:** a cash-only player must reliably die well before the decade ends. Target is **March 2000** — see §9.4. If they can limp to 2002, there is no eagle and the game is a screensaver.

## 5. Guardrails

Non-negotiable, and worth a visible line in the pitch because the brief leads with them.

- **No regulated financial advice.** Nothing here recommends a real product to a real person. Everything is simulated, historical and educational.
- **Build investors, not gamblers.** Score rewards surviving, never getting rich. No leverage, no derivatives, no shorting, no margin. The correct strategy is boring, and the game is designed so that boring wins.
- **No real money, ever.** Not a wallet, not a brokerage, not a funnel to one, not an affiliate link, not an "open a real account" CTA — not even as a stretch goal.
- **Losing must teach.** Every death screen names the cause, specifically, and quotes the evidence the player had. You didn't just lose — you got ground down by inflation, or wiped by a fund that was never real, or forced to sell in 2001 to cover a broken boiler.
- **Never patronising.** Dry and a bit cruel, the way a good roguelike death screen is. A 16-year-old can smell a product that's talking down to them.

### 5.1 Legal & ethical constraints on content

Easy to get wrong in a hurry, expensive to walk back.

1. **Real indices, fictional firms.** FTSE All-Share, S&P 500, NASDAQ, gilts and the CPI/rent series are real and cited. Every named fund, fund manager, company and bank in the game is **invented**.
2. **No real company is ever depicted as a scam, a fraud, or a bad investment.** This is a defamation risk and it is entirely avoidable.
3. **Fictional names must not be near-misses** for real firms that existed in that period. Check the list before shipping.
4. **No shipped Microsoft assets.** The visual language is period-accurate; the icons, fonts, sounds and browser name are original recreations. See §22.
5. A visible in-game line: *"Simulated. Historical data is real; every company and fund in this game is invented. This is not financial advice."*

---
---

# PART II — THE GAME

## 6. The locked decisions

Everything downstream follows from these seven. They are settled; don't relitigate them mid-build.

| # | Decision | Locked as | Consequence |
|---|---|---|---|
| 1 | **Everything starts as cash** | Nothing is invested unless the player acts | Passivity is the default state, and the default state is lethal |
| 2 | **Vehicles only arrive as messages** | Investments come by inbox and popup, never from a shop menu | Triage *is* the game. There is no curated "fund list" screen |
| 3 | **Accept ≠ invest** | Accepting unlocks a vehicle into the portfolio; it holds £0 until allocated | Two separate skills: what you let in, and what you fund |
| 4 | **Scams hurt at both tiers** | Accepting costs a little (fees, more scam mail). Allocating costs everything | Sloppy triage bleeds you. Sloppy allocation ends the run |
| 5 | **Hybrid pacing** | Shocks and life events block. Mail and popups arrive with expiries; Home and the Mail inbox run normally, while opened messages and all other screens auto-pause | Authored delivery pressure without rushing reading, investigation or allocation |
| 6 | **Two-way % allocation sliders, free rebalance** | Player sets target % across cash + every unlocked vehicle; game buys/sells to match | Retreat to cash is always possible — §12.3 explains why the death spiral survives anyway |
| 7 | **Investing is the only lever** | The player never chooses their rent, food, job or lifestyle | The eagle stays unambiguous. No lifestyle system to build |
| 8 | **Everything is authored** | One fixed timeline. No RNG anywhere in the run | The demo is reproducible on stage. Content is data, tunable without a rebuild. §14.2 is the script |

**The calibration target:** a player who accepts nothing and stays 100% cash goes bankrupt in **March 2000** — the exact month the NASDAQ peaked. They go broke the same week the bubble they never joined reaches its top. Use this. It is the best line on the death card in the game.

## 7. The loop

### 7.1 The ten-second version

> Time runs. Prices rise. Your pay doesn't. Messages arrive — some are opportunities, some are traps, most are noise. You decide what to let in, and what to put your money into. Something breaks at the worst possible moment. Repeat until you run out.

### 7.2 The state machine

```
                    ┌─────────────────────────────┐
                    │        RUNNING              │
                    │  time advances month by     │◄────────────┐
                    │  month; prices tick up;     │             │
                    │  pay is applied; surplus    │             │
                    │  or deficit hits cash       │             │
                    └──────┬───────────┬──────────┘             │
                           │           │                        │
              non-blocking │           │ blocking               │
                           ▼           ▼                        │
                  ┌────────────┐  ┌──────────────┐              │
                  │ MAIL &     │  │  DIALOG      │              │
                  │ POPUPS     │  │  time PAUSED │              │
                  │ offers,    │  │  shocks,     │              │
                  │ junk,      │  │  job loss,   │              │
                  │ scams      │  │  crash news, │              │
                  │ (expiring) │  │  year turn   │              │
                  └─────┬──────┘  └──────┬───────┘              │
                        │                │                      │
        player opens    │                │ must be resolved     │
        when they choose│                │ before time resumes  │
                        ▼                ▼                      │
                  ┌──────────────────────────────┐              │
                  │   DECIDE                     │              │
                  │   delete / accept a message  │──────────────┘
                  │   move the sliders           │
                  │   pay or sell to cover       │
                  └──────────────┬───────────────┘
                                 │
                    cash < 0 and no credit left
                                 ▼
                        ┌────────────────┐
                        │  DEATH CARD    │
                        └────────────────┘
```

### 7.3 The month tick

Every simulated month, in this exact order. Order matters — it determines whether a player dies before or after their investments have a chance to save them.

1. **Pay in** — fixed nominal salary hits cash
2. **Expenses out** — current-year basket deducted from cash
3. **Market moves** — each vehicle's holding multiplied by its monthly return
4. **Interest and fees** — cash interest, debt interest, vehicle annual fees applied pro-rata
5. **Scheduled events fire** — mail and popups arrive; dialogs pause the clock
6. **Solvency check** — if cash < 0, attempt liquidation (§12.3); if still < 0 and no credit, run ends

### 7.4 Session shape

- **Target run length:** 18–22 minutes for a player who survives the decade
- **Target decision count:** 15–20 real decisions (accepts, deletes-that-mattered, reallocations, shock resolutions)
- **First run:** expected to end in 1999–2000, at roughly 6–9 minutes. That's the hook — the replay button, not a tutorial, is what teaches.
- **Base rate:** 1 simulated month ≈ 1.2 real seconds, so an uninterrupted year is ~15s. Held fast-forward runs at 4×.

## 8. The economic model

### 8.1 Starting state — January 1996

You are 18. You have a job, a room in a shared flat, and a current account.

| Line | Monthly | Notes |
|---|---|---|
| Take-home pay | **£760** | **Fixed nominal for the entire decade. Never rises.** |
| Rent | £310 | Room in a shared flat |
| Food | £140 | |
| Bills | £95 | Gas, electric, water, council tax share |
| Transport | £58 | |
| Phone & other | £42 | |
| **Total out** | **£645** | |
| **Surplus** | **+£115** | 15% of income. The entire strategic resource. |

Starting cash **£0**. Portfolio **empty**. Unlocked vehicles **none**.

### 8.2 Expense growth — why it's honest and why it's lethal

UK CPI over 1996–2006 averaged only ~2–3%/yr. That alone will *not* kill anyone in four years, and a spec claiming otherwise will not survive a judge who knows the numbers.

The honest mechanism is **basket composition**. The expense basket of an 18-year-old renter is dominated by housing, and UK private rents and housing costs rose far faster than headline CPI across that decade. Weight the basket to rent and the eagle appears without inventing a single number.

| Component | Weight (1996) | Annual growth | Keyed to |
|---|---|---|---|
| Rent | 48% | **~5.5%** | UK private rental / housing cost index |
| Food | 22% | ~2.5% | CPI food |
| Bills | 15% | ~4.0% | CPI housing, water, electricity, gas |
| Transport | 9% | ~3.0% | CPI transport |
| Phone & other | 6% | ~2.0% | CPI misc |
| **Blended** | 100% | **~4.2%** | vs headline CPI ~2.5% |

**Requirement:** these are real series loaded from a data file, not hand-tuned constants. The blended rate is an *output* of the basket, never an input. This is the single most important defensive fact in the project.

### 8.3 The squeeze

| Year | Expenses/mo | Surplus/mo | Running feel |
|---|---|---|---|
| 1996 | £645 | **+£115** | Comfortable. You feel fine. |
| 1997 | £673 | +£87 | Slightly tighter. Barely noticeable. |
| 1998 | £701 | +£59 | You notice. |
| 1999 | £730 | +£30 | Uncomfortable. |
| 2000 | £760 | **£0** | **Break-even. Pay exactly equals costs.** |
| 2001 | £793 | −£33 | Eating savings. |
| 2002 | £827 | −£67 | |
| 2003 | £862 | −£102 | |
| 2004 | £900 | −£140 | |
| 2005 | £938 | −£178 | |
| 2006 | £980 | **−£220** | £220/mo underwater on a wage that never moved. |

The year-2000 break-even is deliberate and must be surfaced hard — see the year-turn dialog in §20.3. It is the thesis of the game delivered as a game event.

### 8.4 Why cash-only dies in March 2000

Arithmetic alone doesn't kill the cash player — it takes their **resilience**, and then a shock kills them. More honest than pure erosion, and it plays better.

```
end 1996   +£1,380                          =  £1,380
end 1997   +£1,044   − £600  (deposit/phone)=  £1,824
end 1998     +£708 − £1,100  (laptop/car)   =  £1,432
end 1999     +£360 − £1,600  (job loss, 3mo)=    £192
Mar 2000   surplus £0/mo,  −£900 (boiler)   =   BROKE
```

**Calibration contract:**

| Strategy | Dies | Band |
|---|---|---|
| 100% cash, no accepts | **Q1–Q2 2000** | OUCH |
| Accepts and funds everything | 2000–2001, killed by a scam | OUCH / OKAY |
| Broad tracker, ignores the hot stuff | ~2004 | SOLID |
| Tracker + no scams + held through the crash + covered shocks without panic-selling | **survives to 2006** | LEGENDARY |

**Playtest gate:** if the cash-only player reaches 2002, the game ships broken. First number to instrument, last to stop watching.

### 8.5 Winning must be possible

At £115/mo falling to £0, lifetime contributions total ~£3,500 — nowhere near the ~£13,000 needed to cover late-decade deficits plus shocks. **Contributions alone cannot win the game.** Capital has to come from somewhere.

It comes from **windfalls, which arrive in the inbox like everything else.**

| When | What | Amount |
|---|---|---|
| 1997 | Matured child savings account / Premium Bonds from a grandparent | ~£2,000 |
| 2000 | Redundancy payout attached to the job-loss shock | ~£1,800 |
| 2003 | A small legacy | ~£2,500 |

Mechanically necessary and thematically perfect: **a windfall landing is exactly when the scam offers get loudest.** Every windfall must be followed by a spike in predatory mail and popups. That is how it works in real life and it is how it works here.

## 9. Vehicles & the market

### 9.1 The vehicle taxonomy

None exist at start; all arrive by message.

| Tier | Vehicle | Behaviour | Role |
|---|---|---|---|
| **Default** | Current account | 0% | Where you start. Where you die. |
| **Safe** | Building society bond | ~4–5%, falling over the decade | The trap that *feels* responsible. Still loses to a 5.5% rent rise. |
| **Correct** | UK All-Share tracker | Real index, ~0.4% fee | Boring, dull-looking, correct |
| **Correct** | Global/US tracker | Real index, ~0.5% fee | Correct, more volatile |
| **Reasonable** | Gilt fund | Real series | Dampener. Wins during the crash. |
| **Reasonable** | Corporate bond fund | Real series | |
| **Mediocre** | High-fee active tech fund | Real sector series, **5% fee, 1% exit** | Legitimate, and still terrible. Fees are a scam you're allowed to sell. |
| **Mediocre** | Managed portfolio | 3% annual + 20% performance | Legitimate. Sounds premium. Underperforms the tracker. |
| **Concentrated** | Blue-chip single stocks | Real-ish large-cap series | Undiversified but real |
| **Concentrated** | Dot-com single stocks | Explosive to 2000, then −90%+ | The pure bubble ride |
| **Fatal** | Unregulated "guaranteed return" fund | 3–5%/mo for 12–18 months, then **zero, permanently** | The Ponzi. §11.4 |
| **Fatal** | Boiler-room pump stock | +200% over 4 months, then −98% and unsellable | The pump and dump |
| **Fatal** | "Pension release" scheme | Takes a lump sum, returns nothing | The liberation scam |
| **Negative** | Credit card | £2,000 limit, 0% for 6mo then 29.8% APR | §13 |

### 9.2 The market series

- **Indices are real.** FTSE All-Share, S&P 500, NASDAQ, UK gilts, base rate, 1996–2006, real monthly data, real crash timing, in the real order.
- **Shipped as a precomputed table**, not a series engine: one JSON file, 132 rows (one per month), one column per vehicle, holding that month's multiplier. Generated once by a build script from the source data, checked into the repo, never computed at runtime. Fictional vehicles are columns in the same table, derived from a real series plus an authored fee and, where applicable, an authored collapse (§11.4).
- **The crash is not tuned.** March 2000 through 2002 happens because it happened. This is the answer when a judge asks whether the game was rigged to prove its point.
- **Named entities are fictional** — see §5.1.
- Single stocks use real sector/size-factor series with fictional names layered on.

### 9.3 Fees

Fees must be *visible in the sim*, not just on the fact sheet. Deduct monthly, show them in the portfolio row, and total them on the death card:

> *"You paid £1,840 in fees. The tracker would have charged you £96."*

That line does more financial education than a tutorial ever will.

## 10. The two channels — mail and popups

Vehicles reach the player through two distinct channels with different pressure. This split is the core of both the pacing and the visual design (§20).

| Channel | Carries | Blocking? | Scams, in the authored run | Expiry |
|---|---|---|---|---|
| **Inbox (mail)** | Solicited and semi-solicited: workplace pension letters, building society literature, fund prospectuses, Dave, windfalls, statements | Delivery/list: no. Open message: yes | **1 of 9 offers** | Yes, visible |
| **Popup window** | Unsolicited: ads, promos, "opportunities", junk | Delivery: no. Its linked offer/decision pages pause | **5 of 8 offers** | Yes, closes on its own eventually |
| **System dialog** | Shocks, job loss, forced sales, year turns, death | **Yes** | **0 — see §20.4** | n/a |

Those counts are the authored manifest, not a probability. The ratio is the *reason* the manifest looks like this: popups skew scam heavily, mail mostly doesn't, and one mail scam exists specifically so the player can't learn "mail is safe."


**Rules that make this work:**

1. **Popups skew scam but never determine it.** A real tracker fund advertises by popup too. A professional scam arrives by post. Skew, don't determine.
2. **Closing a popup is free and safe**, always. Same as deleting mail. A player who closes every popup survives longer than one who reads them all — but they die too, because they never invest.
3. **Clicking through a popup navigates to the offer's website** (§19.3) and adds the message to the inbox, so nothing is permanently lost by exploring.
4. **The dialog channel never carries an offer.** If the operating system is talking to you, it is telling the truth. Exactly one exception, deliberately introduced late — §20.5.

### 10.1 Message classes

| Class | Frequency | Channel | Effect |
|---|---|---|---|
| **Junk** | High | Popup mostly | Low-stakes adverts, chain mail and "you may already have won" promotions. Free to dismiss; accepting is harmless but attracts more junk. |
| **Legit offer** | Medium | Both | Unlocks a real vehicle. Fact sheet is clean. |
| **Mediocre offer** | Medium | Both | Unlocks a real but bad vehicle. High fees or narrow holdings, plainly stated. Legal, legitimate, a mistake. |
| **Scam offer** | Rising 1998–2000 | Popup-weighted | Unlocks a fatal vehicle. Fact sheet carries ≥2 red flags. §11 |
| **Life admin** | Low | Mail | Pension opt-in, tenancy renewal, tax code. Teaches diegetically. |
| **Windfall** | 3 per run | Mail | Money arrives. Always followed by a scam spike. |
| **Credit offer** | 2–3 per run | Both | The card. §13 |
| **Social** | Low | Mail | A mate emails about the fund that made him rich. FOMO pressure, and one is a scam vector. |

### 10.2 Message lifecycle

```
  ARRIVES ──► UNREAD (badge +1) ──► READ ──► ACCEPTED ──► vehicle unlocked
     │                                 │
     │                                 └──► DELETED ──► gone
     │
     └──► EXPIRES (countdown hits 0) ──► gone, silently
```

- **Expiry is visible** on the list row: `3d`, `9d`, or `—` for never.
- **Expiry is real.** Miss a good tracker offer and you wait for the next one. Miss a scam and you got lucky. The game never tells you which happened.
- **Unread mail keeps arriving.** The badge grows. There is no forced inbox-zero moment.
- **Deleting is always free and always safe.**

### 10.3 Triage pressure

The player must still triage arrivals before they expire, but detailed financial reading and decisions are not speed-reading tests.

- Home and the Mail inbox are the normal running screens, allowing new Mail and events to accumulate while the inbox is browsed. Individual messages, My Money, offer pages, fact sheets, accept/decision routes and every other route automatically pause simulated time.
- Popups do **not** slow time. Ignoring them is a real option with a real cost.
- Junk, legit and scam rows are **visually identical in the inbox list**. Only the message body, the site it links to, and the fact sheet distinguish them.

## 11. The scam system

### 11.1 The two damage tiers

| Action | Cost | Feel |
|---|---|---|
| **Accepting** a scam | Setup/admin fee £25–£150 charged immediately, **plus** your address goes on a list: scam frequency rises for the rest of the run | A bleed. Survivable. Annoying. Saying yes has a price even when you hand over nothing. |
| **Allocating** to a scam | Everything you put in, gone — but not instantly. It shows fake gains first. | Run-ending. |

**Sloppy triage bleeds you, sloppy allocation kills you.** A player who accepts everything but only funds the tracker will watch their inbox fill with garbage and their cash quietly drain — and will learn to delete, without ever being killed by it.

### 11.2 The fairness contract

Non-negotiable. A game that kills you unfairly teaches nothing except that the game is unfair.

1. **Every scam shows at least two red flags on its fact sheet before the player can fund it.** No exceptions.
2. **Red flags are always available before commitment** — the fact sheet is one click from the accept button, free, and untimed.
3. **No single red flag is diagnostic.** Legit offers sometimes carry one. Judgement is required, not a checklist.
4. **At least one scam per run is genuinely hard** — one flag subtle, one buried in the small print. It must be possible to lose to it fairly.
5. **The death card always names the flags you missed**, quoting them from the sheet you could have read.
6. **Visual style is a hint, never a verdict.** See §21 — this is where the fairness contract meets the art direction, and it is easy to break by accident.

### 11.3 The red-flag vocabulary

Reusable across scam and legit messages. Legit offers draw one at random from the top; scams draw two or more, weighted to the bottom.

| Flag | Appears on |
|---|---|
| Slightly high fee (1.5–3%) | Legit-but-mediocre, sometimes |
| Short track record (12–24mo) | Legit new funds, and scams |
| Unsolicited approach | Common. Weak signal alone. |
| Urgency / short expiry | Legit promos use this too |
| Concentrated holdings (<5) | Single stocks, legitimately |
| Very high fee (>5%) | Mediocre and scam |
| **Track record under 12 months** | Scam-weighted |
| **Returns described as "guaranteed" or with a floor** | **Near-diagnostic** |
| **No regulator listed / "registered overseas"** | **Near-diagnostic** |
| **Lookalike sender domain** (visible in the address bar) | **Near-diagnostic** |
| **Return promise implausible vs the index** | **Near-diagnostic** |
| **"Introducer commission" / recruit-a-friend bonus** | **Diagnostic** |

### 11.4 The Ponzi curve

The signature scam, and the reason the design works. It must **pay out convincingly first.**

```
     value
       │                    ╭──╮
       │              ╭─────╯  ╰╮
       │        ╭─────╯         │
       │  ╭─────╯               │
       │──╯                     ╰──────────────────
       └────────────────────────────────────────── time
         month 1        month 14  ▲     month 15
                                  │
                     "SUSPENDED PENDING REVIEW"
                              value → £0
```

- Months 1–14: pays **3–5% per month**, smooth, never a down month. By a wide margin the best performer in the player's portfolio, and the portfolio screen says so.
- **The smoothness is the tell.** A real equity fund has down months. This one never does, and the fact sheet's return chart shows a suspiciously straight line.
- Collapse: total, permanent, no partial recovery, no warning.
- **A greedy player will rebalance *into* it** as it outperforms. That is the trap, and it is a fair one.

### 11.5 The six scams

Six scams, authored, named, dated. That is the complete list — there is no seventh and no generator.

| # | Name | Arrives | Channel | Style (§21) | Red flags on the sheet | Damage |
|---|---|---|---|---|---|---|
| 1 | **Meridian Capital Guaranteed Growth** | Mar 1997 | Popup | Loud | "Guaranteed 30% p.a."; no regulator | Small — the amateur one, right after windfall #1. Teaches the shape cheaply. |
| 2 | **Cavendish Technology Opportunities** | Mar 1998 | Popup | Loud | 8% fee; 3 holdings; "guaranteed minimum 40%"; unregulated | Moderate |
| 3 | **Halcyon Reserve** — *the Ponzi* | Jun 1999 | Popup | **Slick — best-looking site in the game** | "Registered in Guernsey", no UK regulator; 5% introducer commission; a return chart with no down months | **Run-ending.** Collapses Nov 2000. §11.4 |
| 4 | **Vertex Communications** — *the pump* | May 1999 | Popup | Loud | Single holding; unsolicited tip; 4-month track record | Severe. +200%, then −98% and unsellable. |
| 5 | **Restitution Partners** | Apr 2001 | **Mail** | Plain, professional | Upfront fee to "recover" losses; no regulator | Moderate. Targets a player who just got hurt — the cruellest one, and the most real. |
| 6 | **"SECURITY ALERT"** — *the fake dialog* | Apr 2003 | Popup posing as a dialog | Imitation system chrome | The clock doesn't stop; it sits inside the content area; its buttons have URLs | Severe. The hardest one. §20.5 |

The shape of the list is the history: two cheap ones early, the mania pair in 1999, the recovery-room scam right after the crash, and the phishing-flavoured one in 2003 as the web professionalises. Post-crash the scams change character rather than disappearing — that is real, it is cruel, and it belongs in the game.

The September 2005 Meadowbank impersonation is a separate, non-actionable
security lesson rather than a seventh fundable scam: it has no vehicle, fact
sheet, cash effect or credential mechanic. Its X-only browser presentation
teaches that a familiar bank name and threatened account restriction do not
authenticate a request for personal information.

## 12. Portfolio & allocation

### 12.1 The model

Two-way % sliders over total wealth, free rebalance.

- Sliders set a **target allocation** across cash + every unlocked vehicle.
- Must total 100%. The UI enforces this.
- Confirming executes buys and sells to reach the target at current prices.
- The player can always return to 100% cash.

### 12.2 Slider behaviour

- Dragging one slider redistributes the difference **proportionally across the others**, with a lock toggle per row to pin one in place.
- Live preview: each row shows the £ the % resolves to, in both period and today's money, updating as you drag.
- **Nothing executes until `[ Rebalance Now ]` is confirmed.** Sliders are a draft until then; `[ Reset ]` restores current actual allocation.
- Exit fees, if any, are itemised in the confirm step *before* commitment.

### 12.3 Why free rebalancing doesn't kill the death spiral

Frictionless selling would normally defuse the forced-sale-at-the-bottom lesson. It doesn't here, because **expense shocks don't ask about the sliders.**

When a £900 boiler lands in September 2001 and cash is £120, the player must raise £780 *at September 2001 prices* — which are terrible. The trade is forced by the calendar, not by an exit fee. They sell the tracker down 34% and it never comes back for them, because they sold the units.

On a shortfall the game raises a **forced-sale dialog** listing what will be sold and at what loss, in both money terms. The death card remembers every forced sale: *"You sold at the bottom three times."*

### 12.4 The portfolio row

Each unlocked vehicle displays: name and period-appropriate logo; current value (period money) with today's money beneath; return since purchase; fee as annual % **and as £ paid to date**; allocation slider; and a link that reopens the fact sheet, always, forever. You can re-read what you agreed to.

## 13. Debt

Debt is an optional lever that arrives by message, not a system imposed at £0.

- A credit card offer arrives 2–3 times per run, first around 1998, and again immediately after the first serious shock — when it is most tempting and most dangerous.
- Terms shown plainly: **£2,000 limit, 0% for 6 months, then 29.8% APR.**
- Accepting unlocks it as a negative vehicle. It sits at £0 until used.
- With a card active, a cash shortfall offers `[ Put it on the card ]` alongside `[ Sell to cover ]`.
- Interest compounds monthly, displayed as a growing red bar with the monthly charge called out: *"£8 a month just to be broke."*
- **Death condition:** cash negative, no assets left to liquidate, and either no card or the card is maxed.
- Taking the card is genuinely correct sometimes — bridging a 2001 shock rather than selling a tracker at the bottom is the right call. It must not be a pure trap, or the lesson collapses into "debt bad".

## 14. The master script

**This section is the single source of truth for run content.** Everything in it is authored, dated and fixed. If an event is not in this table, it does not happen.

### 14.1 Shock design

Shocks are the difficulty engine, because the market series is fixed by history and can't be tuned. **Difficulty lives here.**

- **Size:** £250–£1,600
- **Timing:** hand-placed, and deliberately adversarial — the September 2001 shock lands in the trough because we put it there. The game is cruel about *when*; it is never cruel about *whether the player could have known* (§11.2).
- **Front-loaded:** the 1997–1999 shocks strip the cash player's buffer before 2000. This is the mechanism behind the March 2000 calibration.
- **Job loss** is the big one: 2–3 months of no income, plus a redundancy payout arriving as a windfall — a lump sum landing at the exact moment you're most desperate and most likely to reach for something that promises a lot.

### 14.2 The timeline

**42 authored events. 26 of them demand a decision.** Channel: `MAIL` (badge only), `POP` (popup window), `DLG` (blocking dialog). Class per §10.1.

| Date | Ch | Event | Class | Notes |
|---|---|---|---|---|
| Jan 1996 | — | Run begins. £760/mo, £645 out, £0 cash | — | |
| Feb 1996 | POP | EasyPay Credit — 0% buy now, pay later | Junk | Introduces popup dismissal and the cost after an introductory borrowing period |
| **Apr 1996** | MAIL | **Northmoor Building Society — 5.2% savings bond** | **Legit** | **The discoverability floor (§16).** Unmistakably safe, and the fact sheet is the only way to see the rate. Hideous website (§21 rule 2) |
| Dec 1996 | MAIL | Northmoor annual statement | Flavour | Shows interest earned: £31. Against £28/yr of rent inflation. The joke lands silently |
| **Feb 1997** | MAIL | **Windfall #1 — £2,000**, matured child savings | Windfall | |
| **Mar 1997** | POP | **Meridian Capital Guaranteed Growth** | **Scam 1** | The scam spike follows the windfall by three weeks. Loud, cheap, obvious |
| May 1997 | MAIL | Brightwell Ltd — workplace pension opt-in | Life admin | Teaches allocation diegetically |
| **Jul 1997** | MAIL | **Fenwick Index Trust — UK All-Share tracker, 0.4%** | **Legit — the correct answer** | Dull page, dull copy, correct |
| **Sep 1997** | DLG | **Shock — £600** (deposit top-up + phone bill) | Shock | |
| Feb 1998 | MAIL | Dave — "mate you have to see this" | Social | FOMO. Links to the tech fund |
| **Mar 1998** | POP | **Cavendish Technology Opportunities** | **Scam 2** | The §22.3 example page |
| May 1998 | MAIL | Capital Direct Gold Card — introductory credit information | Credit | Informational; no application link in the MVP |
| **Aug 1998** | DLG | **Shock — £500** (car repair) | Shock | |
| Oct 1998 | MAIL | Ashcombe Managed Portfolio — 3% + 20% | Mediocre | Legal, legitimate, a mistake |
| Jan 1999 | MAIL | Fenwick World — global tracker, 0.5% | Legit | |
| Mar 1999 | MAIL | Kingsley Gilt Income Fund | Legit | Crash dampener; sober investor correspondence |
| **May 1999** | POP | **Vertex Communications** | **Scam 4 — the pump** | Mania peak |
| **Jun 1999** | POP | **Halcyon Reserve** | **Scam 3 — THE PONZI** | Arrives showing 14 months of flawless 4%/mo. Best-looking site in the game |
| Jul 1999 | MAIL | Dave — "I'm up 300%" | Social | |
| Sep 1999 | MAIL | Quicksilver.com — dot-com single stock | Concentrated | Real vehicle, catastrophic timing |
| **Nov 1999** | DLG | **JOB LOSS — 3 months, no income** | Shock | The big one |
| **Jan 2000** | DLG | **Year turn — BREAK-EVEN** | Year turn | Living costs now match £760 pay; from here costs rise faster |
| Feb 2000 | MAIL | **Windfall #2 — £1,800** redundancy; new job, same £760 | Windfall | Cash lands at maximum desperation |
| **Mar 2000** | DLG | **THE CRASH** | Market | |
| **Mar 2000** | DLG | **Shock — £900** (boiler) | Shock | **The cash-only player dies here.** §8.4 |
| Apr 2000 | MAIL | **Restitution Partners — "recover your losses"** | **Scam 5** | Aimed at whoever just lost money. By mail, so mail cannot be trusted either |
| Jun 2000 | MAIL | MarketWatch — "Buy the dip" | Junk/market context | Financial newsletter rhetoric after the crash |
| Oct 2000 | MAIL | Capital Direct — introductory credit revisited | Credit | Post-shock informational warning; no application link in the MVP |
| **Nov 2000** | DLG | **HALCYON RESERVE SUSPENDED — value £0** | Scam payload | 17 months of perfect returns, then nothing |
| Mar 2001 | MAIL | Granville plc investor relations | Legit | Concentrated blue-chip share offer |
| **Sep 2001** | DLG | **Market event + Shock £900, in the trough** | Shock | **The forced-sale moment.** Designed emotional peak of the run |
| Dec 2001 | DLG | Year turn | Year turn | |
| **Jan 2002** | DLG | **"Your computer has been upgraded."** | Era switch | **Era A → Era B (§18.2).** No further explanation |
| Jun 2002 | MAIL | Fenwick Investor Bulletin — post-crash uncertainty and diversification | Flavour | Educational and state-independent; no offer or CTA |
| Oct 2002 | DLG | Shock — £500 | Shock | |
| Feb 2003 | MAIL | **Windfall #3 — £2,500** legacy | Windfall | |
| **Apr 2003** | POP | **"SECURITY ALERT — your savings are at risk"** | **Scam 6 — fake dialog** | The hardest one. §20.5 |
| Sep 2003 | MAIL | Marlow Corporate Bond Fund | Legit | |
| **Mar 2004** | DLG | **Shock — £1,200** (rent spike, moving costs) | Shock | Most surviving players die here |
| Aug 2004 | MAIL | Pension matching reminder | Life admin | Informational; no Brightwell-specific link after redundancy |
| Feb 2005 | MAIL | Marlow Investor Bulletin — the compounding effect of investment charges | Flavour | Educational and state-independent; no offer or CTA |
| May 2005 | DLG | Shock — £700 | Shock | |
| Sep 2005 | POP | Meadowbank Online Banking — account-verification phishing | Security | Bank impersonation and threatened account restriction; X-only, with no credential mechanics |
| Jun 2006 | DLG | Shock — £600 | Shock | |
| Aug 2006 | MAIL | Personal Finance Review — keeping long-term plans on track | Flavour | Late-game reflection on regular saving, pensions and diversification |
| **Dec 2006** | DLG | **THE DECADE ENDS — you survived** | Win | LEGENDARY card |

**Implemented totals:** 47 events · 23 Mail events · 8 authored popup windows · 17 actionable offers (11 mail, 6 popup; life-admin and educational reminders excluded) · 6 fundable scams plus one non-actionable phishing lesson · 9 shocks · 3 windfalls · 2 junk · 2 credit events.

### 14.3 Rules the script must satisfy

Check these whenever the timeline is edited. They are what stop hand-authoring from quietly breaking the design.

1. **The first offer of the run is safe and requires the fact sheet.** Apr 1996, Northmoor. Non-negotiable — §16.
2. **Every windfall is followed by a scam within 90 days.** Feb 1997 → Mar 1997. Feb 2000 → Apr 2001 is too slow; if playtesting shows the pattern isn't landing, move a scam into mid-2000.
3. **No two decisions land in the same month** except where deliberately doubled (Mar 2000: crash + boiler, which is the point).
4. **Every scam meets the fairness contract** — ≥2 red flags visible on its fact sheet before funding. §11.2.
5. **At least 60 simulated days of quiet before every major shock**, so it reads as an interruption rather than as noise.
6. **The cash-only path dies in Mar 2000** and the tracker-only path reaches 2004. Verify after every edit — §25.3.

## 15. Scoring & bands

No win/lose. Bands by how far you got.

| Band | Reached | Expected share of runs |
|---|---|---|
| **OUCH** | Died before Jan 2001 | ~50% of first runs |
| **OKAY** | 2001–2002 | |
| **SOLID** | 2003–2004 | |
| **IMPRESSIVE** | 2005 | |
| **LEGENDARY** | Survived through Dec 2006 | Should be rare |

Bands are determined by **survival date only** — never by final wealth. This is deliberate and it is the anti-gambling guardrail made mechanical: a player who ends 2006 with £400 scores the same as one who ends with £40,000.

Secondary stats on the death card, for bragging and teaching, not for scoring: peak wealth, fees paid, scams funded, scams dodged, forced sales, months underwater.

## 16. Onboarding

**Die fast, learn across runs.**

- **No tutorial mode.** No "welcome to BUBBLE, let's learn about sliders."
- The first run is short and probably fatal, and that is the design.
- **Teaching is diegetic.** The workplace pension letter explains allocation because it's a pension letter. Dave's email demonstrates FOMO because Dave is like that. The year-turn dialog explains inflation because it's January.
- **Discoverability floor:** the first message of the first run must be unmistakably safe and must require opening the fact sheet, so the player learns the sheet exists before it matters. Everything after that is on them.
- The replay button, plus a death card that names exactly what killed you, is the tutorial. Runs 2 and 3 are where learning happens. Assume nobody understands the game on run 1, and that this is fine.

**The demo caveat.** "Die fast, learn across runs" is the product's design and it stays in the pitch — but the demo is a *single* playthrough, and a first run that ends in OUCH at eight minutes is a bad thing to show a judge. Two consequences:

- The demo is driven by an operator who knows the script and plays the **demo path** — competent, reaching 2004+, showing the crash, one scam dodged and one shock survived.
- The shipped application has no presenter/debug shortcut. If the pitch also wants to show the cash-only death, use a separate full run or a recording; do not interrupt the decision-carrying demo path.

---
---

# PART III — VISUAL DESIGN

## 17. The conceit

**The game is a website, and you are looking at it through a 1998 web browser.**

Not a game with a retro skin. A faux browser window, rendered straight, containing a period-correct financial portal. The player's whole session is one long web session from 1996 to 2006 — they navigate with a Back button, they watch pages load over a modem, they close popups, and they read fact sheets that look like they were laid out in FrontPage.

**Tone: straight chrome, period-loud pages.** The browser plays it completely sober — real proportions, real system font, real greys, nothing winking at the camera. The *websites inside it* are authentically of their time, which for 1999 means tiled backgrounds, WordArt and marquee tags on the worst offenders. The humour comes from what things say and from what the death card tells you, never from the interface elbowing you in the ribs.

**Why this beats the cartoon version.** In a room full of clean fintech blue, a game that looks like a bank is invisible and a game that looks like a cartoon is dismissed. A game that looks like a *forensically accurate 1999 browser* is neither — it's a period artefact, and it earns the seriousness the subject needs while being unmistakably not-a-bank. The dot-com bubble is the setting; rendering the game in the actual artefact of that bubble is the strongest available move.

### 17.1 The site

The game lives at a fictional period portal:

```
  http://www.bubble.net/home     the account dashboard
  http://www.bubble.net/mail     webmail — the inbox
  http://www.bubble.net/money    the portfolio and allocation page
```

External sites are real destinations you navigate to:

```
  http://www.northmoor-bs.co.uk/savings-bond
  http://www.cavendish-assets.co.uk.offers.net/tech-fund     ← look at that domain
```

**This makes the address bar a gameplay element.** Lookalike domains are visible there, exactly as they are in life, and checking the URL before you trust a page is a real transferable skill that costs us nothing to build. Back and Forward are functional. See §19.3.

## 18. The frame

**One browser window, maximised.** No desktop, no taskbar, no wallpaper. The window fills the viewport; the game lives entirely inside the content area. Landscape, desktop proportions, minimum 1024×768 — the era's standard resolution, and the correct one.

### 18.1 Window anatomy

```
┌────────────────────────────────────────────────────────────────────────┐
│ ⊞  BUBBLE — Bubble Navigator                             _   □   ✕     │  ← title bar
├────────────────────────────────────────────────────────────────────────┤
│  File   Edit   View   Go   Favorites   Help                            │  ← menu bar
├────────────────────────────────────────────────────────────────────────┤
│   ←      →      ✕      ⟳      ⌂      🔍      ★      ✉                   │  ← toolbar
│  Back  Forward  Stop  Refresh  Home  Search  Fav'ts  Mail              │     (labels: Era A)
├────────────────────────────────────────────────────────────────────────┤
│  Address │ 📄 http://www.bubble.net/home                    ▾ │  Go    │  ← address bar
├──────────────────┬─────────────────────────────────────────────────────┤
│                  │                                                     │
│  ▸ HOME          │                                                     │
│  ▸ INBOX    (3)  │              content area                           │
│  ▸ MY MONEY      │                                                     │
│                  │                                                     │
│  ──────────      │                                                     │
│  SEP 1998        │                                                     │
│  ▶▶  ⏸           │                                                     │
│                  │                                                  ▲  │  ← scrollbar
├──────────────────┴─────────────────────────────────────────────────────┤
│ Done                                          ▓▓▓▓▓░░░░  🌐 Internet   │  ← status bar
└────────────────────────────────────────────────────────────────────────┘
```

**Every element is functional or diegetic. Nothing is decoration.**

| Element | Behaviour |
|---|---|
| Title bar | Shows the current page title. Updates on navigation, as a real browser does. `_ □ ✕` are inert but correctly drawn — hovering shows the bevel press. Clicking `✕` prompts *"Are you sure you want to leave?"* and, if confirmed, quits the run. |
| Menu bar | `File > New run`, `File > Quit`, `View > Money as 2026 £` (the dual-money toggle, §19.4), `Help > About`, `Help > This is not financial advice`. Real menus, real dropdowns, mostly greyed out — correct for the era and it hides the settings where they belong. |
| Back / Forward | **Functional.** Navigation history across pages. Greyed when unavailable. |
| Stop / Refresh | Stop cancels a page load. Refresh re-renders. Both real. |
| Home | Returns to `/home`. |
| Mail | Jumps to `/mail`. Icon shows an envelope badge on unread. |
| Address bar | Shows the live URL. **Editable is not required**; the dropdown lists visited URLs. This is where lookalike domains are caught. |
| Left nav | The portal's own navigation, styled as a period sidebar. Carries the date, unread count and time controls. |
| Status bar | Left: load state (`Done`, `Opening page http://…`, `Transferring data…`). Centre: load progress. Right: zone indicator, and — Era B only — the popup blocker count. |
| Scrollbar | 16px, correct Win95 metrics. Long pages actually scroll. |

### 18.2 The two eras

The look shifts **once**, at the crash, dividing the run in two. Half the art, most of the payoff — and the change lands as a beat rather than a gradual drift the player never notices.

| | **ERA A — 1996–2000** | **ERA B — 2001–2006** |
|---|---|---|
| Feel | Windows 95/98, IE4 | Windows XP Luna, IE6 |
| Browser name | **Bubble Navigator 4.0** | **Bubble Navigator 6** |
| Title bar | Flat `#000080`, white bold 11px | Gradient `#0058EE → #3F8CF3`, rounded top 6px, soft text shadow |
| Window face | `#C0C0C0` | `#ECE9D8` |
| Bevels | Hard 1px double bevel, no radius | Softer, 2px radius on buttons |
| Chrome font | MS Sans Serif 11px bitmap | Tahoma 11px |
| Toolbar | Large icons **with text labels underneath**, 16-colour | Small icons, no labels, 256-colour with subtle gradient |
| Address bar | No `Go` button | `Go` button present |
| Page loads | **0.6–1.2s**, visible progressive paint | **0.2–0.4s**, near-instant |
| Popups | Unblocked, up to 3 at once | **Popup blocker** — status bar reports *"Popup blocked"*, volume drops ~60% |
| Page style | Tables, tiled backgrounds, WordArt, marquee, `#FF00FF` on `#00FFFF` | CSS layout, gradients, drop shadows, rounded corners, a sobered-up web |

**The switch happens at the January 2002 year turn**, one year after the crash, with no announcement beyond a dialog that reads *"Your computer has been upgraded."* Players notice on their own, and it is one of the most satisfying moments available to us for the cost of a second stylesheet.

**Implementation:** two CSS custom-property themes on a root `data-era="a" | "b"` attribute. Every chrome colour, radius, font and metric is a token. No component knows which era it is in.

### 18.3 The load, and the modem

Page loads are simulated, and they matter.

- On navigation, the status bar reads `Opening page http://…`, the progress segment fills, and the content area paints **progressively, top to bottom, in bands**, the way a 33.6k modem rendered a page.
- Images resolve in horizontal strips, low-to-high, over ~400ms.
- Era A: 0.6–1.2s. Era B: 0.2–0.4s. **The decade literally gets faster**, and the player feels the arrival of broadband without being told.
- Loads are skippable — clicking anywhere completes the paint instantly. Nobody should sit through this twice.
- The load is also free cover for any real async work, and it prevents the game feeling like a single-page app, which is exactly the illusion we're protecting.

## 19. Type, colour and metrics

### 19.1 Type

| Use | Era A | Era B | Notes |
|---|---|---|---|
| Chrome (menus, buttons, status) | MS Sans Serif 11px | Tahoma 11px | Bitmap-accurate, **no antialiasing** in Era A — `-webkit-font-smoothing: none`. This single property does more for the period feel than any other line of CSS. |
| Page body — institutional | Times New Roman 16px | Times New Roman 16px | The browser default of the era. Unstyled pages render in Times, and that is *correct*. Building societies and pension providers use it. |
| Page body — commercial | Arial / Helvetica 13px | Verdana 13px | Verdana was the web-design font of the late 90s |
| Loud / scam pages | Comic Sans, Impact, WordArt | — | Used knowingly and sparingly. See §21. |
| Numbers, tables, tickers | Courier New | Courier New | Monospace money reads as period-accurate financial data |

**Fonts must be bundled, not system-dependent.** Use a free bitmap-accurate recreation (e.g. W95FA or an equivalent MS Sans Serif clone) — do not ship Microsoft's fonts and do not rely on the player having them.

### 19.2 Colour

**System palette — Era A**

| Token | Hex | Use |
|---|---|---|
| `--face` | `#C0C0C0` | Window and control faces |
| `--face-light` | `#DFDFDF` | Inner bevel highlight |
| `--hilite` | `#FFFFFF` | Outer bevel highlight (top/left) |
| `--shadow` | `#808080` | Inner bevel shadow |
| `--dk-shadow` | `#000000` | Outer bevel shadow (bottom/right) |
| `--title` | `#000080` | Active title bar |
| `--title-inactive` | `#808080` | Inactive title bar |
| `--title-text` | `#FFFFFF` | |
| `--field` | `#FFFFFF` | Sunken input and content areas |
| `--disabled` | `#808080` | Greyed text, with `#FFFFFF` offset shadow |

**System palette — Era B:** `--face: #ECE9D8`, `--title: linear-gradient(#0058EE, #3F8CF3)`, `--hilite: #FFFFFF`, `--shadow: #ACA899`, accent `#316AC5`.

**The bevel is the whole language.** Every raised control is `border-top/left: 1px solid var(--hilite)`, `border-right/bottom: 1px solid var(--dk-shadow)`, with a 1px inset `--face-light` / `--shadow`. Every sunken field is the same, inverted. Pressed state swaps them and offsets content by 1px. Build this once as a `.bevel-out` / `.bevel-in` / `.bevel-pressed` triple and never write it again.

**Page accent colours must come from the 216-colour web-safe palette.** `#FF00FF` `#00FFFF` `#00FF00` `#FF6600` `#FFFF00` `#0000FF` `#800080`. This is a hard constraint and it enforces the period automatically — a page cannot accidentally look like 2026 if its accents can only be web-safe.

### 19.3 Chrome must never lie about state

Because the chrome is functional, it must stay honest, or the illusion collapses on the first inconsistency a player notices:

- Back is greyed on the first page. Forward is greyed unless you've gone back.
- The title bar always matches the page.
- The address bar always matches the page, **including on scam sites** — that is the point.
- Status bar says `Done` when done, and shows the target URL on link hover. **Link-hover URL preview is a red-flag delivery mechanism**: hovering the "INVEST NOW" button on a scam page reveals `http://cavendish-assets.co.uk.offers.net/…` in the status bar. Free, period-accurate, and teaches URL-checking.

### 19.4 Dual money display

Every figure appears twice: **period-accurate, and in 2026 purchasing power.**

- Period money is primary (larger, on top). 2026 money is secondary (smaller, beneath, in `--disabled` grey).
- **Global toggle** at `View > Money as 2026 £` in the menu bar, and by clicking the headline figure on `/home`. Swaps which is primary, everywhere at once, instantly.
- Applies to: net worth, salary, every expense line, every portfolio row, every offer, every shock, every number on the death card.
- Comparison year is **2026**, at the project owner's request, because it gives a present-day player a recognisable purchasing-power reference. The offline conversion is pinned to ONS CPI series D7BT: 68.8 for 1996 and 142.9 for July 2026. Period-to-1996 conversion still happens first so each simulated month retains its authored inflation path.
- **Design for the moment where a growing nominal number sits above a shrinking real one.** That is the game's thesis in two lines of type.

## 20. The notification vocabulary

Three tiers, three completely different visual objects, three different levels of intrusion. **A player should be able to tell which tier something is from across the room, before reading a word of it.**

### 20.1 Tier 1 — System dialog (blocking)

Shocks, job loss, forced sales, year turns, death. Time is **paused**.

```
        ┌──────────────────────────────────────────────┐
        │ ⚠  Bubble Navigator                      ✕   │   ← ✕ is drawn but disabled
        ├──────────────────────────────────────────────┤
        │                                              │
        │    ⚠     The boiler has failed. Your         │
        │   32px    landlord says it is your problem.  │
        │                                              │
        │           Repair cost:        £900           │
        │           You have in cash:   £120           │
        │                                              │
        │       ┌──────────────┐  ┌──────────────┐     │
        │       │ Sell to cover│  │ Use the card │     │   ← 75×23, default has
        │       └──────────────┘  └──────────────┘     │      an extra focus ring
        └──────────────────────────────────────────────┘
```

- Grey `--face`, correct bevel, navy title bar, 32×32 warning icon, MS Sans Serif body.
- Centred. The page behind dims 40% and does not respond.
- **There is never a `[ Dismiss ]` or `[ Later ]`.** Shocks are not optional. A choice must be made.
- Sound: a single system chord.
- Maximum two sentences of body copy. If it needs three, it isn't a dialog.

### 20.2 Tier 2 — Popup window (non-blocking, loud)

Unsolicited offers and ads. Time keeps running.

```
   ┌─ Cavendish Asset Management ─────────────── ✕ ┐
   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
   │▓  ★ ★  G U A R A N T E E D   4 0 %   ★ ★   ▓│
   │▓                                            ▓│
   │▓   <marquee> PLACES CLOSE FRIDAY </marquee> ▓│
   │▓                                            ▓│
   │▓        ┌────────────────────────┐          ▓│
   │▓        │   >> CLICK HERE NOW << │          ▓│
   │▓        └────────────────────────┘          ▓│
   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
   └──────────────────────────────────────────────┘
```

- Opens at a **random offset** over the content area, 300×250 or 468×280, with a minimal title bar and a **real, working `✕`**.
- Chromeless — no menu, no address bar, no status bar. `window.open(…, 'toolbar=no,location=no')` rendered faithfully.
- **Draggable.** Players will move them out of the way, and being able to is part of the texture.
- Content is authentically awful: tiled background, animated GIF, marquee, WordArt heading, a big CTA.
- Up to **3 at once** during the 1999–2000 mania. Never more — that crosses from atmospheric into unplayable.
- Auto-closes after ~45 simulated days if ignored, exactly like an expiring inbox message.
- Sound: a short modem chirp, or nothing. Never a system chord — that sound is reserved for Tier 1, and the reservation is what makes Tier 1 mean something.
- Clicking the CTA navigates the main window to the offer's site and files a copy in the inbox.
- Popup windows render only on Home. Navigating to Inbox, My Money or another
  route returns the active popup to its presentation queue; it resumes after
  the player returns Home rather than following them across the interface.

### 20.3 Tier 3 — Inbox badge (quietest)

New mail. No visual interruption at all.

- The left-nav `INBOX (3)` count increments with a single 200ms bold flash.
- The toolbar mail icon gains an envelope badge.
- Status bar briefly reads `1 new message`.
- Sound: a soft two-note chime, or silence.
- **Nothing covers content. Nothing demands a click.** A player can go a full simulated year without opening the inbox — and the design intends for some of them to try, and to learn what it cost.

### 20.4 The trust hierarchy

This matters more than it looks:

> **The system dialog channel never carries an offer. If the operating system is talking to you, it is telling the truth.**

Without this rule, everything on screen is potentially lying, the player stops reading, and the fairness contract dies. With it, the player learns a real and useful heuristic: *the more something wants your attention, the less it deserves your trust — except when it's the machine itself.*

### 20.5 The one exception, and why it's earned

**2003. Exactly once per run.** A popup that imitates a system dialog:

```
        ┌──────────────────────────────────────────────┐
        │ ⚠  Bubble Navigator                      ✕   │
        ├──────────────────────────────────────────────┤
        │    ⚠     SECURITY ALERT: Your savings are    │
        │          at risk. Immediate action required. │
        │       ┌──────────────┐  ┌──────────────┐     │
        │       │  Protect now │  │    Ignore    │     │
        └──────────────────────────────────────────────┘
```

It is the hardest scam in the game and it is fair, because it is detectable by three things the player already knows how to check:

1. **It doesn't pause time.** The clock in the left nav keeps running behind it. Every real dialog stops it.
2. **It's inside the content area**, not centred over the whole window — it's a page element pretending to be a window.
3. **Hovering its buttons reveals a URL in the status bar.** System dialogs don't have URLs.

The death card, if it gets you, says so: *"That wasn't a warning from your computer. It was an advert. The clock never stopped."*

## 21. Visual tells and the reliability contract

This is where the art direction meets §11.2, and it is the easiest thing in the whole document to break by accident.

**The temptation:** make scam sites ugly, so players learn to spot them. **The problem:** if ugly reliably means scam, the fact sheet becomes decoration, the player stops reading, and we have taught them to judge financial products by their web design — which is not merely useless in real life, it is actively dangerous.

**The resolution: the tell is real, and it inverts at the top end.**

| Looks like | Actually is | Damage if you fund it |
|---|---|---|
| **Loud** — WordArt, marquee, tiled GIF background, `#FF00FF` on `#00FFFF`, three exclamation marks | ~70% scam, ~30% legitimate-but-aggressive (a real 1999 discount broker looked like this) | Small. These are the amateur scams. They take a few hundred pounds. |
| **Plain** — unstyled Times New Roman, grey tables, no images, looks like it was typed | ~15% scam. Mostly institutional and dull-correct — the tracker, the gilt fund, the workplace pension | — |
| **Slick** — professional layout, restrained palette, custom logo, testimonials, a clean returns chart | **~35% scam — and this is where the Ponzi lives** | **Run-ending.** |

**The rules that make this hold:**

1. **The most dangerous vehicle in the game always has the best-looking website.** The Ponzi's site is the most professional page the player will see all decade. It looks like real money because that is what the money bought.
2. **At least one genuinely legitimate vehicle per run has a hideous site.** The building society's 1998 website is authentically dreadful — a tiled background, a clip-art padlock, a hit counter. It is also completely real and paying 5%. A player who dismisses on looks alone gets burned by this exactly once, and remembers.
3. **The fact sheet is identical on every page** (§22.4), so the only consistent way to evaluate anything is to open it. Style tells you where to look harder. It never tells you the answer.

*"Loud is cheap. Beautiful is expensive. Somebody paid for that website, and it wasn't out of their own pocket."* — a candidate death-card line, and a fair summary of the whole system.

## 22. The pages

Each of these is a web page rendered inside the frame from §18. Chrome is omitted below for space — assume it is always present, always functional.

### 22.1 `/home` — the dashboard

```
├──────────────────┬─────────────────────────────────────────────────────┤
│  ▸ HOME          │   BUBBLE                            SEPTEMBER 1998  │
│  ▸ INBOX    (3)  │   ─────────────────────────────────────────────     │
│  ▸ MY MONEY      │                                                     │
│                  │        Y O U R   M O N E Y                          │
│  ──────────      │                                                     │
│  SEP 1998        │              £2,140                                 │
│  ▶▶  ⏸           │              £3,574 in 2026 money                   │
│                  │                                                     │
│  ──────────      │        ┌─────────────────────────────────┐          │
│  1996 ▓          │        │ THIS MONTH                      │          │
│  1997 ▓▓         │        │   Pay in            £760   ──   │          │
│  1998 ▓▓▓  ◄     │        │   Out             − £701   ▲    │          │
│  1999 ▓▓▓▓       │        │  ─────────────────────────────  │          │
│  2000 ▓▓▓▓▓      │        │   Left over          £59   ▼    │          │
│                  │        │                  was £115       │          │
│                  │        └─────────────────────────────────┘          │
│                  │                                                     │
│                  │   ▪ NASDAQ closes above 2,000 ▪ Bank holds rates ▪   │  ← marquee ticker
├──────────────────┴─────────────────────────────────────────────────────┤
│ Done                                                    🌐 Internet    │
```

**Controls:** `▶▶` hold-to-fast-forward (4×, held not toggled — it keeps a hand on the game); `⏸ / ▶` manual pause, whose pressed state also reflects an active reading/decision pause; click the headline figure to toggle dual money; the left-nav year bars are a live progress spine showing how far you've got and quietly implying how far there is to go.

The headline number is the emotional core of the screen. When the nominal figure grows while the 2026 figure shrinks, that pairing should be given room and weight — it is the single most important piece of typography in the product. Two compact live charts sit below it: the dot-com-era NASDAQ path and the player's nominal/2026 wealth path. They use the same deterministic history that drives the ending report.

### 22.2 `/mail` — the inbox

Webmail of the era. Message list, no preview pane in Era A; preview pane appears in Era B.

```
│   ✉ BUBBLE MAIL — inbox                                    3 unread   │
│   ┌────┬──────────────────────────┬─────────────────────┬───────────┐ │
│   │    │ From                     │ Subject             │  Expires  │ │
│   ├────┼──────────────────────────┼─────────────────────┼───────────┤ │
│   │ ●  │ Cavendish Asset Mgmt     │ A once-in-a-gener…  │    2d     │ │
│   │ ●  │ Payroll @ Brightwell Ltd │ Your workplace pen… │    —      │ │
│   │ ●  │ Prize Post               │ You may have won    │    —      │ │
│   │    │ Dave                     │ mate you have to s… │    9d     │ │
│   │    │ Northmoor Building Soc.  │ Your annual statem… │    —      │ │
│   └────┴──────────────────────────┴─────────────────────┴───────────┘ │
│                                                                       │
│   [ Open ]   [ Delete ]                              [ Delete all ]   │
```

- Sortable column headers with the correct sunken-on-press bevel.
- **No visual class indicator.** Junk, legit and scam rows are identical.
- Row hover = full-row highlight in `--title` with white text, as a period list control does.
- Time runs normally in the `/mail` inbox list and pauses while an individual message is open.
- `[ Delete all ]` exists and is a real strategy. It will also delete a windfall.

### 22.3 An offer page — the external site

Reached by clicking a message or a popup CTA. **The address bar and the page style are both doing work here.**
Simulation time pauses while the player reviews the offer or follows its accept/decision flow.

```
│  Address │ 📄 http://www.cavendish-assets.co.uk.offers.net/tech ▾│ Go │
├───────────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░ tiled background ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░                                                                   ░ │
│ ░     ██▀█ CAVENDISH TECHNOLOGY OPPORTUNITIES ██▀█                  ░ │
│ ░                                                                   ░ │
│ ░     <marquee> ★ 64% IN TWELVE MONTHS ★ PLACES CLOSE FRIDAY ★ </m> ░ │
│ ░                                                                   ░ │
│ ░     Our fund has returned 64% in twelve months with a             ░ │
│ ░     guaranteed minimum of 40% per annum for early                 ░ │
│ ░     participants.                                                 ░ │
│ ░                                                                   ░ │
│ ░        [ FUND FACT SHEET ]          [ >> ACCEPT << ]              ░ │
│ ░                                                                   ░ │
│ ░     🚧 This site is under construction 🚧    visitors: 000417      ░ │
├───────────────────────────────────────────────────────────────────────┤
│ http://cavendish-assets.co.uk.offers.net/accept    ← on link hover    │
```

`[ FUND FACT SHEET ]` is present on every offer page, in the same position, at the same size, always. **This consistency is the single most important piece of UI in the game for the educational goal.**

### 22.4 The fact sheet

Identical layout for every vehicle, legit or otherwise. **The layout is the lesson** — once you know where "Regulated by" sits on the page, you check it every time. Installing that habit is what we're actually here to do.

Simulation time pauses while the sheet is open, so fees, risk, diversification and red flags can be read without clock pressure.

Rendered as a plain grey table in Times New Roman on every site, however garish the page around it — as though it were a required regulatory disclosure, because in this fiction it is.

```
        ┌───────────────────────────────────────────────────┐
        │  FUND FACT SHEET                                  │
        ├───────────────────────────────────────────────────┤
        │  Name          Technology Opportunities Fund      │
        │  Manager       Cavendish Asset Management         │
        │  ─────────────────────────────────────────────    │
        │  12-month return                    +64%          │
        │     ▁▂▃▄▅▆▇█  ← no down months                    │
        │  Annual fee                          8.0%         │
        │  Exit fee                            3.0%         │
        │  Holdings                    3 companies          │
        │  Launched                     Feb 1998            │
        │  Regulated by                   — none —          │
        │  Minimum return                "40% p.a."         │
        │  Introducer commission                 5%         │
        ├───────────────────────────────────────────────────┤
        │              [ Back ]      [ Accept ]             │
        └───────────────────────────────────────────────────┘
```

The same sheet for the tracker reads: *fee 0.4%, holdings 623, launched 1989, regulated by IMRO, minimum return — none —.* **The contrast is the teaching.** Every field appears on every sheet; empty is never blank, it is `— none —`.

### 22.5 `/money` — portfolio and allocation

```
│   MY MONEY                                          SEPTEMBER 2000    │
│   Total  £6,200        £9,933 in 2026 money                           │
│   ┌─────────────────────────────────────────────────────────────────┐ │
│   │ Cash                                    £1,240            20%   │ │
│   │ 🔓 ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             │ │
│   ├─────────────────────────────────────────────────────────────────┤ │
│   │ All-Share Tracker      ▲ 31%            £3,100            50%   │ │
│   │ fee 0.4%  ·  £38 paid to date               [ fact sheet ]      │ │
│   │ 🔓 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░             │ │
│   ├─────────────────────────────────────────────────────────────────┤ │
│   │ Technova Growth        ▲ 210%           £1,860            30%   │ │
│   │ fee 8.0%  ·  £420 paid to date  ⚠           [ fact sheet ]      │ │
│   │ 🔓 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             │ │
│   └─────────────────────────────────────────────────────────────────┘ │
│                                                       Total    100%   │
│                                    [ Reset ]   [ Rebalance Now ]      │
```

Sliders are period controls: sunken track, raised square thumb with a bevel and two grip lines, no rounded corners in Era A. `🔓` per row is a lock toggle. `[ Rebalance Now ]` opens a confirm dialog itemising every buy, sell, realised gain/loss and exit fee **before** executing.

### 22.6 The death card

The shareable artefact and the closing shot of the demo. **MVP, not stretch.**

Rendered as a full-window page — the browser chrome remains, but the title bar reads `BUBBLE — Game Over` and every toolbar button is greyed except `Home`. A small, quiet, effective touch: the machine keeps working, and you don't.

```
│   ────────────────────  G A M E   O V E R  ────────────────────       │
│                                                                       │
│                          MARCH 2000                                   │
│                                                                       │
│         You went broke the same month the bubble peaked.              │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────────┐ │
│   │  your money    ╲                                                │ │
│   │  ──────────────╲──────╲                                         │ │
│   │  the market      ╲      ╱╲      ╱                               │ │
│   │                    ╲__╱   ╲__╱                                  │ │
│   │  96   97   98   99   00   01   02   03   04   05   06           │ │
│   └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│        You never opened the inbox. You never invested a penny.        │
│                                                                       │
│        Final savings          £0        Fees paid          £0         │
│        Peak savings       £2,024        Scams funded         0        │
│        In 1996 money      £1,540        Forced sales         3        │
│                                                                       │
│                          BAND:  OUCH                                  │
│                                                                       │
│              [ Save picture ]        [ Run it again ]                 │
```

**Cause-of-death lines must be specific and earned.** A library, selected by what actually happened:

- *"You went broke the same month the bubble peaked."*
- *"Ground down. Your rent rose 71%. Your pay rose £0."*
- *"Cavendish Asset Management was never real. Two things on that fact sheet said so."*
- *"You sold at the bottom three times. That's what got you."*
- *"You paid £1,840 in fees. The tracker would have charged you £96."*
- *"The card bridged you through 2001 and then ate you in 2003."*
- *"That wasn't a warning from your computer. It was an advert. The clock never stopped."*

`[ Run it again ]` restarts instantly — no menu, no confirmation, no loading screen. This is the growth mechanic and the retention mechanic and it must be one click.

`[ Save picture ]` renders the card to PNG client-side, sized for social. The decade graph is the shareable object; the band is the brag.

## 23. Motion and sound

**Motion: everything snaps.** No easing curves, no fades, no spring physics. Windows appear instantly. Buttons press by offsetting content 1px. Menus open with zero transition. The only "animation" in the entire product is:

- Progressive page paint (§18.3)
- Animated GIFs on period pages — genuinely animated, genuinely awful
- Marquee text, real and scrolling
- The 200ms bold flash on the unread counter
- A hit counter incrementing

Modern easing is the single fastest way to destroy this illusion. If it eases, it's wrong.

**Sound**, all original recreations, none shipped from a real OS:

| Event | Sound |
|---|---|
| Boot / new run | Dial-up handshake, ~3s, skippable |
| System dialog | Single system chord |
| New mail | Soft two-note chime |
| Popup opens | Short modem chirp, or silence |
| Button press | Faint click |
| Page load complete | Nothing — the status bar says it |
| Death | Hard disk spin-down, then silence |

Everything is muteable from `View > Sounds`. Default on, because the dial-up handshake on the first boot is worth a great deal in a demo and costs almost nothing.

## 24. Asset list

Everything needed, kept deliberately small. All original work.

**Chrome (build as CSS, not images):** window bevels, title bars ×2 eras, menu bar, scrollbars, buttons, sunken fields, sliders, tabs, progress bar.

**Icons, 16×16 and 32×32, 16-colour:** back, forward, stop, refresh, home, search, favourites, mail, envelope, warning triangle, stop sign, info, padlock, globe/zone, folder, document, hit-counter digits.

**Fonts:** one bitmap MS Sans Serif clone, Tahoma, Times New Roman, Arial, Verdana, Courier New (the last four are safe web stacks).

**Period page furniture:** 6–8 tiling backgrounds, 4–5 animated GIFs (under construction, spinning coin, flashing NEW, dancing arrow, email envelope), WordArt-style heading treatments ×3, a hit counter, 3–4 "web ring" / "best viewed in" badges.

**Logos:** one per fictional firm, ~12 total. Era-appropriate — a bevelled gradient wordmark, a clip-art globe, a lion for the building society. Deliberately mediocre, except the Ponzi's, which must be genuinely good.

**Sounds:** 7 clips, per §23.

---
---

# BUILD STATUS

**Live:** https://bubble-sim.pages.dev/ · **Repo:** https://github.com/aarianmm/bubble-sim · **stack:** Vite + React + TS, static, no backend
**Last updated:** 25 Aug 2026

> Owner-supplied screenshots inform the visual pass, but the controllable local
> browser was unavailable during automated review. The integration suite drives
> the real `<App/>` with real DOM clicks through §25.5's demo path, which strongly
> checks behaviour but cannot replace a final human visual rehearsal. Recheck
> §21 rule 1 in particular: Halcyon must be the best-looking page and Northmoor
> one of the worst, because that contrast is load-bearing for the fairness contract.

The MVP was built step by step on `step/*` branches, merged into `mvp`, and
merged to `main` via PR #1. `main` deploys to the live URL above; pull requests
get their own Cloudflare preview deployment.

**This section is maintained, not archival.** CLAUDE.md rules 10–12 require every
change to update it in the same commit, every deviation to be recorded under
*Deviations*, and every problem found to be added to `KNOWN-ISSUES.md`.

## The number the design rests on

**`npm run verify` asserts that a 100% cash player goes bankrupt in March 2000**
(§6, §8.4) — the month the NASDAQ peaked. It is wired into CI and gates merges.

```
strategy             dies       expected
cash-only            2000-03    Mar 2000      ✓
accept-everything    2001-01    2000-2001     ✓
greedy               2000-01    2000          ✓
tracker-only         2003-01    2003-2004     ✓
bond-only            2004-08    KNOWN GAP
perfect play         2005-02    KNOWN GAP
```

## Done

| Step | What | Notes |
|---|---|---|
| 1–2 | Scaffold, `Math.random()` ban, type contract | Ban proven: a probe file containing `Math.random()` fails lint |
| 3 | Market table generator → `series.json` | 132 rows × 22 columns. NASDAQ 5.03× to Mar 2000, then −78% to Oct 2002. Gilts gain through the crash while the tracker loses. Halcyon has no down month, then 0 in Nov 2000 |
| 4 | Expense basket | Reproduces §8.3 to within £1 every year; **year-2000 surplus is −£0.45** — break-even, as designed. The blended rate is an output of the basket, never an input |
| 5 | The script | **47 events.** The implemented delivery mix, popup-density reduction and late-game pacing additions are documented under *Deviations* below |
| 6 | Fact sheets | All 17 vehicles, ten fields each, `— none —` never blank. Every scam carries ≥2 red flags (tested) |
| 7–8 | Month tick + headless runner | §7.3's six sub-steps in exact order; full decade runs in <50ms. The shared tick boundary records chart histories and rejects missing/non-finite prior-month prefixes instead of silently misaligning or rebaselining a series |
| 9 | **Verification gate** | Six scripted strategies asserting exact death dates. In CI |
| 10–11 | Design tokens + bevel system | Three deliberately stark milestone layers built entirely from root CSS tokens: the untouched flat Windows 95 grey in 1996; a taller, sectional IE4/Windows 98 channel-and-rebar shell in 1998; then an owner-directed glossy blue/aqua/lime millennium shell in 2000. Later milestones change bar metrics, spacing, tool orientation, framing, labels and scrollbar paint—not only colour. The 2000 art direction draws on the Frutiger Aero Archive's glass, saturated sky/water blue and optimistic green references while retaining the same functional browser inventory and shaded icon image list. Zero hex values anywhere outside `tokens.css` |
| 12 | Window chrome | Bubble Navigator title bar, working menus, toolbar, address bar, status bar, 16px scrollbars, `TooSmall` fallback. The 1996 bars remain original. 1998 adds visible coolbar grippers, Channel Bar/Internet Zone labels, a BUBBLE-branded toolbar panel, wider navigation rail, modem footer, connection/activity panes and a conventional size grip. 2000 reflows the same tools into hot-tracked horizontal glass pills, reveals IE5's Go control, adds a trusted-zone capsule, visible popup-blocker count, luminous broadband tray and glossy scrollbar |
| 13 | Navigation | Real history stack, correctly greyed Back/Forward, title + address sync, **status-bar URL preview on link hover** (§19.3's red-flag delivery mechanism) |
| 14 | Clock, year spine, time controls | 1.2s/month, hold-to-fast-forward at 4×; effective pause state reflects independent manual and context-based pauses. The base year keeps §22.1's original growing `▓` staircase and current `◄` marker. From 1998 the same mounted rows become a connected timeline with completed/current/upcoming nodes and an explicit `NOW` badge; 2000 rounds and glosses those parts. Visibility and paint remain milestone-token-driven |
| 15 | Presenter test driver (retired from deployment) | The original jump/preset/event driver remains test-only so integration coverage can land on authored beats. `App.tsx` has no import, URL unlock, About-click unlock, or render path for it; see Deviation 6 |
| 16 | Dual money display | One component; the toggle swaps every figure at once (proven by test). The comparison is now 2026 purchasing power, using an offline fixed ONS CPI D7BT reference (1996 68.8; July 2026 142.9) |
| 17 | `/home` | Headline pairing, this-month strip, year spine and fact-checked ticker, plus live accessible NASDAQ and player-wealth charts. Both charts are fed by the same pure monthly tick history used by the ending report. Their invariant SVG structure participates in the UI evolution: flat sparse plots in 1996, framed area/data-console treatment in 1998, then rounded layered fills, stronger grids, endpoint halos and luminous depth in 2000—all through milestone tokens |
| 18 | `/mail` | Junk, legit and scam rows are **byte-identical in markup** (tested) — triage is impossible from the list view; the inbox runs normally and open messages pause time |
| 19 | Offer pages + **fact sheet** | Three style bands driven by content, never by `isScam`. Halcyon (slick) vs Northmoor (plain but legitimate). Offer, fact-sheet and accept routes pause time for investigation and decisions |
| 20–22 | The three notification tiers | Dialogs have **no code path that closes them without a choice**; `DialogItem` cannot carry a vehicle, making §20.4's trust hierarchy a compile-time guarantee. Popups are draggable, capped at 3, positioned by arithmetic on the month index and pinned to Home; leaving Home defers the active snapshot so Inbox and My Money stay clear without losing the offer |
| 23 | `/money` | Sliders always total 100% under proportional redistribution. Textual `PIN` / `PINNED` controls now explain that pins hold a target only while editing, expose pressed state to assistive technology, and give stepped visual feedback. An unconfirmed draft survives Home, Inbox, Refresh and Back/Forward navigation instead of silently reverting to cash, while Reset/new run/confirmation clear it deliberately. Suspended instruments cannot receive new money directly or via another slider's proportional redistribution; sellable residuals can only move down and unsellable ones freeze. The simulation rejects non-finite, out-of-range, unknown and non-100% rebalance decisions. `[Rebalance Now]` explicitly distinguishes draft from applied money and itemises every buy, sell, realised P&L and exit fee before executing. A live target-allocation donut makes draft versus applied state visible without changing the allocator's mechanics. Allocation controls and graph retain the original flat 1996 treatment, change to a square cyan/blue console with a subtle orbit in 1998, and become a glossy rounded aqua/lime instrument with depth and stronger segment caps in 2000, entirely through root tokens with reduced-motion-safe stepped feedback. Time pauses while allocating. Real-engine route regressions prove the lifecycle, auto-pause and milestone switching |
| 24 | **Script wired to the UI** | All 47 events fire on their authored dates into the correct tier. Mail and popups now genuinely expire. Two-phase month commit keeps a blocking dialog open without breaking `tick()`'s atomicity, matching `run.ts`'s batching exactly so §25.2 determinism holds |
| 25 | Forced-sale flow | Diffs the sim's own solvency result rather than recomputing liquidation; shows what is sold and at what loss in both money terms, with `[Sell something else]` and a "nothing left to sell" ending |
| 26 | Bands + cause-of-death | `bandFor(status, deathMonth)` takes **no wealth parameter**, so §15's anti-gambling guardrail is structural. Five of six §22.6 lines proven reachable by real runs |
| 27 | Death card | Full-page, chrome retained, **every toolbar button greyed except Home**. The shared accessible decade chart compares the player's money with the NASDAQ. A deterministic personal report summarises the player's decisions, fact-sheet reading, rebalances, scam exposure and forced sales, then gives specific next-run guidance. Missed red flags are still quoted from the fact sheet the player could have read (§11.2 rule 5) |
| 28 | **One-click replay** | `engine.reset()`, no menu, no confirmation |
| 29–30 | Visual progression at Jan 1998 and Jan 2000 | Continuous play pauses at each boundary on the previous design and presents a large mandatory prompt: `We are now entering the year 1998/2000. Please update the system.` `[ Update the system ]` starts the real router load beneath a blue full-viewport installer that covers every old chrome control, shows staged installation status and preserves the frozen date. Only after loading finishes are the destination root attributes applied; a second full-screen `Welcome to 1998/2000` surface then previews the installed interface and `[ Enter the updated system ]` returns control. The three-stage sequence borrows the supplied Windows Aero reference's deep desktop-blue field, translucent framed panels, glass highlights and luminous controls. The welcome signal and progress sheen use discrete step animation with reduced-motion fallbacks. 1998 installs a markedly taller IE4/Win98 channel interface; 2000 makes the starker Frutiger Aero-inspired jump across the full shell and changes the toolbar from stacked legacy tools to horizontal glass controls. Functional control slots, handlers and ordering remain invariant; their milestone metrics and presentation deliberately do not. Forward range checks prevent a batched month render from skipping the destination update, while reset/presenter state rebuilds still apply their target milestone immediately. `?visual=1` exposes the prompt, installer and completion surfaces for review. The authored Jan 2002 computer-upgrade dialog remains narrative and no longer changes the theme; see Deviation 5 |
| — | Launch experience and chapter library | A modern product-level opening surface introduces BUBBLE through Overview, Simulation, Leaderboard, User reports and Settings tabs. Simulation explains the core loop before opening a minimal chapter library. Only 1996–2000 is playable; later cards are visibly locked presentation previews. Starting the demo runs an original deterministic stepped retro boot sequence, then mounts the existing simulation unchanged. No account, stored report, ranking or later-decade mechanic is implied |

| — | Final integration pass | §25.5's demo path walked beat by beat; `DEMO.md` written as the operator's card |

### MVP complete at Step 28 (§26.1), with the owner-directed launch/reporting expansion. 379 tests green.

Seven bugs were found and fixed during integration, all worth knowing about:

- **`mvpDeferred` events were being skipped entirely.** §26.1 wants them
  *delivered* without their deferred mechanic, not removed from the run — the
  credit-card offers and the fake-dialog scam are part of the run's texture even
  when they cannot be funded. Now delivered, with a test asserting that
  "accepting" the deferred card never creates working debt.
- **Two cause-of-death lines overclaimed.** "You went broke the same month the
  bubble peaked" fired anywhere in H1 2000, and "you sold at the bottom three
  times" fired on almost any death — because the solvency check always attempts
  one liquidation before declaring the run over. Both now require what they
  assert. These are the closing shot of the demo; a false statement there is
  expensive.
- **The death card's fee line always read `£0`.** §9.3's *"You paid £1,840 in
  fees. The tracker would have charged you £96"* — the line §9.3 calls better
  financial education than a tutorial — was permanently wrong on every real
  playthrough. `trackerCounterfactualFees` was accumulated only by the headless
  runner's own loop, and the live engine calls `tick()` directly. Now maintained
  in `tick()`, with a determinism test driving identical decisions through both
  paths to prove they cannot drift (§25.2).
- **Money allocation drafts vanished on navigation.** The sliders correctly
  prepared a rebalance, but the draft lived inside the routed page component;
  Home, Inbox or Refresh unmounted it and silently reconstructed 100% cash.
  Draft ownership now sits above routed content, the page states plainly when
  money has not moved, and a real-engine regression proves that confirmation
  updates both cash and the selected holding across later navigation.
- **Suspended funds and malformed rebalance inputs bypassed the allocation
  contract.** A collapsed vehicle could still receive new cash through a slider
  or a direct replay decision, and the simulation trusted totals/ranges that the
  normal UI happened not to emit. The editor now freezes or caps suspended rows,
  excludes them from proportional increases, and the pure simulation validates
  every rebalance before applying it. The accept-everything verification fixture
  was normalised to a real 100% allocation instead of relying on historical
  over-allocation; it still funds a scam and dies in the authored 2000–2001 band.
- **A literal reading of the former presenter workflow would have broken the
  demo on stage.** Its jump-to-date replayed from Jan 1996 with *no* decisions,
  so moving between beats silently discarded every earlier choice. The panel no
  longer ships; `DEMO.md` uses only the normal play/fast-forward controls.
- **The live browser never recorded wealth or market history.** Only the
  headless runner appended those points, while the mounted engine calls the pure
  monthly tick directly. The old ending chart was therefore empty during a real
  playthrough. History ownership now lives in `tick()`, which records exactly
  one wealth and indexed NASDAQ point per committed month; `run.ts`, Home and
  the ending report all consume that same source. A regression prevents the
  headless and browser paths from drifting again.

The 25 Aug correctness review then closed four more implementation issues:

- **Draft reconciliation could contradict a Cash pin or erase the whole draft.**
  It now repairs only invalid rows, preserves feasible pins and valid targets,
  and visibly unpins a row only if state constraints make that target impossible.
- **The 2000 token layer hid the popup-blocker count.** The final milestone now
  exposes the still-mounted status cell, and the exact token is regression-tested.
- **Toolbar Mail's forced accessible label hid its unread badge and arrival
  notice.** Native descendant naming now includes all visible Mail state.
- **Batched month changes could miss a milestone update.** Forward range checks
  select the destination milestone; state-rebuild keys retain immediate
  presenter/test landing. The inaccurate bundle-check claim in Deviation 6 was
  corrected to describe the production-render test that actually exists.

The graph merge review then closed two more issues while this popup branch was
updated from `main`:

- **Missing chart-history prefixes failed silently.** `tick()` now rejects
  incomplete or non-finite wealth and NASDAQ history before applying a month,
  while January alone uses the documented market baseline of 100.
- **Chart axis dates duplicated calendar arithmetic.** Both year-grid and label
  positions now use the shared `monthIndex(year, 1)` helper, so they cannot
  drift from `START_YEAR`.
- **The isolated forced-sale fixture carried impossible empty histories into
  September 2001.** It now supplies valid prior-month prefixes before invoking
  the real tick; the production engine was already chronological.

Two §25.5 details worth knowing before rehearsing:

- **"Move to 70% tracker / 30% cash" is two slider drags, not one.** With
  Northmoor already funded, dragging Fenwick alone strands the balance in
  Northmoor rather than cash, because §12.2 redistributes proportionally by
  current weight. Drag Northmoor to 0% first. Locked in by a regression test.
- `DialogCopy.title` is authored but never rendered — §20.1's own mock-up fixes
  the dialog titlebar to "Bubble Navigator". Dead content, not a bug.

## To be done

### Known gaps inside the MVP — see `KNOWN-ISSUES.md`

1. **Perfect play cannot survive the decade** (§8.5, §26.1). Deprioritised by the
   project owner, not fixed. This is a spec arithmetic gap, not an implementation
   bug: across the decade, pay minus expenses is −£5,325, job loss −£2,280 and
   shocks −£5,900 against +£6,300 of windfalls, leaving **£7,205 that market
   growth must cover** — unreachable from a pot that peaks near £5–7k and is drawn
   down from 2001 onward. Removing every shock entirely still does not clear it,
   so §14.1's shock lever is provably not the binding constraint.
   **The fix is to raise the windfalls** (§8.5 writes them as "~" figures).
   Critically, a cash-only player never opens the inbox and so never receives a
   windfall — windfall size cannot move the March 2000 death date. Target a
   *narrow* survival; §15 bands by date only, so a thin win plays far better.
2. **Bond-only outlives tracker-only** (§9.1), inverting §8.4's illustrative
   table. The cause is real: a player drawing down through the 2000–2002 crash is
   hurt by the tracker and protected by a fee-free 5.2% bond. Decide whether to
   teach §9.1's lesson through death-card copy or to steepen the bond's glide path.
3. **Index levels are reconstructed, not archival** (§9.2). §25.4 requires an
   offline build, so nothing is fetched. Crash timing, magnitude and ordering are
   real; month-to-month texture between documented anchor points is interpolated.
   Stated plainly in `series.json`'s `meta.note`. Drop in real month-end closes
   before the pitch.
4. **Vitest 2.1.9 has a critical UI-server advisory** (§25.4). It is a
   development-only dependency and its UI server is neither used nor shipped, so
   the static game is not exposed. Upgrade to Vitest ≥3.2.6, reconcile the Vite
   peer dependency and refresh the lockfile; see `KNOWN-ISSUES.md` for the audit
   evidence.
### Outside the MVP boundary — §26.1, priority-ordered

| Step | What | Status |
|---|---|---|
| 31 | Credit card / debt | Not built. The two credit offers are in the script, marked `mvpDeferred` |
| 32 | Scam 6 — the fake dialog (§20.5) | Not built. Ships as an ordinary loud popup. Scam 5 (Restitution) *is* built. `Popup.tsx` carries the `imitatesDialog` seam and its three required tells are documented |
| 33 | Social mail (Dave) | Content authored; both messages are in the script |
| 34 | Progressive page paint + modem timing | Not built. Loads are instant |
| 35 | Sound | Not built. Silent |
| 36 | Period page furniture — GIFs, tiled backgrounds, hit counters | Partial. Hit counters and tiled backgrounds exist; no animated GIFs |
| 37 | Death-card PNG export | Not built. Screenshot it |

### Not being built — §26.3

Randomised runs · a playable second decade · generative scams · live leaderboards · shared-seed
play-a-friend · student-loan opening · a full Windows desktop · accounts or saves ·
mobile.

## Deviations from this document, and why

1. **The script carries 47 events, not 42.** §14.2's printed table contains 46 rows
   against its own headline of "42 authored events" — the headline does not
   reconcile with the table beneath it. The table was treated as authoritative
   (per §14.2: "if an event is not in this table, it does not happen"), plus the
   three vehicle additions in point 2, less six expendable standalone junk events.
   Three additional companion junk windows were removed without changing their
   parent Meridian and Vertex events. A subsequent pacing pass added three inert,
   financially educational Mail items and one non-actionable bank-phishing popup.
   The eight current POP events each produce exactly one window.
2. **Three legitimate offers were added; one remains a popup.** §14.2's headline claims 17 offers
   with an 8-popup split, but its table lists only 5 popup offers and **all 5 are
   scams**. That directly contradicts §10 rule 1 — "a real tracker fund advertises
   by popup too. Skew, don't determine" — and would teach players that popups are
   always scams, which is wrong in life and fatal to §11.2's fairness contract.
   The three §9.1 vehicles with no delivery anywhere were used: the high-fee tech
   fund (loud but entirely legitimate — §21's central lesson made concrete), the
   blue-chip single stock, and the gilt fund. Technova remains the non-scam popup;
   the sober Granville and Kingsley solicitations arrive through Mail. The popup
   channel therefore still cannot be used as a reliable scam classifier.
3. **Restitution Partners moved from Apr 2001 to Apr 2000.** §14.3 rule 2 requires
   every windfall to be followed by a scam within 90 days and flags the Feb 2000
   windfall as "too slow", explicitly authorising a scam being moved into mid-2000.
   Arriving one month after the crash strengthens its "aimed at whoever just lost
   money" framing.
4. **The Aug 1998 shock is £500, not §8.4's £1,100.** With the real basket and the
   Nov 1999 job loss, £1,100 killed the cash player in January 2000. §14.1 names
   shocks as the difficulty lever and permits £250–£1,600. Below roughly £635 the
   March 2000 death date is robust.
5. **The visual progression now lands at Jan 1998 and Jan 2000, not once at Jan
   2002.** The project owner explicitly requested visible improvement at both
   earlier milestones while preserving every function, icon and button. The
   shell therefore derives `data-era` and `data-ui-year` from the current month,
   and all three designs alter CSS tokens only. The stronger 1998 treatment is
   grounded in contemporary Windows 98 gradient-caption and IE4 coolbar imagery.
   The initial 2000 treatment followed IE5/IE5.5 and Windows 2000 closely, but
   the owner found that change too subtle and explicitly requested a broader,
   starker treatment based on the Frutiger Aero Archive. The shipped milestone
   therefore brings that later visual language forward: glossy blue/aqua glass,
   optimistic green highlights, soft rounded controls and brighter layered
   panels now cover every chrome region. This deliberately departs from §18.2's
   period-exact Windows XP/IE6 palette in favour of the requested visual arc.
   The shaded icon group remains in the same eight SVG slots and handlers.
   After further owner review, the later bar metrics are deliberately no longer
   identical: 1998 grows the rebar bands and sidebar, while 2000 rearranges the
   same toolbar children from stacked icon/label controls into wider horizontal
   glass buttons and reveals the already-mounted Go control. This is a visual
   layout departure only; control order, accessible names, handlers and game
   behaviour remain unchanged. The 1996 grid remains exactly original.
   In continuous play, each boundary now pauses before changing: a large system
   prompt announces the incoming year and requires `[ Update the system ]`; a
   blue installation screen then covers the complete viewport under an
   engine-level clock hold. Only the completed load applies the next installed
   theme, after which a second full-screen welcome displays the new visual
   language and `[ Enter the updated system ]` returns control. A separate
   temporary `data-ui-target` attribute styles all three phases without changing
   the live chrome early. The sequence takes glass framing, deep blue desktop
   space and luminous layered panels from the owner's supplied Windows Aero
   reference image while remaining code-native and fully offline. At the
   owner's request, the welcome signal and the 2000 loading sheen are narrow
   exceptions to §23's animation list: both use hard `steps()` timing, no easing,
   and stop under `prefers-reduced-motion`. This deliberately replaces §18.2's
   "no announcement" direction at the owner's request. Test-only state loads
   bypass the sequence and apply the target milestone immediately.
   §18.2's Jan 2002 computer-upgrade dialog remains authored and resolves
   normally, but is now narrative rather than the visual trigger. No simulation
   rule, event, route, control or handler changes with the presentation.
6. **Presenter Tools are not shipped.** At the project owner's request, this
   departs from §25.4 and Step 15: `?dev=1` is ignored, repeated About clicks do
   not unlock anything, and `App.tsx` imports neither the Presenter dialog nor
   its notification harness. The old component remains a test-only driver for
   fast integration coverage, but production builds tree-shake it and its CSS;
   the deployment exposes only public gameplay controls and `?visual=1` visual
   QA. A production-`<App/>` regression verifies that `?dev=1` renders no
   Presenter UI; the build itself is not currently scanned for that text.
7. **The sidebar year spine evolves after 1996 instead of retaining §22.1's
   growing block staircase for the full decade.** The owner requested that the
   base year stay original, then gain a stronger design treatment in 1998 and
   2000. Both the legacy `▓` / `◄` presentation and the later timeline remain in
   the invariant DOM. Root tokens expose the exact staircase in 1996; 1998 and
   2000 switch to a continuous rail, completed/current/upcoming nodes, checks
   and a labelled `NOW` badge. The later 2000 layer adds rounded blue/green glass
   treatment. All eleven years and the same live clock source remain, with no
   simulation timing or navigation behaviour change.
8. **A modern launch shell and locked chapter library now sit outside the period
   browser.** The owner requested a contemporary introduction, tutorial-style
   Simulation tab, chapter picker and dramatic retro hand-off. This departs from
   §18's assumption that the maximised faux browser is the entire product
   surface. The exception ends before gameplay: selecting the only unlocked
   1996–2000 card runs a deterministic `steps()` boot animation and then mounts
   the existing browser, routes and simulation without altering them. The
   Leaderboard, User reports and Settings tabs explicitly describe unavailable
   local/demo functionality; they do not add accounts, persistence, rankings or
   a second playable decade.
9. **Purchasing-power comparisons use 2026 rather than 1996.** The owner asked
   for a present-day reference that is more meaningful to current players. The
   implementation first applies the existing month-specific conversion back to
   1996, then multiplies by the fixed ONS CPI D7BT ratio 142.9 / 68.8 (July 2026
   versus 1996). The constants are bundled so the deterministic offline build
   never depends on a live statistics service.
10. **The visual market comparator is the NASDAQ Composite.** The request named
   FTSE or S&P as examples, but this chapter's authored calibration and ending
   are explicitly tied to the March 2000 NASDAQ peak. Index values remain the
   reconstructed offline series disclosed in known issue 3. Using one shared
   series on Home and the ending report avoids presenting two competing bubble
   stories.
11. **Detailed reading and decision surfaces pause time.** The original hybrid-pacing
   wording treated every offer interaction as non-blocking. Authored Mail and popup
   arrivals still do not block, and their expiries still create triage pressure, but
   playtesting showed that leaving the clock running while reading an individual
   message, comparing a fact sheet, reviewing an offer or allocating in My Money
   discouraged the careful financial behaviour the game is meant to teach. Home is
   the only normal running surface; manual pause intent remains independent.
12. **Popup presentation is pinned to Home.** §20.2 originally described a popup
   over the browser content area without restricting which page could sit beneath
   it, and the first route-aware implementation treated Inbox and My Money as
   presentation surfaces. The project owner asked that those focused reading and
   allocation pages remain uncluttered. Leaving Home now returns the active popup
   snapshot to the existing queue and holds its gap timer; returning Home resumes
   it without generating a dismissal decision, dropping the CTA or changing the
   authored simulation event.

---
---

# PART IV — BUILD

## 25. Technical

**Stack: React + TypeScript, static web.** Vite + React + TS + Tailwind (or plain CSS modules — the bevel system is easier as hand-written CSS), deployed static to Cloudflare Pages or Vercel. **No backend.** The whole decade is a local deterministic simulation; the death card renders client-side.

Rationale: nothing to fail on stage, no latency, no auth, no cold start, no CORS surprise in front of a judge. Nothing in the demo scope needs a server, and nothing should acquire one — see §25.4 on running fully offline.

**Viewport:** landscape, desktop, minimum 1024×768. Below that, show a period-correct *"This site is best viewed at 1024×768 or higher"* page — which is both a genuine responsive fallback and the funniest possible one.

### 25.1 Architecture

```
  /data          historical series as static JSON — CPI components,
                 rent index, FTSE/S&P/NASDAQ/gilt monthly returns.
                 Loaded once at boot. Never generated at runtime.

  /sim           pure functions. No React, no DOM, no Date.now(),
                 NO RANDOMNESS ANYWHERE.
                 tick(state, month) → state
                 Fully determined by (script, decisions).
                 This is the part that gets unit tested.

  /script        THE RUN. §14.2 as data — one array of dated
                 events, one row per beat. The largest and most
                 important content file in the project. Editable
                 by a non-programmer. This is where the game
                 actually lives.

  /content       message bodies, fact sheets, offer page templates,
                 shock copy, death-card lines. Referenced by id
                 from /script.

  /chrome        the browser shell — window, menus, toolbar, address
                 bar, status bar, dialogs, popups. Era-themed via
                 CSS custom properties on data-era.

  /pages         the websites. Each is a component rendered into the
                 chrome's content area, with a URL and a title.

  /ui            glue. Owns no game logic.
```

**Hard rule: the simulation is a pure, headless, testable module with no React dependency.** Verification runs it headlessly against a handful of scripted strategies (§25.3) — you cannot tune this game by playing it by hand, and there isn't time to try.

**Hard rule: `Math.random()` does not appear anywhere in the codebase.** Add the lint rule in Step 1 (§26). Every "random" thing a player sees — popup position, which junk mail arrives, the hit counter — is either authored in `/script` or derived from the current month. An RNG that sneaks in is a demo that behaves differently on stage than it did in rehearsal, and that is the single worst outcome available to us.

**Second hard rule: no component knows which era it is in.** Every colour, radius, font, metric and duration is a token on `:root[data-era]`. The 2002 switch must be one attribute change.

### 25.2 Determinism

There is one script and no seed, so determinism is free rather than engineered:

- A run is fully described by `(the script, the ordered list of player decisions)`.
- Same decisions → same outcome, always, on any machine.
- A bug report is a list of clicks. A regression test is a list of clicks plus an expected death date.
- **Record every decision with its timestamp.** A run replay is then just the decision list fed back in at speed — free debugging, free playtest analysis, and if there's time, a free "watch what I did" mode on the death card.

### 25.3 Verification, not calibration

With a hardcoded run this is much cheaper than a generated game would need — but it does not go away, because §8's arithmetic still has to hold. What was a Monte Carlo harness is now a **fixed set of scripted playthroughs, run headlessly, asserting exact dates.**

```
  npm run verify

  strategy                               dies       expected   ✓
  ─────────────────────────────────────────────────────────────
  cash-only          (accept nothing)    Mar 2000   Mar 2000   ✓
  accept-everything  (fund everything)   Dec 2000   2000–01    ✓
  bond-only          (Northmoor only)    Sep 2001   2001–02    ✓
  tracker-only       (Fenwick only)      May 2004   2003–04    ✓
  perfect play       (tracker, no scams) survived   survived   ✓
  greedy             (always the hottest)Nov 2000   2000       ✓
```

Six strategies, each a hardcoded decision list run against the §14.2 script. Completes in under a second. **Wire it into CI and gate merges on it** — because the failure mode of hand-authored content is that a late content edit nudges a shock, the cash-only path silently slips to 2002, and nobody notices until a judge is watching.

Also assert, as unit tests: every scam has ≥2 red flags on its fact sheet (§11.2); every event in `/script` resolves to real content in `/content`; every fact sheet has all ten fields populated; no two decision events share a month except the authored Mar 2000 pair.

### 25.4 Presenter tools (retired)

The deployed application has no Presenter Tools UI. `?dev=1` is ignored and
Help > About is only an About action, regardless of click count. Rehearsal uses
the same play, pause, hold-to-fast-forward and replay controls available to a
player. A test-only driver may retain date/preset/event helpers for fast
integration coverage, provided it is not imported into the production graph.

Plus, for safety: **the build must work fully offline.** No CDN, no font fetch, no analytics, no telemetry. Everything bundled. Assume the venue wifi fails, because at some point it will.

### 25.5 The demo path

The operator's script — the known-good playthrough, rehearsed, ~8 minutes with fast-forward.

| Beat | Do this | It shows |
|---|---|---|
| 1996 | Open the Northmoor mail, open the fact sheet, accept, allocate 100% | The inbox, the fact sheet, the sliders — all three surfaces in 40 seconds |
| Feb 1997 | Take the windfall. **Open the Meridian popup and read it aloud.** Decline | The scam mechanic, with a scam obvious enough to narrate |
| Jul 1997 | Accept the tracker, move to 70% tracker / 30% cash | The correct play, made to look boring on purpose |
| Sep 1997 | Take the £600 shock from cash | Shocks, and why cash matters |
| Jun 1999 | **Open Halcyon Reserve. Show the beautiful site. Show the fact sheet. Decline.** | The whole thesis of §21 in thirty seconds — this is the money shot of the demo |
| Jan 2000 | Let the year-turn dialog play | Living costs have caught up with pay and will now rise faster |
| Mar 2000 | Let the crash land, then the boiler. Cover it by selling | The forced sale, at the bottom |
| Nov 2000 | Halcyon collapses — **you dodged it** | Payoff for the 1999 decision. Land this and the judges have understood the game |
| Fast-forward | Jump to Dec 2006 | |
| End | The death card | The shareable artefact, the closing shot |

**Rehearse it end to end at least three times.** The failure mode of a scripted demo is not the software, it is the operator hunting for a button.

## 26. Scope and build plan

Built by agents, fast, in parallel where possible. So this section is not a schedule — it is an **ordered list of discrete steps, each with a file list and a verifiable done-condition.** Time estimates are deliberately absent; dependencies and gates are what matter.

### 26.1 The MVP boundary

**The MVP is Steps 1–28.** That is the irreducible game: if any one of these is missing, what's left is not a smaller BUBBLE, it's a different and worse thing.

| The MVP is exactly this | Why it cannot be cut |
|---|---|
| The month tick, real basket, real market table | Without it the eagle isn't real and §8 is a lie |
| The §14.2 script as data, all 42 events | This *is* the run. No script, no game |
| Verification suite, cash-only dying Mar 2000 | The one number the whole design rests on |
| The browser frame — Era A, functional Back/Forward/address bar | The entire visual thesis, and the address bar is a mechanic (§17.1) |
| `/home`, `/mail`, `/money`, offer pages | The three surfaces plus the place offers live |
| The fact sheet, one layout, every vehicle | The teaching surface. Cut this and the game teaches nothing |
| Blocking dialogs + non-blocking popups + quiet badge | The three-tier trust hierarchy (§20.4) |
| Allocation sliders + rebalance confirm | The strategy surface |
| Shocks + forced-sale flow | The difficulty engine |
| Dual money display | The inflation lesson |
| 4 scams, fairness contract satisfied | The scam mechanic needs the Ponzi, the pump, and two cheap ones |
| Death card + bands + one-click replay | The closing shot of the demo |
| Continuous public-control demo path | The performance exercises the same app judges receive |

**Everything below is outside the MVP.** Each is a discrete, additive layer that touches little else — none of them is load-bearing, and the game is demonstrable without any of them.

| Added after MVP | Steps | What it buys | What it costs if skipped |
|---|---|---|---|
| **Era B** — the Jan 2002 visual switch | 29–30 | The decade visibly passing; one of the most satisfying beats available | Run ships in Era A throughout. Nobody who hasn't read this doc will know |
| **Credit card / debt** | 31 | A real temptation, and compound interest running in reverse | The run just ends at £0. Loses a lesson, breaks nothing |
| **Scams 5 and 6** (Restitution, fake dialog) | 32 | Mail can't be trusted either; the hardest scam in the game | 4 scams still covers loud/slick/pump/Ponzi |
| **Social mail** (Dave) | 33 | FOMO with a human face | Offers still arrive; peer pressure goes unmodelled |
| **Progressive page paint + modem timing** | 34 | The decade audibly getting faster; the strongest single period cue | Instant loads. Feels like an SPA, which is the illusion we're protecting |
| **Sound** | 35 | The dial-up handshake is worth a lot in a demo for very little work | Silent. Fine |
| **Period page furniture** — GIFs, tiled backgrounds, hit counters, web-ring badges | 36 | §21's visual-tell system gets its full range | Scam pages read as merely plain rather than loud. Weakens but doesn't break the tell |
| **Death-card PNG export** | 37 | The share artefact actually shareable | Screenshot it |

**If time runs out, stop after any step.** The list is priority-ordered — every step leaves the build in a demonstrable state, and no step depends on a later one.

### 26.2 Rules for the agents building this

1. **One step, one commit, one verify command.** A step is not done because the code exists. It is done when its stated check passes.
2. **Do not start a step whose dependencies aren't green.** Dependencies are listed per step.
3. **Steps marked ∥ can run concurrently** with others in the same phase, by separate agents, without conflict. They touch disjoint files.
4. **Stay inside your step's file list.** If a step seems to require changing a file outside it, that's a signal the step boundary is wrong — say so rather than widening the change silently.
5. **`Math.random()` is banned** (§25.1). The lint rule lands in Step 1; do not disable it.
6. **Content and code are separate steps on purpose.** A content agent can write all 17 offers while a code agent builds the fact-sheet component, because the interface between them is a typed id.
7. **Never edit `/data/series.json` by hand.** It is generated. If a number looks wrong, fix the generator.
8. **After Step 9, `npm run verify` must stay green.** Any step that reddens it is not done, whatever else it achieved.

---

### PHASE 1 — Simulation. No UI.

*Gate: nothing in Phase 2 starts until Step 9 is green.*

| # | Step | Files | Done when |
|---|---|---|---|
| **1** | Scaffold. Vite + React + TS. Vitest. ESLint with `no-restricted-properties` banning `Math.random`. Plain CSS (not Tailwind — the bevel system is hand-written CSS and utility classes fight it). | `package.json`, `vite.config.ts`, `.eslintrc`, `tsconfig.json` | `npm run lint && npm run test` passes on an empty suite; a file containing `Math.random()` fails lint |
| **2** | Types. `GameState`, `Vehicle`, `Holding`, `ScriptEvent`, `Decision`, `FactSheet`, `Band`. No logic. | `src/sim/types.ts` | Compiles; every §9.1 vehicle tier and §10.1 message class is representable |
| **3** ∥ | Market table generator. Pull real monthly series 1996–2006 (FTSE All-Share, S&P 500, NASDAQ, UK gilts, base rate) plus CPI components and a UK private-rent index. Emit 132 rows × one column per vehicle, applying authored fees and the Halcyon collapse. | `scripts/build-series.ts` → `src/data/series.json` | `series.json` has 132 rows; every month has every vehicle; Mar 2000 → Oct 2002 shows the real drawdown |
| **4** ∥ | Expense basket. §8.1 starting values, §8.2 weights and growth rates. Pure function `expensesFor(month)`. | `src/sim/basket.ts` | 1996 = £645, 2000 = £760 ±£3, 2006 = £980 ±£5 (§8.3) |
| **5** ∥ | The script. §14.2 encoded as a typed array — 42 events, exact dates, channel, class, content id. | `src/script/timeline.ts` | 42 events; counts match §14.2 totals (17 offers, 6 scams, 9 shocks, 3 windfalls, 8 junk, 2 credit) |
| **6** ∥ | Fact-sheet data for all 17 vehicles, all ten fields populated, `— none —` never blank. | `src/content/factsheets.ts` | Unit test: every sheet has 10 fields; every scam has ≥2 red flags from §11.3 |
| **7** | The month tick. §7.3, in that exact order. Pure, no React, no `Date`. | `src/sim/tick.ts` | Unit tests for each of the six sub-steps in isolation |
| **8** | Headless runner. `run(script, decisions) → RunResult` with death date, band, and the §15 secondary stats. | `src/sim/run.ts` | Runs the full decade in <50ms |
| **9** | **GATE — verification suite** (§25.3). Six scripted strategies asserting exact death dates. Wire into CI. | `src/sim/verify.test.ts`, CI config | `npm run verify` green, **cash-only dies Mar 2000**, tracker-only reaches 2003–04, perfect play survives |

> **If Step 9 will not go green, stop and fix the basket or the shock sizes before writing a single line of UI.** Everything after this point is a view of numbers that have to already work.

---

### PHASE 2 — The frame.

| # | Step | Files | Done when |
|---|---|---|---|
| **10** | Design tokens. Every §19.2 colour, plus fonts, radii, metrics, durations, as CSS custom properties on `:root[data-era="a"]`. Era B block written but unused. | `src/chrome/tokens.css` | No hex value appears anywhere outside this file |
| **11** | Bevel primitives + bundled fonts. `.bevel-out`, `.bevel-in`, `.bevel-pressed`. `font-smooth: none` on chrome text. | `src/chrome/bevel.css`, `src/assets/fonts/` | A visual test route renders a button, a sunken field and a pressed button correctly at 1× |
| **12** | Window chrome. Title bar, menu bar with working dropdowns, toolbar, address bar, status bar, 16px scrollbars. Static — no navigation yet. | `src/chrome/Window.tsx` and children | Renders §18.1 at 1024×768 with no layout shift; menus open and close |
| **13** | Navigation. URL state, history stack, functional Back/Forward with correct greying, title-bar sync, status-bar URL preview on link hover (§19.3). | `src/chrome/router.tsx` | Back is greyed on first page; navigating three pages and going back twice lands correctly; hover shows target URL |
| **14** | Left nav + clock + time controls. Date, unread count, year progress spine, `⏸/▶`, hold-to-fast-forward at 4×. | `src/chrome/Nav.tsx` | Time advances at ~1.2s/month; holding fast-forward gives 4×; the control reflects effective manual/context pause state |
| **15** | **Test-only demo driver, early.** Jump-to-date, force-event and state presets for integration coverage only; never imported by the deployed app. | `src/dev/Presenter.tsx` | Tests can land on Mar 2000; production `?dev=1` exposes no panel |

> **Step 15 is test infrastructure only.** It keeps integration checks fast
> without creating a hidden control surface in the shipped application.

---

### PHASE 3 — Pages and notifications.

*Steps 16–19 are ∥ with 20–23 — different agents, disjoint files.*

| # | Step | Files | Done when |
|---|---|---|---|
| **16** ∥ | Dual money display. One component, one global toggle in `View >` and on the `/home` headline. | `src/ui/Money.tsx` | Every figure renders both; toggle swaps primary everywhere at once |
| **17** ∥ | `/home`. §22.1 — headline, this-month strip, year spine, news ticker. | `src/pages/Home.tsx` | Matches §22.1 at 1024×768; headline toggles dual money on click |
| **18** ∥ | `/mail`. §22.2 — list, sortable headers, expiry column, row select, open, delete, delete-all. No class indicator on rows. | `src/pages/Mail.tsx` | Junk, legit and scam rows are pixel-identical; the inbox runs normally and an open message pauses time |
| **19** ∥ | Offer page template + **fact sheet component**. Fact sheet identical on every page, same position, same size, Times New Roman table. | `src/pages/Offer.tsx`, `src/ui/FactSheet.tsx` | Renders any of the 17 vehicles from Step 6 data; offer, fact-sheet and accept routes pause time |
| **20** ∥ | Dialog system. §20.1 — blocking, dims the page, pauses time, no dismiss, max two buttons. | `src/chrome/Dialog.tsx` | Time is frozen while open; there is no code path that closes one without a choice |
| **21** ∥ | Popup system. §20.2 — random-free positioning, draggable, real `✕`, chromeless, up to 3 concurrent, auto-close after 45 sim days. | `src/chrome/Popup.tsx` | Three open at once in May 1999; closing does not delete the inbox copy |
| **22** ∥ | Inbox badge tier. §20.3 — counter increment, 200ms flash, status-bar line, no content occlusion. | `src/chrome/Nav.tsx`, `src/chrome/StatusBar.tsx` | New mail never covers content and never steals focus |
| **23** | `/money`. §22.5 — slider rows, lock toggles, live £ preview, 100% enforcement, `[Reset]`, `[Rebalance Now]` with itemised confirm dialog. | `src/pages/Money.tsx` | Time pauses while allocating; sliders always total 100%; confirm itemises every buy, sell, realised P&L and exit fee before executing |
| **24** | Wire the script to the UI. Events fire on their §14.2 dates into the right channel. | `src/sim/scheduler.ts` | Jump to any date in the timeline and the correct event fires in the correct tier |
| **25** | Forced-sale flow. §12.3 — shortfall detection, what-will-be-sold dialog with loss in both money terms, `[Sell something else]`. | `src/ui/ForcedSale.tsx` | Sep 2001 with £120 cash and a £900 shock produces the §12.3 dialog |

---

### PHASE 4 — Endgame. Completes the MVP.

| # | Step | Files | Done when |
|---|---|---|---|
| **26** | Bands (§15) + cause-of-death selection from the §22.6 line library, chosen by what actually happened. | `src/sim/bands.ts`, `src/content/deathlines.ts` | Each of the six §22.6 lines is reachable by a scripted playthrough |
| **27** | Death card. §22.6 — full page, greyed toolbar, decade graph, stats block, band. | `src/pages/DeathCard.tsx` | Renders for every band; the decade graph shows player line vs market line |
| **28** | **One-click replay.** No menu, no confirm, no loading screen. | `src/pages/DeathCard.tsx` | Click → Jan 1996, fresh state, under 200ms |

> **MVP complete at Step 28.** Stop here and you have a demonstrable game. Rehearse §25.5 against this build before adding anything.

---

### PHASE 5 — Beyond MVP. Additive, priority-ordered, each independently cuttable.

| # | Step | Files | Done when |
|---|---|---|---|
| **29** | Era B token set. §18.2 — XP palette, Tahoma, rounded, gradient title bar, `Go` button, popup blocker in status bar. | `src/chrome/tokens.css` | Setting `data-era="b"` changes every chrome surface; **no component file is touched** |
| **30** | The Jan 2002 switch, and the *"Your computer has been upgraded."* dialog. | `src/script/timeline.ts` | Crossing Jan 2002 flips the era once, with the dialog |
| **31** | Credit card. §13 — offer, limit, 0%-then-29.8%, `[Put it on the card]` on shortfalls, compounding red bar. | `src/sim/debt.ts`, `src/ui/Card.tsx` | Verify suite gains a card-user strategy; §25.3 stays green |
| **32** | Scams 5 and 6 — Restitution Partners (mail) and the fake dialog (§20.5), including its three tells: clock keeps running, sits in the content area, buttons have URLs. | `src/content/`, `src/chrome/Popup.tsx` | The fake dialog is distinguishable by all three tells; fairness test still passes |
| **33** | Social mail — Dave, both messages. | `src/content/messages.ts` | — |
| **34** | Progressive page paint + modem timing. §18.3 — banded top-to-bottom paint, 0.6–1.2s Era A, 0.2–0.4s Era B, click-to-skip. | `src/chrome/PageLoad.tsx` | Era A loads are visibly slower than Era B; clicking completes instantly |
| **35** | Sound. Seven clips per §23, original recreations, muteable from `View >`. | `src/assets/audio/` | Dial-up plays on new run; the system chord is used by dialogs and *nothing else* |
| **36** | Period page furniture. Tiled backgrounds, animated GIFs, WordArt headings, hit counters, web-ring badges — applied per §21's three style bands. | `src/assets/`, offer page templates | Halcyon is the best-looking page in the build; Northmoor is one of the worst |
| **37** | Death-card PNG export, client-side, sized for social. | `src/pages/DeathCard.tsx` | Produces a shareable PNG offline |

### 26.3 Explicitly out of scope

Not "stretch" — **not being built.** Say so plainly if a judge asks what's next, and don't imply any of it exists.

Randomised or generated runs · a second decade (2003–2013, the housing crash) · generative scams · leaderboards · shared-seed play-a-friend · student-loan alternate opening · a full Windows desktop with multiple windows · accounts, saves or persistence · mobile.

**The honest framing for the pitch:** this is a vertical slice — one decade, one authored run, built to be complete rather than broad. The systems underneath (real series, event-driven pacing, content as data) are what a second decade plugs into. That is a strength and should be stated as one, not hedged.

## 27. The pitch artboard

**Format:** single landscape artboard, eight numbered panels in a grid, dense infographic style. Big numbered badges top-left of each panel, heavy use of icons and simple diagrams over body text, one bold pull-quote per panel.

**Critical instruction:** this is a pitch, not a spec. Do **not** enumerate every screen, mechanic, formula or state transition. The panels carry the *idea* and the *motivation*. If a panel is explaining how something works rather than why it matters, cut it.

**Artboard styling:** the artboard itself should be clean and modern — it is a pitch document, not a period artefact. The *screenshots inside it* are the period artefact. Let the contrast do the work.

| Panel | Carries |
|---|---|
| **01** | Title, logo, the one-liner. The hook: you can't practise being 18. |
| **02** | The problem — the brief's numbers, and the cliff at 18 where support disappears exactly when stakes spike. |
| **03** | The solution — a decade in twenty minutes. Rehearsal, not curriculum. |
| **04** | What it looks like. The hero shot: the full browser window, `/home` open, dual money display visible, one popup mid-screen. **This panel does the most work.** Let the period frame carry it — it is the most distinctive thing we have. |
| **05** | The key idea — inflation is the eagle. Passivity is fatal. The cash-hoarder's line going down while the world's prices go up, ending in March 2000. |
| **06** | The scam mechanic — the fake fund's fact sheet beside the real one, same layout, two fields different. Plus the lookalike domain in the address bar. |
| **07** | What we built and what we didn't — the MVP boundary from §26.1, kept short. Being explicit about the vertical slice reads as confidence, not as a gap. |
| **08** | Why this wins, and the closing line. |

**Closing line for panel 08:**

> **In real life, you get one run at your twenties.**
> **Here, you get as many as you need.**

## 28. Open — decide by watching someone play, not in a meeting

Fewer of these than there would be in a generated game: decision count, scam frequency and popup density are no longer parameters to tune, they are rows in §14.2. What's left is timing, legibility and whether the teaching actually lands.

**Answer before the script freezes — i.e. before Step 36, after which it is copy edits only and no date changes:**

- **Mail reading pause.** Home and the Mail inbox run unless manually paused; opening a message or any other non-inbox screen auto-pauses so reading and decisions are not rushed.
- **Popup volume at the 1999 peak.** Three concurrent is the authored cap. Watch for the point where it stops being atmospheric and starts being hated.
- **Does the Halcyon fact sheet actually get opened?** This is the load-bearing moment of the whole design (§21). If players fund it without ever clicking through, the fact-sheet button is in the wrong place or the wrong size, and that is a UI bug, not a player error.
- **Does anyone find the Northmoor trap?** If nobody notices that the "safe" 5.2% bond also loses to rent, that lesson isn't landing and needs its own death-card line.
- **Does anyone check the address bar unprompted?** If not, move the teaching earlier — the Mar 1997 Meridian popup should be the message where the status-bar URL is the clearest tell.
- **Fast-forward: hold or toggle?** Hold keeps a hand on the game; toggle is kinder on a trackpad during a live demo. The demo operator's preference wins here.
- **Base year for "today's money."** 1996 is specified in §19.4. If players find it confusing, the alternative is 2026 — test it.
- **Does Era B land?** If nobody notices the Jan 2002 switch, it isn't earning its build cost. Cut it, or make it louder.

**Naming, decide any time:**

- **The game.** BUBBLE is still a placeholder. Alternates: *Nine Nine*, *Dial-Up*, *The Long Run*.
- **The browser.** *Bubble Navigator* needs to evoke IE without being it. The owner retired the former Comet name so the product and browser chrome share one brand.
- **The 12 fictional firms.** Check every name against real 1996–2006 companies before shipping — §5.1 rule 3.

**Not open, and worth saying so:** whether the run is randomised, whether there's a second decade, whether difficulty scales. All settled: no. See §26.
