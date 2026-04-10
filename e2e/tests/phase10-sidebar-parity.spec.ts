import { expect, test } from '@playwright/test';

/**
 * Phase 10 Wave 0 — PARITY-01 + PARITY-04 regression guard.
 * Tag: @phase10 @sidebar-parity
 *
 * Asserts structural parity with the Aloha design prototype sidebar:
 *   - NAVIGATION and MODULES section labels
 *   - Separator between sections
 *   - Disabled "Focused" footer button
 *   - Sub-module rows carry the green-left rail (border-l-2)
 *   - Sub-module accordion has vertical margin above the first child
 */

const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

test.describe('@phase10 @sidebar-parity — structural sidebar parity', () => {
  test('sidebar contains NAVIGATION + MODULES headers with separator', async ({
    page,
  }) => {
    await page.goto(`/home/${ACCOUNT_SLUG}/`);
    const sidebar = page.locator('aside, [data-sidebar="sidebar"]').first();
    await expect(sidebar.getByText(/^NAVIGATION$/i)).toBeVisible();
    await expect(sidebar.getByText(/^MODULES$/i)).toBeVisible();
    const separators = sidebar.locator('[role="separator"], hr');
    expect(await separators.count()).toBeGreaterThanOrEqual(1);
  });

  test('sidebar footer exposes a disabled "Focused" button', async ({
    page,
  }) => {
    test.fail(true, 'Wave 0 red — PARITY-01 focused footer not yet added');

    await page.goto(`/home/${ACCOUNT_SLUG}/`);
    const focused = page
      .locator('aside, [data-sidebar="sidebar"]')
      .first()
      .getByRole('button', { name: /focused/i });
    await expect(focused).toBeVisible();
    await expect(focused).toHaveAttribute('aria-disabled', 'true');
  });

  test('active sub-module row carries border-l-2 rail', async ({ page }) => {
    test.fail(true, 'Wave 0 red — PARITY-04 rail not yet verified');

    await page.goto(`/home/${ACCOUNT_SLUG}/hr/hr_employee_register`);
    const sidebar = page.locator('aside, [data-sidebar="sidebar"]').first();
    const railWrapper = sidebar.locator('.border-l-2').first();
    await expect(railWrapper).toBeVisible();
  });

  test('sub-module accordion first child has >=4px top margin', async ({
    page,
  }) => {
    test.fail(true, 'Wave 0 red — PARITY-04 vertical gap not yet applied');

    await page.goto(`/home/${ACCOUNT_SLUG}/hr/hr_employee_register`);
    const sidebar = page.locator('aside, [data-sidebar="sidebar"]').first();
    const firstSubItem = sidebar
      .locator('[data-sidebar="menu-sub"] > :first-child')
      .first();
    const marginTop = await firstSubItem.evaluate(
      (el) => parseFloat(window.getComputedStyle(el).marginTop) || 0,
    );
    expect(marginTop).toBeGreaterThanOrEqual(4);
  });
});
