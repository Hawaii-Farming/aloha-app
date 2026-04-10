import { expect, test } from '@playwright/test';

/**
 * Phase 10 Wave 0 — PARITY-03 regression guard.
 * Tag: @phase10 @avatar-initials
 *
 * The navbar avatar AND the sidebar-footer profile menu avatar must both
 * render the org-derived initials ("HF" for "Hawaii Farming"). Until
 * Plan 10-04 ships `get-org-initials.ts` and threads it through the
 * navbar + sidebar footer, this spec is expected to fail.
 *
 * Requires the E2E fixture user to belong to an org whose name resolves
 * to the expected initials (defaulting to "HF" via E2E_EXPECTED_INITIALS).
 */

const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';
const EXPECTED = process.env.E2E_EXPECTED_INITIALS ?? 'HF';

test.describe('@phase10 @avatar-initials — avatars render org initials', () => {
  test('navbar avatar fallback renders org initials', async ({ page }) => {
    await page.goto(`/home/${ACCOUNT_SLUG}/`);
    const navbarAvatar = page
      .locator('nav')
      .first()
      .locator(
        '[data-test="workspace-navbar-avatar"], [data-slot="avatar-fallback"]',
      )
      .first();
    await expect(navbarAvatar).toHaveText(EXPECTED);
  });

  test('sidebar footer profile avatar renders org initials', async ({
    page,
  }) => {
    await page.goto(`/home/${ACCOUNT_SLUG}/`);
    const sidebarAvatar = page
      .locator('aside, [data-sidebar="sidebar"]')
      .first()
      .locator('[data-slot="avatar-fallback"]')
      .first();
    await expect(sidebarAvatar).toHaveText(EXPECTED);
  });
});
