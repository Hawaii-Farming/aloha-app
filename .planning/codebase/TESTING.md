# Testing Patterns

**Analysis Date:** 2026-04-07

## Test Framework

**Unit/Integration Test Runner:**
- Framework: Vitest 4.1.3
- Config: `vitest.config.ts` at root
- Environment: Node.js

**E2E Test Framework:**
- Framework: Playwright 1.57.x (`@playwright/test`)
- Config: `e2e/playwright.config.ts`
- Browser: Chromium (primary; Safari and Firefox commented out)
- Base URL: `http://localhost:5173`

**Database Tests:**
- Framework: Supabase pgTAP (PostgreSQL test framework)
- Location: `supabase/tests/` (SQL files)
- Run: `pnpm supabase:test`

## Run Commands

```bash
pnpm test:unit              # Run all Vitest unit tests
pnpm test                   # Run all test suites via turbo
pnpm supabase:test          # Run pgTAP database tests
```

## Test File Organization

**Unit Tests:**
- Location: `app/**/__tests__/**/*.test.ts` (co-located with source)
- Pattern: Vitest test files in `__tests__` directory alongside source code
- Example: `app/lib/crud/__tests__/crud-helpers.test.ts` for `app/lib/crud/crud-helpers.server.ts`
- Naming: `[module-name].test.ts`

**E2E Tests:**
- Location: `e2e/tests/[feature]/*.spec.ts`
- Pattern: Organize by feature (auth, crud, etc.)
- Examples: `e2e/tests/crud/crud-flows.spec.ts`, `e2e/tests/authentication/*`
- Naming: `[scenario].spec.ts`

**Page Objects:**
- Location: `e2e/tests/[feature]/[feature].po.ts`
- Pattern: Encapsulate page interactions and element locators
- Examples: `e2e/tests/crud/crud.po.ts`, `e2e/tests/authentication/auth.po.ts`
- Naming: `[page-name].po.ts` (page object)

**Database Tests:**
- Location: `supabase/tests/` (numbered SQL files)
- Pattern: SQL test files with pgTAP assertions
- Examples: `00010-rls-helper-functions.sql`, `00070-rls-app-navigation.sql`
- Naming: `[number]-[topic].sql` (number determines execution order)

## Unit Test Structure

**Test Suite Organization** from `app/lib/crud/__tests__/crud-helpers.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import { sanitizeSearch } from '../crud-helpers.server';

describe('sanitizeSearch', () => {
  it('strips parentheses', () => {
    expect(sanitizeSearch('foo(bar)')).toBe('foobar');
  });

  it('strips commas', () => {
    expect(sanitizeSearch('foo,bar')).toBe('foobar');
  });

  it('trims whitespace', () => {
    expect(sanitizeSearch('  hello  ')).toBe('hello');
  });

  it('passes through clean input', () => {
    expect(sanitizeSearch('normal search')).toBe('normal search');
  });
});

describe('loadTableData sort validation', () => {
  it('falls back to default sort when column not in whitelist', async () => {
    const { client, calls } = createMockSupabaseChain();
    const loadTableData = await getLoadTableData();
    
    await loadTableData({
      client,
      viewName: 'test_view',
      orgId: 'acme-farms',
      searchParams: new URLSearchParams('sort=evil_column'),
      allowedColumns: ['name'],
      defaultSort: { column: 'created_at', ascending: false },
    });
    
    const orderCall = calls.find((c) => c.method === 'order');
    expect(orderCall).toBeDefined();
    expect(orderCall!.args[0]).toBe('created_at');
  });
});
```

**Patterns:**
- `describe(...)` blocks organize related tests
- `it('description', ...)` for individual test cases
- Arrange-Act-Assert pattern (implicit in examples)
- Assertion library: Vitest built-in `expect()` (compatible with Jest)

## Mocking

**Mocking Strategy for Supabase Client:**

Use typed mock chain factories instead of Proxy-based mocks. Manually construct chainable objects that track method calls.

**Example** from `crud-helpers.test.ts`:
```typescript
function createMockSupabaseChain() {
  const calls: { method: string; args: unknown[] }[] = [];
  const chain: Record<string, (...args: unknown[]) => unknown> = {};

  const methods = ['select', 'eq', 'is', 'not', 'or', 'ilike', 'order', 'in'] as const;

  for (const method of methods) {
    chain[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return chain; // Return chain for method chaining
    };
  }

  chain.range = (...args: unknown[]) => {
    calls.push({ method: 'range', args });
    return Promise.resolve({ data: [], count: 0, error: null });
  };

  const client = {
    from: (table: string) => {
      calls.push({ method: 'from', args: [table] });
      return chain;
    },
  };

  return {
    client: client as unknown as SupabaseClient<Database>,
    calls,
  };
}
```

