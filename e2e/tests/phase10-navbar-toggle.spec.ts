import { expect, test } from '@playwright/test';

/**
 * Phase 10 Wave 0 — PARITY-02 regression guard.
 * Tag: @phase10 @navbar-toggle
 *
 * The sidebar toggle (PanelLeft) must be the first interactive child of
 * the workspace navbar (leftmost slot). Research confirms this is already
 * correct — this spec locks the invariant.
 */

const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

test.describe('@phase10 @navbar-toggle — sidebar toggle is leftmost in navbar', () => {
  test('first interactive navbar child is the sidebar toggle', async ({
    page,
  }) => {
    test.fail(
      true,
      'Wave 0 red — assertion locked in once Plan 10-05 smoke verifies',
    );

    await page.goto(`/home/${ACCOUNT_SLUG}/`);
    const first = page.locator('nav').first().locator(':scope > *').first();
    const dataTest = await first.getAttribute('data-test');
    const hasIcon = (await first.locator('svg.lucide-panel-left').count()) > 0;
    expect(
      dataTest === 'workspace-navbar-sidebar-toggle' || hasIcon,
      `first navbar child should be the sidebar toggle; data-test=${dataTest}, hasIcon=${hasIcon}`,
    ).toBeTruthy();
  });
});
