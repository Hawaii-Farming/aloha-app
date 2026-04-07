---
phase: quick
plan: 260407-e8h
subsystem: type-safety
tags: [typescript, supabase, type-guards, refactor]

provides:
  - "typed-query.server.ts helpers: castRows, castRow, queryUntypedView, isErrorWithCode"
  - "type-guards.ts shared client/server type guard utilities"
  - "SupabaseClient<Database> used consistently across CRUD helpers"
affects: [crud, workspace, auth]

tech-stack:
  added: []
  patterns: ["Centralized boundary casts via typed-query helpers instead of inline as unknown as"]

key-files:
  created:
    - app/lib/crud/typed-query.server.ts
    - app/lib/type-guards.ts
  modified:
    - app/lib/crud/crud-helpers.server.ts
    - app/lib/crud/load-form-options.server.ts
    - app/lib/workspace/org-workspace-loader.server.ts
    - app/lib/workspace/require-module-access.server.ts
    - app/lib/workspace/home-loader.server.ts
    - app/routes/workspace/module.tsx
    - app/routes/workspace/sub-module.tsx
    - app/routes/workspace/sub-module-detail.tsx
    - app/routes/workspace/sub-module-create.tsx
    - app/components/crud/card-detail-view.tsx
    - app/components/crud/create-panel.tsx
    - app/components/auth/update-password-form.tsx

key-decisions:
  - "Keep crud-action.server.ts with unparameterized SupabaseClient since SupabaseClient<Database> is assignable to it"
  - "Use 'as never' on dynamic table names to satisfy SupabaseClient<Database> generic constraints"
  - "Create shared type-guards.ts (non-server) for client-accessible type guards"
  - "Use JSON-compatible Record types for fetcher.submit data instead of Record<string, unknown>"

patterns-established:
  - "castRows/castRow for Supabase query results: centralized boundary cast in typed-query.server.ts"
  - "queryUntypedView for views not in generated Database type"
  - "isErrorWithCode type guard for safe error narrowing"

requirements-completed: []

duration: 7min
completed: 2026-04-07
---

# Quick Task 260407-e8h: Fix Type Safety Summary

**Eliminated all 19 inline `as unknown as` casts across 11 app files by creating typed-query helpers and fixing SupabaseClient parameter types**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-07T15:20:20Z
- **Completed:** 2026-04-07T15:27:24Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Created `typed-query.server.ts` with `castRows`, `castRow`, `queryUntypedView`, and `isErrorWithCode` helpers that encapsulate all Supabase boundary casts in one place
- Updated all CRUD helper and workspace loader parameter types to use `SupabaseClient<Database>` consistently, removing 5 client-level casts from route files
- Fixed 3 `fetcher.submit` casts by typing callback parameters with JSON-compatible Record types
- Replaced unsafe error cast in `update-password-form.tsx` with proper `isErrorWithCode` type guard

## Task Commits

Each task was committed atomically:

1. **Task 1: Create typed-query helper and fix server-side casts** - `2ddcbb3` (refactor)
2. **Task 2: Fix fetcher.submit casts and error type guard** - `380353a` (refactor)

## Files Created/Modified

- `app/lib/crud/typed-query.server.ts` - Centralized typed helpers for Supabase query result casting
- `app/lib/type-guards.ts` - Shared client/server type guard utilities
- `app/lib/crud/crud-helpers.server.ts` - Updated client type to SupabaseClient<Database>, replaced inline casts
- `app/lib/crud/load-form-options.server.ts` - Updated client type, replaced inline casts
- `app/lib/workspace/org-workspace-loader.server.ts` - Replaced untyped client pattern with queryUntypedView
- `app/lib/workspace/require-module-access.server.ts` - Updated client type, replaced row casts with castRow
- `app/lib/workspace/home-loader.server.ts` - Replaced inline cast with castRows
- `app/routes/workspace/module.tsx` - Replaced untyped client + result casts with queryUntypedView + castRows
- `app/routes/workspace/sub-module.tsx` - Removed SupabaseClient cast on loadFormOptions call
- `app/routes/workspace/sub-module-detail.tsx` - Removed SupabaseClient cast on loadFormOptions call
- `app/routes/workspace/sub-module-create.tsx` - Removed SupabaseClient cast, fixed fetcher.submit type
- `app/components/crud/card-detail-view.tsx` - Fixed fetcher.submit payload type
- `app/components/crud/create-panel.tsx` - Fixed fetcher.submit data type
- `app/components/auth/update-password-form.tsx` - Replaced unsafe error cast with type guard

## Decisions Made

- Kept `crud-action.server.ts` with unparameterized `SupabaseClient` since `SupabaseClient<Database>` is assignable to it (covariant generic), avoiding unnecessary churn
- Used `as never` on dynamic table name strings to satisfy `SupabaseClient<Database>` generic constraint (centralized in typed-query.server.ts `queryUntypedView` helper)
- Created `type-guards.ts` as a non-server file so `isErrorWithCode` can be used in client components
- Used `Record<string, string | number | boolean | null>` for fetcher.submit callbacks to match React Router's `JsonObject` type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated crud-action.server.ts dynamic table names**
- **Found during:** Task 1
- **Issue:** After updating crud-helpers to use `SupabaseClient<Database>`, the `.from(tableName)` calls with dynamic strings failed typecheck since the string isn't a known table in the Database type
- **Fix:** Added `as never` cast on dynamic table name parameters in crud-helpers and load-form-options (not in crud-action since it kept unparameterized client)
- **Files modified:** app/lib/crud/crud-helpers.server.ts, app/lib/crud/load-form-options.server.ts
- **Committed in:** 2ddcbb3

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Necessary to maintain typecheck passing with the typed client. No scope creep.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

---
*Plan: quick-260407-e8h*
*Completed: 2026-04-07*

## Self-Check: PASSED
