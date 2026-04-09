---
phase: 02-scheduler
plan: 03
subsystem: ui
tags: [ag-grid, react, api-route, detail-rows, crud, scheduler]

requires:
  - phase: 02-scheduler-02
    provides: "SchedulerListView with weekly grid, week navigation, department filter, OT highlighting"
provides:
  - "Schedule history API route with detail and summary modes"
  - "Detail row expansion showing per-employee historical schedule entries"
  - "History/Schedule toggle view with aggregated summary"
  - "Create panel for new schedule entries"
affects: [03-time-off, scheduler]

tech-stack:
  added: []
  patterns:
    - "API route with mode parameter for multiple data shapes"
    - "Detail row fetches data on expand via client-side fetch"
    - "View mode toggle between primary grid and summary grid"

key-files:
  created:
    - app/routes/api/schedule-history.ts
  modified:
    - app/components/ag-grid/scheduler-list-view.tsx
    - app/routes.ts

key-decisions:
  - "Schedule history API uses mode param (detail/summary) to serve two data shapes from one endpoint"
  - "Detail row uses client-side fetch with useEffect (justified: data fetch on row expand)"
  - "History summary uses useEffect triggered by viewMode state change"

patterns-established:
  - "API route with mode-based branching for related data queries"
  - "ScheduleDetailRowInner as inner component capturing accountSlug via closure"

requirements-completed: [SCHED-05, SCHED-06, SCHED-08]

duration: 3min
completed: 2026-04-08
---

# Phase 02 Plan 03: Scheduler Detail Rows, History Toggle, and Create Panel Summary

**Schedule history API with per-employee detail expansion, date-aggregated summary toggle, and CreatePanel for new schedule entries**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-08T20:53:07Z
- **Completed:** 2026-04-08T20:56:04Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 3

## Accomplishments
- API route serving historical schedule data in detail mode (per employee) and summary mode (aggregated by date)
- Detail row expansion in SchedulerListView that fetches and displays employee schedule history on click
- History/Schedule toggle switching between weekly grid and aggregated summary view
- Create panel integrated for new schedule entry creation via side-panel form

## Task Commits

Each task was committed atomically:

1. **Task 1: Create API route for schedule history and add route entry** - `e14e353` (feat)
2. **Task 2: Add detail rows, history toggle, and create panel to SchedulerListView** - `efb58a0` (feat)
3. **Task 3: Visual verification of scheduler submodule** - auto-approved checkpoint

## Files Created/Modified
- `app/routes/api/schedule-history.ts` - API route with detail (per-employee history) and summary (by-date aggregation) modes
- `app/components/ag-grid/scheduler-list-view.tsx` - Updated with useDetailRow, history toggle, and CreatePanel
- `app/routes.ts` - Added schedule-history API route entry

## Decisions Made
- Schedule history API uses a single endpoint with `mode` query param to serve both detail and summary data shapes
- Detail row component uses client-side `fetch` + `useState`/`useEffect` rather than `useFetcher` for cleaner data isolation per expanded row
- History summary uses `useEffect` triggered by `viewMode` state change (justified: data fetch on view mode change)
- Cast `HistoryRow[]` via `unknown` to satisfy AG Grid's `Record<string, unknown>[]` type constraint

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed HistoryRow type cast for AG Grid**
- **Found during:** Task 2 (typecheck verification)
- **Issue:** TypeScript error: `HistoryRow[]` not assignable to `Record<string, unknown>[]` due to missing index signature
- **Fix:** Added `as unknown as RowData[]` cast on historyData passed to AgGridWrapper
- **Files modified:** app/components/ag-grid/scheduler-list-view.tsx
- **Verification:** `pnpm typecheck` passes
- **Committed in:** efb58a0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type cast fix required for TypeScript strict mode. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Scheduler submodule complete with all SCHED-01 through SCHED-08 requirements addressed
- Pattern established for API routes with mode-based data serving
- Ready for Phase 03 (time-off submodule)

---
*Phase: 02-scheduler*
*Completed: 2026-04-08*

## Self-Check: PASSED
