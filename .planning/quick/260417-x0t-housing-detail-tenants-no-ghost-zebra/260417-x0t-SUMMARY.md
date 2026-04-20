---
id: 260417-x0t
type: quick
status: complete
---

# Quick Task 260417-x0t — Summary

Housing detail Tenants grid no longer shows ghost zebra stripes in empty space.

- Added `domLayout="autoHeight"` → grid height hugs row count; no stripe band below last row.
- Added `onGridReady` calling `sizeColumnsToFit()` → columns span the grid width; no stripe column to the right.
- Imported `GridReadyEvent` from `ag-grid-community`.

Ghost zebra CSS in `app/styles/kit.css` left intact for list grids where it's desirable.
