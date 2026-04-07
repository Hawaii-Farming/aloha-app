---
phase: quick
plan: 260407-ekz
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/tests/00060-auth-trigger.sql
  - supabase/tests/00070-rls-app-navigation.sql
  - app/lib/crud/__tests__/crud-helpers.test.ts
  - vitest.config.ts
  - e2e/tests/crud/crud-flows.spec.ts
  - e2e/tests/crud/crud.po.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "pgTAP tests verify auth auto-link trigger fires on INSERT with confirmed email, skips when email_confirmed_at is NULL, links across multiple orgs, and logs to auth_link_log"
    - "pgTAP tests verify RLS on app_navigation view returns rows only for the calling user's orgs"
    - "Unit tests verify sanitizeSearch strips PostgREST delimiters, sort column whitelist rejects unknown columns, and filter params are validated"
    - "E2E tests verify CRUD list view loads, search filters rows, create form submits, and delete action works"
  artifacts:
    - path: "supabase/tests/00060-auth-trigger.sql"
      provides: "pgTAP tests for auth auto-link trigger and audit log"
    - path: "supabase/tests/00070-rls-app-navigation.sql"
      provides: "pgTAP tests for app_navigation view tenant isolation"
    - path: "app/lib/crud/__tests__/crud-helpers.test.ts"
      provides: "Unit tests for sanitizeSearch, sort whitelist, filter validation"
    - path: "vitest.config.ts"
      provides: "Vitest test runner configuration"
    - path: "e2e/tests/crud/crud-flows.spec.ts"
      provides: "E2E tests for CRUD list, search, create, delete"
    - path: "e2e/tests/crud/crud.po.ts"
      provides: "Page object for CRUD E2E interactions"
  key_links:
    - from: "supabase/tests/00060-auth-trigger.sql"
      to: "supabase/migrations/20260401000141_auth_auto_link_employee.sql"
      via: "Tests trigger by inserting into auth.users"
      pattern: "INSERT INTO auth\\.users"
    - from: "app/lib/crud/__tests__/crud-helpers.test.ts"
      to: "app/lib/crud/crud-helpers.server.ts"
      via: "Imports and tests sanitizeSearch and loadTableData logic"
      pattern: "sanitizeSearch|loadTableData"
---

<objective>
Add three categories of tests covering PR #6 changes: pgTAP database tests for the auth auto-link trigger and RLS policies, Vitest unit tests for CRUD filter/search handling, and Playwright E2E tests for CRUD flows.

Purpose: Establish test coverage for the auth trigger (email gate, multi-org linking, audit log), RLS tenant isolation on app_navigation, CRUD helper input sanitization, and end-to-end CRUD workflows.
Output: 5 new test files + vitest configuration
</objective>

<execution_context>
@.claude/skills/postgres-expert/SKILL.md
@.claude/skills/playwright-e2e/SKILL.md
</execution_context>

<context>
@supabase/tests/00000-test-helpers.sql
@supabase/tests/00020-rls-positive-access.sql
@supabase/migrations/20260401000141_auth_auto_link_employee.sql
@supabase/migrations/20260401000142_app_views.sql
@app/lib/crud/crud-helpers.server.ts
@e2e/playwright.config.ts
@e2e/tests/authentication/auth.po.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: pgTAP tests for auth trigger and app_navigation RLS</name>
  <files>supabase/tests/00060-auth-trigger.sql, supabase/tests/00070-rls-app-navigation.sql</files>
  <action>
Create two pgTAP test files following the exact patterns in 00000-test-helpers.sql and 00020-rls-positive-access.sql.

**File: supabase/tests/00060-auth-trigger.sql** — Auth auto-link trigger tests.
Wrap in BEGIN/ROLLBACK. Use `create_test_user()`, `create_test_org()`, `create_test_employee()` helpers from 00000.

