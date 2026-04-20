---
phase: quick-260417-vw8
plan: 01
subsystem: ui-polish
tags: [housing, payroll, navbar, ag-grid, portal, full-screen]
requires:
  - app/components/workspace-shell/workspace-navbar.tsx  # portal slot
  - app/components/navbar-filter-button.tsx              # useNavbarFilterSlot pattern reference
provides:
  - portal-based PayrollViewToggle pill segmented control in workspace navbar
  - Housing detail page with no stat cards and flex-filling tenants grid
  - Housing list with no SummaryBar — accommodations grid full-area
affects:
  - app/components/crud/housing-detail-view.tsx
  - app/components/ag-grid/housing-map-view.tsx
  - app/components/ag-grid/payroll-view-toggle.tsx
  - app/components/ag-grid/payroll-comparison-list-view.tsx
tech-stack:
  added: []
  patterns:
    - createPortal into '#workspace-navbar-filter-slot' via useNavbarFilterSlot (copied from navbar-filter-button.tsx)
    - Pill segmented control: h-9 rounded-full border outer with h-8 inner buttons + bg-primary active state
key-files:
  modified:
    - app/components/crud/housing-detail-view.tsx
    - app/components/ag-grid/housing-map-view.tsx
    - app/components/ag-grid/payroll-view-toggle.tsx
    - app/components/ag-grid/payroll-comparison-list-view.tsx
  created: []
decisions:
  - "Pill segmented control uses h-8 inner buttons in an h-9 outer so they don't visually clip the border (p-0.5 inset)."
  - "Active segment: bg-primary text-primary-foreground (primary green per DESIGN.md); inactive: muted with hover→foreground+muted bg."
  - "TenantsGrid drops domLayout='autoHeight' + sizeColumnsToFit handler — default AG Grid layout + flex-1 min-h-0 parents handle fill/width distribution via existing flex:1 column defs."
  - "Task 3 is verification-only and skipped as planned — all four list views already had flex min-h-0 flex-1 flex-col root + grid wrapper."
metrics:
  duration: ~8min
  completed: 2026-04-17
---

# Phase quick-260417-vw8 Plan 01: Full-screen tables in Scheduler + Payroll & Housing polish Summary

Three-part UI polish: removed Housing detail stat cards + tenants grid now fills remaining height, removed Housing list SummaryBar, and portal-mounted the Payroll Comparison view toggle as a pill segmented control in the workspace navbar (before the Filters button). Scheduler / payroll-comp-manager / employee-review layouts were already correct; no changes needed there.

## Parts Executed

| Part | Intent | Outcome |
| ---- | ------ | ------- |
| A    | Verify scheduler/payroll-comp-manager/employee-review fill full viewport | No-op — all four already have `flex min-h-0 flex-1 flex-col` on root + grid wrapper |
| B    | Housing detail: remove stat cards, make tenants grid fill; Housing list: remove SummaryBar | Implemented — commit `d0e6988` |
| C    | Portal PayrollViewToggle into navbar as pill segmented control; remove inline toolbar | Implemented — commit `1db4405` |

## Commits

- `d0e6988` — `refactor(quick-260417-vw8): remove Housing detail stat cards; make tenants grid fill remaining space`
- `1db4405` — `refactor(quick-260417-vw8): portal Payroll Comparison view toggle into navbar as pill segmented control`
- Task 3 (Part A verification): **SKIPPED** — no code changes required (planner already verified; re-grep confirmed all four list views correct).

## Key Changes

### `app/components/crud/housing-detail-view.tsx`
- Removed unused imports: `Card` from `@aloha/ui/card`, `GridReadyEvent` from `ag-grid-community`.
- Deleted `maxBeds`, `tenantCount`, `availableBeds` locals and the `stats` array.
- Deleted the 3-stat card grid block.
- Restructured scroll body: old `overflow-y-auto` wrapper replaced with a `flex min-h-0 flex-1 flex-col` column. Notes is `shrink-0`; Tenants section is `flex-1 min-h-0` with its grid wrapped in another `flex min-h-0 flex-1 flex-col` so AG Grid virtual scroller claims the remaining viewport height.
- TenantsGrid: dropped `domLayout="autoHeight"` and the `handleGridReady` + `onGridReady` wiring; AG Grid's default layout now fills the parent box, column widths distributed by existing `flex: 1` col defs.
- Header row (Back · icon · title · Edit · Delete) is byte-identical to pre-change.

