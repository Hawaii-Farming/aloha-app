---
phase: 10-ag-grid-theme-template-parity-dark-mode
plan: 01
subsystem: test-scaffolding
tags: [wave-0, tdd, playwright, vitest, regression-guard]
dependency_graph:
  requires:
    - phase-10-research
    - phase-10-ui-spec
    - phase-10-validation-strategy
  provides:
    - ag-grid-theme-hex-regression-test
    - get-org-initials-unit-contract
    - phase10-playwright-regression-suite
    - bug-01-reproduction-evidence
    - bug-02-reproduction-evidence
  affects:
    - wave-1-plans (will turn ag-grid-theme + get-org-initials tests green)
    - wave-2-plans (will turn sidebar/dark-surfaces/scrollbar specs green)
    - wave-3-plans (will turn BUG-01 + BUG-02 specs green)
tech_stack:
  added: []
  patterns:
    - "@phase10 Playwright tag convention via describe-name prefix"
    - "test.fail() as Wave 0 green-on-red marker"
    - "@ts-expect-error guard on imports of not-yet-created modules"
    - "Duck-typed reader over themeQuartz.parts[].modeParams for assertions"
key_files:
  created:
    - app/lib/workspace/__tests__/get-org-initials.test.ts
    - e2e/tests/phase10-grid-sizing.spec.ts
    - e2e/tests/phase10-toolbar-search.spec.ts
    - e2e/tests/phase10-theme-toggle.spec.ts
    - e2e/tests/phase10-dark-surfaces.spec.ts
    - e2e/tests/phase10-sidebar-parity.spec.ts
    - e2e/tests/phase10-navbar-toggle.spec.ts
    - e2e/tests/phase10-avatar-initials.spec.ts
    - e2e/tests/phase10-scrollbar.spec.ts
    - e2e/tests/phase10-bug-01-active-pill.spec.ts
    - e2e/tests/phase10-bug-02-palette-nav.spec.ts
    - .planning/phases/10-ag-grid-theme-template-parity-dark-mode/10-BUG-REPRO.md
  modified:
    - app/components/ag-grid/__tests__/ag-grid-theme.test.ts
decisions:
  - "Unit test reads themeQuartz params by walking .parts[].modeParams buckets (no public API; documented fallback comment in test)"
  - "get-org-initials test imports via @ts-expect-error so Wave 0 is runtime-red but typecheck-green"
  - "Every Playwright spec uses test.fail(true, reason) so `playwright test --grep @phase10` is green-on-red until each wave lands"
  - "Spec account slug matches existing e2e convention: process.env.E2E_ACCOUNT_SLUG ?? 'acme-farms'"
  - "BUG-01 spec asserts URL change AND gradient (expanded symptom discovered during Task 1 repro — wider than original report)"
metrics:
  duration: "~18min"
  tasks_completed: 3
  files_touched: 13
  completed_date: 2026-04-10
---

# Phase 10 Plan 01: Wave 0 Test Scaffolding + Bug Repro Summary

Captured manual reproductions for BUG-01 / BUG-02, scaffolded two failing
Vitest unit suites (ag-grid-theme hex targets, get-org-initials contract),
and scaffolded ten failing `@phase10` Playwright specs — one per Phase 10
requirement. No production code changed.

## Objective Recap

Wave 0 of Phase 10: guarantee every requirement in the phase has an
automated verify target before any implementation lands (Nyquist compliance).
Output is a red test suite plus BUG-REPRO evidence.

## Completed Tasks

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Manual repro BUG-01 + BUG-02 + evidence file | completed | `6e4a4e9` |
| 2 | Unit test skeletons (ag-grid-theme hex + get-org-initials) | completed | `9f57888` |
| 3 | @phase10 Playwright spec skeletons (10 files, 22 tests) | completed | `14c1dae` |

## Key Outcomes

