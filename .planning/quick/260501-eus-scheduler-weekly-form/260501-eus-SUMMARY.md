---
phase: quick-260501-eus
plan: 01
subsystem: scheduler
tags: [scheduler, forms, weekly-batch-insert, ops_task_schedule]
requires:
  - app/components/crud/create-panel.tsx (untouched — generic CRUD path)
  - app/routes/api/schedule-history.ts (existing detail endpoint reused for prefill)
  - app/lib/crud/ops-task-schedule.config.ts (untouched — formFields drive FK loading)
provides:
  - Scheduler-only 7-day weekly form drawer
  - /api/scheduler/create-weekly batch-insert endpoint
  - opsTaskScheduleWeeklySchema + opsTaskScheduleEntrySchema
affects:
  - app/components/ag-grid/scheduler-list-view.tsx (CreatePanel → SchedulerCreatePanel swap)
tech-stack:
  added: []
  patterns:
    - "Per-submodule custom create drawer composed alongside generic CreatePanel (additive, not branching)"
    - "Batch insert via dedicated action route, not via crudCreateAction (single-row only)"
key-files:
  created:
    - app/components/scheduler/scheduler-create-panel.tsx
    - app/routes/api/scheduler/create-weekly.ts
  modified:
    - app/lib/crud/ops-task-schedule.schema.ts
    - app/routes.ts
    - app/components/ag-grid/scheduler-list-view.tsx
decisions:
  - "Dedicated /api/scheduler/create-weekly route instead of branching sub-module-create — keeps the generic crudCreateAction (single-row .insert().select().single()) free of submodule-specific quirks."
  - "Drop submitAttempted state; row errors compute live via useWatch+useMemo. Avoids react-hooks/set-state-in-effect lint error and gives more responsive feedback."
  - "Plain <select> for per-day task picker rather than FkCombobox — keeps day-card height compact and avoids 7 nested popovers fighting the Sheet for focus management."
metrics:
  duration: ~12min
  tasks_completed: 3
  files_changed: 5
  completed: 2026-05-01
---

# Quick 260501-eus: Scheduler Weekly Form Summary

Scheduler `+` button now opens a 7-day weekly form drawer (employee + per-day date/start/stop/task) that batch-inserts one `ops_task_schedule` row per filled day. Generic `CreatePanel` is byte-for-byte unchanged; every other submodule still uses it.

## Files Created / Modified

**Created**
- `app/components/scheduler/scheduler-create-panel.tsx` (458 lines) — Scheduler-only Sheet drawer: employee FK at top, 7 day cards (Sun–Sat) prefilled with the dates of the currently-viewed week, per-card date / start-time / stop-time / task-select inputs, sticky footer with live total hours, prefill effect that fetches `/api/schedule-history?mode=detail` on open + employee change and seeds cards by weekday match (dates stay anchored to `currentWeek`).
- `app/routes/api/scheduler/create-weekly.ts` (66 lines) — Action-only route. Validates body against `opsTaskScheduleWeeklySchema`, loads the org workspace to derive `org_id` + `employee_id`, batch-inserts the entries via `client.from('ops_task_schedule').insert(rows)`, returns `{ success, count }` or `{ success: false, error }`.

**Modified**
- `app/lib/crud/ops-task-schedule.schema.ts` — Added `opsTaskScheduleEntrySchema` (date / start_time / stop_time / ops_task_id with a refine for start<stop) and `opsTaskScheduleWeeklySchema` (employee + entries[]). The existing single-row `opsTaskScheduleSchema` is unchanged so the generic CRUD pipeline still type-checks against it.
- `app/routes.ts` — One-line addition: `route('api/scheduler/create-weekly', 'routes/api/scheduler/create-weekly.ts')` wired alongside the other `api/schedule-*` entries.
- `app/components/ag-grid/scheduler-list-view.tsx` — Swapped the import + JSX from generic `CreatePanel` to `SchedulerCreatePanel`. Dropped now-unused `comboboxOptions` from the props destructure. The floating-`+` button, week navigator, history drawer, grid, detail rows, and column-state persistence are all unchanged.

## Decisions Made

### Dedicated `/api/scheduler/create-weekly` route vs. branching `sub-module-create`

