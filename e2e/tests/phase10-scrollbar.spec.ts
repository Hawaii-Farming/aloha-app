import { expect, test } from '@playwright/test';

/**
 * Phase 10 Wave 0 — PARITY-05 regression guard.
 * Tag: @phase10 @scrollbar
 *
 * The document scrollbar must be themed: Firefox fallback via
 * `scrollbar-color` on `html` must reference slate-200 in light mode and
 * slate-700 in dark mode, and must never resolve to `auto` or empty.
 */

const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

const SLATE_200 = 'rgb(226, 232, 240)';
const SLATE_700 = 'rgb(51, 65, 85)';

test.describe('@phase10 @scrollbar — themed scrollbar in both modes', () => {
  test('html scrollbar-color references Phase 7 tokens', async ({ page }) => {
    test.fail(true, 'Wave 0 red — PARITY-05 global CSS not yet added');

    await page.goto(`/home/${ACCOUNT_SLUG}/`);
    const color = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).scrollbarColor,
    );
    expect(color).not.toBe('');
    expect(color).not.toBe('auto');
    const matchesLight = color.includes(SLATE_200);
    const matchesDark = color.includes(SLATE_700);
    expect(matchesLight || matchesDark).toBe(true);
  });
});