**What to Mock:**
- Supabase client methods (select, insert, update, delete)
- External API calls
- Event listeners (keyboard shortcuts, etc.)
- Timers when testing debounce/throttle behavior

**What NOT to Mock:**
- Zod schemas (validate real data)
- Helper utilities (use actual implementations)
- React Hook Form (test real form behavior)
- Shadcn UI components (integration with form library is critical)

**Dynamic Import for .server.ts Modules:**

Vitest can import `.server.ts` files directly, but async import is needed:
```typescript
async function getLoadTableData() {
  const mod = await import('../crud-helpers.server');
  return mod.loadTableData;
}

describe('loadTableData', () => {
  it('...', async () => {
    const loadTableData = await getLoadTableData();
    // Use loadTableData in test
  });
});
```

## E2E Test Structure

**Test Suite & Page Object Pattern** from `e2e/tests/crud/crud-flows.spec.ts`:
```typescript
import { expect, test } from '@playwright/test';
import { CrudPageObject } from './crud.po';

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;
const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

test.describe.serial('CRUD Flows — HR Departments', () => {
  // Skip entire suite if credentials not configured
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    'E2E_USER_EMAIL and E2E_USER_PASSWORD must be set',
  );

  const testDeptName = `E2E Test Dept ${Date.now()}`;

  test('CRUD list view loads with data', async ({ page }) => {
    const crud = new CrudPageObject(page);
    await crud.goToSubModule(ACCOUNT_SLUG, 'human_resources', 'departments');

    await expect(crud.table).toBeVisible();
    const rowCount = await crud.tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('search filters table rows', async ({ page }) => {
    const crud = new CrudPageObject(page);
    await crud.goToSubModule(ACCOUNT_SLUG, 'human_resources', 'departments');

    const initialCount = await crud.tableRows.count();
    await crud.search('zzz_no_match_expected');
    const filteredCount = await crud.tableRows.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('create new record via sheet form', async ({ page }) => {
    const crud = new CrudPageObject(page);
    await crud.goToSubModule(ACCOUNT_SLUG, 'human_resources', 'departments');

    await crud.openCreateSheet();
    await crud.fillField('Name', testDeptName);
    await crud.submitForm();

    await page.waitForLoadState('networkidle');
    const pageContent = page.locator('body');
    await expect(pageContent).toContainText(testDeptName, { timeout: 10_000 });
  });
});
```

**Patterns:**
- `test.describe.serial()` groups related tests, `.serial` runs in sequence (vs parallel)
- `test.skip()` gracefully skips entire suite if preconditions not met
- Page objects encapsulate locators and interactions — keeps tests readable
- `await page.waitForLoadState('networkidle')` waits for network activity to settle
- Test data isolation via unique suffixes (e.g., `Date.now()`)

**Configuration** from `e2e/playwright.config.ts`:
- Test timeout: 120 seconds
- Expect timeout: 30 seconds
- Retry: 2 times on CI, 1 time locally
- Screenshots: captured on failure only
- Trace: recorded on failure
- Auth state reused via `storageState: 'e2e/.auth/user.json'`
- Global setup: `auth.setup` for authentication before tests

## Page Objects

