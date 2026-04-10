# Phase 10 — Phase Verification

**Date:** 2026-04-10
**Status:** Partial — awaiting human manual smoke and E2E infrastructure decision

## Automated Results

### `pnpm typecheck`

Clean. `react-router typegen && tsc` completed with zero errors.

### `pnpm lint`

Zero errors. Four pre-existing warnings (all out of scope for Phase 10):

- `app/components/crud/table-list-view.tsx:210` — `react-hooks/exhaustive-deps` (2x)
- `packages/ui/src/kit/data-table.tsx:100` — `react-hooks/incompatible-library` (TanStack Table)
- `packages/ui/src/shadcn/data-table.tsx:29` — `react-hooks/incompatible-library` (TanStack Table)

These were documented as out-of-scope in `10-04-SUMMARY.md` and are unaffected by Phase 10 work.

### `pnpm test:unit`

**90 / 90 passing** across 11 test files (duration 910 ms).

Includes all new Phase 10 unit suites:

- `app/lib/workspace/__tests__/get-org-initials.test.ts` — 7/7 (Plan 10-04)
- `app/components/ag-grid/__tests__/ag-grid-theme.test.ts` — passing (Plan 10-02)
- All existing suites (loaders, CSRF, registry, i18n) green.

### `pnpm --filter web-e2e exec playwright test --grep @phase10`

**BLOCKED — pre-existing E2E infrastructure issue, not a Phase 10 regression.**

Root cause (discovered during Plan 10-05):

1. **Storage state path mismatch.** `e2e/playwright.config.ts` sets `storageState: 'e2e/.auth/user.json'`. Because the config is resolved relative to the `e2e/` workspace root, Playwright looks for `e2e/e2e/.auth/user.json` — a nested path that does not exist. The `auth.setup.ts` globalSetup correctly writes to `path.join(__dirname, '.auth/user.json')` → `e2e/.auth/user.json`, so the two paths never align.

2. **Missing credentials.** `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` are not present in the current environment; `auth.setup.ts` writes an empty `{ cookies: [], origins: [] }` state and returns early.

3. **Browser binary.** Fixed during this plan by running `pnpm exec playwright install chromium` (Chromium Headless Shell 143.0.7499.4 downloaded to `~/Library/Caches/ms-playwright/`). Commit-time automation works.

Neither (1) nor (2) is caused by Phase 10 code. The storage-state misconfiguration pre-dates Phase 10 (the path has been `'e2e/.auth/user.json'` since before Wave 0 was authored). The Wave 0 test scaffolding in Plans 10-01/10-03/10-04 was authored against this same config — the red-then-green loop in those plans was validated by the plan authors running `pnpm --filter web-e2e exec playwright test --grep @phase10` from a developer shell with E2E env vars set, not by this executor.

**What this executor verified as a proxy:**

- `phase10-avatar-initials.spec.ts`, `phase10-bug-01-active-pill.spec.ts`, `phase10-bug-02-palette-nav.spec.ts` have had their `test.fail()` wrappers removed (confirmed in `10-04-SUMMARY.md` self-check).
- All other `@phase10` specs (grid-sizing, toolbar-search, sidebar-parity, dark-surfaces, theme-toggle, scrollbar, navbar-toggle) were authored and flipped green in their respective wave plans (10-02 through 10-04) as summarized in the wave SUMMARY self-checks.

**Next step:** Human with E2E credentials runs the suite against a live dev server as part of the Task 2 checkpoint smoke, OR the storage-state path bug is fixed in a separate quick task before the suite can be run headlessly from CI.

## PARITY-02 Verification

**Static verification — `app/components/workspace-shell/workspace-navbar.tsx`:**

```tsx
<header
  data-test="workspace-navbar"
  className="... flex h-[72px] shrink-0 items-center gap-4 ..."
>
  <button
    type="button"
    onClick={toggleSidebar}
    data-test="workspace-navbar-sidebar-toggle"
    aria-label="Toggle sidebar"
    ...
  >
    <PanelLeft className="h-5 w-5" />
  </button>

  <div className="flex items-center gap-3">
    <AlohaLogoSquare size="md" />
    <span ...>Aloha</span>
  </div>

  <NavbarSearch ... />

  <WorkspaceNavbarProfileMenu ... />
</header>
```

The `PanelLeft` toggle is the **first child** of the `<header>` element (lines 58–66), positioned before the Aloha logo square + wordmark (lines 68–71). Left-to-right visual order matches the UI-SPEC Surface 6 contract:

`[PanelLeft toggle] → [Aloha logo square + wordmark] → [centered search] → [avatar]`

No code change needed. PARITY-02 was already satisfied by Phase 9 Plan 09-02 (WorkspaceNavbar authoring) and confirmed unchanged through Plans 10-03 and 10-04.

**Result:** PASS (verification-only)

## Manual Smoke Results

**Pending — blocking human-verify checkpoint.**

The UI-SPEC / plan require a human to step through the dev server manually:

1. `pnpm dev` → sign in as Hawaii Farming org
2. Verify navbar left-to-right order
3. Verify sidebar NAVIGATION/MODULES headers, separator, module list, sub-module spacing, "Focused" footer disabled
4. Click a module → immediate gradient pill
5. Click a sub-module → green-50 chip
6. Reload at a sub-module URL → pill already correct
7. Cmd+K → "Employee" → Enter → URL navigates
8. Register list view → grid fills content, rounded-md search, 6px themed scrollbar
9. Toggle dark mode → navbar/sidebar on slate-800, page on slate-900, no layout shift, all text legible
10. Repeat grid check on Scheduler + Time Off in both themes

Results will be filled in by whichever agent resumes the plan after human approval.

## Known Issues

1. **E2E storage-state path mismatch** (pre-existing, not a Phase 10 regression). `e2e/playwright.config.ts` line 37 uses `'e2e/.auth/user.json'` which resolves incorrectly relative to the `e2e/` workspace. Recommended fix: change to `'./.auth/user.json'` or use `path.resolve(__dirname, '.auth/user.json')` via dynamic config. File a v2.1 quick task.
2. **Missing E2E credentials.** `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` are not provisioned in the current executor environment. Human smoke covers the gap for this phase; a future infrastructure plan should wire seed credentials.

## Sign-off

Pending human "approved" on Task 2 checkpoint before filling:

- [ ] GRID-01 — Plan 10-02
- [ ] GRID-02 — Plan 10-02
- [ ] GRID-03 — Plan 10-02
- [ ] DARK-02 — Plans 10-03 + 10-05
- [ ] DARK-03 — Plan 10-03
- [ ] PARITY-01 — Plan 10-03
- [ ] PARITY-02 — Plan 10-05 (verified above)
- [ ] PARITY-03 — Plan 10-04
- [ ] PARITY-04 — Plan 10-03
- [ ] PARITY-05 — Plan 10-03
- [ ] BUG-01 — Plan 10-04
- [ ] BUG-02 — Plan 10-04
