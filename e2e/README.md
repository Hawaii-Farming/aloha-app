# E2E Tests (Playwright)

End-to-end tests for aloha-app. Covers navigation, auth, sidebar, grids, and theme.

## Running locally

```bash
cd e2e && pnpm test        # headless
pnpm test:ui               # Playwright UI mode
pnpm report                # open last HTML report
```

The config (`playwright.config.ts`) auto-starts `pnpm dev` via `webServer`. If
a dev server is already running on `:5173` it is reused (no duplicate start).

## Required env vars

Set these in the repo-root `.env` (or export in the shell) so `auth.setup.ts`
can log in and capture a storage-state file before the suite runs:

```bash
E2E_USER_EMAIL=<dev user email>
E2E_USER_PASSWORD=<dev user password>
```

When either is missing, `globalSetup` writes an empty storage-state and every
authenticated test fails with a 401 redirect. This is intentional — tests
should not silently pass without a real session.

## How auth state works

- `auth.setup.ts` (referenced from `playwright.config.ts` as `globalSetup`) runs
  once before the suite. It launches a headless browser, navigates to
  `/auth/sign-in`, fills in the credentials from env vars, and persists cookies
  to `e2e/.auth/user.json`.
- Every test project uses that file via `use.storageState` so individual tests
  start already signed in — no per-test login overhead.

## CI override

`PLAYWRIGHT_SERVER_COMMAND` env var overrides the default `pnpm dev` command
(e.g. set to `pnpm start` in CI to run against the built server).
