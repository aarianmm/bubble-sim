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
credit card and debt (31) · the fake-dialog scam (32) · progressive page paint
and modem timing (34) · sound (35) · period page furniture (36) · death-card PNG
export (37).

---

## 5. Later-stage toolbar buttons lost their accessible names — §18.2

**Status:** fixed during Step 29–30.

The original later-stage token set hid the visible toolbar labels, while the
buttons relied on those spans for their accessible names. The icons remained on
screen and mouse-clickable, but assistive technology and name-based keyboard or
browser automation could no longer identify Back, Home, Mail, and the other
controls. All three milestone designs now keep the labels visible, and every
toolbar button also carries an era-independent `aria-label`. A regression proves
all eight labels, names and icons survive both visual changes.

---

## 6. Vitest UI server advisory — §25.4

**Status:** open; development-tooling only, not present in the production bundle.

`npm audit` reports GHSA-5xrq-8626-4rwp against the direct `vitest@2.1.9`
development dependency: Vitest versions below 3.2.6 can expose arbitrary file
read and execution when their UI server listens on an untrusted interface. The
game does not run or ship the Vitest UI server, so the static offline runtime is
not exposed. Upgrade Vitest to at least 3.2.6 (the audit currently recommends
4.1.11), reconcile its Vite peer dependency, refresh `package-lock.json`, and run
all three repository gates before closing this issue.

---

## 7. Presenter preset cannot reliably leave the death card — §25.4

**Status:** closed by removal of the Presenter Tools UI from the deployed app.

Browser verification showed that loading **Just before the crash** while the
presenter is already on the death card can return immediately to Game Over. The
presenter queues the new running state and navigates Home, but `AppShell` can
still observe the previous terminal state during that render and route back to
`/over`. Make the preset load and route reset atomic, or make the terminal-route
effect respond only to a running-to-terminal transition, then add a regression
that loads every saved state from the death card.

The project owner retired the production presenter surface on 22 Aug 2026.
`App.tsx` no longer imports or renders it, `?dev=1` is ignored, and normal replay
already leaves the death card atomically. The old preset path remains only in a
test harness, so this cannot affect a player or deployed demo.

---

## 8. Visual milestones changed the upper chrome more than the full interface — §18.2

**Status:** fixed on 22 Aug 2026 after owner review.

The original 1998/2000 milestone work strongly repainted the title, toolbar and
address bands, but the sidebar's live navigator, content surround and individual
bottom status cells still inherited near-1996 surfaces. The year changes were
therefore much less obvious through most of the viewport than their token sets
suggested.

The fix adds semantic root tokens for all of those regions and consumes them in
the shared chrome CSS. The 1998 state is now a full cool-blue transition and the
2000 state is an intentionally stronger Frutiger Aero-inspired blue/aqua/lime
shell. React structure and gameplay controls remain unchanged; later owner
review deliberately expanded the milestone grid metrics as recorded in BUILD
STATUS Deviation 5.

---

## 9. Interface installation was confined to the page area — §18.2

**Status:** fixed on 22 Aug 2026 after owner review.

The first milestone sequence announced the destination as a compact welcome and
rendered its loader inside the browser content pane. The old title bar, toolbar,
sidebar and status bar stayed visible, so it read as a page refresh rather than
a machine-wide interface update. It also removed the transition as soon as the
load completed, leaving no distinct reveal of the newly installed UI.

The revised sequence uses a large mandatory year-change prompt, a blue installer
that covers the full viewport, and a final welcome rendered after the new root
theme is installed. The clock remains held until the player enters the updated
system. Integration coverage asserts the copy, full-screen wrapper, preserved
old theme during loading, post-install welcome and final release of the hold.

---

## 10. Redesigned sidebar removed the original base-year spine — §22.1

**Status:** fixed on 22 Aug 2026 after owner review.

The first sidebar redesign replaced §22.1's `▓` staircase and current `◄` marker
in every year, including the opening 1996 interface. That contradicted the
owner's requirement that the base year remain genuinely original.

The shared markup now carries both presentations. Root tokens show the exact
legacy staircase in 1996, then expose the connected timeline only in 1998/2000,
where completed, current and future years receive separate nodes, checks and an
explicit `NOW` badge. A regression verifies all eleven states and confirms the
legacy fifth-row bar and marker remain mounted for the current year.

