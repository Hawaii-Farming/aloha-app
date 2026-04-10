import { expect, test } from '@playwright/test';

/**
 * Phase 10 Wave 0 — GRID-02 regression guard.
 * Tag: @phase10 @grid-sizing
 *
 * Asserts every HR grid fills its container (bounding height > 300px).
 * Every case is marked `test.fail()` until Plan 10-02 fixes
 * `app/routes/workspace/layout.tsx` `<main>` `min-h-0` chain.
 */

const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

const HR_MODULE_PATHS: ReadonlyArray<{ name: string; path: string }> = [
  { name: 'Employee Register', path: 'hr/hr_employee_register' },
  { name: 'Scheduler', path: 'hr/hr_scheduler' },
  { name: 'Time Off', path: 'hr/hr_time_off' },
  { name: 'Payroll', path: 'hr/hr_payroll' },
  { name: 'Hours Comparison', path: 'hr/hr_hours_comparison' },
  { name: 'Housing', path: 'hr/hr_housing' },
  { name: 'Employee Review', path: 'hr/hr_employee_review' },
  { name: 'Departments', path: 'human_resources/departments' },
];

test.describe('@phase10 @grid-sizing — HR grids fill their container', () => {
  for (const mod of HR_MODULE_PATHS) {
    test(`${mod.name} grid height > 300px`, async ({ page }) => {
      test.fail(true, 'Wave 0 red — GRID-02 not yet fixed');

      await page.goto(`/home/${ACCOUNT_SLUG}/${mod.path}`);
      const grid = page
        .locator('[data-test="ag-grid-wrapper"], .ag-root-wrapper')
        .first();
      await expect(grid).toBeVisible();
      const box = await grid.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThan(300);
    });
  }
});
