---
id: 260430-jzf
type: quick
status: planned
created: 2026-04-30
---

# Quick Task 260430-jzf: Time off — widen Reason, drop Notes, add PTO allocator

## Scope

1. **AG Grid table** — widen "Reason" column in Time Off list view.
2. **Drawer forms** — remove the Notes textarea from create/edit.
3. **Drawer forms** — replace the three day-count number inputs (PTO / Sick / Non-PTO) with an interactive PTO allocation widget that splits the requested span (`return_date − start_date`) across PTO / sick / unpaid and blocks the user from over-allocating.

Reference UI: `~/Downloads/pto_allocation_form.html`.

## Tasks

### T1 — Widen Reason column

- File: `app/lib/crud/hr-time-off.config.ts`
- Action: post-process the `mapColumnsToColDefs(...)` spread inside `timeOffColDefs` to override the `request_reason` ColDef with `minWidth: 320, flex: 1`.
- Verify: visual width of Reason column noticeably wider; flex-fills remaining space.
- Done: column expands and stays >= 320px.

### T2 — Remove Notes input

- File: `app/lib/crud/hr-time-off.config.ts`
- Action: remove the `{ key: 'notes', label: 'Notes', type: 'textarea' }` entry from `formFields`. Drop `'notes'` from `search.columns` (no input → not searchable from the form). Schema keeps `notes: optional()` so existing rows are untouched.
- Verify: drawer no longer renders Notes textarea on create or edit.
- Done: notes field absent from drawer.

### T3 — PTO allocation widget

- New type: add `'pto-allocation'` to `FormFieldType` union (`app/lib/crud/types.ts`).
- New component: `app/components/crud/pto-allocation-field.tsx`
  - Uses `useFormContext` + `useWatch` to read `start_date`, `return_date`, `pto_days`, `sick_leave_days`, `non_pto_days`.
  - `total = max(0, daysBetween(start_date, return_date))`.
  - Three Select dropdowns (PTO / Sick / Unpaid). Each select's max option is `total − sumOfOthers`, mirroring the reference HTML.
  - Stacked progress bar showing share of each category.
  - Status text: "X remaining" (red), "Fully allocated" (green), or "Y over" (red); "Set start and return dates" when total = 0.
- Wire-up: add `case 'pto-allocation'` to `app/lib/crud/render-form-field.tsx` returning `<PtoAllocationField label={field.label} />`.
- Config: replace the three visible day-number fields in `hr-time-off.config.ts` with one `pto_allocation` field of type `pto-allocation`, plus three hidden fields (`showOnCreate: false, showOnEdit: false`) for `pto_days`, `sick_leave_days`, `non_pto_days` so `buildDefaultValues()` initializes them and they ride through to the action.
- Verify: opening drawer with start/return dates set populates the widget; selecting values updates progress bar; over-allocation is impossible (clamped via dynamic option list).
- Done: widget renders; submit sends pto_days + sick_leave_days + non_pto_days that sum to total.

## must_haves

- Reason column visibly wider in the Time Off grid.
- Notes textarea removed from create + edit drawer.
- PTO allocator replaces the three day-number inputs, enforces sum ≤ total, and writes pto_days/sick_leave_days/non_pto_days back into the form values that submit.
- `pnpm typecheck` clean.