**Pattern** from `e2e/tests/crud/crud.po.ts`:
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
    return this.page.locator('[data-test="crud-data-table"]');
  }

  /** Get visible table rows (tbody tr) */
  get tableRows() {
    return this.page.locator('[data-test="crud-data-table"] tbody tr');
  }

  /** Type into the search input */
  async search(query: string) {
    const searchInput = this.page.locator('[data-test="table-search"]');
    await searchInput.fill(query);
    await this.page.waitForLoadState('networkidle');
  }

  /** Click the Create button to open the sheet */
  async openCreateSheet() {
    await this.page.locator('[data-test="sub-module-create-button"]').click();
    await expect(
      this.page.locator('[data-test="create-panel"]'),
    ).toBeVisible();
  }

  /** Fill a form field by label */
  async fillField(label: string, value: string) {
    await this.page.getByLabel(label, { exact: false }).fill(value);
  }

  /** Submit the form in the sheet */
  async submitForm() {
    await this.page.locator('[data-test="create-panel-submit"]').click();
  }
}
```

**Principles:**
- Encapsulate page structure behind named getter methods
- Use `data-test` attributes for element queries (not CSS selectors or text)
- Methods describe user actions, not implementation
- Example: `await crud.openCreateSheet()` instead of `await page.click('[class*="create"]')`

## Fixtures and Factories

**Test Data Creation:**

No explicit factory library used. Test data created inline or via mock functions:

**Mock Chain Factory** (see Mocking section above):
```typescript
function createMockSupabaseChain() {
  // Returns { client, calls } with tracked method invocations
}
```

**E2E Test Data:**
- Via environment variables (E2E_USER_EMAIL, E2E_USER_PASSWORD, E2E_ACCOUNT_SLUG)
- Via unique suffixes (e.g., `Date.now()` for record names)
- No persistent test database setup — relies on existing seed data

**Test User Data:**
- Configured via environment variables in CI
- Seed user has `hr_employee` record in test org (e.g., `acme-farms`)
- Location: `.env` for local development, CI secrets for CI/CD

## Async Testing

**Pattern:**
- Use `async`/`await` in test functions
- Vitest and Playwright both handle promise-based assertions
- Example:
  ```typescript
  it('should load data', async () => {
    const { client, calls } = createMockSupabaseChain();
    const loadTableData = await getLoadTableData();
    
    await loadTableData({ client, viewName: 'test_view', ... });
    
    const orderCall = calls.find((c) => c.method === 'order');
    expect(orderCall).toBeDefined();
  });
  ```

## Error Testing

**Error Assertion Pattern:**
```typescript
it('rejects filter when column not in whitelist', async () => {
  const { client, calls } = createMockSupabaseChain();
  const loadTableData = await getLoadTableData();

  await loadTableData({
    client,
    viewName: 'test_view',
    orgId: 'acme-farms',
    searchParams: new URLSearchParams('filter_evil=value'),
    allowedColumns: ['name'],
  });

  // eq is called for org_id and is_deleted, but NOT for 'evil'
  const eqCalls = calls.filter((c) => c.method === 'eq');
  const evilCall = eqCalls.find((c) => c.args[0] === 'evil');
  expect(evilCall).toBeUndefined();
});
```

**Patterns:**
- Use `.toBeUndefined()`, `.toThrow()`, `.rejects` for error cases
- Validate preconditions NOT violated (e.g., evil column was not added to whitelist)
- Mock Supabase to check query construction (defensive validation)

## Coverage

**Coverage Requirements:** Not enforced by tooling

**View Coverage:**
```bash
# Coverage not currently tracked in vitest config
# To enable: Add coverage options to vitest.config.ts
```

**Test Coverage Gap:**
- Unit tests cover CRUD helpers, form validation, and utility functions
- E2E tests cover CRUD flows (list, search, create, delete), auth
- Database tests cover RLS policies and helper functions
- Missing: Component rendering tests, React hook tests (useEffect, useState interactions)

## Test Types

**Unit Tests:**
- Scope: Individual functions and modules (CRUD helpers, validation, sanitization)
- Approach: Isolate function via mocking dependencies
- Examples: `crud-helpers.test.ts` tests `sanitizeSearch()` and `loadTableData()` with mock Supabase chain
- Location: `app/**/__tests__/**/*.test.ts`

**Integration Tests:**
- Scope: Multi-unit interactions (form submission → fetch → state update)
- Approach: Use real form library, mock external services
- Examples: Mock Supabase chain in CRUD tests, verify method call sequence
- Not explicitly separated from unit tests in codebase

**E2E Tests:**
- Scope: Full user workflows (navigate, fill form, submit, verify result)
- Approach: Real browser, real app server, real database (if available)
- Examples: `crud-flows.spec.ts` tests create/search/delete workflows
- Database Tests via pgTAP:
  - Scope: RLS policies, view contracts, database functions
  - Examples: `00010-rls-helper-functions.sql` tests access control functions
  - Pattern: Use test helpers to impersonate users, assert policy behavior

## Common Patterns

**Vitest Setup:**
- No setup files or global fixtures
- Imports done per-test file
- Tests are independent and can run in parallel
- Config: `vitest.config.ts` with Node environment and path alias resolution

**Playwright Setup:**
- Global setup via `e2e/auth.setup` — runs before all tests to authenticate
- Tests reuse auth state from `e2e/.auth/user.json`
- Web server started automatically if `PLAYWRIGHT_SERVER_COMMAND` env var set
- Config sets 2-minute timeout, 30-second expect timeout

**Waiting Strategies:**
- `await page.waitForLoadState('networkidle')` — wait for network activity to settle
- `await expect(element).toBeVisible()` — poll element visibility
- Explicit timeouts when needed: `expect(..., { timeout: 10_000 })`

**Test Data Isolation:**
- E2E tests use unique record names (e.g., `Date.now()`) to avoid conflicts
- Serial test execution (`test.describe.serial`) ensures order for dependent tests
- No explicit teardown — relies on soft-delete (is_deleted = true) in database

---

*Testing analysis: 2026-04-07*
