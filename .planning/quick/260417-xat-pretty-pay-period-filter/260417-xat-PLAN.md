---
id: 260417-xat
type: quick
status: complete
---

# Quick Task 260417-xat

## Objective

Pretty up the Pay Period date labels in the navbar Filters popover.

- Dates show as `2026-03-15 – 2026-03-28` — ISO strings, noisy, hard to scan.
- Popover width `w-80` (320px) crams longer labels.

## Changes

### `app/lib/format/pay-period.ts` (new)

`formatPayPeriodLabel(start, end)` returns:
- Same month: `Mar 15 – 28, 2026`
- Same year: `Mar 28 – Apr 11, 2026`
- Cross year: `Dec 28, 2025 – Jan 10, 2026`

### Payroll views (3 files)

`payroll-comparison-list-view.tsx`, `payroll-hours-list-view.tsx`, `payroll-comp-manager-list-view.tsx`:

Import `formatPayPeriodLabel`; replace raw `${start} – ${end}` labels on the NavbarFilterButton pay-period options.

### `app/components/navbar-filter-button.tsx`

- `PopoverContent` width `w-80` → `w-[22rem]` (352px) so long labels don't wrap.
- Add `tabular-nums` to the Select trigger and its content so dates align monospaced.

## Verification

`pnpm typecheck` clean. Filters popover shows clean, aligned date ranges.
