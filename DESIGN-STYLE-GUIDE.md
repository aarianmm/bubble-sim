# BUBBLE — the 90s aesthetic, for the pitch deck

A reference for whoever is building the pitch PowerPoint. This is *not* the
design spec (that's `bubble-design-requirements.md`, Part III) — it's a
condensed extract of everything about the game's look, told so a designer
who has never opened the codebase can pull the right visual language into
slides. Section numbers (§n) point back at the spec for anyone who wants
the full source.

---

## 1. The one-sentence pitch for the visuals

**The game is a website, and you are looking at it through a 1998 web
browser.** Not a retro skin bolted onto a modern game — a faux browser
window, rendered completely straight, containing a period-correct financial
portal. The player's whole session is one long web session from 1996 to
2006: they click Back, they watch pages load over a modem, they close
popups, they read fact sheets that look laid out in FrontPage. (§17)

## 2. The core tonal rule — this is the thing to get right

**Straight chrome, period-loud pages.**

- The *browser* (window, menus, toolbar, scrollbars) plays it completely
  sober: real proportions, real system font, real greys, nothing winking at
  the camera.
- The *websites inside it* are authentically of their time — for 1999 that
  means tiled backgrounds, WordArt, `<marquee>` tags, hit counters, on the
  worst offenders.
- The humour comes from what things *say*, never from the interface
  elbowing the viewer in the ribs.

**Why this beats a cartoon version:** in a room full of clean fintech blue,
a game that looks like a bank is invisible, and a game that looks like a
cartoon is dismissed. A game that looks like a *forensically accurate 1999
browser* is neither — it's a period artefact. It earns the seriousness the
subject (personal finance, going broke) needs, while being unmistakably not
a bank app. (§17)

**This distinction matters for the pitch deck too — see §9 below.** The
deck itself should be clean and modern; the *screenshots inside it* are the
period artefact. Don't theme the whole presentation as Windows 95 — let the
contrast between a modern deck and a 90s screenshot do the work.

## 3. Two eras, one hard switch

The look shifts exactly once, at the January 2002 year-turn (one year after
the 2000–01 crash), announced only by a dialog that reads *"Your computer
has been upgraded."* No gradual drift — a hard cut.

| | **Era A — 1996–2000** | **Era B — 2001–2006** |
|---|---|---|
| Feel | Windows 95/98, Internet Explorer 4 | Windows XP "Luna", Internet Explorer 6 |
| In-fiction browser name | **Comet Navigator 4.0** | **Comet Navigator 6** |
| Title bar | Flat navy `#000080`, white bold 11px, square corners | Blue gradient `#0058EE → #3F8CF3`, rounded top corners (6px), soft drop-shadow on the text |
| Window face (chrome background) | `#C0C0C0` (classic Windows grey) | `#ECE9D8` (Luna "sand") |
| Bevels | Hard 1px double bevel, zero border-radius | Same bevel language, but 2px radius on buttons |
| Chrome font | MS Sans Serif 11px, bitmap, **no antialiasing** | Tahoma 11px |
| Toolbar | Large 32px icons **with text labels underneath**, 16-colour | Small 16px icons, no labels, 256-colour with subtle gradients |
| Address bar | No "Go" button | "Go" button present |
| Page load time | 0.6–1.2s, visible progressive paint | 0.2–0.4s, near-instant |
| Popups | Unblocked, up to 3 at once | Popup blocker active — status bar reports "Popup blocked" |
| Page style (the sites *inside* the browser) | Tables, tiled backgrounds, WordArt, `<marquee>`, raw web-safe colour (`#FF00FF` on `#00FFFF`) | CSS layout, gradients, drop shadows, rounded corners — "a sobered-up web" |

If the pitch deck wants to show "the decade progressing," Era A → Era B is
the single strongest before/after pair available — it's literally Windows
95 turning into Windows XP mid-story. (§18.2)

## 4. The browser chrome — what's on screen at all times

One maximised browser window. No desktop, no taskbar, no wallpaper — the
window *is* the whole screen, minimum 1024×768 (the era's standard
resolution). Every element is functional, never decorative: (§18, §18.1)

- **Title bar** — shows the current page title, updates on navigation. `_ □ ✕` are drawn correctly (and hovering shows a bevel press) even though only ✕ does anything (prompts "Are you sure you want to leave?").
- **Menu bar** — `File / Edit / View / Go / Favorites / Help`, real dropdowns, mostly greyed out (correct for the era, and it's where settings like the dual-money toggle live).
- **Toolbar** — Back / Forward / Stop / Refresh / Home / Search / Favorites / Mail, all real and functional. Back is genuinely greyed on the first page.
- **Address bar** — shows the live URL, always accurate, **including on scam sites**. This is a deliberate gameplay surface: lookalike domains (e.g. `cavendish-assets.co.uk.offers.net`) are visible here exactly as in real life.
- **Left nav sidebar** — the portal's own navigation (`HOME`, `INBOX (3)`, `MY MONEY`), plus the current date and time controls (play/pause/fast-forward).
- **Status bar** — left: load state ("Done", "Opening page http://…"); centre: a progress bar; right: a zone icon, plus (Era B only) the popup-blocker count. Link-hover shows the destination URL here — a real-life-transferable "check before you click" mechanic, delivered for free by an authentic browser feature.
- **Scrollbar** — real 16px Win95-metric scrollbar, not a fake overlay. Content genuinely scrolls.

Pages "load": the status bar reports progress, the content paints
top-to-bottom in bands like a 33.6k modem rendering a page, and images
resolve in horizontal strips. This is skippable (click anywhere to finish
instantly) but is the free, cheap way the game makes "the decade getting
faster" *felt* rather than told. (§18.3)

## 5. Colour system — the bevel is the whole visual language

Every colour is a CSS custom property, swapped wholesale by the era
attribute (`data-era="a"|"b"` on `:root`). No hex values appear anywhere
outside the one tokens file. (§19.2, project rule)

**Era A system palette (Windows 95 grey):**

| Token | Hex | Use |
|---|---|---|
| Window/control face | `#C0C0C0` | The grey of everything |
| Bevel highlight (outer) | `#FFFFFF` | Top/left edge of a raised control |
| Bevel highlight (inner) | `#DFDFDF` | Inner top/left |
| Bevel shadow (inner) | `#808080` | Inner bottom/right |
| Bevel shadow (outer) | `#000000` | Outer bottom/right |
| Active title bar | `#000080` (navy) | |
| Sunken field / content background | `#FFFFFF` | |
| Link | `#0000FF`, visited `#800080` | Classic browser blue/purple |

**Era B system palette (XP Luna):** face `#ECE9D8`, title bar gradient
`#0058EE → #3F8CF3`, accent blue `#316AC5`, shadow `#ACA899`.

**The bevel triple** — the single most load-bearing visual idiom in the
whole game: every raised surface (buttons, the window itself, toolbar) is a
1px border, light on top/left, dark on bottom/right, with a matching 1px
inset highlight/shadow just inside it. Every sunken surface (text fields,
list boxes) is the same, inverted. Pressing a button swaps to the sunken
version and nudges its content 1px down-right — that nudge is the *only*
motion a button ever gets.

**Page accent colours are constrained to the 216-colour web-safe
palette** — magenta `#FF00FF`, cyan `#00FFFF`, lime `#00FF00`, orange
`#FF6600`, yellow `#FFFF00`, blue `#0000FF`, purple `#800080`. This is a
hard rule specifically because it's self-enforcing: a page built only from
web-safe colour *cannot* accidentally look like 2026.

## 6. Type

| Use | Era A | Era B | Note |
|---|---|---|---|
| Chrome (menus, buttons, status bar) | MS Sans Serif 11px, bitmap, unantialiased | Tahoma 11px | `font-smoothing: none` — "does more for the period feel than any other line of CSS" |
| Institutional page body (building societies, pensions) | Times New Roman 16px | same | The browser default of the era — unstyled *is* correct |
| Commercial page body | Arial/Helvetica 13px | Verdana 13px | Verdana was *the* late-90s web-design font |
| Loud/scam pages | Comic Sans, Impact, WordArt-style headings | — | Used knowingly, sparingly, only on the "loud" style band |
| Numbers, tables, tickers | Courier New | Courier New | Monospace money reads as period-accurate financial data |

No system font dependency — everything is a bundled, open-licence bitmap
clone (never a real Microsoft asset, for both licensing and legal reasons).

## 7. The three website "style bands" — the game's central visual joke

Every external site the player visits (fund offers, banks, scams) falls
into one of three deliberately-calibrated visual bands. **This is the most
distinctive and most tell-worthy part of the visual design, and probably
the best material for a "how the game teaches" pitch slide.** (§21)

| Band | Looks like | Actually is | Damage if funded |
|---|---|---|---|
| **Loud** | WordArt heading (rotated, drop-shadowed, garish outline), tiled diagonal-stripe magenta/cyan background, a real scrolling `<marquee>`, a hit counter, "under construction" GIF | ~70% scam, ~30% legitimate-but-aggressive (a real 1999 discount broker looked exactly like this) | Small — amateur scams, a few hundred pounds |
| **Plain** | Unstyled Times New Roman, grey `<table>`s, no images, looks hand-typed | ~15% scam, mostly institutional and dull-correct (the tracker fund, the gilt fund, the building society) | — |
| **Slick** | Restrained professional layout, real logo, a clean returns chart, testimonials in a blockquote, generous whitespace, one accent colour used sparingly | **~35% scam — this is where the Ponzi scheme lives** | **Run-ending** |

The rule that makes this fair rather than a "judge the book by its cover"
lesson: **the most dangerous vehicle in the game always has the
best-looking website** ("it looks like real money because that's what the
money bought"), and **at least one genuinely legitimate vehicle has a
hideous site** (the building society: tiled background, clip-art padlock,
hit counter — completely real, pays 5%). Style tells you where to look
harder. It never tells you the answer. The only reliable signal is the fact
sheet (§8 below), which is identical on every single page regardless of
style band.

Representative pitch-quote: *"Loud is cheap. Beautiful is expensive.
Somebody paid for that website, and it wasn't out of their own pocket."*

## 8. The fact sheet — the one consistent, honest surface

Every fund/vehicle, on every site, has an identical fact-sheet layout
rendered in plain grey Times-New-Roman, regardless of how garish the page
around it is — as if it were a regulatory disclosure. Same ten fields every
time: name, manager, 12-month return (with a tiny sparkline), annual fee,
exit fee, holdings, launch date, regulator, "minimum return" claims,
introducer commission. Empty fields read `— none —`, never a blank. The
contrast between two fact sheets — a scam's "Regulated by — none —" next to
a tracker's "Regulated by IMRO" — is the entire teaching mechanism, and
makes an excellent side-by-side pitch-deck panel. (§22.4, and explicitly
called out for panel 06 of the pitch artboard, §27)

## 9. Notifications — three tiers, three completely different visual objects

A deliberate "trust hierarchy" is built into the visual grammar: **the more
something wants your attention, the less it deserves your trust — except
when it's the operating system itself.** (§20)

1. **Tier 1 — System dialog (blocking).** Shocks, job loss, forced sales,
   year-turns, death. Grey face, correct bevel, navy title bar, a 32×32
   warning triangle, centred, page behind dims 40%. **No `[Dismiss]` or
   `[Later]` ever exists** — a real dialog always demands a choice. This
   channel *never* carries a sales offer — if the system is talking to you,
   it's telling the truth.
2. **Tier 2 — Popup window (non-blocking, loud).** Unsolicited offers/ads.
   Opens at a random offset, chromeless (no menu/address/status bar), a
   real working ✕, draggable, garish content (tiled background, animated
   GIF, marquee, WordArt CTA). Up to 3 at once during the 1999–2000 mania,
   never more.
3. **Tier 3 — Inbox badge (quietest).** New mail. A single 200ms bold flash
   on the unread counter, an envelope badge on the mail icon, nothing
   covers content, nothing demands a click.

The one deliberate exception: once per run (2003), a popup imitates a
system dialog as the hardest scam in the game — but it's fair, because it's
detectable by things the player already knows to check (it doesn't pause
the clock; it's inside the content area, not centred; hovering its buttons
reveals a URL). This is a good "the fairness contract" pitch beat if the
deck wants to show the game teaches real skills, not gotchas.

## 10. Motion and sound — "everything snaps"

**Motion:** no easing, no fades, no spring physics, anywhere. Windows
appear instantly. A button "presses" by offsetting its content 1px — that's
the *only* click-motion in the product. The only permitted animation is:
progressive page-paint on load, genuinely animated GIFs on period pages,
real scrolling `<marquee>` text, the 200ms unread-counter flash, and an
incrementing hit counter. "If it eases, it's wrong" is the literal rule.
(§23)

**Sound:** all original recreations (nothing sampled from a real OS) — a
dial-up modem handshake on boot, a single system chord for dialogs, a soft
two-note chime for new mail, a modem chirp for popups, a faint click for
buttons, a hard-disk spin-down into silence on death. Everything muteable.

## 11. The two flagship screens

**`/home` (the dashboard).** The headline figure — the player's current
net worth — is "the single most important piece of typography in the
product." It appears twice, always: the period-accurate nominal figure
large and primary, and the same amount in constant 1996 purchasing power
smaller and grey beneath it. Design deliberately makes room for the moment
a *growing* nominal number sits above a *shrinking* real one — that pairing
is the game's thesis rendered as type. A left-nav "year bar" spine (1996 →
2000, filling in as bars) doubles as progress indicator. A scrolling
marquee ticker along the bottom carries flavour headlines. (§19.4, §22.1)

**The death card (the shareable end screen).** A full-window page; the
title bar changes to read "BUBBLE — Game Over" and every toolbar button
greys out except Home — "the machine keeps working, and you don't." Shows
the month of death, a specific, earned cause-of-death line (drawn from a
library, chosen by what actually happened in that run — e.g. *"You went
broke the same month the bubble peaked,"* or *"You paid £1,840 in fees. The
tracker would have charged you £96"*), a decade line-graph (your money vs.
the market), key stats, a letter-grade "band," and two buttons: `[ Save
picture ]` (renders to PNG for social sharing) and `[ Run it again ]` (one
click, instant restart — no menu, no loading screen). This is the intended
shareable/viral artefact and the natural closing screenshot for a pitch
deck. (§22.6)

## 12. Content and legal texture (relevant to any copy in the pitch)

- **Real indices, fictional firms.** FTSE All-Share, S&P 500, NASDAQ,
  gilts, and real CPI/rent data are cited accurately. Every named fund,
  fund manager, company and bank shown is invented, and deliberately not a
  near-miss for any real firm that existed 1996–2006.
- **No real company is ever depicted as a scam or a bad investment.**
- **No shipped Microsoft assets** — the browser name ("Comet Navigator"),
  icons, fonts and sounds are all original work built to evoke Windows
  95/XP and IE4/6 without using anything Microsoft actually owns.
- A visible in-game disclaimer: *"Simulated. Historical data is real; every
  company and fund in this game is invented. This is not financial
  advice."*
(§5.1)

## 13. Asset inventory, if the deck wants to show "what we built"

Deliberately small and mostly CSS, not images: window chrome built from
bevels/gradients (not bitmaps); ~15 period 16×16/32×32 16-colour icons
(back, forward, stop, mail, warning triangle, padlock, globe, etc.); 6
bundled fonts (one MS-Sans-Serif bitmap clone plus five standard web-safe
stacks); a small kit of period page furniture (6–8 tiling backgrounds, 4–5
animated GIFs like "under construction" and a spinning coin, 3 WordArt-style
heading treatments, a hit counter, "best viewed in" badges); ~12 fictional
firm logos (deliberately mediocre wordmarks and clip-art, except the
Ponzi's — which is the one that has to look genuinely good); 7 original
sound clips. (§24)

## 14. What the pitch artboard itself should look like (already specified)

The spec has its own opinion on the pitch deck's *own* visual treatment
(§27), worth repeating here directly since it's the one part of this
document that describes the deck rather than the game:

> **The artboard itself should be clean and modern — it is a pitch
> document, not a period artefact. The screenshots inside it are the
> period artefact. Let the contrast do the work.**

Recommended structure: one landscape artboard/deck, eight numbered panels,
dense infographic style, big numbered badges top-left of each panel, icons
and simple diagrams over body text, one bold pull-quote per panel. Panel 04
("what it looks like" — the hero screenshot: full browser window, `/home`
open, dual-money display visible, one popup mid-screen) is called out
explicitly as doing the most work of any single panel — lead with it.
Closing line suggested for the final panel:

> **In real life, you get one run at your twenties.**
> **Here, you get as many as you need.**
