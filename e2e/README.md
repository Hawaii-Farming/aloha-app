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

`playwright.config.ts` loads the repo-root `.env` via `dotenv` at startup, so
these can live alongside your other dev vars (or be exported in the shell —
both work):

```bash
E2E_USER_EMAIL=<dev user email>
E2E_USER_PASSWORD=<dev user password>
E2E_ACCOUNT_SLUG=<your workspace account slug>   # e.g. hawaii_farming
```

`E2E_ACCOUNT_SLUG` is the tenant slug the signed-in test user belongs to; the
URL-path tests (`/home/:account/...`) use it to navigate. For the seeded
admin user (`admin@hawaiifarming.com`) the slug is `hawaii_farming`. Tests
fall back to `acme-farms` when unset — that's a placeholder and will cause
404s against real data.

When `E2E_USER_EMAIL` or `E2E_USER_PASSWORD` is missing, `globalSetup` writes
an empty storage-state and every authenticated test fails with a 401
redirect. This is intentional — tests should not silently pass without a
real session.

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
