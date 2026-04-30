---
phase: 260430-poe
plan: 01
subsystem: hr-register
tags: [hr, ag-grid, forms, zod, ux]
key-files:
  modified:
    - app/components/ag-grid/ag-grid-list-view.tsx
    - app/lib/crud/hr-employee.config.ts
    - app/lib/crud/types.ts
    - app/lib/crud/workflow-helpers.ts
    - app/components/crud/create-panel.tsx
    - packages/ui/src/kit/form-fields.tsx
  created: []
decisions:
  - "Reactive OT default uses a justified useEffect in CreatePanel (cross-field, no event-handler home); gated on config.tableName === 'hr_employee' to keep CreatePanel generic."
  - "Schema-level housing requirement uses .superRefine() so both client zodResolver and server crudCreateAction enforce the rule from one source."
  - "is_minority schema/form key removed entirely (DB has no such column — it was binding to nothing)."
  - "FormDateField captionLayout='dropdown' applied globally — every date picker in the app now exposes year/month dropdowns. defaultMonth fallback of 1996-01-01 is HR-tuned but harmless elsewhere (it only seeds the *opened-page*; the form value stays empty)."
metrics:
  duration: ~10min
  tasks: 2
  files: 6
  completed: 2026-04-30
---

# Quick Task 260430-poe: HR Register Module — AG Grid Tweaks + Form Defaults Summary

Polished the HR Register sub-module: removed the AG Grid checkbox column so the avatar column reads first, dropped the "(hrs/week)" suffix from OT Threshold, replaced the dead `is_minority` boolean with an `ethnicity` combobox, added create-mode defaults (Female / Hourly / 0008 / HRB / Electronic), made OT Threshold reactive to Work Authorization (80 for 1099/H1/H3/Local, else 120) until the user edits it, made Housing conditionally required via Zod `.superRefine()`, and upgraded the date picker with year + month dropdowns anchored on Jan 1996.

## What Changed

### `app/components/ag-grid/ag-grid-list-view.tsx`
- Deleted the `CHECKBOX_COL` constant.
- Default `allColDefs` now starts with the avatar column (when present), then data columns. Custom-colDef tables still bypass the avatar prepend.
- Selection state, `onSelectionChanged`, and `BulkActions` left in place — they are now dormant since no row checkbox is rendered, but ready for re-wiring if a future selection model lands.

### `packages/ui/src/kit/form-fields.tsx`
- `FormDateField`'s `<Calendar>` now passes:
  - `captionLayout="dropdown"` — activates year + month dropdown navigation
  - `defaultMonth` = parsed field value, else `new Date(1996, 0, 1)` (HR-friendly anchor; only affects the *opened page* of an empty picker, not the form value)
  - `startMonth={new Date(1920, 0, 1)}`, `endMonth={new Date()}`
- Calendar component already supported these props via `react-day-picker` — no upstream changes needed.

### `app/lib/crud/types.ts`
- Added optional `defaultValue?: unknown` to `FormFieldConfig`. Edit mode is unchanged; record values still always win.

### `app/lib/crud/workflow-helpers.ts`
- `buildDefaultValues` now: (1) prefers a non-null record value; (2) falls back to `field.defaultValue` only in create mode (`record === null`); (3) finally falls back to type default (`false` / `undefined` / `''`).

### `app/lib/crud/hr-employee.config.ts`
- Schema: `is_minority` removed; `ethnicity` added (`z.string().optional()`). Wrapped in `.superRefine()` so a missing `housing_id` raises a Zod issue when `hr_work_authorization_id` is anything other than `Local` or `1099`. Issue path is `housing_id` so it surfaces under that field's `<FormMessage />`.
- Form fields:
  - `is_minority` boolean → `ethnicity` combobox (combobox source defaults to `hr_employee.ethnicity`, so existing distinct values appear).
  - `overtime_threshold` label: `OT Threshold (hrs/week)` → `OT Threshold`.
  - `defaultValue` set on: `gender=Female`, `pay_structure=Hourly`, `wc=0008`, `payroll_processor=HRB`, `pay_delivery_method=Electronic`. DOB and OT Threshold left without static defaults (DOB picker opens on Jan 1996 via Task 1; OT is reactive in CreatePanel).

### `app/components/crud/create-panel.tsx`
- Imported `useWatch` from `react-hook-form`.
- After `useForm()`, added a `useWatch` on `hr_work_authorization_id` and a `useEffect` that:
  - early-returns unless `config?.tableName === 'hr_employee'` (keeps CreatePanel generic)
  - early-returns if the OT field is dirty (`form.getFieldState('overtime_threshold').isDirty`)
  - sets `overtime_threshold = String(['1099','H1','H3','Local'].includes(wa) ? 80 : 120)` with `shouldDirty: false`
- Comment justifying the `useEffect` per CLAUDE.md (cross-field reactive default with no event-handler owner — FK combobox onChange is not routed through this component).

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `pnpm typecheck` — clean.
- `pnpm lint` — clean for touched files (4 pre-existing warnings in `packages/ui/src/kit/data-table.tsx` and `packages/ui/src/shadcn/data-table.tsx` re: TanStack Table compiler skip; out of scope).
- Manual smoke (Task 3 / human-verify) — pending human confirmation per orchestrator gate.

## Self-Check: PASSED

- FOUND: `app/components/ag-grid/ag-grid-list-view.tsx` (CHECKBOX_COL removed, allColDefs no longer prepends it)
- FOUND: `app/lib/crud/hr-employee.config.ts` (ethnicity, defaultValue, superRefine)
- FOUND: `app/lib/crud/types.ts` (FormFieldConfig.defaultValue)
- FOUND: `app/lib/crud/workflow-helpers.ts` (buildDefaultValues honors defaultValue)
- FOUND: `app/components/crud/create-panel.tsx` (useWatch + reactive OT useEffect)
- FOUND: `packages/ui/src/kit/form-fields.tsx` (captionLayout="dropdown", startMonth, endMonth, defaultMonth)
- FOUND commit ef4a608: `feat(quick-260430-poe): drop checkbox col, year/month dropdowns, FormFieldConfig.defaultValue`
- FOUND commit 1ad04f1: `feat(quick-260430-poe): HR Register form polish — ethnicity, defaults, conditional housing, reactive OT`

## Commits

- `ef4a608` — feat(quick-260430-poe): drop checkbox col, year/month dropdowns, FormFieldConfig.defaultValue
- `1ad04f1` — feat(quick-260430-poe): HR Register form polish — ethnicity, defaults, conditional housing, reactive OT
