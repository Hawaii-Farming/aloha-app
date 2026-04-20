---
phase: quick-260417-mg2
plan: 01
subsystem: navbar-search
tags: [navbar, search, command-palette, ag-grid, payroll, housing]
requires:
  - ActiveTableSearchContext (useActiveTableSearch, useRegisterActiveTable) from 260417-lbu
  - NavbarSearch live-filter + clear UX from 260417-lqq
provides:
  - Navbar palette now filters Payroll Hours, Payroll Comparison, Payroll Comp Manager grids via quickFilterText
  - Navbar palette filters Housing accommodations client-side by site name + room name
  - cmdk built-in palette-item filter disabled whenever a list view is the active searchable table
affects:
  - app/components/navbar-search.tsx
  - app/components/ag-grid/payroll-hours-list-view.tsx
  - app/components/ag-grid/payroll-comparison-list-view.tsx
  - app/components/ag-grid/payroll-comp-manager-list-view.tsx
  - app/components/ag-grid/housing-map-view.tsx
tech-stack:
  added: []
  patterns:
    - Parity with AgGridListView: list views call useRegisterActiveTable(slug, displayName) + forward useActiveTableSearch().query to AgGridWrapper.quickFilterText
    - cmdk <Command shouldFilter={!activeTable}> gates built-in item filter so typing = table-filter-only when a list is registered
    - Housing (non-AG-Grid) filters its accommodations[] client-side via useMemo([accommodations, query])
key-files:
  created: []
  modified:
    - app/components/navbar-search.tsx
    - app/components/ag-grid/payroll-hours-list-view.tsx
    - app/components/ag-grid/payroll-comparison-list-view.tsx
    - app/components/ag-grid/payroll-comp-manager-list-view.tsx
    - app/components/ag-grid/housing-map-view.tsx
decisions:
  - Use literal slugs ('hours_comp', 'payroll_comp', 'payroll_comp_manager', 'housing') rather than params.subModule — each view is dedicated to one route, keeping the registration unambiguous
  - Housing filter matches on site name OR any room name (case-insensitive substring); empty query short-circuits to unfiltered reference
  - SummaryBar for Housing intentionally reflects the filtered set so counts track the visible list
metrics:
  duration: ~3min
  completed: 2026-04-17
---

# Quick Task 260417-mg2: Fix Navbar Palette — Wire Payroll + Housing Summary

One-liner: Registered 3 payroll list views and the housing map as active searchable tables, and gated the cmdk palette-item filter on `activeTable` presence so typing becomes a table-filter-only gesture on list pages.

## Objective

Fix two navbar palette bugs on Payroll and Housing list pages:

1. Typing in the palette did NOT filter the page's table/list (Payroll Hours, Payroll Comparison, Payroll Comp Manager, Housing).
2. Typing ALSO collapsed the palette's own Modules/Pages dropdown items whenever a list view had registered as active searchable table.

Root cause: the 3 payroll list views and the housing map view are custom components rendered via `CrudModuleConfig.customViews.list` dynamic imports. They never called `useRegisterActiveTable` and never forwarded `quickFilterText` / filtered their own data. Separately, cmdk's built-in filter (default `shouldFilter=true`) collapsed palette items when the user typed.

## Changes

### Task 1 — NavbarSearch: gate cmdk built-in filter
**File:** `app/components/navbar-search.tsx`
**Commit:** `d678db5`
Added `shouldFilter={!activeTable}` to the `<Command>` element. `activeTable` is already destructured from `useActiveTableSearch()` (line 49). When a list view is registered, `shouldFilter` is `false` → palette items stay visible. When no list is registered, `shouldFilter` is `true` → default cmdk fuzzy-filter is preserved on home/detail routes.

### Task 2 — PayrollHoursListView: register + forward query
**File:** `app/components/ag-grid/payroll-hours-list-view.tsx`
**Commit:** `60f6bc9`
- Added imports for `useActiveTableSearch`, `useRegisterActiveTable`.
- Inside component: `const { query } = useActiveTableSearch();` + `useRegisterActiveTable('hours_comp', props.subModuleDisplayName ?? 'Payroll Hours');`.
- Forwarded `quickFilterText={query}` to `<AgGridWrapper>`.

### Task 3 — PayrollComparisonListView: register + forward query
**File:** `app/components/ag-grid/payroll-comparison-list-view.tsx`
**Commit:** `d917dfb`
Same pattern as Task 2 with slug `'payroll_comp'`. Inserted the hook calls between the search-params derivation block and `useRef<AgGridReact>(null)`.

### Task 4 — PayrollCompManagerListView: register + forward query
**File:** `app/components/ag-grid/payroll-comp-manager-list-view.tsx`
**Commit:** `abd7065`
Same pattern as Task 2 with slug `'payroll_comp_manager'`. Inserted the hook calls after `useParams()` and before `handleRowClicked`.

### Task 5 — HousingMapView: register + client-side filter
**File:** `app/components/ag-grid/housing-map-view.tsx`
**Commit:** `d85cc1c`
Housing is not AG Grid — it renders Card/row layout. Added:
- `const { query } = useActiveTableSearch();` + `useRegisterActiveTable('housing', props.subModuleDisplayName ?? 'Housing');`.
- `filteredAccommodations` via `useMemo([accommodations, query])`: empty-query short-circuit, else case-insensitive match on `accom.site.name` OR any `accom.rooms[].name`.
- Swapped `accommodations` → `filteredAccommodations` in `SummaryBar`, empty-state condition, and list `.map()`.

## Verification

- `pnpm typecheck` — passed (clean) after every task and at phase close.
- Grep checks matched the plan's expected patterns:
  - `navbar-search.tsx`: `shouldFilter={!activeTable}` present on line 151.
  - Each payroll list view: `useRegisterActiveTable` hook call + `quickFilterText={query}` prop both present.
  - `housing-map-view.tsx`: `useRegisterActiveTable` present, and `filteredAccommodations` appears 4 times (useMemo declaration, SummaryBar prop, empty-state condition, list `.map()`).
- lint-staged ran eslint+prettier on every commit — no new warnings.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1-3 auto-fixes triggered; no Rule 4 architectural decisions needed. No auth gates. No test/infra work. Code comments intentionally omitted per plan instructions.

## Commits

| # | Hash      | Task                                          | File                                                         |
|---|-----------|-----------------------------------------------|--------------------------------------------------------------|
| 1 | `d678db5` | Gate cmdk built-in filter                     | app/components/navbar-search.tsx                             |
| 2 | `60f6bc9` | Wire PayrollHoursListView                     | app/components/ag-grid/payroll-hours-list-view.tsx           |
| 3 | `d917dfb` | Wire PayrollComparisonListView                | app/components/ag-grid/payroll-comparison-list-view.tsx      |
| 4 | `abd7065` | Wire PayrollCompManagerListView               | app/components/ag-grid/payroll-comp-manager-list-view.tsx    |
| 5 | `d85cc1c` | Wire HousingMapView                           | app/components/ag-grid/housing-map-view.tsx                  |

## Known Stubs

None.

## Self-Check: PASSED

- All 5 modified files exist and contain the expected patterns (grep-verified).
- All 5 commits exist on `design` branch (`git log --oneline` verified).
- `pnpm typecheck` passed at phase close.
