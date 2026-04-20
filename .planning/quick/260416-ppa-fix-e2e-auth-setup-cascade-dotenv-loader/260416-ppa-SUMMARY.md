---
quick_id: 260416-ppa
status: complete
date: 2026-04-16
description: Fix E2E auth setup cascade (dotenv loader, waitForURL strategy, account slug docs)
---

# Quick Task 260416-ppa — Summary

## Outcome

Three cascading setup bugs in the E2E harness are fixed. `auth.setup.ts` now
reliably captures a real Supabase session from `.env` credentials, and
per-test route assertions reach application code instead of bouncing off
the sign-in redirect.

## Fixes applied

1. **dotenv loader** — `playwright.config.ts` imports `dotenv` and loads
   `../.env` at startup. `dotenv` added as `web-e2e` devDep.
2. **waitUntil strategy** — `auth.setup.ts` uses `domcontentloaded` on
   both `page.goto` and `page.waitForURL` so failing resource fetches
   (the `chats.json` i18n 404) don't block the auth redirect.
3. **account slug docs** — `e2e/README.md` documents `E2E_ACCOUNT_SLUG`,
   names the seeded admin tenant (`hawaii_farming`), and flags the
   `acme-farms` default as a placeholder.

## Verification

| Before | After |
|--------|-------|
| `e2e/.auth/user.json` = 36 bytes (empty state) | 6026 bytes (real session) |
| Tests redirect to `/auth/sign-in` | Tests reach app routes |
| Setup needed shell env exports | `.env` works out of box |

E2E single-test run (`pnpm exec playwright test phase10-bug-01-active-pill`)
now fails at assertion level, not at setup. Specifically:
- `expect(page).toHaveURL(...)` times out waiting for URL change after
  clicking the HR module row → **real UI regression or stale test**, to
  be triaged separately.

## Commits

- `617d1e3` — fix(quick-260416-ppa): E2E auth setup cascade — dotenv loader + waitUntil + slug docs

## Follow-ups

1. **`public/locales/en/chats.json` missing** — app emits 404 for this
   on every page load. Not blocking E2E after the `waitUntil` switch,
   but it's a latent bug worth chasing.
2. **`@phase10` tests still fail** at assertion level. Per-test triage
   needed to decide stale-vs-regression. The first sample
   (bug-01-active-pill) looks like a module-navigation regression — the
   click is reaching the Link but the URL doesn't change. Worth a focused
   investigation before mass-updating tests.
