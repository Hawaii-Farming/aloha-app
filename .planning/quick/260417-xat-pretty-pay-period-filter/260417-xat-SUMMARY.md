---
id: 260417-xat
type: quick
status: complete
---

# Quick Task 260417-xat — Summary

Pay Period filter labels are now pretty (`Mar 15 – 28, 2026` etc.) and the navbar Filters popover is wider with tabular digits.

- Added `app/lib/format/pay-period.ts` exporting `formatPayPeriodLabel(start, end)` — handles same-month, same-year, and cross-year ranges.
- Wired into all three payroll views: `payroll-comparison-list-view.tsx`, `payroll-hours-list-view.tsx`, `payroll-comp-manager-list-view.tsx`.
- `navbar-filter-button.tsx` — popover `w-80` → `w-[22rem]`, Select trigger + content gain `tabular-nums` for vertical digit alignment.
