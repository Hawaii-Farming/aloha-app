import { expect, test } from '@playwright/test';

/**
 * Phase 10 Wave 0 — GRID-03 regression guard.
 * Tag: @phase10 @toolbar-search
 *
 * The CRUD toolbar search input currently inherits `rounded-2xl` (16px)
 * from the Phase 8 Shadcn Input primitive. Phase 10 overrides it to
 * `rounded-md` (6px). Until Plan 10-02 lands, this spec is expected to fail.
 */

const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

test.describe('@phase10 @toolbar-search — CRUD toolbar search rounded-md', () => {
  test('search input border-radius equals 6px (rounded-md)', async ({
    page,
  }) => {
    test.fail(true, 'Wave 0 red — GRID-03 not yet fixed');

    await page.goto(`/home/${ACCOUNT_SLUG}/hr/hr_employee_register`);
    const search = page
      .locator(
        '[data-test="toolbar-search-input"], [data-test="crud-search-input"], input[placeholder*="earch"]',
      )
      .first();
    await expect(search).toBeVisible();
    const borderRadius = await search.evaluate(
      (el) => window.getComputedStyle(el).borderRadius,
    );
    expect(borderRadius).toBe('6px');
    expect(borderRadius).not.toBe('16px');
  });
});
