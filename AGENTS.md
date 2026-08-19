# AGENTS.md

**Read [`CLAUDE.md`](./CLAUDE.md) first.** It is the single set of build rules for
this repository and it applies to every agent and every human working here,
whatever tool you arrived with.

Everything you need is in these four files:

| File | What it is |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | The build rules. Non-negotiables, layout, shared contracts, commands. **Start here.** |
| [`bubble-design-requirements.md`](./bubble-design-requirements.md) | The authoritative spec. Every `§n` reference in the code points at it. Its **BUILD STATUS** section records what is built, what is outstanding, and every deviation. |
| [`KNOWN-ISSUES.md`](./KNOWN-ISSUES.md) | Open problems, each with the evidence needed to close it. |
| [`DEMO.md`](./DEMO.md) | The operator's card for the live demo (§25.5). |

**Live:** `main` deploys to <https://bubble-sim.pages.dev/>

## The two rules that are easiest to forget

1. **Every change updates the spec.** When you change behaviour, update
   BUILD STATUS in `bubble-design-requirements.md` in the same commit. If you
   depart from the spec, record it under *Deviations* with your reasoning.
2. **Every problem you find goes in `KNOWN-ISSUES.md`** — including the ones you
   choose not to fix. An unrecorded known problem is indistinguishable from a
   bug nobody noticed.

## Before you finish

```
npm run check      lint + typecheck + test
npm run verify     the calibration gate — cash-only MUST die March 2000
npm run build
```

`npm run verify` gates CI. If it goes red, the game ships broken — see
CLAUDE.md's "the one number the design rests on".
