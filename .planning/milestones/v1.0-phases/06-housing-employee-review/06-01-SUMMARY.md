---
phase: 06-housing-employee-review
plan: 01
subsystem: database
tags: [postgresql, migration, rls, views, housing, employee-review]

requires:
  - phase: 01-ag-grid-foundation
    provides: AG Grid infrastructure for rendering views
provides:
  - org_site.max_beds column for housing capacity
  - app_hr_housing view with tenant_count and available_beds
  - hr_employee_review table with score columns, generated average, RLS
  - app_hr_employee_reviews view with employee/lead/department joins
affects: [06-02, 06-03, 06-04]

tech-stack:
  added: []
  patterns: [generated-column-for-computed-average, check-constraints-for-score-validation]

key-files:
  created:
    - supabase/migrations/20260411000001_org_site_max_beds.sql
    - supabase/migrations/20260411000002_app_hr_housing.sql
    - supabase/migrations/20260411000003_hr_employee_review.sql
    - supabase/migrations/20260411000004_app_hr_employee_reviews.sql
  modified: []

key-decisions:
  - "GENERATED ALWAYS AS STORED for average column prevents client-side tampering"
  - "CHECK constraints (BETWEEN 1 AND 3) enforce score bounds at DB level"
  - "Named FK constraints for hr_employee_review_employee and hr_employee_review_lead for PostgREST disambiguation"

patterns-established:
  - "Generated columns for computed aggregates that must not be user-editable"
  - "Category-filtered views (housing category filter via org_site_category join)"

requirements-completed: [HOUS-04, EREV-05]

duration: 2min
completed: 2026-04-09
---

# Phase 6 Plan 1: Housing & Employee Review Database Migrations Summary

**4 SQL migrations: org_site max_beds column, app_hr_housing occupancy view, hr_employee_review table with scored averages and RLS, app_hr_employee_reviews display view**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T04:56:30Z
- **Completed:** 2026-04-09T04:57:52Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added max_beds column to org_site for housing capacity tracking
- Created app_hr_housing view computing tenant_count and available_beds from hr_employee site assignments
- Created hr_employee_review table with 4 score columns (1-3 CHECK), generated average, unique quarter constraint, named FKs, and org-scoped RLS
- Created app_hr_employee_reviews view joining employee name/photo, department, work authorization, and lead name

## Task Commits

Each task was committed atomically:

1. **Task 1: Housing schema migrations (max_beds + view)** - `5184ca9` (feat)
2. **Task 2: Employee review table + view migrations** - `0418536` (feat)

## Files Created/Modified
- `supabase/migrations/20260411000001_org_site_max_beds.sql` - ALTER TABLE org_site ADD max_beds INTEGER
- `supabase/migrations/20260411000002_app_hr_housing.sql` - Housing view with tenant_count and available_beds
- `supabase/migrations/20260411000003_hr_employee_review.sql` - Employee review table with scores, RLS, indexes
- `supabase/migrations/20260411000004_app_hr_employee_reviews.sql` - Employee reviews display view with joins

## Decisions Made
- GENERATED ALWAYS AS STORED for average column -- cannot be tampered with via INSERT/UPDATE (threat T-06-02)
- CHECK constraints BETWEEN 1 AND 3 on all score columns for DB-level validation (threat T-06-03)
- Named FK constraints (fk_hr_employee_review_employee, fk_hr_employee_review_lead) for PostgREST disambiguation
- Unique constraint on (org_id, hr_employee_id, review_year, review_quarter) prevents duplicate reviews

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 migration files ready for `supabase db push`
- Config plans (06-02) can now reference app_hr_housing and app_hr_employee_reviews views
- UI plans (06-03, 06-04) can build on these views for AG Grid display

---
*Phase: 06-housing-employee-review*
*Completed: 2026-04-09*
