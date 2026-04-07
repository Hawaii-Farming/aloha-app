---
phase: quick
plan: 260407-f3m
description: "Fix test quality: E2E auth storageState, data-test selectors, clean unit mocks, pgTAP audit log RLS"
completed: "2026-04-07T15:57:48Z"
duration: "2m 26s"
tasks_completed: 3
tasks_total: 3
key_files:
  created:
    - e2e/auth.setup.ts
  modified:
    - e2e/playwright.config.ts
    - e2e/tests/crud/crud-flows.spec.ts
    - e2e/tests/crud/crud.po.ts
    - app/lib/crud/__tests__/crud-helpers.test.ts
    - supabase/tests/00060-auth-trigger.sql
    - .gitignore
---

# Quick Task 260407-f3m: Fix Test Quality Summary

Playwright storageState auth setup, data-test selectors in CRUD page object, typed mock factory replacing Proxy in unit tests, and pgTAP RLS test for auth_link_log.

## Tasks Completed

### Task 1: Fix E2E auth with Playwright storageState and update CRUD selectors
**Commit:** 5d727c6

- Created `e2e/auth.setup.ts` as Playwright globalSetup that authenticates once and saves cookies to `e2e/.auth/user.json`
- Updated `playwright.config.ts` with `globalSetup` and `storageState` configuration
- Removed `beforeAll` auth block and `AuthPageObject` import from `crud-flows.spec.ts`
- Replaced all fragile selectors in `crud.po.ts` with `data-test` attribute selectors (`crud-data-table`, `table-search`, `sub-module-create-button`, `create-panel`, `create-panel-submit`, `bulk-delete-button`)
- Added `e2e/.auth/` to `.gitignore`

### Task 2: Replace Proxy mock with typed factory in unit tests
**Commit:** b42ddbd

- Replaced `createMockClient()` Proxy-based mock with explicit `createMockSupabaseChain()` factory
- Factory returns properly typed `SupabaseClient<Database>` at the factory boundary
- Removed all `as never` casts from `loadTableData()` call sites
- All 11 unit tests pass

### Task 3: Add pgTAP test for auth_link_log RLS
**Commit:** de53b4f

- Bumped plan count from 10 to 12
- Added superuser assertion confirming auth_link_log rows exist (>= 3)
- Added authenticated role assertion confirming 0 rows visible (no SELECT grant)
- pgTAP tests could not be run (Supabase not running locally) but test follows established patterns

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan count adjusted from 11 to 12**
- **Found during:** Task 3
- **Issue:** Plan specified bumping to 11, but we added 2 new assertions (superuser row check + authenticated role check), making the total 12
- **Fix:** Set `SELECT plan(12)` instead of `SELECT plan(11)`

## Verification

- E2E TypeScript compiles without errors
- Unit tests: 11/11 passing (vitest)
- pgTAP: could not verify (Supabase not running); structurally correct
- No `Proxy` usage in test files
- No `as never` casts in test files
- `crud.po.ts` uses only `data-test` selectors for CRUD interactions

## Self-Check: PASSED

All created/modified files exist and all commits verified.
