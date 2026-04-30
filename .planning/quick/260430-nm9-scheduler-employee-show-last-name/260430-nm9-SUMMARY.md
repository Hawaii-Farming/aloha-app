---
phase: quick-260430-nm9
plan: 01
subsystem: crud-framework
tags: [crud, fk, scheduler, label-composition]
requires:
  - app/lib/crud/types.ts
  - app/lib/crud/load-form-options.server.ts
  - app/components/crud/card-detail-view.tsx
  - app/components/ag-grid/inline-detail-row.tsx
provides:
  - 'fkLabelColumns?: string[] — multi-column FK label composition on FormFieldConfig'
  - 'Scheduler Employee dropdown shows preferred_name + last_name'
affects:
  - app/lib/crud/ops-task-schedule.config.ts
tech-stack:
  added: []
  patterns:
    - 'Multi-column FK label composition (space-joined, empty-filtered)'
key-files:
  created: []
  modified:
    - app/lib/crud/types.ts
    - app/lib/crud/load-form-options.server.ts
    - app/components/crud/card-detail-view.tsx
    - app/components/ag-grid/inline-detail-row.tsx
    - app/lib/crud/ops-task-schedule.config.ts
decisions:
  - 'Keep fkLabelColumn for backward compatibility; fkLabelColumns takes precedence when both are set'
  - 'Multi-column resolution in detail views uses a parallel resolver (resolveFkLabelColumns), not the existing buildFkKeyMap, since the map is intrinsically single-key'
  - 'Order column defaults to first label column when fkLabelColumns is set'
metrics:
  duration: '~2 min'
  completed: 2026-04-30
---

# Quick Task 260430-nm9: Scheduler Employee Show Last Name Summary

Extended the CRUD framework's FK form-option loader and detail views to support multi-column display labels via a new optional `fkLabelColumns?: string[]` field on `FormFieldConfig`, then applied it to `ops_task_schedule.hr_employee_id` so the scheduler's Employee dropdown renders `"preferred_name last_name"` (e.g. `"Joe Smith"`) instead of just `"Joe"`. Option `value` still binds to `hr_employee.id` (UUID) — label-only change. Backward compatible: every other CRUD config using singular `fkLabelColumn` continues to render unchanged.

## Tasks

| Task | Name                                                          | Commit  |
| ---- | ------------------------------------------------------------- | ------- |
| 1    | Add fkLabelColumns to FormFieldConfig and update FK loader    | 34b4a4d |
| 2    | Update detail-view FK label resolution (card + inline detail) | e50f40f |
| 3    | Switch scheduler Employee FK to fkLabelColumns                | b44f80d |

## What Changed

### `app/lib/crud/types.ts`
- Added `fkLabelColumns?: string[]` to `FormFieldConfig` immediately after `fkLabelColumn`.
- JSDoc clarifies precedence: when set, `fkLabelColumns` takes precedence over `fkLabelColumn`.

### `app/lib/crud/load-form-options.server.ts`
- FK field filter now qualifies fields with either `fkLabelColumn` OR a non-empty `fkLabelColumns` array.
- The FK loader derives `labelCols` (the columns to read), `orderCol` (defaults to first label column), and `selectCols` (id + orderCol + all label cols) from whichever shape is set.
- The option `label` is built by joining each label column's value with a space, filtering out null/undefined/empty strings.
- The option `value` remains `String(row['id'])` — no FK regression.

### `app/components/crud/card-detail-view.tsx` and `app/components/ag-grid/inline-detail-row.tsx`
- `buildFkKeyMap` filter now includes both shapes; multi-column fields are explicitly skipped inside the loop because the map is single-key.
- New helper `resolveFkLabelColumns(field, record)` composes a space-joined string from `${field.key}_${col}` and `${baseKey}_${col}` lookups for each column.
- `resolveFieldValue` tries the multi-column composer first, then falls back to the existing single-key path — singular path is unchanged.
- The `fkOptions`-based fallback in `card-detail-view.tsx` (~line 346–365) was deliberately not modified; it already receives the composed label produced by Task 1.

### `app/lib/crud/ops-task-schedule.config.ts`
- `hr_employee_id` field now uses `fkLabelColumns: ['preferred_name', 'last_name']` instead of `fkLabelColumn: 'preferred_name'`.
- `ops_task_id` (still `fkLabelColumn: 'id'`) and all other entries unchanged.

## Verification

- `pnpm typecheck`: PASSED
- `pnpm lint`: PASSED (only pre-existing warnings in `packages/ui/src/kit/data-table.tsx` and `packages/ui/src/shadcn/data-table.tsx` for TanStack Table's `useReactTable` — unrelated to this task)
- Type union allows either `fkLabelColumn` OR `fkLabelColumns` on `FormFieldConfig`.
- All other configs using singular `fkLabelColumn` (employees, departments, time-off, housing, etc.) untouched.

## Deviations from Plan

None — plan executed exactly as written. One small TypeScript adjustment was needed in Task 1: `labelCols[0]` is reported as `string | undefined` under strict `noUncheckedIndexedAccess`, so a non-null assertion (`labelCols[0]!`) was added to satisfy the typechecker. `labelCols` is guaranteed non-empty by construction (either `fkLabelColumns` is non-empty OR `fkLabelColumn` is set per the filter), so the assertion is sound.

## Hard Guardrail Compliance

- Scheduler form's `hr_employee_id` FK option `value` unchanged — still `hr_employee.id` UUID.
- No schemas, action handlers, or DB types modified.
- Backward compatibility preserved — every existing CRUD config with singular `fkLabelColumn` continues to work.

## Self-Check: PASSED

Files modified (all confirmed present and committed):
- `app/lib/crud/types.ts` — FOUND
- `app/lib/crud/load-form-options.server.ts` — FOUND
- `app/components/crud/card-detail-view.tsx` — FOUND
- `app/components/ag-grid/inline-detail-row.tsx` — FOUND
- `app/lib/crud/ops-task-schedule.config.ts` — FOUND

Commits (all confirmed in git log):
- `34b4a4d` — Task 1
- `e50f40f` — Task 2
- `b44f80d` — Task 3
