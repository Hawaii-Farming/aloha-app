---
id: 260418-tz2
type: quick
status: complete
---

# Quick Task 260418-tz2 — Summary

Scheduler and task tracker forms can now capture hh:mm alongside the date. Pure `'date'` fields (DOB, check dates, etc.) are untouched.

- `packages/ui/src/kit/form-fields.tsx` — new `FormDateTimeField`: calendar popover + `<Input type="time">` inline. Storage format is `formatISO(date)` (ISO 8601 with local offset); reads via `parseISO` — round-trips in any TZ.
- `app/lib/crud/types.ts` — added `'datetime'` to `FormFieldType`.
- `app/lib/crud/render-form-field.tsx` — switch case renders `FormDateTimeField`.
- `app/lib/crud/ops-task-schedule.config.ts` — `start_time`/`stop_time` → `'datetime'`.
- `app/lib/crud/ops-task-tracker.config.ts` — `start_time`/`stop_time` → `'datetime'`.

## Commit

`6246d06` — feat(quick-260418-tz2): add datetime form field for timestamp columns