Test cases (plan ~10 tests):
1. **email_confirmed_at NULL skips link**: Create an hr_employee with company_email 'unconfirmed@test.com' in 'acme-farms'. Insert into auth.users with email 'unconfirmed@test.com' but email_confirmed_at = NULL. Assert hr_employee.user_id IS STILL NULL. Assert auth_link_log has NO row for this user.
2. **email_confirmed_at NOT NULL links**: Create hr_employee with company_email 'confirmed@test.com' in 'acme-farms'. Insert into auth.users with email 'confirmed@test.com' AND email_confirmed_at = now(). Assert hr_employee.user_id = the new auth user's UUID. Assert auth_link_log has exactly 1 row with correct auth_user_id and employee_id.
3. **Multi-org link**: Create hr_employee rows in BOTH 'acme-farms' AND 'kona-coffee' with the same company_email 'multi@test.com'. Insert confirmed auth.users with that email. Assert BOTH hr_employee rows have user_id set. Assert auth_link_log has 2 rows.
4. **No matching employee — no link, no log**: Insert confirmed auth.users with email 'nobody@test.com' (no hr_employee has this company_email). Assert auth_link_log has 0 rows for this user.
5. **Backfill safety — already linked employee not overwritten**: Create hr_employee with company_email 'taken@test.com' and user_id already set to some UUID. Insert NEW auth.users with email 'taken@test.com'. Assert hr_employee.user_id is UNCHANGED (still the original UUID). The `AND user_id IS NULL` guard prevents overwrite.
6. **UPDATE trigger fires on email confirmation**: Insert auth.users with email_confirmed_at = NULL (unconfirmed). Create matching hr_employee. Assert not linked. Then UPDATE auth.users SET email_confirmed_at = now(). Assert hr_employee.user_id is now set. Assert auth_link_log has 1 row.
7. **auth_link_log not accessible to authenticated role**: Use test_as_user() to impersonate, then SELECT from auth_link_log should fail (no grant).

For auth.users inserts, use the FULL column list from create_test_user() helper but do it inline (not via the helper) because we need to control email_confirmed_at (NULL vs now()). Copy the column list from create_test_user and adjust email_confirmed_at per test.

Use fresh UUIDs per test case (e.g., '11111111-1111-1111-1111-111111111001'::uuid for test 1, etc.).

Create test employees with IDs like 'emp-trigger-01', 'emp-trigger-02', etc. Use existing orgs 'acme-farms' and 'kona-coffee' from seed data (they are created in the test helpers/earlier test files).

**File: supabase/tests/00070-rls-app-navigation.sql** — app_navigation view tenant isolation.
Wrap in BEGIN/ROLLBACK. Plan ~5 tests:
1. Seed user (a1b2c3d4-...) sees app_navigation rows for acme-farms
2. Seed user sees app_navigation rows for kona-coffee (multi-org)
3. Isolated user (b2c3d4e5-...) sees ONLY kona-coffee navigation rows
4. Isolated user sees ZERO acme-farms rows in app_navigation
5. Unknown user sees ZERO rows in app_navigation

Create the isolated user and employee using the helpers (same pattern as 00020). The seed user and orgs already exist from prior test files.
  </action>
  <verify>
    <automated>cd /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app && pnpm supabase:test 2>&1 | tail -30</automated>
  </verify>
  <done>All pgTAP tests pass. Auth trigger tests cover: email gate (NULL skips, NOT NULL links), multi-org linking, no-match no-log, backfill safety, UPDATE trigger, and audit log access denial. App_navigation tests confirm tenant-scoped view isolation.</done>
</task>

<task type="auto">
  <name>Task 2: Vitest unit tests for CRUD helper sanitization and validation</name>
  <files>vitest.config.ts, app/lib/crud/__tests__/crud-helpers.test.ts</files>
  <action>
**Step 1: Install vitest** — Run `pnpm add -D vitest` at the workspace root.