### `app/components/ag-grid/housing-map-view.tsx`
- Removed `Card` import and the entire `SummaryBar` component definition.
- Removed the `<div className="shrink-0"><SummaryBar /></div>` wrapper from the return.
- Grid wrapper (`flex min-h-0 flex-1 flex-col`) claims the full content area; `accommodations` memo retained for rowData derivation.

### `app/components/ag-grid/payroll-view-toggle.tsx` (rewrite)
- Full replacement: now imports `createPortal` from `react-dom`, `cn` from `@aloha/ui/utils`.
- Adds `useNavbarFilterSlot` (identical body to `navbar-filter-button.tsx`).
- Returns `null` until the slot resolves on mount, then `createPortal`s a pill segmented control (`h-9 rounded-full border p-0.5` outer; `h-8 rounded-full px-4` inner buttons) into `#workspace-navbar-filter-slot`.
- Active segment: `bg-primary text-primary-foreground`; inactive: `text-muted-foreground hover:text-foreground hover:bg-muted`.
- All three data-test selectors preserved verbatim: `payroll-view-toggle`, `view-toggle-by-task`, `view-toggle-by-employee`.
- URL toggle semantics unchanged: `setSearchParams(next, { preventScrollReset: true })`.

### `app/components/ag-grid/payroll-comparison-list-view.tsx`
- Deleted the inline `{/* Toolbar */}` block + its `flex shrink-0 items-center gap-2 pb-4` wrapper.
- `<PayrollViewToggle />` now renders before `<NavbarFilterButton />` as a direct sibling; both portal into the navbar slot so DOM order controls left-to-right order (toggle leftmost, Filters right of it).
- No other changes (column defs, grouping, totals row, event handlers all untouched).

## Deviations from Plan

**None** — plan executed exactly as written. Task 3 skipped as the plan explicitly allowed ("do not create an empty commit") since steps 1–2 found no layout issues.

## Verification

### Automated
- `pnpm typecheck` — exits 0 ✓
- `pnpm lint` — 4 pre-existing warnings in `packages/ui/src/shadcn/data-table.tsx` (TanStack Table `useReactTable` react-compiler incompat), 0 errors. None touched by this plan.

### Manual (for orchestrator/user smoke-test)
1. **Housing list** (`/home/:account/human_resources/housing`) — no summary cards above grid; accommodations grid fills full area.
2. **Housing detail** (click a housing row) — Back/icon/title/Edit/Delete header unchanged; no stat cards; Notes section intact (if notes present); tenants table fills remaining vertical space with ghost-zebra fill.
3. **Payroll Comparison** (`/home/:account/human_resources/payroll_comparison`) — navbar shows `[ By Department | By Employee ] [ Filters ]` in that order. Clicking segments updates `?view=by_task` / `?view=by_employee` and highlights the active segment via `bg-primary`. No inline toolbar strip above the grid.
4. **Scheduler / Payroll Comp Manager / Employee Review** — unchanged; already flex-filling.

## Self-Check

- `git log --oneline --all | grep d0e6988` — FOUND
- `git log --oneline --all | grep 1db4405` — FOUND
- `app/components/crud/housing-detail-view.tsx` — FOUND; no `Card` import; no `stats` / `maxBeds` / `tenantCount` / `availableBeds` locals; no `domLayout="autoHeight"`; tenants grid wrapped in `flex min-h-0 flex-1 flex-col`.
- `app/components/ag-grid/housing-map-view.tsx` — FOUND; no `Card` import; no `SummaryBar` component; grid wrapper fills area.
- `app/components/ag-grid/payroll-view-toggle.tsx` — FOUND; uses `createPortal` + `useNavbarFilterSlot`; all three data-test selectors present.
- `app/components/ag-grid/payroll-comparison-list-view.tsx` — FOUND; no `{/* Toolbar */}` block; `<PayrollViewToggle />` renders before `<NavbarFilterButton />`.

## Self-Check: PASSED
