# Testing Patterns

**Analysis Date:** 2026-04-02

## Test Framework

**E2E Testing:**
- Framework: Playwright 1.57.x (`@playwright/test`)
- Config: `e2e/playwright.config.ts`
- Base URL: `http://localhost:5173` (dev server)
- Browsers: Chromium (desktop) configured; mobile browsers can be enabled
- Parallelization: Full parallel execution locally; single worker on CI
- Retries: 2 on CI, 1 locally
- Test timeout: 120 seconds
- Expect timeout: 30 seconds
- Screenshots: Captured on test failure only
- Trace: Enabled for failure debugging

**Database Testing:**
- Framework: pgTAP (PostgreSQL testing framework)
- Config: Via `supabase db test` command
- Tests: SQL files in `supabase/tests/` directory
- Execution: `pnpm supabase:test` runs all pgTAP tests

**Run Commands:**
```bash
# E2E tests
cd e2e && pnpm test                    # Run all E2E tests
cd e2e && pnpm test:ui                 # Interactive UI mode
cd e2e && pnpm report                  # View HTML report

# Database tests
pnpm supabase:test                     # Run all pgTAP tests

# Code quality
pnpm format                            # Check formatting
pnpm lint                              # Check linting
pnpm typecheck                         # Type checking
```

## E2E Test Organization

**Location:**
- Tests: `e2e/tests/` directory
- Page objects: `e2e/tests/[feature]/[feature].po.ts` — e.g., `e2e/tests/authentication/auth.po.ts`
- Test files: Organized by feature/module

**Naming:**
- Page object files: `kebab-case.po.ts` — e.g., `auth.po.ts`, `team-accounts.po.ts`
- Test spec files: Follow Playwright convention of `*.spec.ts` or `*.test.ts`

**Page Object Pattern:**
Page objects encapsulate UI interaction logic and element selectors:

```typescript
import { Page, expect } from '@playwright/test';

export class AuthPageObject {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goToSignIn() {
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

  async updatePassword(password: string) {
    await this.page.waitForTimeout(250);
    expect(async () => {
      await this.page.fill('[name="password"]', password);
      await this.page.fill('[name="repeatPassword"]', password);
      await this.page.click('[type="submit"]');
      await this.page.waitForTimeout(500);
    }).toPass();
  }
}
```

**Selector patterns:**
- `data-test` attributes: `[data-test="account-dropdown-trigger"]` — preferred for E2E
- Form inputs: `input[name="email"]`, `input[name="password"]`
- Buttons: `button[type="submit"]`, `a[href="/path"]`
- Custom queries for complex interactions

## Database Test Organization

**Location:**
- Tests: `supabase/tests/` directory with `.sql` extension
- Helpers: `supabase/tests/00000-test-helpers.sql` — loaded first (alphabetical order)
- Smoke test: `supabase/tests/00001-smoke-test.sql` — verifies pgTAP framework

**Test file execution order:**
- Alphabetical order by filename
- Helpers (00000) always load first
- Tests numbered to control dependency order

**pgTAP Test Structure:**

```sql
-- Test helpers for authentication and data setup
CREATE OR REPLACE FUNCTION test_as_user(user_uuid UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', user_uuid::text,
    'role', 'authenticated',
    'aud', 'authenticated'
  )::text, true);
  PERFORM set_config('role', 'authenticated', true);
END;
$$;

CREATE OR REPLACE FUNCTION test_as_anon()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{}'::text, true);
  PERFORM set_config('role', 'anon', true);
END;
$$;

-- Test data creation helpers
CREATE OR REPLACE FUNCTION create_test_user(p_uuid UUID, p_email TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, ...) 
  VALUES (p_uuid, p_email, ...) 
  ON CONFLICT (id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION create_test_org(p_id TEXT, p_name TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.org (id, name)
  VALUES (p_id, p_name)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Test execution
BEGIN;

SELECT plan(4);

-- Test 1: Verify extension exists
SELECT has_extension('pgtap', 'pgTAP extension is installed');

-- Test 2: Verify helper function exists
SELECT has_function('public', 'test_as_user', ARRAY['uuid'], 
  'test_as_user() helper function exists');

-- Test 3: Verify test data creation
SELECT has_function('public', 'create_test_user', ARRAY['uuid', 'text'],
  'create_test_user() function exists');

-- Test 4: Verify RLS helper
SELECT has_function('public', 'get_user_org_ids', '{}',
  'get_user_org_ids() RLS helper exists');

SELECT * FROM finish();

ROLLBACK;
```

**Key pgTAP patterns:**
- `SELECT plan(N)` — declare N tests in this suite
- `SELECT ok(condition, 'test description')` — basic assertion
- `SELECT is(actual, expected, 'test description')` — equality check
- `SELECT has_extension('name', 'description')` — extension check
- `SELECT has_function('schema', 'name', 'args', 'description')` — function check
- `SELECT * FROM finish()` — finalize test suite
- BEGIN/ROLLBACK block — isolate each test file (automatic rollback prevents side effects)
- `RESET ROLE` — return to postgres (superuser) context after `test_as_user()`