**Task 1 (delivered by prior agent + user):** `10-BUG-REPRO.md` documents
both bugs with observed symptoms and confirmed root causes. Notable
expansion: BUG-01's symptom is wider than the original report — clicking a
module row in expanded-mode does not navigate at all, not just "missing
pill." Root cause traced to the nested `<Link>` inside `<SidebarGroupLabel>`
+ sibling `CollapsibleTrigger` intercepting clicks. BUG-02 matches the
research hypothesis: `cmdk` `value` collision between module and
sub-module paths causes the dialog to close without navigating.

**Task 2:** Unit test contracts are locked. `get-org-initials.test.ts`
spec-drives 7 behaviours of the helper Plan 10-04 will create. The
`ag-grid-theme.test.ts` update walks the internal `parts[].modeParams`
array to read back both light and dark mode params and assert every
Phase 7 hex target (backgroundColor, foregroundColor, headerBackgroundColor,
headerTextColor, borderColor, accentColor, rowHoverColor,
selectedRowBackgroundColor, oddRowBackgroundColor) plus `'Inter Variable'`
font family and the shared typographic scale. Runs red against the
current Supabase hex values; Plan 10-02 turns them green by editing only
`ag-grid-theme.ts`.

**Task 3:** Ten Playwright specs created, listing 22 tests total via
`playwright test --grep @phase10 --list`:

| Spec | Tests | Requirement(s) |
|------|-------|----------------|
| phase10-grid-sizing.spec.ts | 8 | GRID-02 |
| phase10-toolbar-search.spec.ts | 1 | GRID-03 |
| phase10-theme-toggle.spec.ts | 1 | DARK-02 |
| phase10-dark-surfaces.spec.ts | 1 | DARK-03 |
| phase10-sidebar-parity.spec.ts | 4 | PARITY-01, PARITY-04 |
| phase10-navbar-toggle.spec.ts | 1 | PARITY-02 |
| phase10-avatar-initials.spec.ts | 2 | PARITY-03 |
| phase10-scrollbar.spec.ts | 1 | PARITY-05 |
| phase10-bug-01-active-pill.spec.ts | 2 | BUG-01 |
| phase10-bug-02-palette-nav.spec.ts | 1 | BUG-02 |

Every test uses `test.fail(true, reason)` so the Wave 0 run is
green-on-red — Waves 1-4 remove the marker as each requirement is fixed.
GRID-01 is covered by the Vitest suite rather than Playwright (theme
params are easier to assert via unit test).

## Verification

- `pnpm vitest run app/lib/workspace/__tests__/get-org-initials.test.ts app/components/ag-grid/__tests__/ag-grid-theme.test.ts` → 2 files failed, 4 assertions red (as expected)
- `pnpm typecheck` → clean (root)
- `cd e2e && pnpm exec tsc --noEmit` → clean
- `cd e2e && pnpm exec playwright test --grep @phase10 --list` → 22 tests across 10 files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript import of module that doesn't exist**
- **Found during:** Task 2
- **Issue:** The plan instructs the test to import from `../get-org-initials`, a module that will not exist until Plan 10-04. Plan also required `pnpm typecheck green` — these two requirements conflict.
- **Fix:** Added `// @ts-expect-error — module is created in Plan 10-04 (PARITY-03); red is intentional.` directive. Runtime still errors with "module not found" (the desired Wave 0 red signal); typecheck stays green. When Plan 10-04 creates the module the `@ts-expect-error` becomes an unused-error that TypeScript will flag, forcing us to remove it in the same edit.
- **Files modified:** `app/lib/workspace/__tests__/get-org-initials.test.ts`
- **Commit:** `9f57888`

