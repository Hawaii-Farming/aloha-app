---
date: "2026-04-08 11:15"
promoted: false
---

Team Lead Row Grouping for Register Table — AG Grid Row Grouping and Tree Data are Enterprise-only features. The AG Grid HR demo (ag-grid.com/example-hr/) uses treeData with getDataPath and autoGroupColumnDef with agGroupCellRenderer to create expandable/collapsible team lead groups. To replicate in Community: (1) Pre-sort data by team_lead_id in the loader, (2) Insert synthetic group header rows into the data array, (3) Use full-width rows (isFullWidthRow) to render group headers with a custom expand/collapse toggle, (4) Filter child row visibility based on collapsed state using useMemo. The hr_employee table already has team_lead_id and the config has selfJoins for team_lead_id -> preferred_name. This pattern should be reusable across other HR tables that have hierarchical grouping needs. Reference: app/lib/crud/hr-employee.config.ts (team_lead_id field), app/components/ag-grid/ag-grid-list-view.tsx (where grouping would be added), app/components/ag-grid/detail-row-wrapper.tsx (useDetailRow hook as pattern reference for synthetic row injection).
