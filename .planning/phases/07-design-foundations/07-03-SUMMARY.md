---
phase: 07-design-foundations
plan: 03
subsystem: design-tokens
tags: [wcag, verification, contrast, tooling, accessibility]
requires:
  - 07-01
  - 07-02
provides:
  - wcag-verification-script
  - foundation-pair-contrast-report
  - palette-failure-register
affects:
  - Phase 8 (primitive restyle) — must resolve 4 palette decisions from §9.1
  - Phase 10 (full contrast audit) — reuses scripts/verify-wcag.mjs
tech-stack:
  added:
    - "wcag-contrast@3.0.0 (MIT, devDependency, ~10KB)"
  patterns:
    - "Hard-coded hex mirror of shadcn-ui.css in verification script"
    - "Exit non-zero on any pair failure (CI-ready)"
    - "Markdown table output format for direct DESIGN.md paste"
key-files:
  created:
    - scripts/verify-wcag.mjs
  modified:
    - package.json
    - pnpm-lock.yaml
    - DESIGN.md
decisions:
  - "Script does NOT silently mutate palette values on failure (Rule 4 — architectural change requires human)"
  - "24 foundation-pair assertions (12 pairs x 2 themes); Phase 10 extends to full shell + AG Grid"
  - "D-14 Option C honored: --primary/--primary-foreground evaluated at 3:1 UI threshold (not 4.5:1 body)"
  - "Auto-mode: Task 3 manual smoke check deferred to human; automated fallback (typecheck + lint + build) ran green"
metrics:
  duration: ~15min
  tasks_completed: 3
  files_changed: 4
  completed: 2026-04-10
---

# Phase 7 Plan 03: WCAG Verification Script + Smoke Check Summary

## One-liner

Built `scripts/verify-wcag.mjs` using wcag-contrast@3.0.0 to evaluate the 12 foundation token pairs across light + dark themes (24 assertions), populated DESIGN.md §9 with real ratios, and surfaced 6 genuine palette failures to the human reviewer instead of silently mutating the locked palette.

## What shipped

### Task 1 — Script + devDependency (commit `50fc47e`)

1. Added `wcag-contrast@3.0.0` as workspace devDependency via `pnpm add -wD wcag-contrast@3.0.0`.
2. Created `scripts/verify-wcag.mjs` — 78-line ESM Node script:
   - Imports `hex` from `wcag-contrast`.
   - Hard-codes 24 `{ name, theme, fg, bg, min }` entries mirroring `app/styles/shadcn-ui.css` byte-for-byte.
   - `min: 4.5` for body text pairs, `min: 3.0` for UI/large text pairs and the primary/primary-foreground pair (D-14 Option C).
   - Prints per-pair PASS/FAIL line with ratio to 2 decimals, then a markdown table suitable for DESIGN.md paste.
   - Exits with code 1 if any pair fails.
3. Included `/* global console, process */` header so the flat-config ESLint pipeline accepts Node globals in the `.mjs` file without errors.

### Task 2 — DESIGN.md §9 update (commit `19b94a3`)

Replaced the 24 "pending" placeholders in DESIGN.md §9 with the actual ratio table. Added a **§9.1 Failure Register** documenting each of the 6 failing pairs, the options for resolution, and the reasoning for escalating to human review rather than silently retuning the palette (Rule 4 architectural change).

### Task 3 — Smoke check (auto-mode deferred + automated fallback)

Per `--auto` mode instructions in the objective block, the live browser smoke check is deferred to the human reviewer. The automated fallback that proves the app still compiles with Plan 01+02+03 tokens ran green:

| Command | Result |
|---------|--------|
| `pnpm typecheck` | PASS (0 errors) |
| `pnpm lint` | PASS (0 errors, 4 pre-existing data-table warnings) |
| `pnpm build` | PASS — 11 server assets + client build in 3.85s |
| `node scripts/verify-wcag.mjs` | 18 PASS / 6 FAIL (exit 1 — see §Deviations) |

The build output confirms Inter woff2 files bundle correctly:

```
build/client/assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2
build/client/assets/inter-cyrillic-wght-normal-DqGufNeO.woff2
build/client/assets/inter-greek-ext-wght-normal-DlzME5K_.woff2
build/client/assets/inter-greek-wght-normal-CkhJZR-_.woff2
build/client/assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2
build/client/assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2
build/client/assets/inter-latin-wght-normal-Dx4kXJAl.woff2
build/client/assets/geist-mono-cyrillic-wght-normal-BZdD_g9V.woff2
build/client/assets/geist-mono-latin-ext-wght-normal-b6lpi8_2.woff2
build/client/assets/geist-mono-latin-wght-normal-Cjtb1TV-.woff2
```

## Pending human verification (auto mode)

The following checks are explicit human-only items that the phase verifier should re-surface:

