# Testing

This document covers the testing infrastructure, patterns, and current state of testing in the aloha-app codebase.

## Overview

The project has two testing layers:

1. **E2E tests** -- Playwright browser tests in `e2e/`
2. **Database tests** -- pgTAP via `supabase db test` (infrastructure present, no tests written yet)

There are currently **no unit tests** or **integration tests** at the TypeScript level. No Jest, Vitest, or other unit test runner is configured.

## E2E Tests (Playwright)

### Setup

- **Location:** `e2e/` (separate package with its own `package.json`)
- **Config:** `e2e/playwright.config.ts`
- **Test directory:** `e2e/tests/`
- **Package name:** `web-e2e`
- **Dependency:** `@playwright/test ^1.57.0`

### Configuration Details

```typescript
// e2e/playwright.config.ts
{
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,        // fail build if test.only left in CI
  retries: process.env.CI ? 2 : 1,     // retry once locally, twice in CI
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'on',
    navigationTimeout: 15_000,
  },
  timeout: 120_000,                     // 2 minute test timeout
  expect: { timeout: 30_000 },          // 30 second assertion timeout
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
}
```

The dev server is started conditionally via `PLAYWRIGHT_SERVER_COMMAND` env var. If not set, Playwright expects the app to already be running on port 5173.

### Running Tests

```bash
# From the e2e/ directory:
cd e2e

# Run all tests (stops on first failure)
pnpm test
# Equivalent to: playwright test --max-failures=1

# Run tests with interactive UI
pnpm test:ui
# Equivalent to: playwright test --ui

# View HTML report from last run
pnpm report
# Equivalent to: playwright show-report
```

From the root, Turborepo delegates:

```bash
pnpm test    # Runs turbo test, which runs e2e tests
```

### Test File Organization

```
e2e/
  package.json
  playwright.config.ts
  tests/
    authentication/
      auth.po.ts           # Page Object for auth flows
```

**Current state:** Only one page object file exists (`auth.po.ts`). No actual test spec files (`.spec.ts` or `.test.ts`) are present. The testing infrastructure is set up but the test suite has not been written yet.

### Page Object Pattern

Page objects encapsulate page interactions behind a class API:

```typescript
// e2e/tests/authentication/auth.po.ts
import { Page, expect } from '@playwright/test';

export class AuthPageObject {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  goToSignIn() {
    return this.page.goto('/auth/sign-in');
  }

  async signIn(params: { email: string; password: string }) {
    await this.page.waitForTimeout(500);
    await this.page.fill('input[name="email"]', params.email);
    await this.page.fill('input[name="password"]', params.password);
    await this.page.click('button[type="submit"]');
  }

  async signOut() {
    await this.page.click('[data-test="account-dropdown-trigger"]');
    await this.page.click('[data-test="account-dropdown-sign-out"]');
  }
}
```

Conventions:
- File suffix: `.po.ts`
- Class name: `XxxPageObject`
- Constructor takes Playwright `Page`
- Methods return promises for async interactions
- Uses `data-test` attributes as selectors (set in component code)

### data-test Attributes

Components include `data-test` attributes for E2E targeting:

```tsx
<button data-test="auth-submit-button" />
<div data-test="sub-module-list" />
<table data-test="crud-data-table" />
<body data-test="root-error-boundary" />
<button data-test="account-dropdown-trigger" />
```

The CLAUDE.md guideline states: "Add `data-test` for E2E tests where appropriate."

## Database Tests (pgTAP)

### Infrastructure

- Supabase CLI supports `supabase db test` which runs pgTAP tests
- The command is configured in `package.json`:

```bash
pnpm supabase:test    # Equivalent to: supabase db test
```

### Current State

**No database tests exist.** The `supabase/tests/` directory does not exist. The pgTAP testing infrastructure is available via the Supabase CLI but has not been utilized.

### Expected Pattern (for future tests)

pgTAP tests would live in `supabase/tests/` as `.sql` files:

```sql
-- supabase/tests/rls_test.sql
BEGIN;
SELECT plan(2);

SELECT has_table('public', 'org', 'org table exists');
SELECT has_column('public', 'org', 'id', 'org has id column');

SELECT * FROM finish();
ROLLBACK;
```

## Unit / Integration Tests

### Current State

**No unit or integration test runner is configured.** There are no:
- Vitest or Jest configuration files
- `.test.ts` or `.spec.ts` files (outside of e2e)
- Test utilities or mocking helpers for TypeScript code
- Component tests (no testing-library/react)

### Implications

All business logic in service files, CRUD helpers, and workspace loaders is untested at the unit level. Validation is covered only insofar as Zod schemas parse correctly at runtime.

## CI Integration

### Current State

**No CI pipeline is configured.** There is no `.github/workflows/` directory or equivalent CI configuration file in the repository.

The Playwright config does check for a `CI` environment variable to adjust behavior:
- `forbidOnly: !!process.env.CI` -- prevents `test.only` from passing in CI
- `retries: process.env.CI ? 2 : 1` -- more retries in CI
- `workers: process.env.CI ? 1 : undefined` -- single worker in CI

This indicates CI was anticipated but not yet set up.

## Test Coverage Gaps

### Critical gaps (no automated tests):

1. **Authentication flows** -- Page object exists but no test specs use it
2. **CRUD operations** -- `crudCreateAction`, `crudUpdateAction`, `crudDeleteAction`, `crudTransitionAction` have no tests
3. **Workspace loaders** -- `loadOrgWorkspace`, `requireModuleAccess` untested
4. **RLS policies** -- 91+ tables with RLS policies, no pgTAP tests verify them
5. **Form validation** -- Zod schemas are defined but not tested in isolation
6. **API routes** -- `/api/ai/chat`, `/api/db/webhook`, etc. have no integration tests

### Recommended priorities:

1. **pgTAP tests for RLS policies** -- Verify org-scoped data isolation, the most critical security property
2. **E2E auth flow** -- Complete the auth test spec using the existing page object
3. **E2E CRUD flow** -- Test list/create/edit/delete through the workspace UI
4. **Unit tests for CRUD helpers** -- `loadTableData`, `crudCreateAction`, etc. with a mocked Supabase client
5. **CI pipeline** -- GitHub Actions workflow running typecheck, lint, and tests on PR

## Commands Summary

```bash
# E2E tests
cd e2e && pnpm test          # Run Playwright tests
cd e2e && pnpm test:ui       # Interactive Playwright UI
cd e2e && pnpm report        # View HTML report

# Database tests
pnpm supabase:test           # Run pgTAP tests (none exist yet)

# Code quality (not tests, but related)
pnpm typecheck               # TypeScript type checking
pnpm lint                    # ESLint
pnpm format                  # Prettier check
```