**RLS Testing patterns:**
```sql
-- Test read access via RLS
SELECT test_as_user('user-uuid'::uuid);
SELECT ok(
  (SELECT COUNT(*) FROM public.tablename WHERE org_id = 'test-org' > 0),
  'authenticated user can read org rows'
);
RESET ROLE;

-- Test write access
SELECT test_as_user('user-uuid'::uuid);
INSERT INTO public.tablename (org_id, name) VALUES ('test-org', 'Test Item');
RESET ROLE;

-- Test anonymous access blocked
SELECT test_as_anon();
SELECT throws_ok(
  $$ SELECT COUNT(*) FROM public.tablename $$,
  'access denied'
);
RESET ROLE;
```

## Test File Locations

**E2E test structure:**
```
e2e/
├── playwright.config.ts           # Playwright configuration
├── package.json                   # test, test:ui, report scripts
└── tests/
    └── authentication/
        ├── auth.po.ts             # Page object for auth flows
        └── [test files or subdirectories]
```

**Database test structure:**
```
supabase/
└── tests/
    ├── 00000-test-helpers.sql     # Reusable helpers (loaded first)
    ├── 00001-smoke-test.sql       # Verify pgTAP framework
    ├── 00002-test-rls-policies.sql
    └── [numbered test files]
```

## Mocking

**E2E Testing:**
- No mocking — tests run against real dev server with actual Supabase instance
- Database state set up via page object helper methods calling actual APIs

**API mocking (within tests):**
- Not currently used; actual API endpoints tested
- Supabase auth and database operations run against local Supabase (`supabase start`)

**Test data setup:**
- Created via helper functions in page objects (e.g., `signIn()` creates session)
- Database helpers (pgTAP) create test users and orgs via SQL functions

## Test Types

**Unit Tests:**
- Not extensively used in current codebase
- Supabase functions and RLS policies verified via pgTAP integration tests

**Integration Tests:**
- pgTAP database tests: Verify RLS policies, constraints, function behavior
- Focus on data layer and Row-Level Security enforcement
- Tests auth scenarios: user in org, user in different org, anonymous user

**E2E Tests:**
- Playwright tests in `e2e/tests/authentication/`
- Test complete user flows: sign-in, sign-out, password update
- Verify UI renders correctly and interactions work end-to-end
- Base URL: `http://localhost:5173` (local dev server required)

**Code Quality:**
- ESLint: `pnpm lint` — checks for style violations and best practices
- Prettier: `pnpm format` — verifies code formatting (fix with `pnpm format:fix`)
- TypeScript: `pnpm typecheck` — type safety checks across all packages
- No strict coverage requirements enforced in CI

## Common Patterns

**Async testing in Playwright:**

```typescript
// Wait for network and DOM
await page.waitForLoadState('networkidle');

// Wait for specific element
await page.waitForSelector('[data-test="element"]');

// Retry flaky assertions
await expect(async () => {
  // assertion or action that may flake
}).toPass();

// Custom wait
await page.waitForTimeout(500);
```

**Error/exception testing in pgTAP:**

```sql
-- Test that operation throws
SELECT throws_ok(
  $$ SELECT * FROM public.tablename WHERE org_id != user_org $$,
  'access denied',
  'RLS policy blocks cross-org access'
);

-- Test constraint violation
SELECT throws_ok(
  $$ INSERT INTO public.tablename (org_id, name) VALUES (NULL, 'Invalid') $$,
  'not-null',
  'org_id cannot be null'
);
```

**Failure modes:**
- Playwright retries 2x on CI, 1x locally before reporting failure
- Test timeout 120 seconds — long operations may timeout
- Screenshots auto-saved on failure to `test-results/` directory
- Trace files available for debugging failed tests

## Coverage

**Requirements:** No strict coverage targets enforced in CI.

**View coverage:** Not currently configured; would require adding Istanbul/c8 to test setup.

**Best practices:**
- Focus on critical user flows (E2E)
- Verify RLS policies and data constraints (pgTAP)
- Integration tests preferred over unit tests (better reflects real-world usage)
- Database tests verify business logic, not implementation details

## Running Tests Locally

**Setup:**
```bash
# Start Supabase (required for E2E and database tests)
pnpm supabase:start

# Install E2E dependencies
cd e2e && pnpm install

# Start dev server (required for E2E)
pnpm dev
```

**E2E:**
```bash
# Run all tests headless
cd e2e && pnpm test

# Interactive mode with live browser
cd e2e && pnpm test:ui

# View results
cd e2e && pnpm report
```

**Database:**
```bash
# Run all pgTAP tests
pnpm supabase:test

# Output shows pass/fail count and failures
```

**Code quality:**
```bash
# Check all
pnpm lint && pnpm format && pnpm typecheck

# Fix issues
pnpm lint:fix && pnpm format:fix
```

---

*Testing analysis: 2026-04-02*
