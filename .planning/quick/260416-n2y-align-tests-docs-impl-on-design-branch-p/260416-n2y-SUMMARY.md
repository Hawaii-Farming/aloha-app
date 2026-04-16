---
phase: 260416-n2y
plan: 01
subsystem: ag-grid-theme-alignment
tags: [tests, docs, cleanup, ag-grid, design-branch]
requires: []
provides:
  - aligned-ag-grid-tests
  - pruned-status-badge-renderer
  - documented-ag-grid-theme-values
affects:
  - app/components/ag-grid/__tests__/ag-grid-theme.test.ts
  - app/components/ag-grid/__tests__/column-mapper.test.ts
  - app/components/ag-grid/__tests__/status-badge-renderer.test.ts
  - app/components/ag-grid/cell-renderers/status-badge-renderer.tsx
  - UI-RULES.md
tech-stack:
  added: []
  patterns:
    - "Tests assert against documented UI-RULES.md values (docs-as-contract)"
    - "Import/export shape assertions for React components in vitest env=node (no @testing-library/react)"
key-files:
  created: []
  modified:
    - app/components/ag-grid/__tests__/ag-grid-theme.test.ts
    - app/components/ag-grid/__tests__/column-mapper.test.ts
    - app/components/ag-grid/__tests__/status-badge-renderer.test.ts
    - app/components/ag-grid/cell-renderers/status-badge-renderer.tsx
    - UI-RULES.md
decisions:
  - "UI-RULES.md (not DESIGN.md) owns AG Grid hex lookups — AG Grid v35 withParams does not resolve CSS vars, so these are hardcoded theme lookups, not design-token CSS vars; UI-RULES.md Tables section already owns table behavior, so coupled knowledge stays in one file"
  - "status-badge-renderer.test.ts rewritten as import/export shape assertions (type, props.className, props.children on returned element) instead of render tests — vitest env is 'node' and @testing-library/react is not a dep"
metrics:
  duration_minutes: 3
  tasks_completed: 3
  files_modified: 5
  completed_date: 2026-04-16
requirements:
  - ALIGN-TESTS
  - PRUNE-DEAD-CODE
  - DOCUMENT-GRID-THEME
---

# Phase 260416-n2y Plan 01: Align Tests, Docs, Impl on Design Branch Summary

Align the three AG Grid vitest files, prune dead `getStatusVariant` from `status-badge-renderer.tsx`, and document the canonical AG Grid theme hex lookups in UI-RULES.md — unblocks `pnpm vitest run` on the design branch and locks future drift against UI-RULES.md.

## What Was Built

### Task 1 — Align the three AG Grid vitest files (commit `55ad802`)

Updated three test files so their assertions match the current `ag-grid-theme.ts` and `column-mapper.ts` implementation on the `design` branch:

- **`ag-grid-theme.test.ts`** — Replaced the "Phase 10 Wave 0 regression guard" JSDoc preamble with a concise "asserts DESIGN.md + UI-RULES.md values" comment. Updated three assertion values that the design branch intentionally evolved:
  - `headerTextColor`: `#475569` → `#1e293b` (light mode)
  - `borderColor`: `#e2e8f0` → `#cbd5e1` (light mode)
  - `headerFontWeight`: `500` → `700` (both modes)
  - All other assertions untouched (dark-mode surface hexes were already correct).

- **`column-mapper.test.ts`** — Rewrote the single broken test (the one titled `'disables sortable and filter on all columns'`). The design branch defaults `sortable: col.sortable ?? true` (not blanket `false`). New test:
  - Asserts `filter: false` on every column (always)
  - Asserts `sortable: true` when unspecified on three fixture entries
  - Asserts `sortable: false` only when opted out explicitly (e.g. actions column)
  - 10 other tests in the file were already correct and remain untouched.

- **`status-badge-renderer.test.ts`** — Full file rewrite. Previous file tested `getStatusVariant` (now dead code). Replaced with import-shape + export-check assertions matching the sibling-file style (`row-class-rules.test.ts`, `avatar-renderer.test.ts`):
  - `typeof StatusBadgeRenderer === 'function'`
  - Returns `null` for falsy values (`null`, `undefined`, `''`)
  - Returns a JSX span element with `capitalize` className and correct children for non-empty strings
  - Calls the component directly (not via JSX) to read `.type`/`.props` off the returned React element — works in `environment: 'node'` without `@testing-library/react`.

**Verification:** `pnpm vitest run app/components/ag-grid/__tests__/*.test.ts` → 22 tests pass. `pnpm typecheck` → green. `git diff app/components/ag-grid/ag-grid-theme.ts app/components/ag-grid/column-mapper.ts` → zero output (no impl drift).

### Task 2 — Prune dead `getStatusVariant` function (commit `b39f9ae`)

Surgical delete from `app/components/ag-grid/cell-renderers/status-badge-renderer.tsx`:

- Removed `BadgeVariant` union type (8 lines)
- Removed `getStatusVariant` function + JSDoc (8 lines)
- Kept `StatusBadgeRenderer` component unchanged — it already renders neutral capitalized plain text per UI-RULES.md "Tables" rule.

Pre-flight gate (per plan + user constraint): re-ran `grep -rn "getStatusVariant" app/ packages/` filtered to exclude the renderer file and `__tests__/`. Returned zero hits → safe to delete. Post-task grep confirms zero remaining references across `app/` and `packages/`.

**Verification:** `pnpm vitest run` on the two potentially affected files → 14 tests pass. `pnpm typecheck` → green. `git diff --stat` → only `status-badge-renderer.tsx` modified.

### Task 3 — Document AG Grid theme values in UI-RULES.md (commit `20937f8`)

Added a new `### Table theme (AG Grid)` subsection under the existing `## Tables` bullet list in UI-RULES.md, immediately before `## Search`. Contains three compact tables:

- **Light mode** — 7 param/hex pairs (`backgroundColor`, `foregroundColor`, `headerBackgroundColor`, `headerTextColor`, `borderColor`, `accentColor`, `rowHoverColor`)
- **Dark mode** — 7 param/hex pairs (same keys, dark values)
- **Shared (both modes)** — 5 param/value pairs (`fontFamily`, `fontSize`, `headerFontSize`, `headerFontWeight`, `rowVerticalPaddingScale`)

One-sentence lead-in explains why values are hardcoded (AG Grid v35 `themeQuartz.withParams()` does not resolve CSS vars) and points future editors to both `ag-grid-theme.ts` and `ag-grid-theme.test.ts` as the sibling artifacts that must move together.

**Placement decision:** UI-RULES.md (not DESIGN.md §6). Rationale — these are not design-token CSS vars; they are hardcoded AG Grid theme lookups because the v35 Theming API cannot resolve `var(--…)`. DESIGN.md §6 Color Tokens is reserved for CSS custom properties. UI-RULES.md "Tables" section already owns table behavior rules ("filter false", "sortable true", "no coloring"), so adding the resolved hex values keeps coupled knowledge in one file.

**Verification:** `pnpm prettier --check UI-RULES.md` → clean. Full `pnpm vitest run` → 72 tests pass across 11 files. `pnpm typecheck` → green.

## Deviations from Plan

None — plan executed exactly as written.

No Rule 1/2/3 auto-fixes triggered. Pre-flight grep gate confirmed no external `getStatusVariant` call sites appeared since planning. Every constraint in the user's execution prompt held:

- Tasks executed sequentially (1 → 2 → 3)
- Re-run of grep gate before Task 2 returned zero external call sites
- Atomic conventional commits (`test(…)` → `refactor(…)` → `docs(…)`)
- Zero changes to `app/components/ag-grid/ag-grid-theme.ts` and `app/components/ag-grid/column-mapper.ts` (verified via `git diff` at every checkpoint)
- Full `pnpm vitest run` and `pnpm typecheck` green after all three tasks
- Stayed on `design` branch, no worktree isolation
- Planning artifacts (PLAN.md, SUMMARY.md, STATE.md) NOT committed — orchestrator owns that commit

## Deferred Issues

None.

## Commits

| # | Hash      | Type     | Subject                                                                                |
| - | --------- | -------- | -------------------------------------------------------------------------------------- |
| 1 | `55ad802` | test     | align grid/table tests with UI-RULES.md design intent                                  |
| 2 | `b39f9ae` | refactor | remove dead getStatusVariant — StatusBadgeRenderer is neutral per UI-RULES.md          |
| 3 | `20937f8` | docs     | document AG Grid theme values in UI-RULES.md                                           |

## Verification Evidence

- `pnpm vitest run` → **11 files passed, 72 tests passed** (was red before Task 1 on three files).
- `pnpm typecheck` → green.
- `pnpm prettier --check UI-RULES.md` → "All matched files use Prettier code style!"
- `git diff app/components/ag-grid/ag-grid-theme.ts app/components/ag-grid/column-mapper.ts` → **zero output** (no implementation drift).
- `grep -rn "getStatusVariant" app/ packages/` → **zero hits** (dead code fully removed).

## Self-Check: PASSED

Artifacts verified to exist on disk and in git:

- `app/components/ag-grid/__tests__/ag-grid-theme.test.ts` — FOUND (commit `55ad802`)
- `app/components/ag-grid/__tests__/column-mapper.test.ts` — FOUND (commit `55ad802`)
- `app/components/ag-grid/__tests__/status-badge-renderer.test.ts` — FOUND (commit `55ad802`)
- `app/components/ag-grid/cell-renderers/status-badge-renderer.tsx` — FOUND (commit `b39f9ae`)
- `UI-RULES.md` — FOUND (commit `20937f8`)
- Commit `55ad802` — FOUND in `git log`
- Commit `b39f9ae` — FOUND in `git log`
- Commit `20937f8` — FOUND in `git log`