---

## 11. Bottom status bar did not advance with the rest of the interface — §18.2

**Status:** fixed on 22 Aug 2026 after owner review.

The top and side chrome made the 1998/2000 progression obvious, while the bottom
bar only changed its background and progress colour. This left a major edge of
the window visually underdeveloped and weakened the sense of a system upgrade.

The 1996 bar remains untouched. Later root tokens now reveal an activity lamp,
an `ONLINE` connection compartment, a three-step signal meter and a conventional
right-edge sizing grip. The DOM is invariant, decoration is non-interactive and
hidden from assistive technology, and the load text/progress/zone continue to
report the same truthful application state. Unit coverage verifies that the
decoration is mounted and progress remains clamped.

---

## 12. Milestone chrome still read as a recolour instead of a new interface — §18.2

**Status:** fixed on 22 Aug 2026 after owner review and period-image research.

Even after the full-shell repaint, the title/menu/toolbar/address stack kept the
1996 heights and button arrangement, while the left and right edges gained only
paint. At a glance the 1998/2000 states could still be mistaken for themes over
the same interface rather than installed generations of browser chrome.

The 1998 layer now uses taller sectional rebars, visible grippers, channel and
zone labels, a toolbar brand panel, a wider framed navigator, modem footer and a
WEB 98 status cap. The 2000 layer makes a second structural-looking jump: wider
glass framing, horizontal list-style toolbar buttons, the already-mounted Go
button, trusted-zone and broadband capsules, luminous right rail, and a glossy
scrollbar. CSS root tokens still own every difference and 1996 retains its exact
original metrics. This is intentionally more expressive than period-exact
Windows 2000; see BUILD STATUS Deviation 5.

---

## 13. Browser chrome used a second “Comet” brand beside BUBBLE — §18.1

**Status:** fixed on 22 Aug 2026 after owner review.

The application title, dialogs, update installer, responsive fallback and later
milestone decorations still called the browser “Comet Navigator,” even though
the product, URLs and page titles were branded BUBBLE. This made the interface
look like two competing products.

Every user-visible reference now uses Bubble Navigator / BUBBLE. The fake
security-alert sender was updated too because it imitates the browser chrome.
Internal `comet-*` CSS selectors remain unchanged: they are invisible stable
implementation identifiers, and renaming them would add risk without changing
anything a player sees.

---

## 14. Money allocation drafts disappeared on navigation — §12.2, §22.5

**Status:** fixed on 23 Aug 2026.

Dragging an allocation slider updated only `MoneyPage`'s local React state.
Navigating to Home or Inbox unmounted that routed page, so returning to My Money
silently rebuilt the sliders from the still-unmodified portfolio—usually 100%
cash. The rebalance simulation and explicit confirmation path were correct, but
the disappearing draft made the interface look as though a visible allocation
had already failed and gave no clear indication that money had not moved yet.

The draft now belongs to a provider mounted above the router's page-remount
boundary, is reconciled when a newly accepted vehicle adds a row, and is cleared
only by Reset, a new/test-loaded run, or successful confirmation. The footer
distinguishes a pending draft from the currently applied allocation. A jsdom
regression drives the real `AppShell` and `EngineProvider` through the reported
journey, then confirms the rebalance and verifies both cash and holding values
survive a second navigation.

---

## 15. Suspended funds accepted new money and rebalances trusted malformed totals — §11.4, §12.1

**Status:** fixed on 23 Aug 2026.

The allocation UI rendered a normal enabled slider after an instrument had
collapsed, and the simulation's rebalance executor accepted arbitrary target
maps without checking IDs, finite ranges, or the required 100% total. A player
could therefore allocate new money into a suspended fund; a replay or test
fixture could also submit an over-allocated decision. Post-collapse market rows
use a multiplier of 1, so money incorrectly added after suspension could remain
there instead of being lost or rejected.

Suspended rows are now reconciled as soon as collapse state changes. Worthless
funds are disabled, sellable residual holdings can only be reduced, and
unsellable Vertex holdings are frozen. Proportional redistribution treats every
other suspended row as a calculation-only pin so dragging Cash or an active fund
cannot increase it indirectly. The pure tick boundary independently rejects
unknown IDs, non-finite/out-of-range values, and allocations that do not total
100%, then refuses collapsed buys even for a forged but otherwise valid
decision. Regression tests cover all of these paths and the six-strategy
calibration fixture now emits valid 100% decisions.

