---
phase: quick-260416-ppa
plan: 01
files_modified:
  - e2e/playwright.config.ts
  - e2e/auth.setup.ts
  - e2e/package.json
  - e2e/README.md
  - pnpm-lock.yaml
autonomous: true
---

<objective>
Unblock E2E auth cascade so `cd e2e && pnpm test` reaches actual test
assertions. Three bugs stacked and made the prior setup fix (quick-260416-p3e)
insufficient.
</objective>

<diagnosis>
Investigation (Option C on phase10-bug-01-active-pill) confirmed the test
selector and DOM structure match — sidebar still renders `.bg-gradient-to-r`.
Failures were caused by cascading setup bugs:

1. **`.env` never loaded by Playwright.** `playwright.config.ts:7` had
   `// require('dotenv').config();` commented out. Env vars in repo-root
   `.env` never reached `auth.setup.ts` → empty storage state → every
   authenticated test redirected to sign-in.

2. **`waitForURL` wait strategy too strict.** Default `waitUntil: 'load'`
   waits for all resources including failing i18n fetches
   (`public/locales/en/chats.json` 404s). The load event never fires
   within 30s → timeout → silent catch → empty state.

3. **`E2E_ACCOUNT_SLUG` default is fictional.** Tests fall back to
   `acme-farms`. The seeded admin user (`admin@hawaiifarming.com`)
   belongs to tenant `hawaii_farming`. Wrong slug → 404s on routed paths.
</diagnosis>

<tasks>

<task type="auto">
  <name>Task 1: Wire dotenv into playwright.config.ts</name>
  <files>e2e/playwright.config.ts, e2e/package.json, pnpm-lock.yaml</files>
  <action>
- `pnpm add -D dotenv --filter web-e2e`
- Replace the commented `// require('dotenv').config();` with:
  ```ts
  import dotenv from 'dotenv';
  import path from 'node:path';
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
  ```
  at the top of playwright.config.ts. Absolute path via `__dirname` so CWD
  doesn't matter.
  </action>
</task>

<task type="auto">
  <name>Task 2: Switch auth.setup waits to domcontentloaded</name>
  <files>e2e/auth.setup.ts</files>
  <action>
- `page.goto('/auth/sign-in', { waitUntil: 'domcontentloaded' })`
- `page.waitForURL(/\/home\//, { timeout: 30_000, waitUntil: 'domcontentloaded' })`
- Leave the outer try/catch that writes EMPTY_STATE on failure — that's
  still the right fallback.
  </action>
</task>

<task type="auto">
  <name>Task 3: Document E2E_ACCOUNT_SLUG in e2e/README.md</name>
  <files>e2e/README.md</files>
  <action>
Expand the "Required env vars" section:
- Add `E2E_ACCOUNT_SLUG` with `hawaii_farming` (seeded admin user's tenant)
- Explain fallback `acme-farms` is placeholder and will 404
- Note that `.env` is now loaded automatically via dotenv — shell exports
  no longer required.
  </action>
</task>

</tasks>

<verification>
- `cd e2e && pnpm exec playwright test --list` → 26 tests parse
- `cd e2e && pnpm test` (with dev server running + `.env` populated):
  - `e2e/.auth/user.json` grows to ~6KB (was 36 bytes empty state)
  - Tests reach their assertion code (not the sign-in redirect)
  - Failures remaining are real UI/assertion issues, not setup

`pnpm typecheck` remains green.
</verification>

<follow_ups>
- `public/locales/en/chats.json` missing — causes ongoing load-event delays
  (not blocking E2E after domcontentloaded switch, but user-visible).
- Phase 10 `@phase10` E2E tests now run but fail at assertion level. The
  @bug-01-active-pill failure suggests the module-row click regression is
  back in design branch. Needs per-test triage — out of scope for this
  quick task.
</follow_ups>

<success_criteria>
- auth.setup produces a non-empty storage state when creds are in `.env`
- Playwright no longer requires shell env exports
- `E2E_ACCOUNT_SLUG` is a documented, discoverable env var
- No implementation code changed (app/ untouched)
</success_criteria>