The generic `crudCreateAction` is hard-coded to single-row inserts (`.insert(insertData).select().single()`). Branching the generic action with a "if scheduler, do an array insert" check would couple the registry-driven CRUD pipeline to a single submodule's quirks — exactly the leak the hard constraint exists to avoid. Carving out a Scheduler-specific endpoint keeps the generic path identical for every other submodule (Employees, Tasks, Departments, etc.) and gives the weekly drawer one type-safe target.

### Drop `submitAttempted` state in favour of always-live row errors

The original plan suggested showing per-row errors only after submit. The implementation hit a lint rule (`react-hooks/set-state-in-effect`) when resetting `submitAttempted` in the fetcher-response effect. Rather than work around the rule, I dropped the gate: row errors now compute live via `useWatch` → `useMemo` over the days array, giving the user instant feedback as they fill the form (and matching the Aloha pattern of preferring derivation over state). Submit still hard-blocks on those same errors.

### Plain `<select>` for per-day task picker

Each day card needs a task picker. Using `FkCombobox` (Popover-based) inside an already-open Sheet drawer would create 7 nested popovers per card, each fighting Radix Sheet for focus and z-index. A native `<select>` is small, accessible, mobile-friendly, and keeps each row a single 44px line. The employee picker at the top stays as `FkCombobox` because there's only one and search-by-typing is more useful for the larger employee list.

## Hard Constraint Verified

- `git diff app/components/crud/create-panel.tsx` → empty (zero lines changed).
- `git diff app/lib/crud/ops-task-schedule.config.ts` → empty.
- `grep -c "from '~/components/crud/create-panel'" app/components/ag-grid/scheduler-list-view.tsx` → `0`.
- `grep -c "SchedulerCreatePanel" app/components/ag-grid/scheduler-list-view.tsx` → `2` (one import, one JSX usage).

## Deviations from Plan

**[Rule 1 - Lint] Drop `submitAttempted` state.** Resetting it inside the fetcher-response useEffect tripped `react-hooks/set-state-in-effect`. Resolved by computing row errors live; the user-visible behaviour is more permissive (errors appear as soon as a row becomes invalid rather than only on submit attempt) but submit-time blocking still catches them.

**[Rule 1 - Lint] Wrap `form.handleSubmit(onSubmit)` in a `useCallback` event handler.** `onSubmit={form.handleSubmit(onSubmit)}` triggered `react-hooks/refs` (passing a ref to a function during render). Mirrored the generic CreatePanel pattern: extract `handleFormSubmit = useCallback((e) => form.handleSubmit(onSubmit)(e), [...])`.

**[Rule 1 - Cleanup] Removed `comboboxOptions` from `SchedulerListView`'s props destructure.** The scheduler drawer takes only `fkOptions`; leaving the variable destructured but unused would have failed `@typescript-eslint/no-unused-vars`.

## Verification Results

- `pnpm typecheck` — clean (0 errors).
- `pnpm lint` — 0 errors. 4 pre-existing warnings in `packages/ui/src/{kit,shadcn}/data-table.tsx` (`react-hooks/incompatible-library` for TanStack Table); out of scope.
- Hard-constraint guards pass (see above).

## Auth Gates

None.

## Known Stubs

None — all form fields are wired and prefill is functional against `/api/schedule-history`.

## Self-Check: PASSED

- `app/components/scheduler/scheduler-create-panel.tsx` → FOUND
- `app/routes/api/scheduler/create-weekly.ts` → FOUND
- `app/lib/crud/ops-task-schedule.schema.ts` → contains `opsTaskScheduleWeeklySchema`
- `app/routes.ts` → contains `api/scheduler/create-weekly`
- Commit `fd163a5` (Task 1: schema + action) → FOUND in `git log`
- Commit `fe4332f` (Task 2: drawer component) → FOUND in `git log`
- Commit `a0cc398` (Task 3: list-view wire-up) → FOUND in `git log`

## Pending: Human Verify

Task 4 (`checkpoint:human-verify`) is intentionally not auto-resolved — it's the orchestrator/operator's responsibility to drive the manual smoke (open the drawer, verify prefill on a worker with prior history, regression-check Employees/Tasks/etc. still open the generic CreatePanel, mobile 360px viewport).
