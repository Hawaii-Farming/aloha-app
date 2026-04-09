---
phase: 05-hours-comparison
plan: 02
subsystem: ui
tags: [ag-grid, hours-comparison, variance-highlighting, detail-rows, payroll]

requires:
  - phase: 05-hours-comparison/01
    provides: app_hr_hours_comparison SQL view with FULL OUTER JOIN of schedule vs payroll aggregates
provides:
  - CRUD config for payroll_hours slug with custom list view type
  - Registry entry mapping payroll_hours to hrPayrollHoursConfig
  - Loader branch with pay period filter and default period selection
  - PayrollHoursListView with variance highlighting, detail row expansion, pinned totals
affects: [05-hours-comparison/03, housing, employee-review]

tech-stack:
  added: []
  patterns: [api-fetch-in-detail-row, variance-cell-class-rules, hours-comparison-grid]

key-files:
  created:
    - app/lib/crud/hr-payroll-hours.config.ts
    - app/components/ag-grid/payroll-hours-list-view.tsx
  modified:
    - app/lib/crud/registry.ts
    - app/routes/workspace/sub-module.tsx

key-decisions:
  - "varianceHighlightCellClassRules(4, 0.01) for red >=4h and amber >0h variance thresholds"
  - "HoursDetailInner fetches /api/schedule-by-period on mount (justified useEffect for external data fetch)"
  - "canFetch guard avoids setState in effect body to satisfy react-hooks/set-state-in-effect lint rule"

patterns-established:
  - "API-fetch detail row: HoursDetailInner fetches schedule data on expand instead of pre-loading"
  - "Variance formatter with +/- prefix for positive/negative hour differences"

requirements-completed: [HCMP-01, HCMP-02, HCMP-03, HCMP-04]

duration: 3min
completed: 2026-04-09
---

# Phase 05 Plan 02: Hours Comparison UI Summary

**Hours Comparison AG Grid with pay period filter, variance highlighting (amber >0h, red >=4h), and API-driven daily schedule detail rows**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-09T03:56:42Z
- **Completed:** 2026-04-09T04:00:09Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- CRUD config registered for payroll_hours slug with custom list view and app_hr_hours_comparison view
- Full PayrollHoursListView with AG Grid: avatar, employee/dept, scheduled hours, payroll hours, variance columns
- Variance column highlights amber (>0h) and red (>=4h) using varianceHighlightCellClassRules
- Detail row expansion fetches /api/schedule-by-period for daily breakdown table with date, day, department, task, start/end time, hours
- Pay period filter with default-to-most-recent, search, CSV export, pinned totals row, column state persistence

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CRUD config, registry entry, and loader branch** - `2f2f587` (feat)
2. **Task 2: Create payroll-hours-list-view.tsx custom list view** - `ebdb820` (feat)

## Files Created/Modified
- `app/lib/crud/hr-payroll-hours.config.ts` - CRUD config with app_hr_hours_comparison view, custom list type, empty formFields
- `app/components/ag-grid/payroll-hours-list-view.tsx` - Full list view with variance highlighting, detail rows, pinned totals
- `app/lib/crud/registry.ts` - Added payroll_hours registry entry
- `app/routes/workspace/sub-module.tsx` - Added payroll_hours loader branch with period filter and default period

## Decisions Made
- Used varianceHighlightCellClassRules(4, 0.01) for thresholds: red at >=4h absolute variance, amber at >0h
- HoursDetailInner uses API fetch on mount (useEffect justified for external data sync) rather than pre-loading schedule data
- Initialized loading state conditionally with canFetch flag to avoid setState in effect body (react-hooks/set-state-in-effect rule)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed react-hooks/set-state-in-effect lint violation**
- **Found during:** Task 2 (PayrollHoursListView creation)
- **Issue:** setLoading(false) called directly in effect body for early return when params missing
- **Fix:** Introduced canFetch derived boolean, initialized loading state to canFetch value, guarded effect with if (!canFetch) return
- **Files modified:** app/components/ag-grid/payroll-hours-list-view.tsx
- **Verification:** eslint passes with no errors on the file
- **Committed in:** ebdb820 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor restructure for lint compliance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Hours Comparison submodule fully wired: config, registry, loader, and custom list view
- Ready for Plan 03 (verification/polish) or next phase
- /api/schedule-by-period endpoint (created in Plan 01) provides daily breakdown data

---
*Phase: 05-hours-comparison*
*Completed: 2026-04-09*
