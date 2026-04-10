import { expect, test } from '@playwright/test';

/**
 * Phase 10 Wave 0 — BUG-02 regression guard.
 * Tag: @phase10 @bug-02-palette-nav
 *
 * Selecting a MODULE-level entry in the Cmd+K command palette must
 * navigate the app to that module's path. Current `navbar-search.tsx`
 * passes cmdk a `value` string that collides across module + sub-module
 * entries with matching prefixes; the dialog closes but the URL doesn't
 * change. Fix lands in Plan 10-05 (value = unique path, keywords for search).
 */

const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

test.describe('@phase10 @bug-02-palette-nav — palette module entry navigates', () => {
  test('selecting the HR module from Cmd+K changes the URL', async ({
    page,
  }) => {
    await page.goto(`/home/${ACCOUNT_SLUG}/`);

    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const input = dialog
      .getByRole('combobox')
      .or(dialog.locator('input'))
      .first();
    await input.fill('Employee');

    // Select the MODULE entry (first item that matches "HR" or "Human Resources",
    // not a sub-module). Use keyboard to avoid hover-state races.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(
      new RegExp(`/home/${ACCOUNT_SLUG}/(hr|human_resources)`),
    );
  });
});
