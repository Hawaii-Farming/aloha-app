---
phase: quick-260420-kd0
plan: 01
subsystem: design-system
tags: [dark-mode, theme, wcag, kimbie]
status: complete
dependency_graph:
  requires:
    - DESIGN.md (token source of truth, pre-Kimbie)
    - UI-RULES.md (behavior companion, pre-Kimbie)
    - app/styles/shadcn-ui.css (live dark block, pre-Kimbie)
    - .planning/sketches/themes/kimbie-dark.css (canonical Kimbie reference)
  provides:
    - Kimbie Dark palette in app/styles/shadcn-ui.css .dark block
    - DESIGN.md §1/§2/§8/§9 rewritten for Kimbie
    - UI-RULES.md Table theme note flagging AG Grid dark mismatch
  affects:
    - Every component consuming .dark scope in the app shell
    - AG Grid dark theme — NOT affected (intentional out-of-scope mismatch)
tech-stack:
  added: []
  patterns:
    - Warm earth-tone dark mode with preserved brand tokens
    - Kimbie-hued alpha washes for semantic color triples
key-files:
  created:
    - .planning/quick/260420-kd0-adopt-kimbie-dark-app-wide/260420-kd0-SUMMARY.md
  modified:
    - app/styles/shadcn-ui.css (56 insertions / 47 deletions — .dark block only)
    - DESIGN.md (74 insertions / 64 deletions — §1/§2/§8/§9)
    - UI-RULES.md (2 insertions — AG Grid mismatch note)
decisions:
  - "Preserve --primary/--primary-foreground/--ring/--gradient-primary byte-identical so Aloha emerald brand still reads on Kimbie warm canvas"
  - "Hold --semantic-red-fg at Tailwind red-400 #f87171 instead of Kimbie #dc3958 because #dc3958 on its self-wash is low contrast"
  - "Brighten Kimbie olive #889b4a → #a7c05a for --semantic-green-fg for legibility on warm canvas"
  - "Repalettize --chart-3/4/5 to Kimbie teal/yellow-orange/cream instead of leaving slate-cool defaults"
  - "--sidebar-background = canvas #15100a (was elevated slate-800); --sidebar-border = card #1e1710 — same subtle-lift pattern as prior slate version"
  - "AG Grid dark theme intentionally NOT synced — out of scope (TS file + test); follow-up task proposed"
  - "verify-wcag.mjs script not updated this plan (scope: CSS + MD only); dark ratios recomputed via one-off node invocation using the same wcag-contrast package"
metrics:
  duration: ~5 minutes
  completed_date: "2026-04-20"
  tasks_completed: 3
  files_modified: 3
---

# Quick Task 260420-kd0: Adopt Kimbie Dark Palette App-Wide Summary

Swapped the `.dark` token block in `app/styles/shadcn-ui.css` from a slate-based palette to the Kimbie Dark warm earth-tone palette, keeping the four Aloha emerald brand tokens (`--primary`, `--primary-foreground`, `--ring`, `--gradient-primary`) byte-identical so the brand CTA still reads as Aloha green on the Kimbie canvas. Aligned `DESIGN.md` (token source of truth) and spot-checked `UI-RULES.md` (behavior companion) to match — including recomputed WCAG AA ratios for every dark pair.

## Commits

| Task | Subject                                                                   | Hash      |
| ---- | ------------------------------------------------------------------------- | --------- |
| 1    | `style(quick-260420-kd0): swap dark tokens to Kimbie palette`             | `c6a982e` |
| 2    | `docs(quick-260420-kd0): rewrite DESIGN.md dark-mode sections for Kimbie` | `bebf1b1` |
| 3    | `docs(quick-260420-kd0): spot-check UI-RULES.md for Kimbie compatibility` | `9ef3d6e` |

Base commit (branch `design`): `8468f43`.

## Hard-constraint verification

### `:root` (light mode) byte-identical

`git diff HEAD~3 HEAD -- app/styles/shadcn-ui.css` shows a single hunk starting at `@@ -79,65 +79,74 @@` — every inserted/deleted line falls inside the `.dark { ... }` block (which begins at line 81). Lines 11-79 (the entire `:root` block) are untouched. Confirmed manually and via `git diff -U0`.

### Preserved brand tokens — byte-identical values

All four brand tokens retain their prior emerald values in the `.dark` block:

| Token                  | Value                                        | Line in final file |
| ---------------------- | -------------------------------------------- | ------------------ |
| `--primary`            | `#4ade80`                                    | 96                 |
| `--primary-foreground` | `#052e16`                                    | 97                 |
| `--ring`               | `#4ade80`                                    | 113                |
| `--gradient-primary`   | `linear-gradient(135deg, #4ade80, #10b981)`  | 115-119 (prettier-wrapped; functionally identical) |

Prettier wrapped `--gradient-primary` across four lines — CSS gradient syntax is whitespace-insensitive, so the value is byte-identical at the parsed level. Inline comment tags the line as `/* PRESERVED */`.

## WCAG delta table

Dark pairs recomputed via a one-off Node invocation using the `wcag-contrast` package (same formula as `scripts/verify-wcag.mjs`). Light pairs unchanged — not re-run. PRESERVED pairs have identical ratios.