**Step 2: Create vitest.config.ts** at project root:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['app/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '~': '/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/app',
    },
  },
});
```
Use a relative `./app` path for the alias, not absolute. The alias resolves `~/` imports used by crud-helpers.server.ts.

**Step 3: Create app/lib/crud/__tests__/crud-helpers.test.ts** — Tests for the pure functions and logic in crud-helpers.server.ts.

Since `sanitizeSearch` is not exported, and `loadTableData` requires a Supabase client, the approach is:
- Extract `sanitizeSearch` test by importing the module and testing the behavior through `loadTableData` with a mock client, OR
- Recommend exporting `sanitizeSearch` for testability and test it directly.

Preferred approach: **Export `sanitizeSearch` from crud-helpers.server.ts** (add `export` keyword to the function declaration). Then test directly.

Also update the `.server.ts` file to export `sanitizeSearch` — add `export` before `function sanitizeSearch`.

Test cases for sanitizeSearch (~6 tests):
1. Strips parentheses: `sanitizeSearch('foo(bar)')` returns `'foobar'`
2. Strips commas: `sanitizeSearch('foo,bar')` returns `'foobar'`
3. Strips asterisks: `sanitizeSearch('foo*bar')` returns `'foobar'`
4. Trims whitespace: `sanitizeSearch('  hello  ')` returns `'hello'`
5. Passes through clean input: `sanitizeSearch('normal search')` returns `'normal search'`
6. Handles empty string: `sanitizeSearch('')` returns `''`
7. Strips mixed delimiters: `sanitizeSearch('a(b,c)*d')` returns `'abcd'`

Test cases for column whitelist / sort validation (~4 tests):
Since `loadTableData` needs a Supabase client, create a minimal mock that captures the `.order()` and `.or()` calls. Use `vi.fn()` to create a chainable mock Supabase client.

1. **Sort falls back to default when column not in whitelist**: Call loadTableData with searchParams `sort=evil_column`, allowedColumns `['name']`, defaultSort `{ column: 'created_at', ascending: false }`. Assert the mock's `.order()` was called with `'created_at'`.
2. **Sort honors whitelisted column**: Call with searchParams `sort=name`, allowedColumns `['name']`. Assert `.order()` called with `'name'`.
3. **Filter params rejected when column not in whitelist**: Call with searchParams `filter_evil=value`, allowedColumns `['name']`. Assert `.eq()` was NOT called with `'evil'`.
4. **Filter params accepted when column is whitelisted**: Call with searchParams `filter_name=John`, allowedColumns `['name']`. Assert `.eq()` was called with `'name', 'John'`.

The mock Supabase client should be a chainable object where each method returns itself, and the final result returns `{ data: [], count: 0, error: null }`. Pattern:
```typescript
function createMockClient() {
  const calls: { method: string; args: unknown[] }[] = [];
  const chain = new Proxy({} as any, {
    get: (_, prop) => {
      if (prop === 'then') return undefined; // not a promise
      return (...args: unknown[]) => {
        calls.push({ method: String(prop), args });
        // 'range' is the last call before awaiting
        if (prop === 'range') {
          return Promise.resolve({ data: [], count: 0, error: null });
        }
        return chain;
      };
    },
  });
  return { client: { from: () => chain }, calls };
}
```

**Step 4: Add test script** — Add `"test:unit": "vitest run"` to package.json scripts.
  </action>
  <verify>
    <automated>cd /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app && pnpm vitest run --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>Vitest runs and all unit tests pass. sanitizeSearch strips PostgREST delimiters (parentheses, commas, asterisks). Sort validation falls back to default for unknown columns. Filter params are rejected when not in allowedColumns whitelist.</done>
</task>

<task type="auto">
  <name>Task 3: Playwright E2E tests for CRUD list, search, create, and delete flows</name>
  <files>e2e/tests/crud/crud.po.ts, e2e/tests/crud/crud-flows.spec.ts</files>
  <action>
Create E2E tests for CRUD flows using the HR Departments module (simplest config, fewest required fields — just `name`).

**File: e2e/tests/crud/crud.po.ts** — Page object for CRUD interactions:
```typescript
import { Page, expect } from '@playwright/test';

export class CrudPageObject {
  constructor(private readonly page: Page) {}

  /** Navigate to a specific sub-module list view */
  async goToSubModule(account: string, module: string, subModule: string) {
    await this.page.goto(`/home/${account}/${module}/${subModule}`);
    await this.page.waitForLoadState('networkidle');
  }

  /** Get the data table container */
  get table() {
    return this.page.locator('table');
  }

  /** Get visible table rows (tbody tr) */
  get tableRows() {
    return this.page.locator('table tbody tr');
  }

  /** Type into the search input */
  async search(query: string) {
    const searchInput = this.page.getByPlaceholder(/search/i);
    await searchInput.fill(query);
    // Wait for table to update (debounced search triggers navigation)
    await this.page.waitForLoadState('networkidle');
  }

  /** Click the Create button to open the sheet */
  async openCreateSheet() {
    await this.page.getByRole('button', { name: /create/i }).click();
    // Wait for sheet to slide in
    await expect(this.page.locator('[role="dialog"]')).toBeVisible();
  }

