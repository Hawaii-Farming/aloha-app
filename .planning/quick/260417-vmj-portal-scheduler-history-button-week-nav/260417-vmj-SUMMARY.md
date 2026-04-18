---
phase: quick-260417-vmj
plan: 01
subsystem: scheduler-ui
tags: [ui, scheduler, navbar, portal, refactor]
requires: []
provides:
  - SchedulerNavbarTools (portal component into #workspace-navbar-filter-slot)
affects:
  - Scheduler list view (History + week navigator moved from body toolbar into workspace navbar)
tech-stack:
  added: []
  patterns:
    - createPortal + useNavbarFilterSlot hook (duplicated from navbar-filter-button.tsx per DRY note in plan)
key-files:
  created:
    - app/components/ag-grid/scheduler-navbar-tools.tsx
  modified:
    - app/components/ag-grid/scheduler-list-view.tsx
decisions:
  - Dropped `currentWeek` from SchedulerNavbarToolsProps — only `weekLabel` is consumed visually; keeping an unused prop would trip `no-unused-vars`. Plan explicitly authorized this ("If unused by TS/ESLint after write, drop it from the interface").
  - `useNavbarFilterSlot` hook duplicated verbatim in scheduler-navbar-tools.tsx instead of extracted to a shared helper (plan DRY note — extract if a third caller appears).
  - `formatWeekLabel` stays in scheduler-list-view.tsx and is passed as a string prop, keeping week-formatting ownership with the state owner.
metrics:
  duration: ~5 min
  completed: 2026-04-17
---

# Phase quick-260417-vmj Plan 01: Portal Scheduler History + Week Navigator Summary

## One-liner

Moved scheduler's History button and week navigator pill out of the scheduler body toolbar and portaled them into `#workspace-navbar-filter-slot`, matching the `NavbarFilterButton` pattern; scheduler body is now flush with the AG Grid per UI-RULES.md stripped-chrome table convention.

## Files touched

| File                                                  | Change   | Lines       |
| ----------------------------------------------------- | -------- | ----------- |
| `app/components/ag-grid/scheduler-navbar-tools.tsx`   | Created  | +87         |
| `app/components/ag-grid/scheduler-list-view.tsx`      | Modified | +9 / −49    |

Total: 2 files, 96 insertions, 49 deletions.

## What shipped

### Task 1 — `scheduler-navbar-tools.tsx` (new)

- Exports `SchedulerNavbarTools` React component.
- Props: `weekLabel`, `onPrev`, `onNext`, `onToday`, `onHistoryOpen`.
- Local `useNavbarFilterSlot()` hook (one-shot portal target lookup on mount, mirrored verbatim from `navbar-filter-button.tsx` lines 46-53).
- Uses `createPortal` from `react-dom` to mount into `document.getElementById('workspace-navbar-filter-slot')`.
- Renders **History button first** (`variant="outline"`, `h-9 w-9 rounded-full p-0`, lucide `History` icon, `data-test="history-toggle"`, `aria-label="History"`) and **week navigator pill second** (`<` / label / `>` pattern with all four data-test attributes: `week-navigator`, `week-nav-prev`, `week-nav-today`, `week-nav-next`).
- Both wrapped in `<div className="flex items-center gap-2">` inside the portal.
- Uses only existing `@aloha/ui/button` primitive — no new UI deps.

### Task 2 — `scheduler-list-view.tsx` (modified)

- Removed inline toolbar div (old lines 521-568: `<div className="flex shrink-0 flex-wrap items-center gap-2 pb-4">...</div>` containing the week-navigator pill + History button).
- Mounted `<SchedulerNavbarTools weekLabel={formatWeekLabel(currentWeek)} onPrev={handlePrev} onNext={handleNext} onToday={handleToday} onHistoryOpen={() => setHistoryOpen(true)} />` inside the main `<div data-test="scheduler-list-view">` container (portal renders into the navbar regardless of DOM position).
- Removed now-unused lucide imports: `ChevronLeft`, `ChevronRight`, `History` (kept `Plus` — still used by floating Create FAB).
- Added import: `import { SchedulerNavbarTools } from '~/components/ag-grid/scheduler-navbar-tools';`
- Untouched: `historyOpen` state, `currentWeek` derivation, `navigateWeek`/`handlePrev`/`handleNext`/`handleToday` callbacks, the Historical Data `<Sheet>` drawer, floating `Create` Button, `CreatePanel`, AG Grid setup.

## Verification

| Command                                                                                                   | Result                                                                                          |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                                                                                          | Passed (no new errors)                                                                          |
| `pnpm lint:fix app/components/ag-grid/scheduler-list-view.tsx app/components/ag-grid/scheduler-navbar-tools.tsx` | Passed (0 errors; 4 pre-existing warnings in `packages/ui/src/kit/data-table.tsx` and `packages/ui/src/shadcn/data-table.tsx`, unrelated to this plan) |
| Grep `week-navigator\|week-nav-prev\|week-nav-today\|week-nav-next\|history-toggle` in `scheduler-navbar-tools.tsx` | All 5 selectors present                                                                         |
| Grep `ChevronLeft\|ChevronRight\|\bHistory\b` in `scheduler-list-view.tsx`                                | Only 1 match — a comment ("History summary column definitions" on line 401). No import/component references. |
| Grep `<SchedulerNavbarTools` in `scheduler-list-view.tsx`                                                 | Exactly 1 match (line 522), positioned before `<Sheet>` at line 552                             |
| Post-commit `git diff --diff-filter=D`                                                                    | No files deleted                                                                                |

## Must-haves (from plan frontmatter)

- [x] Navbar filter slot renders History button first, then Week navigator pill (left-to-right)
- [x] Clicking History opens the Historical Data Sheet drawer (same `setHistoryOpen(true)` callback)
- [x] `<` / `>` / date label navigate prev / next / current week (same `navigateWeek` logic)
- [x] Scheduler body starts flush at the top — inline toolbar row removed
- [x] All 5 data-test selectors preserved in visible buttons
- [x] `pnpm typecheck` passes

## Deviations from Plan

None. Plan executed exactly as written.

One plan-sanctioned trim-down: `currentWeek` was dropped from `SchedulerNavbarToolsProps` (plan explicitly allowed this: "If unused by TS/ESLint after write, drop it from the interface to avoid `no-unused-vars` — destructure only what is used"). `weekLabel` is the only value actually rendered.

## Commit

- `dd3978c` — refactor(quick-260417-vmj): portal scheduler History + week navigator into workspace navbar

## Self-Check: PASSED

- FOUND: `app/components/ag-grid/scheduler-navbar-tools.tsx`
- FOUND: `app/components/ag-grid/scheduler-list-view.tsx` (modified)
- FOUND: commit `dd3978c` in `git log`
