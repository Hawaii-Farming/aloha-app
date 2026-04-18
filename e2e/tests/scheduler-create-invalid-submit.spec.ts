import { expect, test } from '@playwright/test';

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;
const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

test.describe('Scheduler — silent-submit regression', () => {
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    'E2E_USER_EMAIL and E2E_USER_PASSWORD must be set',
  );

  test('invalid Create submit surfaces a toast (not silent)', async ({
    page,
  }) => {
    await page.goto(`/home/${ACCOUNT_SLUG}/scheduler/scheduler`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-test="sub-module-create-button"]').click();
    await expect(page.locator('[data-test="create-panel"]')).toBeVisible();

    let networkRequestFired = false;
    const listener = (req: import('@playwright/test').Request) => {
      if (req.url().includes('/scheduler/scheduler/create')) {
        networkRequestFired = true;
      }
    };
    page.on('request', listener);

    await page.locator('[data-test="create-panel-submit"]').click();

    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5_000 });
    await expect(toast).toContainText(/required|fix|highlighted/i);

    expect(networkRequestFired).toBe(false);

    page.off('request', listener);
  });
});
