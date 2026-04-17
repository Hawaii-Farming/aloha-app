---
phase: quick-260417-mwl
plan: 01
subsystem: ui/tables
tags: [refactor, ag-grid, ui-rules, housing]
requires:
  - app/components/ag-grid/ag-grid-wrapper.tsx
  - app/components/ag-grid/column-state.ts
  - app/components/active-table-search-context.tsx
provides:
  - Housing list rendered as AG Grid (navbar-palette filter + per-slug column state)
  - Housing detail Tenants section rendered as AG Grid (autoHeight embed)
affects:
  - app/components/ag-grid/housing-map-view.tsx
  - app/components/crud/housing-detail-view.tsx
tech-stack:
  added: []
  patterns:
    - AgGridWrapper with quickFilterText wired to useActiveTableSearch()
    - saveColumnState/restoreColumnState slug-keyed persistence ('housing')
    - domLayout='autoHeight' for grids embedded inside a parent scroll region
key-files:
  created: []
  modified:
    - app/components/ag-grid/housing-map-view.tsx
    - app/components/crud/housing-detail-view.tsx
decisions:
  - Sort Occupancy column by tenant count (integer ranking) — progress bar rendered via cellRenderer, numeric value drives sort per UI-RULES "numbers right-aligned, tabular-nums"
  - Skip column state persistence for the tenants grid — per-detail ephemeral, not slug-routable
  - Register 'housing-tenants' active table only when tenants.length > 0 — navbar palette has nothing to filter on empty state
metrics:
  duration: ~8min
  completed: 2026-04-17
---

# Quick 260417-mwl: Convert Housing list + Housing detail Tenants to AG Grid Summary

Converted the last two remaining custom card/semi-table list surfaces to AG Grid so every list and embedded data table in the app now honours the UI-RULES.md table contract (one datum per cell, no per-table search, navbar-only palette filter, uniform `text-sm`, no coloring, flat `ColDef[]`).

## Tasks Completed

| Task | Name                                                     | Commit   | Files                                            |
| ---- | -------------------------------------------------------- | -------- | ------------------------------------------------ |
| 1    | Rewrite housing-map-view.tsx as AG Grid                  | c12e885  | app/components/ag-grid/housing-map-view.tsx      |
| 2    | Replace Tenants section of housing-detail-view with AG Grid | 7f84467 | app/components/crud/housing-detail-view.tsx     |

## What Changed

**Housing list (`housing-map-view.tsx`)**
- Replaced `Card`-wrapped `SummaryBar` + `HousingListHeader` + `HousingListRow` + `OccupancyBar` with a single `AgGridWrapper` render.
- Kept `parseHousingSite` + `buildAccommodations` intact; added a small `AccommodationRow` flattening step between the memoized accommodations and the grid's `rowData`.
- 5 flat `ColDef[]` entries at module scope: home-icon avatar (60px, non-sortable / non-resizable / non-movable), `name`, `beds` (numericColumn), `baths` (numericColumn), `tenantCount` header `'Occupancy'` with an inline progress-bar `cellRenderer`.
- Wired navbar palette filter: `useActiveTableSearch().query -> AgGridWrapper quickFilterText`. Removed the old `filteredAccommodations` `useMemo`.
- Slug-keyed column state persistence under `'housing'` via `restoreColumnState` in `onGridReady` and a 300ms debounced `saveColumnState` across `onColumnMoved`, `onColumnResized`, `onSortChanged`, `onColumnVisible` — mirrors the payroll-hours reference.
- `getRowStyle` returns `{ opacity: '0.6' }` for `row.isActive === false`, preserving the prior inactive-row dim.
- Row click navigates to `/home/${account}/human_resources/housing/${row.id}` guarded on both values.
- Outer wrapper switched from `flex-1 flex-col gap-5 overflow-y-auto px-4 py-4` to `flex min-h-0 flex-1 flex-col` so the grid owns its own scroll region via the wrapper.

**Housing detail Tenants (`housing-detail-view.tsx`)**
- Deleted `TENANT_COLS` grid-template constant and the `TenantRowView` component.
- Added module-level `TENANT_COL_DEFS: ColDef[]` with 4 columns: initials avatar, Name, Department (em-dash fallback), Work Auth (em-dash fallback).
- Added local `TenantInitialsRenderer` for the avatar chip (`bg-primary/10 text-primary`, 2-letter uppercase initials).
- New local `TenantsGrid` component renders `AgGridWrapper` with `domLayout='autoHeight'` and `pagination={false}` so the grid sizes to its rows inside the already-scrollable detail content region.
- `TenantsGrid` registers itself as the active table (`'housing-tenants'`, display name `'Tenants'`) and consumes `useActiveTableSearch().query` for navbar filtering.
- Row click navigates to `/home/${accountSlug}/human_resources/employees/${tenantId}`.
- Empty-state behaviour preserved: when `tenants.length === 0` the `<p>No tenants currently assigned.</p>` renders and `TenantsGrid` is never mounted (so the navbar palette does not advertise a `'Tenants'` active table on an empty detail view).
- Dropped `Link` import (was only used by deleted `TenantRowView`); kept `Card` import (still used by stat cards).

## UI-RULES Compliance

- One datum per cell on both grids.
- No per-table search UI on either surface.
- `defaultColDef.filter = false` inherited from `AgGridWrapper`; no `filter` overrides on any colDef.
- Numbers right-aligned via `type: 'numericColumn'` on Beds/Baths and `text-right tabular-nums` inside the Occupancy renderer.
- Uniform `text-sm` from the AG Grid theme — no `text-xs` / `text-lg` in data cells.
- No coloring on rows or cells; the avatar chip color is the existing avatar convention, not data color.
- Flat `ColDef[]` — no `ColGroupDef`.

## Deviations from Plan

None — plan executed exactly as written. One minor type touch-up: `rowData` needed `as unknown as Record<string, unknown>[]` on both wrappers because `AgGridWrapperProps.rowData` is typed as `Record<string, unknown>[]` and the typed `AccommodationRow[]` / `TenantRow[]` do not satisfy a string index signature. This matches how typed row arrays are passed to `AgGridWrapper` throughout the codebase.

## Verification

- `pnpm typecheck` clean after each task.
- `git diff --name-only ba03a2d..HEAD` lists exactly two files: the two in `files_modified`.
- Zero-touch files untouched: `active-table-search-context.tsx`, `ag-grid-list-view.tsx`, `ag-grid-wrapper.tsx`, `column-state.ts`, `hr-housing.config.ts`.
- Registry untouched — `hr-housing.config.ts` dynamic imports (`housing-map-view`, `housing-detail-view`) resolve by path, which is unchanged.

## Self-Check: PASSED

- FOUND: app/components/ag-grid/housing-map-view.tsx
- FOUND: app/components/crud/housing-detail-view.tsx
- FOUND commit: c12e885 (Task 1)
- FOUND commit: 7f84467 (Task 2)
