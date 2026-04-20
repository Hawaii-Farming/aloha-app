---
id: 260418-tz1
type: quick
status: complete
---

# Quick Task 260418-tz1 — Summary

`FormDateField` no longer shifts the selected day by one in HST. The stored `'yyyy-MM-dd'` string is now parsed with `date-fns` `parse` (local TZ) instead of `new Date()` (UTC midnight).

- `packages/ui/src/kit/form-fields.tsx` — added `parse` to `date-fns` import; replaced `new Date(field.value)` with `parse(field.value, 'yyyy-MM-dd', new Date())` at the display site (line 205) and the calendar `selected` prop (line 213).
- Typecheck clean.

## Commit

`23e62a6` — fix(quick-260418-tz1): FormDateField timezone off-by-one in HST

## Follow-ups (out of scope)

- Add hh:mm time input for timestamp columns (`ops_task_schedule.start_time/stop_time`).
- 7-day batch scheduler form — one entry with per-day task selection.
