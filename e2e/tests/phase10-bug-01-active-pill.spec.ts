import { expect, test } from '@playwright/test';

/**
 * Phase 10 Wave 0 — BUG-01 regression guard.
 * Tag: @phase10 @bug-01-active-pill
 *
 * Expanded-mode module rows must:
 *   1. Navigate on click (URL actually changes to the module path).
 *   2. Immediately render the green gradient active pill when the
 *      current URL is under the module subtree.
 *
 * Root cause confirmed in 10-BUG-REPRO.md: expanded-mode uses
 * `<SidebarGroupLabel>` wrapping a nested `<Link>`, which (a) loses the
 * gradient utility classes to the primitive's base styles and (b) has its
 * click swallowed by the sibling `CollapsibleTrigger`. Fix lands in
 * Plan 10-05 (rebuild the expanded branch with `SidebarMenuButton asChild`).
 */

const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

test.describe('@phase10 @bug-01-active-pill — module row navigates + highlights', () => {
  test('clicking a module row changes the URL', async ({ page }) => {
    await page.goto(`/home/${ACCOUNT_SLUG}/`);
    const sidebar = page.locator('aside, [data-sidebar="sidebar"]').first();
    const moduleRow = sidebar
      .getByRole('link', { name: /hr|human resources/i })
      .first();
    await moduleRow.click();
    await expect(page).toHaveURL(
      new RegExp(`/home/${ACCOUNT_SLUG}/(hr|human_resources)`),
    );
  });

  test('module row shows gradient pill immediately when URL matches', async ({
    page,
  }) => {
    await page.goto(`/home/${ACCOUNT_SLUG}/hr/hr_employee_register`);
    const sidebar = page.locator('aside, [data-sidebar="sidebar"]').first();
    const activeModuleRow = sidebar
      .locator('[data-active="true"], .bg-gradient-to-r')
      .first();
    await expect(activeModuleRow).toBeVisible();
    const backgroundImage = await activeModuleRow.evaluate(
      (el) => window.getComputedStyle(el).backgroundImage,
    );
    expect(backgroundImage).toContain('linear-gradient');
    // Green channel (rgb[..22, 197, 94..] = from-green-500) should appear.
    expect(backgroundImage).toMatch(/rgb\(\s*(22|34|74)/);
  });
});