| Pair                                  | Prior (slate) | New (Kimbie) | Min    | Status | Note                           |
| ------------------------------------- | ------------- | ------------ | ------ | ------ | ------------------------------ |
| foreground/background                 | 17.06:1       | 9.23:1       | 4.5:1  | PASS   | Cream on deep brown            |
| card-foreground/card                  | 13.98:1       | 8.64:1       | 4.5:1  | PASS   |                                |
| popover-foreground/popover            | 13.98:1       | 8.64:1       | 4.5:1  | PASS   |                                |
| primary-foreground/primary            | 8.55:1        | 8.55:1       | 3.0:1  | PASS   | PRESERVED — identical          |
| secondary-foreground/secondary        | 9.90:1        | 7.16:1       | 4.5:1  | PASS   |                                |
| muted-foreground/background           | 6.96:1        | 4.94:1       | 4.5:1  | PASS   | **Tight pass — flag for monitoring** |
| muted-foreground/muted                | 5.71:1        | 4.63:1       | 4.5:1  | PASS   | **Tight pass — flag for monitoring** |
| accent-foreground/accent              | 9.90:1        | 7.16:1       | 4.5:1  | PASS   |                                |
| destructive-foreground/destructive    | 3.76:1        | 4.40:1       | 3.0:1  | PASS   | Actually improved              |
| border/background                     | 1.72:1        | 1.29:1       | 3.0:1  | FAIL   | Pre-existing FAIL; §9.1 item 3 decorative caveat carries forward |
| ring/background                       | 10.25:1       | 10.85:1      | 3.0:1  | PASS   | Ring slightly improved on darker canvas |
| sidebar-foreground/sidebar-background | 12.02:1       | 4.94:1       | 4.5:1  | PASS   | **Tight pass — flag for monitoring** |

**Net PASS/FAIL count:** unchanged from pre-Kimbie (18 PASS / 6 FAIL). No PASS↔FAIL flips. The single remaining dark FAIL is `border/background`, which was FAIL at 1.72:1 pre-Kimbie and is FAIL at 1.29:1 post-Kimbie — same decorative-hairline caveat (WCAG 1.4.11) applies.

`§9.1` Failure Register updated: items 2, 3, 4 rewritten to reflect post-Kimbie dark ratios.

## Deviations from Plan

### None beyond noted scope

- UI-RULES.md scan found no other cool/slate/blue-ish dark-mode prose beyond the AG Grid table (which was out of scope for value changes); only the expected single note was appended, exactly as the plan predicted.
- No architectural changes (Rule 4). No Rule 1-3 auto-fixes. No CLAUDE.md conflicts.

### Kimbie-adjacent color choices (from plan, recorded here)

1. `--semantic-red-fg` held at Tailwind red-400 `#f87171` instead of adopting Kimbie `#dc3958` — Kimbie red on its 15% self-wash is low contrast; red-400 preserves legibility.
2. `--semantic-green-fg` brightened from Kimbie olive `#889b4a` to `#a7c05a` — planner-provided range allowed either; brighter tone chosen for WCAG legibility on warm canvas.
3. `--sidebar-accent` uses `#332618` (matches `--border` / `--secondary` / `--accent`) instead of a warm orange wash — consistency with the rest of the Kimbie earth tones.

## Authentication Gates

None. This is a CSS/docs-only plan.

## Known Stubs

None. All tokens have concrete values; no placeholders.

## Known Out-of-Scope Items (Flagged and Deferred)

### AG Grid dark theme — slate/Kimbie chrome mismatch

AG Grid v35's `themeQuartz.withParams()` does not resolve CSS vars, so the dark-mode AG Grid hex values are hardcoded in:

- `app/components/ag-grid/ag-grid-theme.ts`
- `app/components/ag-grid/__tests__/ag-grid-theme.test.ts` (Vitest assertion)

This plan's scope is explicitly CSS + MD only (no TS, no JSX). AG Grid dark tables will continue to render slate-900/800/700 chrome while the rest of the app renders Kimbie warm earth. Documented in:

- `DESIGN.md §2` (AG Grid dark theme exception note)
- `UI-RULES.md §Tables > Table theme > Dark mode` (Kimbie/AG-Grid mismatch note)

### `scripts/verify-wcag.mjs` not synced

The script still hardcodes the prior slate dark pairs. Dark ratios in this plan were computed via a one-off `node -e` invocation using the same `wcag-contrast` package and WCAG 2.x relative-luminance formula, so the numbers are authoritative. Syncing the script's hardcoded pairs is a trivial edit but adds a third file type beyond the plan's CSS+MD scope.

## Proposed Follow-up

- **`kd0-aggrid-dark-sync`** — quick task to sync the AG Grid dark theme to Kimbie: update the dark-mode hex values in `app/components/ag-grid/ag-grid-theme.ts`, update the corresponding assertions in `app/components/ag-grid/__tests__/ag-grid-theme.test.ts`, and update the Dark mode hex table in `UI-RULES.md §Tables > Table theme`. Bundle with a `verify-wcag.mjs` update to keep the script authoritative.

## Self-Check: PASSED

Verified claims:

- `app/styles/shadcn-ui.css` exists and contains `--background: #15100a;` — FOUND (line 87)
- `DESIGN.md` exists and contains `#15100a` — FOUND (8 occurrences)
- `DESIGN.md` exists and contains `Kimbie` — FOUND (37 occurrences)
- `DESIGN.md` does NOT contain `slate-900/800/700` — CONFIRMED (grep -c returned 0)
- `UI-RULES.md` exists and contains `Kimbie Dark` — FOUND
- `UI-RULES.md` exists and contains `quick-260420-kd0` — FOUND
- Commit `c6a982e` exists in `git log` — FOUND
- Commit `bebf1b1` exists in `git log` — FOUND
- Commit `9ef3d6e` exists in `git log` — FOUND
- `pnpm typecheck` passed during Task 1 — CONFIRMED (no output means success)
- `:root` block byte-identical (lines 11-79 untouched) — CONFIRMED via `git diff -U0` hunk analysis

All success criteria met. Plan complete.
