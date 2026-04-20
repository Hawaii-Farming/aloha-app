---
id: 260418-tz3
type: quick
status: complete
---

# Quick Task 260418-tz3 — Summary

`FormDateTimeField` now uses two Shadcn `<Select>` dropdowns (HH 00–23, MM 15-min increments) for the time portion instead of the native `<input type="time">`. Visually consistent with every other dropdown on the form.

- `packages/ui/src/kit/form-fields.tsx` — replaced `Input type="time"` with hour + minute Selects. Module-level `HOUR_OPTIONS` (24) and `MINUTE_OPTIONS` (`00 15 30 45`). Shared `commit(date, h, m)` writes back via `formatISO`.
- Typecheck clean.

## Commit

`36737ab` — refactor(quick-260418-tz3): time picker to Shadcn Selects

## Note

Minute granularity is 15 min. If finer resolution is needed later (e.g. 5-min), change `MINUTE_OPTIONS` — one-line edit.
