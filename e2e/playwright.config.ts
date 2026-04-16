import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';

/**
 * Load environment variables from the repo-root `.env` so auth.setup and
 * per-test defaults can read E2E_USER_EMAIL, E2E_USER_PASSWORD,
 * E2E_ACCOUNT_SLUG without requiring the user to export them in the shell.
 */
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: require.resolve('./auth.setup'),
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  /* Limit parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    // take a screenshot when a test fails
    screenshot: 'only-on-failure',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
    navigationTimeout: 15 * 1000,

    /* Reuse auth state saved by globalSetup.
     * Path is relative to this config file (e2e/), not the repo root. */
    storageState: '.auth/user.json',
  },

  // test timeout set to 2 minutes
  timeout: 120 * 1000,
  expect: {
    // expect timeout set to 30 seconds
    timeout: 30 * 1000,
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests.
   * Defaults to `pnpm dev` (Vite HMR) for local runs; CI can override via
   * PLAYWRIGHT_SERVER_COMMAND (e.g. `pnpm start` for the built server). */
  webServer: {
    cwd: '../',
    command: process.env.PLAYWRIGHT_SERVER_COMMAND ?? 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120 * 1000,
  },
});