**2. [Rule 1 - Correctness] themeQuartz has no public getParams() API**
- **Found during:** Task 2
- **Issue:** My first draft of `ag-grid-theme.test.ts` assumed `theme.getParams('light')` or `theme.params.light` — neither exists on `themeQuartz.withParams(...)`. Assertions all reported "undefined".
- **Fix:** Probed the theme shape and discovered `withParams` pushes each call's params into `theme.parts[]` as a part whose `modeParams` object is keyed by the mode string. Rewrote the test helper to walk `parts[]` and merge every entry contributing to the requested mode. Tests now fail with meaningful diffs (`'#262626'` vs `'#1e293b'`) instead of `undefined`.
- **Files modified:** `app/components/ag-grid/__tests__/ag-grid-theme.test.ts`
- **Commit:** `9f57888`

**3. [Rule 2 - Missing coverage] BUG-01 spec needed URL assertion, not just pill check**
- **Found during:** Task 1 (carried into Task 3 design)
- **Issue:** The original plan sketched BUG-01 spec as "assert gradient appears" only. Task 1 repro discovered the real symptom is that the click doesn't navigate at all in expanded mode.
- **Fix:** Added a second test case to `phase10-bug-01-active-pill.spec.ts` that clicks a module row and asserts `page.toHaveURL(...)` before asserting the gradient state. Per continuation note in `10-BUG-REPRO.md`.
- **Files modified:** `e2e/tests/phase10-bug-01-active-pill.spec.ts`
- **Commit:** `14c1dae`

**4. [Rule 3 - Non-blocking] Spec count exceeds plan acceptance criterion in a good way**
- **Found during:** Task 3
- **Issue:** Plan verification expected "≥ 10 tests" listed via `--grep @phase10`. Actual total is 22 (the grid-sizing spec parametrises over 8 HR modules, sidebar-parity has 4 assertions, bug-01 has 2, avatar-initials has 2). This is consistent with the plan's intent (one spec file per surface) and stronger coverage.
- **Fix:** None needed — documented here for traceability.

## Known Stubs

None. All test files assert real behaviour against real selectors; no
placeholder returns, no empty arrays flowing to UI.

## Threat Flags

None. This plan produced test-only artefacts with no new network
endpoints, auth paths, file access, or schema changes.

## Self-Check: PASSED

Verified all artefacts exist on disk and all commits are reachable:

- `app/lib/workspace/__tests__/get-org-initials.test.ts` — FOUND
- `app/components/ag-grid/__tests__/ag-grid-theme.test.ts` — FOUND (modified)
- `e2e/tests/phase10-{grid-sizing,toolbar-search,theme-toggle,dark-surfaces,sidebar-parity,navbar-toggle,avatar-initials,scrollbar,bug-01-active-pill,bug-02-palette-nav}.spec.ts` — all 10 FOUND
- `.planning/phases/10-ag-grid-theme-template-parity-dark-mode/10-BUG-REPRO.md` — FOUND
- Commit `6e4a4e9` — FOUND
- Commit `9f57888` — FOUND
- Commit `14c1dae` — FOUND

## Handoff Notes for Wave 1+

- **Plan 10-02 (GRID-01/02/03):** To turn `ag-grid-theme.test.ts` green, rewrite the hex values in `app/components/ag-grid/ag-grid-theme.ts` and switch `fontFamily` to `'Inter Variable'` for both modes. The test walks `parts[].modeParams` so any subsequent `withParams()` additions are captured automatically.
- **Plan 10-04 (PARITY-03):** Creating `app/lib/workspace/get-org-initials.ts` will both turn the unit suite green AND break the `@ts-expect-error` (must be removed in the same edit).
- **Plan 10-05 (BUG-01 + BUG-02):** The Playwright specs assert URL navigation AND visual state. Fix must address both legs of BUG-01 (navigation + pill) to pass.
- **All specs use `E2E_ACCOUNT_SLUG` (default `acme-farms`). If CI/local tests run against a different fixture org name, override via env var.**
- **Avatar spec expects `E2E_EXPECTED_INITIALS` env var (default `HF`) — set if fixture org isn't "Hawaii Farming".**
