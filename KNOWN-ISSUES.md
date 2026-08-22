# Known issues

Deliberately open, with the evidence needed to close them. Each names the spec
section it violates so nothing here can be quietly forgotten.

**Add to this file whenever you find a problem** — including problems you choose
not to fix and problems you caused (CLAUDE.md rule 12). Give each one what a
future reader needs to close it: what breaks, why, which §n it violates, and what
the fix would be. Never widen a test or soften an assertion to turn a check green;
record the gap and leave the check honest.

**Live:** https://bubble-sim.pages.dev/

---

## 1. Perfect play cannot survive the decade — §8.5, §26.1

**Status:** open, deprioritised by the project owner. Flagged, not fixed.

`npm run verify` reports `perfect play` dying **Feb 2005** (band IMPRESSIVE)
where §8.4's calibration contract and §26.1's MVP boundary both require it to
survive through Dec 2006 (band LEGENDARY). The verify suite asserts the real
behaviour and labels it `KNOWN GAP`, so the gate stays honest rather than
reporting a pass on a failing condition.

**This is a spec arithmetic gap, not an implementation bug.** Over the full
decade, against the merged timeline and the real basket and series:

| line | amount |
|---|---:|
| lifetime pay − expenses | −£5,325 |
| income lost to the Nov 1999 job loss | −£2,280 |
| shocks (8) | −£5,900 |
| windfalls (3) | +£6,300 |
| **market growth must cover** | **−£7,205** |

£7,205 of *growth* is unreachable from a pot that peaks near £5–7k and is drawn
down continuously from 2001 onward. Removing every shock entirely still does not
clear the bar, so shock size — §14.1's designated difficulty lever — is provably
not the binding constraint. §8.5 states the requirement ("~£13,000 needed") but
its own windfall figures do not fund it.

**The fix, when it is wanted:** raise the windfalls. §8.5 writes them as
"~£2,000 / ~£1,800 / ~£2,500" — approximations, explicitly adjustable. Critically,
**a cash-only player never opens the inbox and so never receives a windfall**,
which means windfall size cannot move the March 2000 death date. It is the one
lever that fixes winnability without touching the number the whole design rests
on. Target a *narrow* survival — a few hundred pounds left in Dec 2006, not
thousands — since §15 bands by survival date only, and a thin win keeps the
eagle real to the last month.

---

## 2. Bond-only outlives tracker-only — §9.1

**Status:** open. Possibly correct behaviour; needs a design call.

§8.4's illustrative table has `bond-only` dying 2001–02 and `tracker-only`
2003–04. The sim produces the reverse: bond-only **Aug 2004**, tracker-only
**Jan 2003**. The cause is real rather than a bug — a player drawing down
through the 2000–2002 crash is hurt by the tracker and protected by a fee-free
5.2% bond that never has a down month.

§9.1 wants the bond to read as "the trap that feels responsible. Still loses to
a 5.5% rent rise." That lesson can still be delivered on the death card
(the bond paid ~4.5% while rent rose ~5.5%) without forcing the death dates to
invert. Decide whether to teach it through copy or to steepen the bond's rate
glide path in `scripts/build-series.ts`.

---

## 3. Index levels are reconstructed, not archival — §9.2, §25.4

**Status:** accepted trade-off, documented in the build.

§25.4 requires the build to work fully offline, so nothing is fetched at build
time. `scripts/source-data/indices.ts` carries month-end levels reconstructed
from documented anchor points. **Crash timing, magnitude and ordering are real**
— NASDAQ peaks Mar 2000 and draws down 78% to Oct 2002 — but the month-to-month
texture between anchors is interpolated. Stated plainly in the file header and in
`series.json`'s `meta.note`. Drop in real month-end closes before the pitch if a
judge is likely to check.

---

## 4. Not built — outside the Step 1–28 MVP boundary (§26.1)

Not bugs. §26.1 lists these as additive layers, priority-ordered:
Era B visual switch (29–30) · credit card and debt (31) · the fake-dialog scam
(32) · progressive page paint and modem timing (34) · sound (35) · period page
furniture (36) · death-card PNG export (37).

The Era B token set **is** written and works (`data-era="b"` flips every surface
with no component change) — only the Jan 2002 switch that triggers it is unbuilt.