---

## 16. Draft reconciliation could move pinned Cash or discard the whole draft — §12.2, §22.5

**Status:** fixed on 25 Aug 2026 after correctness review.

When a new or suspended holding caused `reconcileDraftRows()` to rebuild the
row set, it always rewrote Cash to the residual percentage while preserving its
`locked` flag. A pinned 50% Cash row could therefore display as both pinned and
100%. If the reconciled non-Cash total overflowed 100%, the defensive branch
returned the complete actual allocation and erased every in-progress target.

Reconciliation now repairs only malformed rows, preserves valid targets and
pins, lets unpinned Cash absorb normal drift, and redistributes around pinned
Cash when another editable holding exists. If state constraints make a pin
mathematically impossible, the affected row is unpinned at the same moment it
changes. Regressions cover pinned-Cash suspension slack and a single malformed
overflowing row without losing the rest of the draft.

---

## 17. The 2000 milestone hid the popup-blocker count — §18.1, §18.2

**Status:** fixed on 25 Aug 2026 after correctness review.

The status-bar blocker slot remains mounted at every milestone, but the final
2000 token block set `--popup-blocker-display: none`. That contradicted Era B's
required visible blocker count and silently removed the readout at the final
interface milestone. The 2000 token is now `flex`, with a regression reading
the exact milestone block so a later theme edit cannot hide it again.

---

## 18. BUILD STATUS claimed a bundle assertion that did not exist — §25.4

**Status:** fixed on 25 Aug 2026 after documentation review.

Deviation 6 said the generated bundle was checked for the absence of
`Presenter Tools`, but the suite only mounts the production `<App/>` with
`?dev=1` and asserts that no Presenter UI appears. The documentation now states
that exact coverage and explicitly says the bundle is not scanned, avoiding a
false assurance while retaining the useful production-render regression.

---

## 19. Toolbar Mail's accessible name omitted unread and arrival text — §19.3, §20.3

**Status:** fixed on 25 Aug 2026 after accessibility review.

Every toolbar button forced `aria-label={btn.label}`. On Mail this overrode the
visible descendant badge and live `New Mail` notice, leaving its accessible
name as only “Mail.” The redundant label has been removed, so the button's
native name is derived from its visible label, unread count and notice; the
notice retains its independent polite live-region announcement. A regression
asserts that the overriding attribute cannot return.

---

## 20. Batched month changes could skip an interface update — §18.2, Step 29–30

**Status:** fixed on 25 Aug 2026 after correctness review.

`evolutionReached()` recognised only the exact Dec→Jan pair at each milestone.
If React observed a forward month change spanning more than one month, neither
equality matched and the mandatory system-update interstitial was skipped.
Forward crossings now use range checks and prefer the latest crossed milestone,
so a batched landing in 1998 or 2000 still presents the appropriate update.
Backward/test state loads remain non-interrupting. Pure regressions cover both
single-boundary and multi-boundary jumps.

---

## 21. The merged pacing harness bypassed persistent draft ownership — §12.2, §22.5

**Status:** fixed on 25 Aug 2026 during the main-branch merge.

`App.pacing.test.tsx` was added on `main` before `MoneyDraftProvider` existed and
mounted routed page components directly. After merging the money-allocation
branch, every pacing scenario that visited My Money threw because the harness
did not reproduce the production provider boundary. The production `AppShell`
was already correct. The harness now mounts routed content inside the same
provider, so auto-pause tests exercise the real persistent-draft composition.

---

## 22. Range-based milestone detection initially intercepted deliberate state loads — §18.2, §25.4

**Status:** fixed on 25 Aug 2026 while closing issue 20.

The first batched-crossing fix treated every forward range as continuous play.
Presenter/test `jumpToMonth()` calls deliberately rebuild the state and are
specified to apply the destination theme immediately, so they began opening an
update dialog and broke milestone and Jan 2000 integration scenarios.
`AppShell` now distinguishes a rebuild through `mailNoticeResetKey`: continuous
forward crossings still receive an update, while reset and test/presenter loads
land immediately on their destination milestone.
