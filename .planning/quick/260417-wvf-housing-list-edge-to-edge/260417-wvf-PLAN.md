---
id: 260417-wvf
type: quick
status: complete
---

# Quick Task 260417-wvf

## Objective

Housing list view had `gap-4 px-4 py-4` on its outer flex container, adding ~16px padding on all sides. Payroll Data (standard `AgGridListView`) uses no padding — the grid butts against navbar / sidebar edges. Make Housing match.

## Change

File: `app/components/ag-grid/housing-map-view.tsx` (outer return)

- `flex min-h-0 flex-1 flex-col gap-4 px-4 py-4` → `flex min-h-0 flex-1 flex-col`

## Verification

`pnpm typecheck` clean.
