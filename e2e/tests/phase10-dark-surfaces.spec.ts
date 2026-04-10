import { expect, test } from '@playwright/test';

/**
 * Phase 10 Wave 0 — DARK-03 regression guard.
 * Tag: @phase10 @dark-surfaces
 *
 * In dark mode the navbar and sidebar must render on slate-800 (#1e293b)
 * and visually differ from the body background (slate-900 #0f172a).
 * Current state: `--sidebar-background` collides with `--background`, so
 * the sidebar disappears into the page. Plan 10-03 fixes this.
 */

const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

const SLATE_800 = 'rgb(30, 41, 59)';
const SLATE_900 = 'rgb(15, 23, 42)';

test.describe('@phase10 @dark-surfaces — navbar + sidebar on elevated chrome', () => {
  test('dark-mode navbar and sidebar sit above the body surface', async ({
    page,
  }) => {
    test.fail(
      true,
      'Wave 0 red — DARK-03 sidebar/body collision not yet fixed',
    );

    await page.goto(`/home/${ACCOUNT_SLUG}/`);
    await page.evaluate(() => {
      window.localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.reload();

    const bodyBg = await page.evaluate(
      () => window.getComputedStyle(document.body).backgroundColor,
    );
    const navbarBg = await page
      .locator('nav, header[role="banner"]')
      .first()
      .evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const sidebarBg = await page
      .locator('aside, [data-sidebar="sidebar"]')
      .first()
      .evaluate((el) => window.getComputedStyle(el).backgroundColor);

    expect(bodyBg).toBe(SLATE_900);
    expect(navbarBg).toBe(SLATE_800);
    expect(sidebarBg).toBe(SLATE_800);
    expect(navbarBg).not.toBe(bodyBg);
    expect(sidebarBg).not.toBe(bodyBg);
  });
});