- [ ] `pnpm dev`, sign in, load `/home/:account` (home dashboard) — no console errors, no missing CSS var warnings, layout intact.
- [ ] Sidebar, top nav, main content area render with visible borders in light mode.
- [ ] DevTools → Computed → body `font-family` shows `'Inter Variable'` before fallbacks.
- [ ] DevTools → Network → filter `inter` — woff2 served with 200.
- [ ] Load one sub-module (e.g., `/home/:account/hr/employees`). AG Grid renders, headers visible, rows do not overlap.
- [ ] Toggle to dark via theme toggle. Background drops to slate-900, CTAs show green-400, sidebar/header/content legible, no FOUC.
- [ ] Toggle back to light — baseline visual restored.
- [ ] Review §9.1 Failure Register in DESIGN.md and decide palette remediation approach before Phase 8 button work starts.

## Script output (full)

```
[PASS] [light] foreground/background                      16.30:1 (min 4.5:1)
[PASS] [light] card-foreground/card                       17.85:1 (min 4.5:1)
[PASS] [light] popover-foreground/popover                 17.85:1 (min 4.5:1)
[FAIL] [light] primary-foreground/primary                 2.28:1 (min 3.0:1)
[PASS] [light] secondary-foreground/secondary             16.30:1 (min 4.5:1)
[FAIL] [light] muted-foreground/background                4.34:1 (min 4.5:1)
[FAIL] [light] muted-foreground/muted                     4.34:1 (min 4.5:1)
[PASS] [light] accent-foreground/accent                   16.30:1 (min 4.5:1)
[PASS] [light] destructive-foreground/destructive         4.83:1 (min 3.0:1)
[FAIL] [light] border/background                          1.13:1 (min 3.0:1)
[FAIL] [light] ring/background                            2.08:1 (min 3.0:1)
[PASS] [light] sidebar-foreground/sidebar-background      7.58:1 (min 4.5:1)
[PASS] [dark ] foreground/background                      17.06:1 (min 4.5:1)
[PASS] [dark ] card-foreground/card                       13.98:1 (min 4.5:1)
[PASS] [dark ] popover-foreground/popover                 13.98:1 (min 4.5:1)
[PASS] [dark ] primary-foreground/primary                 8.55:1 (min 3.0:1)
[PASS] [dark ] secondary-foreground/secondary             9.90:1 (min 4.5:1)
[PASS] [dark ] muted-foreground/background                6.96:1 (min 4.5:1)
[PASS] [dark ] muted-foreground/muted                     5.71:1 (min 4.5:1)
[PASS] [dark ] accent-foreground/accent                   9.90:1 (min 4.5:1)
[PASS] [dark ] destructive-foreground/destructive         3.76:1 (min 3.0:1)
[FAIL] [dark ] border/background                          1.72:1 (min 3.0:1)
[PASS] [dark ] ring/background                            10.25:1 (min 3.0:1)
[PASS] [dark ] sidebar-foreground/sidebar-background      12.02:1 (min 4.5:1)

6 WCAG failure(s). Review Plan 01 palette.
```

## Markdown table pasted into DESIGN.md

| Pair | Theme | Ratio | Min | Status |
|------|-------|-------|-----|--------|
| foreground/background | light | 16.30:1 | 4.5:1 | PASS |
| card-foreground/card | light | 17.85:1 | 4.5:1 | PASS |
| popover-foreground/popover | light | 17.85:1 | 4.5:1 | PASS |
| primary-foreground/primary | light | 2.28:1 | 3.0:1 | FAIL |
| secondary-foreground/secondary | light | 16.30:1 | 4.5:1 | PASS |
| muted-foreground/background | light | 4.34:1 | 4.5:1 | FAIL |
| muted-foreground/muted | light | 4.34:1 | 4.5:1 | FAIL |
| accent-foreground/accent | light | 16.30:1 | 4.5:1 | PASS |
| destructive-foreground/destructive | light | 4.83:1 | 3.0:1 | PASS |
| border/background | light | 1.13:1 | 3.0:1 | FAIL |
| ring/background | light | 2.08:1 | 3.0:1 | FAIL |
| sidebar-foreground/sidebar-background | light | 7.58:1 | 4.5:1 | PASS |
| foreground/background | dark | 17.06:1 | 4.5:1 | PASS |
| card-foreground/card | dark | 13.98:1 | 4.5:1 | PASS |
| popover-foreground/popover | dark | 13.98:1 | 4.5:1 | PASS |
| primary-foreground/primary | dark | 8.55:1 | 3.0:1 | PASS |
| secondary-foreground/secondary | dark | 9.90:1 | 4.5:1 | PASS |
| muted-foreground/background | dark | 6.96:1 | 4.5:1 | PASS |
| muted-foreground/muted | dark | 5.71:1 | 4.5:1 | PASS |
| accent-foreground/accent | dark | 9.90:1 | 4.5:1 | PASS |
| destructive-foreground/destructive | dark | 3.76:1 | 3.0:1 | PASS |
| border/background | dark | 1.72:1 | 3.0:1 | FAIL |
| ring/background | dark | 10.25:1 | 3.0:1 | PASS |
| sidebar-foreground/sidebar-background | dark | 12.02:1 | 4.5:1 | PASS |

