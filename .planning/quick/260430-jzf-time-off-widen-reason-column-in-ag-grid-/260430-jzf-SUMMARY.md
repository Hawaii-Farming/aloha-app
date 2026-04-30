---
id: 260430-jzf
type: quick
status: complete
date: 2026-04-30
commit: 97660be
---

# Quick Task 260430-jzf — Summary

## What changed

| Area | Change |
|------|--------|
| `app/lib/crud/hr-time-off.config.ts` | Reason col gets `minWidth: 320, flex: 1`. Notes textarea removed from `formFields` and from `search.columns`. Three day-number inputs swapped for one `pto_allocation` field; the underlying `pto_days`, `sick_leave_days`, `non_pto_days` are kept as hidden form fields so default values + submit payload still flow through. |
| `app/lib/crud/types.ts` | New `'pto-allocation'` member on `FormFieldType`. |
| `app/lib/crud/render-form-field.tsx` | Renders `<PtoAllocationField />` for `'pto-allocation'`. |
| `app/components/crud/pto-allocation-field.tsx` | New component. Reads `start_date`/`return_date` via `useWatch`, computes `total = max(0, dayDiff)`. Three Selects (PTO/Sick/Unpaid). Each select's max option list is `total − sumOfOthers`, mirroring the reference HTML's clamping behavior, so over-allocation is structurally impossible. Stacked progress bar shows mix; status text reads "X remaining" / "Fully allocated" / "Y over" / "Set start and return dates". Updates the three underlying form values via `setValue`. |

## Verification

- `pnpm typecheck` — clean
- `pnpm lint` — only pre-existing TanStack Table warnings; no new findings
- `pnpm format:fix` — no diff (full turbo cache)

## Manual checks pending

UI not exercised in a browser by the agent. Recommend a quick visual pass on `/home/<account>/hr/time-off`:

- Reason column visibly wider, takes leftover horizontal space.
- Drawer (create + edit) shows: Employee, Start Date, Return Date, Time off allocation widget, Reason — and no Notes.
- Setting Start + Return populates the widget; selects clamp so total never exceeds (return − start).
- Edit drawer pre-fills selects from existing pto_days / sick_leave_days / non_pto_days values.

## Out of scope

- No DB migration. `notes` column stays in `hr_time_off_request`; only the input was removed.
- No status validation on submit beyond the structural cap — submit still works at any allocation, including under-allocated. If future spec requires "must equal total to submit", add a Zod superRefine on the schema.
