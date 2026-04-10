---
phase: 10-ag-grid-theme-template-parity-dark-mode
plan: 02
subsystem: ag-grid-theme-and-layout
tags: [wave-1, ag-grid, theming, layout, flex-chain, tailwind-merge]
dependency_graph:
  requires:
    - phase-10-plan-01-wave-0-test-scaffolding
  provides:
    - ag-grid-aloha-themed
    - workspace-layout-bounded-flex-chain
    - toolbar-search-rounded-md
  affects:
    - every-hr-ag-grid-list-view
    - every-workspace-route-content-area
tech_stack:
  added: []
  patterns:
    - "themeQuartz.withParams literal hexes (no var() refs)"
    - "Shared params object spread into light + dark withParams calls"
    - "min-h-0 flex chain on outer row + <main> + inner div"
    - "tailwind-merge rounded-md override on Input primitive"
key_files:
  created:
    - .planning/phases/10-ag-grid-theme-template-parity-dark-mode/10-02-SUMMARY.md
  modified:
    - app/components/ag-grid/ag-grid-theme.ts
    - app/routes/workspace/layout.tsx
    - packages/ui/src/kit/data-table-toolbar.tsx
    - e2e/tests/phase10-grid-sizing.spec.ts
    - e2e/tests/phase10-toolbar-search.spec.ts
decisions:
  - "Font unified on 'Inter Variable' (Phase 7 app-wide); supersedes CONTEXT D-02"
  - "checkboxBorderRadius lowered from 999 (pill) to 4 (matches Shadcn checkbox square)"
  - "<main> no longer scrolls; inner content div owns overflow-y-auto so non-grid routes still scroll while AG Grid uses its own virtual scroller"
  - "rounded-md applied only to DataTableToolbar search Input; Input primitive remains rounded-2xl and untouched per Phase 9 D-09 guardrail"
metrics:
  duration: "~12min"
  tasks_completed: 3
  files_touched: 5
  completed_date: 2026-04-10
---

# Phase 10 Plan 02: AG Grid Theme + Layout Sizing + Toolbar Rounding Summary

Three surgical edits across three source files closed GRID-01, GRID-02, and
GRID-03: rewrote the AG Grid theme to Aloha Supabase-inspired hexes with
Inter Variable, repaired the workspace layout flex chain so every HR grid
fills its container, and overrode the toolbar search input to `rounded-md`
without touching the Input primitive.

## Objective Recap

Wave 1 of Phase 10: make every HR grid visually match the Aloha design
system and physically fill its container. Turn the Wave 0 red tests from
Plan 10-01 green for the three GRID requirements.

## Completed Tasks

| # | Task | Status | Commit  | Files |
|---|------|--------|---------|-------|
| 1 | Rewrite `ag-grid-theme.ts` to Aloha hexes + Inter Variable | completed | `22d34be` | `app/components/ag-grid/ag-grid-theme.ts` |
| 2 | Fix workspace layout `min-h-0` flex chain | completed | `00a0a79` | `app/routes/workspace/layout.tsx`, `e2e/tests/phase10-grid-sizing.spec.ts` |
| 3 | Override toolbar search Input to `rounded-md` | completed | `e521673` | `packages/ui/src/kit/data-table-toolbar.tsx`, `e2e/tests/phase10-toolbar-search.spec.ts` |

## Key Outcomes

**Task 1 — AG Grid Theme (GRID-01).** Replaced the old Supabase/Geist
palette with the Phase 7 Aloha tokens, mode-pair per CONTEXT D-03. Shared
params (font, typographic scale, checkbox radius, padding scale, column
border) live in a `const shared` object spread into both `withParams`
calls, keeping the contract maintainable. Font unified on Inter Variable
with an explanatory header comment pointing at the Phase 7 migration.
All 8 assertions in `ag-grid-theme.test.ts` (including the reader that
walks `parts[].modeParams`) go green.

**Task 2 — Layout Flex Chain (GRID-02).** The workspace layout
previously set `<main>` to `flex-1 overflow-y-auto` and the inner content
div to `flex flex-1 flex-col p-4` without any `min-h-0`. That chain
collapses: `<main>` inherits intrinsic content height and scrolls itself,
so the child AG Grid has no bounded height and falls back to its default
min-height. The fix:

