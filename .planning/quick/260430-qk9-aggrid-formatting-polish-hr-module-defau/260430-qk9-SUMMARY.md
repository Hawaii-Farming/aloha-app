---
phase: 260430-qk9
plan: 01
subsystem: ag-grid-shared-infra, hr-module-routing
tags: [ag-grid, formatting, hr-navigation, ui-polish]
requires:
  - app/lib/crud/types.ts (ColumnConfig.type union)
  - hr_rba_navigation view (sub_module_slug rows)
  - app/config/module-icons.config.ts (Proper-Case slug convention)
provides:
  - MODULE_DEFAULT_SUB_MODULE override map (HR → Register)
  - numberFormatter (Intl.NumberFormat 'en-US', ≤2 decimals, FP-noise rounding)
  - numericColDef ColDef preset (text-right + tabular-nums + valueFormatter)
  - defaultColDef.wrapHeaderText:true (cross-cutting header wrapping)
  - MM/DD/YY date format in shared DatePillRenderer + dateFormatter
affects:
  - every AG Grid in the app (via column-mapper + wrapper) inherits numeric/header/date polish
  - HR module sidebar entry pins to Register
tech-stack:
  added: []
  patterns:
    - Shared ColDef preset spread by Object.assign in mapColumnsToColDefs
    - Static module → default-sub-module override map in route loader
key-files:
  created:
    - app/components/ag-grid/cell-renderers/number-formatter.ts
  modified:
    - app/routes/workspace/module.tsx
    - app/components/ag-grid/column-mapper.ts
    - app/components/ag-grid/ag-grid-wrapper.tsx
    - app/components/ag-grid/cell-renderers/date-formatter.ts
    - app/components/ag-grid/cell-renderers/pill-renderer.tsx
    - app/components/ag-grid/__tests__/column-mapper.test.ts
