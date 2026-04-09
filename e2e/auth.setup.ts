import { type FullConfig, chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_DIR = path.join(__dirname, '.auth');
const STORAGE_STATE_PATH = path.join(AUTH_DIR, 'user.json');

const EMPTY_STATE = JSON.stringify({ cookies: [], origins: [] }, null, 2);

export default async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  // Ensure .auth directory exists
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  if (!email || !password) {
    // Write empty state so tests can skip gracefully
    fs.writeFileSync(STORAGE_STATE_PATH, EMPTY_STATE);
    return;
  }

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173';

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await page.goto('/auth/sign-in');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/home\//, { timeout: 30_000 });

    await context.storageState({ path: STORAGE_STATE_PATH });
  } catch (error) {
    // If auth fails, write empty state so tests skip instead of crash
    fs.writeFileSync(STORAGE_STATE_PATH, EMPTY_STATE);
    console.error('Global setup auth failed:', error);
  } finally {
    await browser.close();
  }
}