- Outer flex row gets `min-h-0` alongside `flex-1 overflow-hidden`
- `<main>` becomes `flex min-h-0 flex-1 flex-col` (no scroll)
- Inner content div takes ownership of `overflow-y-auto` with its own
  `min-h-0 flex-1 flex-col`

Result: AG Grid's virtual scroller resolves to the container's real
bounded height, and non-grid routes (settings, detail pages) still scroll
vertically through the inner div. The Wave 0 `test.fail()` marker was
removed from `phase10-grid-sizing.spec.ts` in the same commit.

**Task 3 — Toolbar Search Rounding (GRID-03).** Added `rounded-md` to
the `<Input>` className inside `DataTableToolbar`. `tailwind-merge`
deterministically resolves this over the primitive's `rounded-2xl`
because both classes target `border-radius` and the later class wins.
Primitive untouched (`git diff packages/ui/src/shadcn/input.tsx` empty),
so the only surface that changes is the CRUD toolbar search — no cascade
to other forms. Wave 0 `test.fail()` marker removed from
`phase10-toolbar-search.spec.ts` in the same commit.

## Verification

- `pnpm vitest run app/components/ag-grid/__tests__/ag-grid-theme.test.ts` → **8/8 passed**
- `pnpm typecheck` → clean (all three tasks, each verified incrementally)
- `pnpm lint` → 0 errors (4 pre-existing warnings in unrelated files: `data-table.tsx` react-compiler advisories for TanStack Table)
- `git diff packages/ui/src/shadcn/input.tsx` → empty (primitive guardrail intact)
- `grep -c 'min-h-0' app/routes/workspace/layout.tsx` → 3
- `grep "'Inter Variable'" app/components/ag-grid/ag-grid-theme.ts` → match
- `grep "Geist" app/components/ag-grid/ag-grid-theme.ts` → zero matches
- `grep "var(" app/components/ag-grid/ag-grid-theme.ts` → zero matches

**E2E runs are deferred to phase validation (requires running dev server
+ seeded fixture org).** Both specs had `test.fail()` removed in the same
commit as their fix and will now assert real behaviour against real DOM.

## Deviations from Plan

None. All three tasks executed exactly as specified. The plan's
acceptance criteria, action blocks, and threat mitigations were all
followed verbatim.

## Known Stubs

None. All edits modify real production code paths; no placeholder data,
no empty arrays flowing to UI, no TODO markers added.

## Threat Flags

None. This plan touched a theming module, a layout shell, and a toolbar
component — no new network surface, auth paths, file access, or schema
changes at trust boundaries. The two mitigations documented in the plan
(T-10-03 non-grid scroll preservation, T-10-04 primitive untouched) were
both honoured.

## Self-Check: PASSED

Verified all artefacts exist on disk and all commits are reachable:

- `app/components/ag-grid/ag-grid-theme.ts` — FOUND (rewritten)
- `app/routes/workspace/layout.tsx` — FOUND (modified)
- `packages/ui/src/kit/data-table-toolbar.tsx` — FOUND (modified)
- `e2e/tests/phase10-grid-sizing.spec.ts` — FOUND (test.fail removed)
- `e2e/tests/phase10-toolbar-search.spec.ts` — FOUND (test.fail removed)
- Commit `22d34be` — FOUND (Task 1)
- Commit `00a0a79` — FOUND (Task 2)
- Commit `e521673` — FOUND (Task 3)

## Handoff Notes for Wave 2+

- **Plan 10-03 (PARITY-01 / PARITY-02 / PARITY-04 / PARITY-05 / DARK-02 / DARK-03):**
  Sidebar/navbar/scrollbar/theme-toggle/dark-surfaces work. Should not
  touch the AG Grid surface again — this plan already hit the full grid
  visual contract. If the sidebar retheme reveals any sidebar-driven flex
  breakage in the workspace layout, the repair must preserve the
  `min-h-0` chain landed here.
- **Plan 10-04 (PARITY-03 avatar initials):** Unrelated to grid; will
  create `get-org-initials.ts` and trip the `@ts-expect-error` in the
  Wave 0 unit test.
- **Plan 10-05 (BUG-01 + BUG-02):** Sidebar navigation fix. Unrelated to
  grid theme or layout flex chain.
- **If any future plan needs to add new AG Grid theme params, drop them
  into `const shared` (mode-invariant) or into each mode's `withParams`
  call (mode-pair). The unit test's `parts[].modeParams` reader captures
  any subsequent `withParams()` additions automatically.**
