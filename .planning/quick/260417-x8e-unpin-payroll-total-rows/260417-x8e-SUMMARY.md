---
id: 260417-x8e
type: quick
status: complete
---

# Quick Task 260417-x8e — Summary

Unpinned the TOTAL row in all three payroll list views. `pinnedBottomRowData` dropped; totals row concatenated into `rowData`. `getRowStyle` now matches by data value (`full_name === 'TOTAL'` / `department_name === 'TOTAL'`) instead of `rowPinned === 'bottom'`. UI-RULES §Tables updated to drop the "Pinned TOTAL row" convention.

Files:
- `app/components/ag-grid/payroll-hours-list-view.tsx`
- `app/components/ag-grid/payroll-comp-manager-list-view.tsx`
- `app/components/ag-grid/payroll-comparison-list-view.tsx`
- `UI-RULES.md`