  /** Fill a form field by label */
  async fillField(label: string, value: string) {
    await this.page.getByLabel(label, { exact: false }).fill(value);
  }

  /** Submit the form in the sheet */
  async submitForm() {
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.getByRole('button', { name: /save|create|submit/i }).click();
  }

  /** Select a row by clicking its checkbox */
  async selectRow(index: number) {
    await this.tableRows.nth(index).locator('input[type="checkbox"]').check();
  }

  /** Click the bulk delete button */
  async bulkDelete() {
    await this.page.getByRole('button', { name: /delete/i }).click();
    // Confirm dialog if present
    const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }
}
```

**File: e2e/tests/crud/crud-flows.spec.ts** — Test flows:

Prerequisites: The app must be running at localhost:5173 with a signed-in user who has access to the HR module in acme-farms. Use the AuthPageObject to sign in first.

Import AuthPageObject from `../authentication/auth.po`. Use test credentials from the seed data (the user whose email matches an hr_employee with company_email in acme-farms).

Determine the correct test credentials: Check `.env` or `.env.template` for test user email/password. If unavailable, use a `test.beforeAll` that signs in and stores the auth state.

Test cases:
1. **CRUD list view loads with data**: Navigate to `/home/acme-farms/human_resources/departments`. Assert the table is visible. Assert at least 1 row exists (seed data has 5 departments).
2. **Search filters table rows**: Type a department name into search. Assert the visible rows are filtered (row count changes or specific text visible).
3. **Create new record via sheet form**: Click Create button. Fill in the `name` field with a unique test value (e.g., `E2E Test Dept ${Date.now()}`). Submit. Assert the new record appears in the table OR a success toast appears.
4. **Delete record via bulk action**: Select the row containing the test record just created. Click delete. Assert the row is removed from the table OR row count decreases.

Use `test.describe.serial()` so tests run in order (create before delete).

The account slug for the URL is the org `id` from the database. Based on the seed data pattern, try 'acme-farms'. The module slug is 'human_resources', sub-module is 'departments'.

Handle auth: In `test.beforeAll`, use AuthPageObject to sign in. Store the authenticated page context. Sign-in credentials should be read from environment or use the seed user email that matches hr_employee company_email in acme-farms.

NOTE: Since the app runs against hosted Supabase (not local), E2E tests require valid credentials. Add a `.env` check at the top of the spec — if `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` are not set, skip the test suite with `test.skip()`. Document this in a comment.
  </action>
  <verify>
    <automated>cd /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/e2e && npx playwright test tests/crud/ --reporter=list 2>&1 | tail -20</automated>
  </verify>
  <done>E2E test files exist with proper page object pattern. Tests cover list view loading, search filtering, record creation via sheet form, and bulk delete. Tests are gated by env vars for credentials and skip gracefully if not configured.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Test env only | All tests run against local Supabase (pgTAP) or dev instance (E2E); no production exposure |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | I (Information Disclosure) | E2E test credentials | mitigate | Read from env vars, never hardcode; .env excluded from git via .gitignore |
| T-quick-02 | T (Tampering) | sanitizeSearch bypass | accept | Unit tests confirm current regex strips known PostgREST delimiters; additional chars can be added if discovered |
</threat_model>

<verification>
1. `pnpm supabase:test` passes all pgTAP tests including new 00060 and 00070 files
2. `pnpm vitest run` passes all CRUD helper unit tests
3. `cd e2e && npx playwright test tests/crud/` runs (passes if credentials configured, skips gracefully otherwise)
4. `pnpm typecheck` still passes (no type errors introduced)
</verification>

<success_criteria>
- 7+ pgTAP tests for auth trigger (email gate, multi-org, backfill safety, UPDATE trigger, audit log)
- 5+ pgTAP tests for app_navigation RLS tenant isolation
- 10+ unit tests for sanitizeSearch and column whitelist/sort/filter validation
- 4 E2E tests for CRUD list, search, create, delete flows
- All existing tests continue to pass
</success_criteria>

<output>
After completion, create `.planning/quick/260407-ekz-add-tests-for-pr-6-pgtap-for-auth-trigge/260407-ekz-SUMMARY.md`
</output>
