---
phase: 04-payroll-views
plan: 01
subsystem: database, ui
tags: [ag-grid, postgresql, payroll, sql-views, column-groups]

# Dependency graph
requires:
  - phase: 01-ag-grid-foundation
    provides: AgGridWrapper, column-mapper, cell renderers, registry pattern
  - phase: 03-time-off
    provides: Custom loader pattern in sub-module.tsx, queryUntypedView usage
provides:
  - Four SQL views for payroll aggregation (by_task, by_employee, by_comp_manager, detail)
  - Pinned bottom row support in AgGridWrapper
  - ColGroupDef support in AgGridWrapper and CrudModuleConfig
  - Three payroll CRUD configs registered in registry
  - Generalized sub-module loader with payroll period/manager filtering
  - Currency and hours value formatters
affects: [04-02-payroll-comparison, 04-03-payroll-comp-manager, 04-04-payroll-data]

# Tech tracking
tech-stack:
  added: []
  patterns: [ColGroupDef column groups in AG Grid, pinnedBottomRowData for totals rows, slug-based custom loader branching]

key-files:
  created:
    - supabase/migrations/20260409000001_app_hr_payroll_views.sql
    - app/components/ag-grid/payroll-formatters.ts
    - app/lib/crud/hr-payroll-comparison.config.ts
    - app/lib/crud/hr-payroll-comp-manager.config.ts
    - app/lib/crud/hr-payroll-data.config.ts
    - app/components/ag-grid/payroll-comparison-list-view.tsx
    - app/components/ag-grid/payroll-comp-manager-list-view.tsx
  modified:
    - app/components/ag-grid/ag-grid-wrapper.tsx
    - app/lib/crud/types.ts
    - app/lib/crud/registry.ts
    - app/routes/workspace/sub-module.tsx

key-decisions:
  - "app_hr_payroll_by_task groups by department (not ops_task) since hr_payroll lacks task FK"
  - "app_hr_payroll_detail enumerates columns explicitly instead of SELECT p.* to avoid schema drift"
  - "Stub list views created for comparison and comp manager to unblock typecheck; replaced in Plans 02-03"
  - "Pay periods loaded as distinct values from hr_payroll for filter dropdowns in payroll submodules"
  - "Managers loaded from comp_manager view for payroll_comp_manager filter"

patterns-established:
  - "Slug-based custom loader branching: sub-module.tsx routes payroll_* slugs through slug-specific query logic"
  - "ColGroupDef column groups: hr-payroll-data.config uses AG Grid column groups for organized payroll columns"
  - "pinnedBottomRowData: AgGridWrapper passes through to AgGridReact for totals/summary rows"

requirements-completed: [PCMP-06, PMGR-04, PDAT-01, PDAT-02]

# Metrics
duration: 4min
completed: 2026-04-09
---

# Phase 04 Plan 01: Payroll Views Foundation Summary

**Four SQL payroll views, three CRUD configs with ColGroupDef column groups, and generalized sub-module loader for payroll period/manager filtering**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T01:51:27Z
- **Completed:** 2026-04-09T01:55:43Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Four SQL views created for payroll aggregation: by_task (department), by_employee, by_comp_manager, and full detail
- AgGridWrapper extended with pinnedBottomRowData and ColGroupDef support for totals rows and column groups
- Three payroll CRUD configs created and registered with custom view types
- Sub-module loader generalized from scheduler-only to support all payroll slugs with period/manager filtering

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL views and payroll value formatters** - `566506e` (feat)
2. **Task 2: Extend infrastructure, create configs, register slugs, generalize loader** - `1a27df5` (feat)

## Files Created/Modified
- `supabase/migrations/20260409000001_app_hr_payroll_views.sql` - Four payroll aggregation views
- `app/components/ag-grid/payroll-formatters.ts` - Currency and hours value formatters
- `app/components/ag-grid/ag-grid-wrapper.tsx` - Added pinnedBottomRowData and ColGroupDef support
- `app/lib/crud/types.ts` - Widened agGridColDefs to accept ColGroupDef
- `app/lib/crud/hr-payroll-comparison.config.ts` - Payroll comparison config (by_task/by_employee views)
- `app/lib/crud/hr-payroll-comp-manager.config.ts` - Comp manager config (by_comp_manager view)
- `app/lib/crud/hr-payroll-data.config.ts` - Payroll data config with 7 column groups
- `app/lib/crud/registry.ts` - Registered payroll_comparison, payroll_comp_manager, payroll_data
- `app/routes/workspace/sub-module.tsx` - Generalized custom loader for payroll slugs
- `app/components/ag-grid/payroll-comparison-list-view.tsx` - Stub (replaced in Plan 02)
- `app/components/ag-grid/payroll-comp-manager-list-view.tsx` - Stub (replaced in Plan 03)

## Decisions Made
- app_hr_payroll_by_task groups by department since hr_payroll has no task FK column
- app_hr_payroll_detail enumerates all columns explicitly instead of SELECT p.* for stability
- Created stub list view components to unblock typecheck; Plans 02-03 replace them
- Pay period and manager filter data loaded as distinct values in loader for dropdown support

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created stub list view components for typecheck**
- **Found during:** Task 2 (typecheck verification)
- **Issue:** Dynamic imports in configs referenced payroll-comparison-list-view and payroll-comp-manager-list-view which don't exist yet
- **Fix:** Created minimal stub components that display record count; will be replaced by Plans 02-03
- **Files modified:** app/components/ag-grid/payroll-comparison-list-view.tsx, app/components/ag-grid/payroll-comp-manager-list-view.tsx
- **Verification:** pnpm typecheck passes
- **Committed in:** 1a27df5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for typecheck to pass. Stubs are intentional placeholders replaced in Plans 02-03.

## Known Stubs

| File | Line | Reason |
|------|------|--------|
| app/components/ag-grid/payroll-comparison-list-view.tsx | 5-11 | Placeholder until Plan 04-02 builds full comparison grid |
| app/components/ag-grid/payroll-comp-manager-list-view.tsx | 5-11 | Placeholder until Plan 04-03 builds full comp manager grid |

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four SQL views ready for Plans 02-04 to query
- Three configs registered and routing through custom loader
- Plans 02-04 can build custom list views against real data
- pinnedBottomRowData and ColGroupDef infrastructure ready for totals rows

---
*Phase: 04-payroll-views*
*Completed: 2026-04-09*