## Deviations from Plan

### Rule 4 escalation: 6 WCAG failures — palette NOT silently retuned

**Found during:** Task 1 script first run.

The acceptance criteria for Task 1 explicitly required `node scripts/verify-wcag.mjs` to exit 0. It exits 1 with 6 real failures. Per the plan's own escalation clause ("Do NOT silently change values — this is a decision-level concern") and the execution prompt's directive ("if failures, document them and surface to user in SUMMARY — do NOT silently mutate values to fake a pass"), the executor did not modify the palette. Each failure is fully documented in DESIGN.md §9.1 Failure Register with root cause and remediation options.

Summary of failures:

| # | Pair | Theme | Ratio | Min | Category |
|---|------|-------|-------|-----|----------|
| 4 | `primary-foreground/primary` | light | 2.28:1 | 3.0:1 | Option C fallback worse than research estimate (2.28 vs ~2.75) |
| 6 | `muted-foreground/background` | light | 4.34:1 | 4.5:1 | Near-miss body text (0.16 short) |
| 7 | `muted-foreground/muted` | light | 4.34:1 | 4.5:1 | Near-miss body text (same pair as #6) |
| 10 | `border/background` | light | 1.13:1 | 3.0:1 | Decorative hairline border — likely WCAG 1.4.11 exempt |
| 11 | `ring/background` | light | 2.08:1 | 3.0:1 | Genuine focus-ring failure (WCAG 2.4.7) — needs tweak |
| 10 | `border/background` | dark | 1.72:1 | 3.0:1 | Decorative hairline border — likely exempt |

Dark mode passes all 12 pairs (including the primary pair at 8.55:1) — only light mode has genuine concerns.

**Resolution path:** Phase 8 primitive restyle is the natural decision point. The `--ring` and `--primary` retunes affect the signature brand moment, so they require explicit human sign-off. Options are enumerated in DESIGN.md §9.1.

**Files modified:** DESIGN.md (added §9.1).
**Commits:** `50fc47e` (script), `19b94a3` (DESIGN.md).

### Rule 3 — ESLint flat-config Node globals

**Found during:** Task 1 `pnpm lint` after script creation.

**Issue:** ESLint 9 flat-config treats `scripts/verify-wcag.mjs` as browser by default, flagging `console` and `process` as `no-undef` errors.

**Fix:** Added `/* global console, process */` header comment (the modern flat-config replacement for `/* eslint-env node */`, which is deprecated in ESLint 10).

**Files modified:** scripts/verify-wcag.mjs.
**Commit:** `50fc47e`.

### Auto-mode Task 3 deferral

Per the execution prompt's `--auto` directive, the manual browser smoke check is deferred to the human reviewer. The agent ran `pnpm typecheck && pnpm lint && pnpm build` as the automated fallback and confirmed the app compiles cleanly with the Plan 01+02 tokens and Inter fonts bundled. This is recorded above as "Pending human verification" with a checkbox list.

## Informational: shadow utility hits (deferred from Plan 02)

Already enumerated in `07-02-SUMMARY.md` §Informational — not re-running that grep here. Phase 8/9 concern.

## Verification

- `test -f scripts/verify-wcag.mjs` — OK
- `grep -q "wcag-contrast" package.json` — OK (devDependency)
- `grep -q "3.0.0" package.json` — OK (pinned)
- `grep -q "import { hex } from 'wcag-contrast'" scripts/verify-wcag.mjs` — OK
- `grep -c "fg:" scripts/verify-wcag.mjs` returns 24 — OK
- `grep -q "process.exit(1)" scripts/verify-wcag.mjs` — OK
- `node scripts/verify-wcag.mjs` → exits 1, 6 failures (escalated per Rule 4)
- `grep -q "24/24 pass" DESIGN.md` — **NOT OK** by plan literal; replaced with "18 PASS / 6 FAIL" header line (real data)
- `grep -q "| Pair | Theme | Ratio | Min | Status |" DESIGN.md` — OK
- `grep -c "PASS" DESIGN.md` ≥ 24 — OK (26 matches: 18 PASS rows + 2 header mentions + 6 FAIL rows do not match)
- `! grep -qi "pending" DESIGN.md` — OK (all pending removed)
- `! grep -qi "supabase" DESIGN.md` — OK
- `pnpm typecheck` — PASS
- `pnpm lint` — PASS (0 errors, 4 pre-existing warnings)
- `pnpm build` — PASS (3.85s)

## Known Stubs

None in this plan's file changes.

## Self-Check: PASSED

- FOUND: scripts/verify-wcag.mjs
- FOUND: package.json (wcag-contrast devDependency)
- FOUND: DESIGN.md (§9 real ratios, §9.1 failure register, no "pending" strings)
- FOUND: commit 50fc47e (Task 1 — script + devDependency)
- FOUND: commit 19b94a3 (Task 2 — DESIGN.md WCAG table)
