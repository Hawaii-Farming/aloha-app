---
phase: 03-time-off
plan: 01
subsystem: database
tags: [postgresql, sql-view, rls, supabase, time-off]

requires:
  - phase: 01-ag-grid-foundation
    provides: AG Grid infrastructure and loadTableData compatibility pattern
provides:
  - app_hr_time_off_requests SQL view with employee-joined columns
  - RLS policies on hr_time_off_request (read/insert/update)
affects: [03-time-off plan 02 (route/loader), 03-time-off plan 03 (grid/CRUD)]

tech-stack:
  added: []
  patterns: [employee-joined view with NULL::DATE end_date for loadTableData compatibility]

key-files:
  created:
    - supabase/migrations/20260408000002_app_hr_time_off_requests_view.sql
    - supabase/migrations/20260408000003_hr_time_off_request_rls.sql
  modified: []

key-decisions:
  - "LEFT JOIN for nullable FKs (department, work_auth, comp_manager, reviewed_by); INNER JOIN for non-null FKs (hr_employee_id, requested_by)"
  - "NULL::DATE AS end_date added for loadTableData compatibility per Phase 1 pattern"

patterns-established:
  - "Time off view pattern: join hr_employee for name/photo, department, work auth, comp manager, plus requested_by/reviewed_by name resolution"

requirements-completed: [TOFF-01]

duration: 1min
completed: 2026-04-09
---

# Phase 03 Plan 01: Time Off SQL View and RLS Summary

**SQL view app_hr_time_off_requests joining employee profile, department, work auth, comp manager, and request/review names with org-scoped RLS policies**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-09T00:14:47Z
- **Completed:** 2026-04-09T00:15:52Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created app_hr_time_off_requests view with 7 JOINs resolving all employee-related fields
- Added NULL::DATE AS end_date for loadTableData compatibility
- Enabled RLS on hr_time_off_request with org-scoped read/insert/update policies
- Mitigated threat T-03-01 (information disclosure) and T-03-02 (tampering)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create app_hr_time_off_requests SQL view migration** - `d79344d` (feat)
2. **Task 2: Create RLS policies for hr_time_off_request table** - `689ad94` (feat)

## Files Created/Modified
- `supabase/migrations/20260408000002_app_hr_time_off_requests_view.sql` - SQL view joining hr_time_off_request with hr_employee, department, work auth, comp manager, requested_by, reviewed_by
- `supabase/migrations/20260408000003_hr_time_off_request_rls.sql` - RLS policies (read/insert/update) and GRANT for hr_time_off_request

## Decisions Made
- LEFT JOIN for nullable FKs (department, work_authorization, compensation_manager, reviewed_by); INNER JOIN for non-null FKs (hr_employee_id, requested_by) -- matches table constraints
- NULL::DATE AS end_date column added for loadTableData compatibility, following the pattern established in Phase 2 scheduler views

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Docker not running so `pnpm supabase:reset` could not verify migrations apply cleanly. SQL follows exact patterns from existing migrations and supabase/CLAUDE.md conventions, so syntax correctness is high confidence.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- View and RLS ready for Plan 02 (route/loader wiring) to query app_hr_time_off_requests via queryUntypedView
- Plan 03 (AG Grid component) can use the view columns for column definitions

---
*Phase: 03-time-off*
*Completed: 2026-04-09*
