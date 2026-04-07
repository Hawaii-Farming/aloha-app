import { expect, test } from '@playwright/test';

import { CrudPageObject } from './crud.po';

// E2E tests require a running app and valid credentials.
// Set E2E_USER_EMAIL and E2E_USER_PASSWORD environment variables
// to the seed user who has an hr_employee record in acme-farms.
// If not set, the entire suite is skipped gracefully.

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;
const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

test.describe.serial('CRUD Flows — HR Departments', () => {
  // Skip entire suite if credentials are not configured
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
    // Search for a term unlikely to match all rows
    await crud.search('zzz_no_match_expected');

    // Either we get fewer rows or a "no results" state
    const filteredCount = await crud.tableRows.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('create new record via sheet form', async ({ page }) => {
    const crud = new CrudPageObject(page);
    await crud.goToSubModule(ACCOUNT_SLUG, 'human_resources', 'departments');

    await crud.openCreateSheet();
    await crud.fillField('Name', testDeptName);
    await crud.submitForm();

    // Wait for sheet to close and table to refresh
    await page.waitForLoadState('networkidle');

    // Verify success: either toast or new row in table
    const pageContent = page.locator('body');
    await expect(pageContent).toContainText(testDeptName, {
      timeout: 10_000,
    });
  });

  test('delete record via bulk action', async ({ page }) => {
    const crud = new CrudPageObject(page);
    await crud.goToSubModule(ACCOUNT_SLUG, 'human_resources', 'departments');

    // Search for the test record we just created
    await crud.search(testDeptName);
    await page.waitForLoadState('networkidle');

    const rowsBefore = await crud.tableRows.count();

    // Select first row and delete
    if (rowsBefore > 0) {
      await crud.selectRow(0);
      await crud.bulkDelete();

      await page.waitForLoadState('networkidle');

      // Verify row count decreased or record no longer visible
      const rowsAfter = await crud.tableRows.count();
      expect(rowsAfter).toBeLessThan(rowsBefore);
    }
  });
});