decisions:
  - HR landing override done in route loader, not by reordering sub_module_display_order — sidebar order stays independently editable
  - numericColDef applied via Object.assign so future per-column overrides can still override cellClass/valueFormatter
  - Detail-row, filter-label, and scheduler date displays intentionally NOT touched (they don't flow through shared renderers and full year is more readable inline)
  - Phone formatter behavior preserved as-is (regression test added in Task 2 to lock it)
metrics:
  duration: ~10m
  completed: 2026-04-30
  tasks_completed: 2/3 (Task 3 is human-verify checkpoint, pending)
requirements: [QK9-01, QK9-02]
---

# Quick 260430-qk9: AG Grid Formatting Polish + HR Module Default Summary

Cross-cutting AG Grid formatting polish baked into shared infrastructure (column-mapper preset, defaultColDef header wrap, shared `MM/dd/yy` date renderer) plus a static HR-module → Register landing override in the workspace module route.

## What Shipped

### Task 1 — HR module → Register default redirect
**Commit:** `0a2516e`

- Added `MODULE_DEFAULT_SUB_MODULE` map at the top of `app/routes/workspace/module.tsx` with `'Human Resources': 'Register'`.
- In the loader, after `requireModuleAccess` and the `hr_rba_navigation` query, the override is applied **before** the standard `subModules[0]` fallback.
- RBA-safe: if the override sub-module is not in the user's accessible navigation, control falls through to the existing first-by-display-order redirect.
- Database untouched (`sub_module_display_order` continues to drive sidebar ordering independently).

### Task 2 — Shared AG Grid formatting (TDD)
**Commits:** `2b3ee1b` (RED), `4061cb2` (GREEN)

- **New `app/components/ag-grid/cell-renderers/number-formatter.ts`:**
  - `numberFormatter`: `Intl.NumberFormat('en-US')` — integers get no decimals, decimals get up to 2 (rounds aggregation FP noise like `12.4500000003` → `12.45`); returns `''` for null/undefined/NaN/non-finite.
  - `numericColDef` preset: `type:'numericColumn'`, `cellClass:'text-right tabular-nums'`, `headerClass:'text-right'`, `valueFormatter: numberFormatter`.
- **`column-mapper.ts`:** `col.type === 'number'` now spreads `numericColDef` via `Object.assign`. Sits before existing date/badge/render branches so other renderers (badge, full_name, phone, email, code) still apply when combined.
- **`ag-grid-wrapper.tsx`:** `defaultColDef.wrapHeaderText: true` added next to existing `autoHeaderHeight: true`. Headers like "Start Date" / "End Date" now wrap to two lines instead of clipping.
- **`cell-renderers/date-formatter.ts`** and **`cell-renderers/pill-renderer.tsx` (`DatePillRenderer`):** `'MM/dd/yyyy'` → `'MM/dd/yy'`.
- **Tests** (`__tests__/column-mapper.test.ts`): 7 new specs — 4 direct `numberFormatter` cases, 1 numeric-preset wiring spec, 1 text-column regression guard, 1 phone-formatter regression guard. All 18 tests pass.

### Untouched on purpose
- `housing-detail-row.tsx`, `employee-review-detail-row.tsx`, `pay-period-filter.tsx` — detail-row / filter labels, full year intentional.
- `scheduler-list-view.tsx`, `scheduler-employee-renderer.tsx` — scheduler does its own `'MMM d'` formatting and never flows through `DatePillRenderer` / `dateFormatter`.
- `payroll-formatters.tsx` — already has its own right-aligned currency / hours / dollars formatters; no double-formatting collision.

## Verification

| Check | Result |
| ----- | ------ |
| `pnpm vitest run app/components/ag-grid/__tests__/column-mapper.test.ts` | 18/18 passed |
| `pnpm typecheck` (after Task 1) | clean |
| `pnpm typecheck` (after Task 2) | clean |
| `pnpm lint` on touched files | 0 errors / 0 warnings (the 4 lint warnings shown by the wider workspace lint are all in `packages/ui/src/shadcn/data-table.tsx`, pre-existing TanStack Table compatibility advisories — out of scope) |

## Deviations from Plan

None — plan executed exactly as written. The lint-staged hook auto-formatted the test file's import grouping after the RED commit; no behavior change.

## Task 3 — Human-Verify Checkpoint (PENDING)

The plan's Task 3 is a `checkpoint:human-verify` gate (blocking). It requires the user to manually exercise the running app and confirm:

1. HR sidebar click lands on `…/Human Resources/Register`.
2. Other modules (Operations, Grow, Pack, Food Safety, Maintenance, Inventory, Sales) still land on their first display-order sub-module.
3. Numeric AG Grid columns (HR Hours Comp / Payroll Comp Manager `Total Hours`, `Regular Pay`, `Total Cost`; Grow Cuke Harvest `Net Weight`; Inventory Onhand stock columns) — right-aligned in header + cell, comma thousands separators, TOTAL pinned row rounded to ≤2 decimals.
4. HR Register Phone column shows `(808) 555-1234` (regression check).
5. HR Register Start/End/DOB date columns show `MM/DD/YY`.
6. Long headers ("Start Date", "End Date", "Date Of Birth") wrap to two lines instead of clipping.
7. Scheduler week-view date headers unchanged (`Apr 26 – May 2` / `MMM d`).
8. Detail-row date strings (Housing detail row, Employee Review detail row) still show full year — intentional.

I have NOT performed these visual checks myself. The automated tests prove the unit-level behavior (formatters, column-mapper wiring, redirect override), but only the user can confirm the rendered grids and the redirect look right end-to-end against live data.

**Resume signal expected from the user:** "approved", or a specific report of what is off and on which page.

## Self-Check: PASSED

Files asserted to exist:
- FOUND: `app/components/ag-grid/cell-renderers/number-formatter.ts`
- FOUND: `app/routes/workspace/module.tsx` (modified)
- FOUND: `app/components/ag-grid/column-mapper.ts` (modified)
- FOUND: `app/components/ag-grid/ag-grid-wrapper.tsx` (modified)
- FOUND: `app/components/ag-grid/cell-renderers/date-formatter.ts` (modified)
- FOUND: `app/components/ag-grid/cell-renderers/pill-renderer.tsx` (modified)
- FOUND: `app/components/ag-grid/__tests__/column-mapper.test.ts` (modified)

Commits asserted to exist on `dev-jean`:
- FOUND: `0a2516e` — feat(quick-260430-qk9): HR module landing redirects to Register sub-module
- FOUND: `2b3ee1b` — test(quick-260430-qk9): add failing tests for shared AG Grid number formatter
- FOUND: `4061cb2` — feat(quick-260430-qk9): shared AG Grid formatting — numbers, MM/DD/YY, header wrap

## TDD Gate Compliance

Task 2 was tagged `tdd="true"`. Gate sequence verified in `git log`:
1. RED gate: `2b3ee1b` `test(quick-260430-qk9): add failing tests …` (5 of 18 specs failing as expected)
2. GREEN gate: `4061cb2` `feat(quick-260430-qk9): shared AG Grid formatting …` (all 18 specs pass)
3. REFACTOR gate: not needed — implementation was already minimal and idiomatic.
