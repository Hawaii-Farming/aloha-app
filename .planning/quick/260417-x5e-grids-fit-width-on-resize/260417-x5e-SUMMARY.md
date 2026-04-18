---
id: 260417-x5e
type: quick
status: complete
---

# Quick Task 260417-x5e — Summary

`AgGridWrapper` now fits columns to the grid width on mount (`sizeColumnsToFit` replacing `autoSizeAllColumns`) and re-fits on every container resize via `onGridSizeChanged`. Sidebar collapse/expand and window resize both trigger a column refit across all list views using the wrapper.

File: `app/components/ag-grid/ag-grid-wrapper.tsx`.
