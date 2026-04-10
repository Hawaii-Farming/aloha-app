import { expect, test } from '@playwright/test';

/**
 * Phase 10 Wave 0 — DARK-02 regression guard.
 * Tag: @phase10 @theme-toggle
 *
 * Toggling light → dark must not shift the navbar, sidebar, or main-content
 * bounding boxes by more than 1px, and must not emit console errors.
 */

const ACCOUNT_SLUG = process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function snapshot(
  page: import('@playwright/test').Page,
): Promise<Record<string, Bounds | null>> {
  const selectors = {
    body: 'body',
    navbar: 'nav, header[role="banner"]',
    sidebar: 'aside, [data-sidebar="sidebar"]',
    main: 'main',
  } as const;
  const result: Record<string, Bounds | null> = {};
  for (const [key, sel] of Object.entries(selectors)) {
    const el = page.locator(sel).first();
    result[key] = (await el.boundingBox()) ?? null;
  }
  return result;
}

function assertClose(a: Bounds | null, b: Bounds | null, label: string) {
  expect(a, `${label} light snapshot`).not.toBeNull();
  expect(b, `${label} dark snapshot`).not.toBeNull();
  if (!a || !b) return;
  expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(a.width - b.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(a.height - b.height)).toBeLessThanOrEqual(1);
}

test.describe('@phase10 @theme-toggle — no layout shift, no console errors', () => {
  test('theme toggle preserves layout within 1px', async ({ page }) => {
    test.fail(true, 'Wave 0 red — DARK-02 visual parity not yet guaranteed');

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`/home/${ACCOUNT_SLUG}/`);
    await page.evaluate(() => {
      window.localStorage.setItem('theme', 'light');
    });
    await page.reload();
    const light = await snapshot(page);

    await page.evaluate(() => {
      window.localStorage.setItem('theme', 'dark');
    });
    await page.reload();
    const dark = await snapshot(page);

    assertClose(light.body, dark.body, 'body');
    assertClose(light.navbar, dark.navbar, 'navbar');
    assertClose(light.sidebar, dark.sidebar, 'sidebar');
    assertClose(light.main, dark.main, 'main');

    expect(errors, `console errors: ${errors.join(' | ')}`).toHaveLength(0);
  });
});
