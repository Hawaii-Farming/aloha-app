---
phase: quick
plan: 260407-ekz
subsystem: testing
tags: [pgtap, vitest, playwright, auth-trigger, rls, crud]
dependency_graph:
  requires: []
  provides: [auth-trigger-tests, rls-navigation-tests, crud-unit-tests, crud-e2e-tests]
  affects: [supabase/tests, app/lib/crud, e2e/tests]
tech_stack:
  added: [vitest]
  patterns: [pgtap-trigger-testing, mock-supabase-client, playwright-page-object]
key_files:
  created:
    - supabase/tests/00060-auth-trigger.sql
    - supabase/tests/00070-rls-app-navigation.sql
    - app/lib/crud/__tests__/crud-helpers.test.ts
    - vitest.config.ts
    - e2e/tests/crud/crud-flows.spec.ts
    - e2e/tests/crud/crud.po.ts
  modified:
    - app/lib/crud/crud-helpers.server.ts
    - package.json
    - pnpm-lock.yaml
decisions:
  - Exported sanitizeSearch from crud-helpers.server.ts for direct unit testing
  - Used Proxy-based mock Supabase client to test loadTableData sort/filter validation
  - E2E tests gated by E2E_USER_EMAIL/E2E_USER_PASSWORD env vars for credential safety
metrics:
  duration: 268s
  completed: "2026-04-07"
  tasks: 3
  files: 9
---

# Quick Task 260407-ekz: Add Tests for PR #6 Summary

pgTAP auth trigger tests (email gate, multi-org, backfill safety, UPDATE flow), app_navigation RLS isolation tests, Vitest unit tests for sanitizeSearch and sort/filter whitelist, Playwright E2E CRUD flow tests with page object pattern.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | pgTAP tests for auth trigger and app_navigation RLS | 658bec0 | supabase/tests/00060-auth-trigger.sql, supabase/tests/00070-rls-app-navigation.sql |
| 2 | Vitest unit tests for CRUD helper sanitization and validation | 744f4ef | vitest.config.ts, app/lib/crud/__tests__/crud-helpers.test.ts |
| 3 | Playwright E2E tests for CRUD list, search, create, delete | 7196ceb | e2e/tests/crud/crud-flows.spec.ts, e2e/tests/crud/crud.po.ts |

## Test Coverage Summary

### pgTAP (15 tests across 2 files)

**00060-auth-trigger.sql (10 tests):**
- Unconfirmed email skips link (user_id stays NULL, no log row)
- Confirmed email links employee (user_id set, 1 log row)
- Multi-org link (both employees linked, 2 log rows)
- No matching employee produces no log entries
- Backfill safety: already-linked employee not overwritten
- UPDATE trigger fires on email confirmation (unconfirmed -> confirmed)

**00070-rls-app-navigation.sql (5 tests):**
- Seed user sees acme-farms navigation rows
- Seed user sees kona-coffee navigation rows
- Isolated user sees kona-coffee navigation rows
- Isolated user sees 0 acme-farms rows
- Unknown user sees 0 total rows

### Vitest (11 tests)

**sanitizeSearch (7 tests):** Strips parentheses, commas, asterisks, mixed delimiters; trims whitespace; passes clean input; handles empty string.

**loadTableData sort/filter (4 tests):** Sort falls back to default for unknown columns; honors whitelisted columns; filter rejects non-whitelisted columns; filter accepts whitelisted columns.

### Playwright E2E (4 tests)

CRUD list view loads with data; search filters rows; create record via sheet form; delete record via bulk action. All gated by env vars.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unused import in test file**
- **Found during:** Task 2 (lint check)
- **Issue:** `vi` imported from vitest but never used
- **Fix:** Removed unused import
- **Files modified:** app/lib/crud/__tests__/crud-helpers.test.ts
- **Commit:** 2556c44

### Verification Gaps

- **pgTAP tests not verified**: Docker is not running, so `pnpm supabase:test` could not execute. Tests follow exact patterns from existing passing test files (00020, 00030, etc.) and should pass when Docker/Supabase is available.
- **E2E tests not verified**: Require running app + credentials. Tests skip gracefully when `E2E_USER_EMAIL`/`E2E_USER_PASSWORD` not set.
- **Vitest unit tests**: All 11 tests pass.
- **Typecheck**: Passes with no errors.

## Self-Check: PASSED

All created files exist. All commits verified.
