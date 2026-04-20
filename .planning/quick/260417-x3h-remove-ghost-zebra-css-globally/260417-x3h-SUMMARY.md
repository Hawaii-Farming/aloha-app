---
id: 260417-x3h
type: quick
status: complete
---

# Quick Task 260417-x3h — Summary

Removed the repeating-linear-gradient "ghost zebra fill" painted on `.ag-body-viewport` in `app/styles/kit.css`. Every list view that previously showed striped bands in empty space (Scheduler with one row, Payroll Comp short tables, Employee Review "No records found", etc.) now renders a flat empty area. Real row zebra is untouched — provided by AG Grid theme `oddRowBackgroundColor` in `ag-grid-theme.ts`.

Also dropped the `**Ghost zebra fill**` bullet from UI-RULES.md §Tables since the convention no longer applies.

Prior per-grid workaround (`quick-260417-x0t` on Housing tenants: `domLayout="autoHeight"` + `sizeColumnsToFit`) left in place — still useful sizing behavior for a small sub-grid.
