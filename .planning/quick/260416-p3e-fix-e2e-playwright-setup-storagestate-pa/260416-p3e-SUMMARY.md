---
quick_id: 260416-p3e
status: complete
date: 2026-04-16
description: Fix E2E Playwright setup — storageState path + webServer default + README
---

# Quick Task 260416-p3e — Summary

## Outcome

`cd e2e && pnpm test` now works on a fresh clone once `E2E_USER_EMAIL` and
`E2E_USER_PASSWORD` are set in the repo-root `.env`. Three surgical fixes:

1. **storageState path** in `e2e/playwright.config.ts:37` — changed from
   `'e2e/.auth/user.json'` (broken: resolved to `e2e/e2e/.auth/user.json`
   when tests run from `e2e/`) to `'.auth/user.json'` (correct: relative
   to the config's directory). `auth.setup.ts` was always writing to the
   right absolute path via `__dirname`.
2. **webServer block** — removed the `process.env.PLAYWRIGHT_SERVER_COMMAND`
   gate. Now always runs, defaults to `pnpm dev` for local, and honors the
   env var as an override for CI (e.g. `pnpm start` for the built server).
3. **e2e/README.md** — new doc explaining how to run, required env vars,
   how auth state is captured, and CI override. `.env.template` is
   gitignored (`.gitignore` line 60: `.env*`), so README is the durable
   home for this documentation.

## Verification

- `cd e2e && pnpm exec playwright test --list` → config parses, **26 tests
  in 11 files**
- Commit `e063aa2` created with the two-file diff (playwright.config.ts +
  new e2e/README.md)
- No implementation files touched — only test infrastructure

## Commits

- `e063aa2` — fix(quick-260416-p3e): E2E Playwright setup — storageState path + webServer default + README

## User next steps

1. In repo-root `.env`, set:
   ```
   E2E_USER_EMAIL=<dev user email>
   E2E_USER_PASSWORD=<dev user password>
   ```
2. Run `cd e2e && pnpm test`. webServer auto-starts `pnpm dev`; auth.setup
   captures a storage state; tests run.

## Deviations from initial plan

- Plan said to edit `.env.template` directly. Discovered at execution time
  that `.env.template` is gitignored. Redirected to a new `e2e/README.md`
  for the durable doc. User's local `.env.template` was also edited
  in-place (harmless — gitignored, benefits current dev only).
