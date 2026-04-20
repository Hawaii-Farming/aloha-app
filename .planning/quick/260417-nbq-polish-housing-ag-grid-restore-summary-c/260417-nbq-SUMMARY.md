---
phase: quick-260417-nbq
plan: 01
subsystem: ui-housing-ag-grid
tags: [ag-grid, housing, summary-bar, sizeColumnsToFit, regression-fix]
requires:
  - app/components/ag-grid/ag-grid-wrapper.tsx
  - app/components/ag-grid/column-state.ts
provides:
  - Housing list with 4-card SummaryBar and full-width grid
  - Housing detail tenants grid that fills panel width
affects:
  - app/components/ag-grid/housing-map-view.tsx
  - app/components/crud/housing-detail-view.tsx
tech-stack:
  added: []
  patterns:
    - "setTimeout(api.sizeColumnsToFit, 20) called from consumer onGridReady to run after AgGridWrapper's own autoSizeAllColumns(setTimeout 0)"
    - "Stable colId on non-field renderer columns to neutralize any persisted column state"
key-files:
  created: []
  modified:
    - app/components/ag-grid/housing-map-view.tsx
    - app/components/crud/housing-detail-view.tsx
decisions:
  - "Removed column-state persistence from housing-map-view.tsx only; column-state.ts module itself stays on disk (used by other list views)."
  - "Used sizeColumnsToFit() (with a 20ms delay to sequence after the wrapper's autoSizeAllColumns) instead of changing the wrapper, per zero-touch constraint."
metrics:
  duration: 82s
  tasks_completed: 2
  files_modified: 2
  completed: 2026-04-17
---

# Phase quick-260417-nbq Plan 01: Polish Housing AG Grid — restore summary cards, fix column order, avatar size, and grid width Summary

Fixed four regressions introduced by the 260417-mwl Housing AG Grid rewrite: restored the 4-card SummaryBar, dropped stale column-state persistence that was reapplying a wrong column order, shrunk the avatar circle to fit the default row height, and forced both the list and detail-tenants grids to fill their container width by calling `sizeColumnsToFit()` after the wrapper's built-in `autoSizeAllColumns` tick.

## Outcomes

- **BUG-A fixed:** Housing list renders a 4-card SummaryBar (Accommodations, Total Bedrooms, Total Tenants, Occupied) above the grid.
- **BUG-B fixed:** Housing list columns render in the defined order (avatar → Name → Beds → Baths → Occupancy) on every load. Column-state persistence is no longer wired up in this view, and the avatar colDef has a stable `colId: 'home_icon'` to harden against any stored state residue from earlier sessions.
- **BUG-C fixed:** `HomeIconRenderer` circle is now `h-8 w-8` (icon remains `h-4 w-4`), fitting cleanly inside the default AG Grid row height.
- **BUG-D fixed:** Both the Housing list grid and the Housing detail tenants grid call `setTimeout(() => event.api.sizeColumnsToFit(), 20)` from their `onGridReady`. The wrapper's own `handleGridReadyWithMobileUnpin` fires `autoSizeAllColumns()` inside `setTimeout(..., 0)`; the 20ms delay sequences our `sizeColumnsToFit()` strictly after, defeating the content-clamp and letting the grid flex to its container.

## Tasks

### Task 1 — Rewrite `housing-map-view.tsx`

**Commit:** `554ce12`

Changes:
- Deleted `restoreColumnState` / `saveColumnState` imports.
- Deleted `saveDebounceRef`, `debouncedSaveState`, `handleColumnMoved`, `handleColumnResized`, `handleSortChanged`, `handleColumnVisible`.
- Removed the corresponding `onColumnMoved` / `onColumnResized` / `onSortChanged` / `onColumnVisible` props from `<AgGridWrapper>`.
- Narrowed the `ag-grid-community` type import to `ColDef`, `GridReadyEvent`, `RowClassParams`, `RowClickedEvent` (dropped `ColumnMovedEvent`, `ColumnResizedEvent`, `ColumnVisibleEvent`, `GridApi`, `SortChangedEvent`). Kept `useRef` because `gridRef` still uses it.
- Rewrote `handleGridReady` to `setTimeout(() => event.api.sizeColumnsToFit(), 20)`.
- Shrunk the avatar circle in `HomeIconRenderer` from `h-10 w-10` to `h-8 w-8`.
- Added `colId: 'home_icon'` to the avatar colDef.
- Added `SummaryBar` component (and `Card` import from `@aloha/ui/card`) rendering 4 cards above the grid.
- Replaced the outer `<div>` layout with `flex min-h-0 flex-1 flex-col gap-4 px-4 py-4`, with the SummaryBar in a `shrink-0` row and the grid in a `flex min-h-0 flex-1 flex-col` row.

### Task 2 — `housing-detail-view.tsx` tenants grid fills panel width

**Commit:** `b6d5145`

Changes:
- Added `GridReadyEvent` to the existing `ag-grid-community` type import.
- Added `handleGridReady` (via `useCallback`) inside `TenantsGrid` using `setTimeout(() => event.api.sizeColumnsToFit(), 20)`.
- Passed `onGridReady={handleGridReady}` to `<AgGridWrapper>`. `domLayout="autoHeight"` preserved; no other changes.

## Deviations from Plan

None — plan executed exactly as written. Prettier reformatted the `ag-grid-community` import in `housing-detail-view.tsx` to a multi-line form on the commit lint pass; this is stylistic, not semantic.

## Verification

- `pnpm typecheck` — passes after each task.
- `git diff --stat HEAD~2 HEAD` — exactly 2 modified files:
  - `app/components/ag-grid/housing-map-view.tsx` (58 insertions, 68 deletions)
  - `app/components/crud/housing-detail-view.tsx` (10 insertions, 1 deletion)
- `ag-grid-wrapper.tsx`, `column-state.ts`, `active-table-search-context.tsx`, and `hr-housing.config.ts` remain untouched.

## Commits

- `554ce12` — fix(quick-260417-nbq): restore housing SummaryBar, fix column order, avatar size, grid width
- `b6d5145` — fix(quick-260417-nbq): make housing detail tenants grid fill panel width

## Self-Check: PASSED

- FOUND: app/components/ag-grid/housing-map-view.tsx (modified)
- FOUND: app/components/crud/housing-detail-view.tsx (modified)
- FOUND commit: 554ce12
- FOUND commit: b6d5145
