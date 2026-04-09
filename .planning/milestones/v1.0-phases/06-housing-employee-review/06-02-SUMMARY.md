---
phase: 06-housing-employee-review
plan: 02
subsystem: ui
tags: [ag-grid, crud, housing, api, detail-row, react]

requires:
  - phase: 06-housing-employee-review
    provides: app_hr_housing view with tenant_count and available_beds, org_site max_beds column
  - phase: 01-ag-grid-foundation
    provides: AG Grid infrastructure, column-mapper, detail row pattern
provides:
  - Housing CRUD config with AG Grid columns and detail row expansion
  - /api/housing-tenants endpoint for tenant data
  - Housing category auto-resolution on create
affects: [06-03, 06-04]

tech-stack:
  added: []
  patterns: [generatePk-for-text-pk-auto-slugify, server-side-category-resolution-for-create]

key-files:
  created:
    - app/lib/crud/hr-housing.config.ts
    - app/routes/api/housing-tenants.ts
  modified:
    - app/lib/crud/registry.ts
    - app/routes/workspace/sub-module-create.tsx
    - app/routes.ts
    - app/components/ag-grid/housing-detail-row.tsx

key-decisions:
  - "generatePk slugifies housing name for org_site text PK (avoids requiring user to provide ID)"
  - "Server-side org_site_category_id resolution in sub-module-create action prevents client tampering"
  - "HousingDetailRow fetches tenants via API on expand (same pattern as HoursDetailInner)"

patterns-established:
  - "Server-side FK resolution for create actions when category/type must be auto-set"
  - "generatePk pattern for CRUD configs writing to text-PK tables"

requirements-completed: [HOUS-01, HOUS-02, HOUS-03]

duration: 3min
completed: 2026-04-09
---

# Phase 6 Plan 2: Housing CRUD Config and Tenant Detail Row Summary

**Housing AG Grid config with occupancy columns, tenant detail row via API fetch, and auto-resolved category on create**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-09T05:00:00Z
- **Completed:** 2026-04-09T05:03:28Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created housing CRUD config with 4 AG Grid columns (name, max beds, tenants, available beds) reading from app_hr_housing view
- Built HousingDetailRow component that fetches and renders tenant list with avatar, name, department, start date, work auth
- Added /api/housing-tenants API endpoint querying hr_employee by site_id with department and work auth joins
- Auto-resolve org_site_category_id for housing creates so users never see the category field

## Task Commits

Each task was committed atomically:

1. **Task 1: Housing CRUD config with AG Grid columns and registry entry** - `9e823f4` (feat)
2. **Task 2: Housing detail row component and tenants API route** - `6923cbe` (feat)

## Files Created/Modified
- `app/lib/crud/hr-housing.config.ts` - Housing CRUD config with agGrid viewType, colDefs, formFields, generatePk
- `app/components/ag-grid/housing-detail-row.tsx` - Detail row fetching tenants via /api/housing-tenants on expand
- `app/routes/api/housing-tenants.ts` - API route returning employees assigned to a housing site
- `app/lib/crud/registry.ts` - Added housing slug to CRUD registry
- `app/routes/workspace/sub-module-create.tsx` - Added housing category ID auto-resolution for creates
- `app/routes.ts` - Registered /api/housing-tenants API route

## Decisions Made
- Used generatePk to auto-slugify housing name for org_site text PK (org-site.config requires user to type ID manually; housing auto-generates)
- Server-side org_site_category_id resolution in create action (threat T-06-06: not client-provided)
- HousingDetailRow follows same useEffect+fetch pattern as HoursDetailInner for consistency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added generatePk for text PK auto-generation**
- **Found during:** Task 1
- **Issue:** org_site has text PK but plan's formFields didn't include an id field; creates would fail without a PK
- **Fix:** Added generatePk that slugifies the housing name
- **Files modified:** app/lib/crud/hr-housing.config.ts
- **Committed in:** 9e823f4

**2. [Rule 3 - Blocking] Registered API route in routes.ts**
- **Found during:** Task 2
- **Issue:** API route file alone isn't routable without registration in routes.ts
- **Fix:** Added route entry for api/housing-tenants
- **Files modified:** app/routes.ts
- **Committed in:** 6923cbe

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for functionality. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Housing submodule fully wired: grid, detail row, create/edit forms, API
- Ready for Plan 03 (employee review config) and Plan 04 (verification)

---
*Phase: 06-housing-employee-review*
*Completed: 2026-04-09*
