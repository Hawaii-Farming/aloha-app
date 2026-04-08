# Feature Landscape

**Domain:** HR Management Submodules (AG Grid data grids with CRUD)
**Researched:** 2026-04-07

## Table Stakes

Features users expect. Missing = product feels incomplete.

### Cross-Submodule (AG Grid UX Patterns)

| Feature | Why Expected | Complexity | Schema Support |
|---------|--------------|------------|----------------|
| Column sorting (multi-column) | Every data grid sorts; users click headers instinctively | Low | AG Grid Community built-in |
| Column filtering (text, number, date) | Users need to narrow large datasets without coding | Low | AG Grid Community built-in |
| Quick-filter / global search bar | Single input to search across all visible columns | Low | AG Grid Community `quickFilterText` prop |
| Column resize and reorder | Users customize views to their workflow | Low | AG Grid Community built-in |
| Pagination or infinite scroll | Payroll/schedule tables can have thousands of rows | Low | AG Grid Community built-in; use pagination for HR (clearer page context) |
| Row selection (single click to expand) | PROJECT.md specifies full-width detail rows on click | Med | AG Grid Community `fullWidthCellRenderer` |
| Side-panel CRUD forms | Create/Edit in right-side panel matching register pattern | Med | No AG Grid dependency; app-level panel component |
| Soft delete (archive, not destroy) | All tables use `is_deleted` flag; users expect undo-safety | Low | All tables have `is_deleted` column |
| Loading and empty states | Skeleton/spinner while data loads; "No records" when empty | Low | AG Grid `overlayLoadingTemplate` / `overlayNoRowsTemplate` |
| Status badge rendering | Time off, disciplinary, reviews all have status columns | Low | AG Grid custom `cellRenderer` |
| Date formatting (locale-aware) | Raw ISO dates are unreadable | Low | AG Grid `valueFormatter` |
| Currency formatting | Payroll amounts must show $ with 2 decimals | Low | AG Grid `valueFormatter` |
| Responsive column hiding | On narrower screens, hide less-important columns | Low | AG Grid `columnDefs` with `hide` at breakpoints or `suppressColumnsToolPanel` |

### Scheduler Submodule

| Feature | Why Expected | Complexity | Schema Support |
|---------|--------------|------------|----------------|
| Weekly grid view (Sun-Sat) | `ops_task_weekly_schedule` view already pivots to day columns | Low | View exists with `sunday` through `saturday` columns |
| Week navigation (prev/next/current) | Users browse schedules by week; `week_start_date` is the filter | Low | View has `week_start_date`; filter param in loader |
| Employee name + task per row | Core information users need at a glance | Low | View has `full_name`, `task` columns |
| Total hours column | Users need weekly hour totals per employee-task | Low | View has `total_hours` computed column |
| Overtime flag/highlight | Managers must see who is approaching/exceeding OT | Low | View has `is_over_ot_threshold` boolean and `ot_threshold_weekly` |
| Create schedule entry form | Employee, task, date, start/end time | Med | `ops_task_schedule` table with `hr_employee_id`, `ops_task_id`, `start_time`, `stop_time` |
| Filter by department | Managers oversee specific departments | Low | View has `hr_department_id` for filtering |

### Time Off Submodule

| Feature | Why Expected | Complexity | Schema Support |
|---------|--------------|------------|----------------|
| Status filter tabs (All/Pending/Approved/Denied) | PROJECT.md specifies; managers triage pending requests | Low | `status` column with CHECK constraint |
| PTO / sick / non-PTO day breakdown | Users need to see leave type allocation | Low | `pto_days`, `sick_leave_days`, `non_pto_days` columns |
| Inline status toggle (approve/deny) | Managers approve without opening a form; PROJECT.md specifies | Med | `status` column; `reviewed_by`, `reviewed_at` for audit |
| Denial reason field | Required when denying; prevents disputes | Low | `denial_reason` column exists |
| Date range display (start - return) | Users need to see duration at a glance | Low | `start_date`, `return_date` columns |
| Create request form | Employee, dates, PTO/sick days, reason | Med | All columns exist in schema |

### Hours Comparison Submodule

| Feature | Why Expected | Complexity | Schema Support |
|---------|--------------|------------|----------------|
| Scheduled hours vs payroll hours per employee | Core purpose: catch discrepancies between planned and paid | High | **Needs new SQL view** joining `ops_task_schedule` (summed hours) with `hr_payroll` (total_hours) per employee per pay period |
| Variance column (scheduled - payroll) | Highlight mismatches; the whole point of comparison | Med | Computed in the SQL view |
| Row-click daily breakdown | PROJECT.md specifies; drill into which days differ | High | **Needs detail query** grouping `ops_task_schedule` by date for the selected employee/period |
| Pay period selector | Must scope comparison to a specific pay period | Low | `hr_payroll.pay_period_start` / `pay_period_end` |
| Variance highlighting (conditional cell styling) | Red/amber cells when hours don't match draws manager attention | Low | AG Grid `cellClassRules` based on variance threshold |

### Payroll Comparison Submodule

| Feature | Why Expected | Complexity | Schema Support |
|---------|--------------|------------|----------------|
| Aggregated by task view | See labor cost per task across employees | High | **Needs SQL view or client aggregation** grouping `hr_payroll` by department/task |
| Aggregated by employee view | See total compensation per employee across periods | Med | Aggregate `hr_payroll` by `hr_employee_id` |
| Toggle between 2 table views | PROJECT.md specifies two perspectives | Med | Two AG Grid instances or dynamic columnDefs swap |
| Pay period filter | Scope to specific period | Low | `pay_period_start` / `pay_period_end` columns |
| Totals row (pinned bottom) | Managers need grand totals for budgeting | Low | AG Grid Community `pinnedBottomRowData` |

### Payroll Comp Manager Submodule

| Feature | Why Expected | Complexity | Schema Support |
|---------|--------------|------------|----------------|
| Filter by compensation manager | Core purpose: manager sees only their reports' payroll | Low | `hr_employee.compensation_manager_id` FK; join to `hr_payroll` |
| Grouped by manager view | Each manager's team as a section | Med | AG Grid row grouping is Enterprise-only; **use filtered view per manager or pre-grouped SQL view** |
| Summary totals per manager | Manager needs their team's total cost | Med | SQL aggregation or `pinnedBottomRowData` |

### Payroll Data Submodule

| Feature | Why Expected | Complexity | Schema Support |
|---------|--------------|------------|----------------|
| Full payroll line items | Every column from `hr_payroll` displayed | Low | All columns exist; wide table with many numeric fields |
| Pay period filter | Standard payroll navigation | Low | `pay_period_start` / `pay_period_end` |
| Employee filter | Look up specific employee's pay history | Low | `hr_employee_id` |
| Column groups (Hours / Earnings / Deductions / Employer Costs) | 40+ columns need logical grouping or users drown | Med | AG Grid Community `columnDefs` with `children` (column groups) |
| Export to CSV | Payroll data frequently exported for external processing | Low | AG Grid Community CSV export built-in |

### Housing Submodule

| Feature | Why Expected | Complexity | Schema Support |
|---------|--------------|------------|----------------|
| Housing sites list (category=housing) | Filter `org_site` by housing category | Low | `org_site.org_site_category_id` references `org_site_category` |
| Tenant list per housing site | Row-click shows employees assigned to that site | Med | `hr_employee.site_id` FK to `org_site`; detail row query |
| Occupancy display (current tenants / capacity) | Managers need to see availability | Med | **Needs schema addition**: `max_beds` on `org_site` or housing-specific table; count tenants via `hr_employee` where `site_id` matches |
| Assign/unassign employee to housing | Core CRUD for housing management | Med | Update `hr_employee.site_id` |

### Employee Review Submodule

| Feature | Why Expected | Complexity | Schema Support |
|---------|--------------|------------|----------------|
| Quarterly review scores grid | Productivity, attendance, quality, engagement (1-3 scale) | Med | **Needs new table**: `hr_employee_review` (per PROJECT.md) |
| Average score computation | Auto-calculated from 4 dimensions | Low | Computed column or client-side calc |
| Year-Quarter filter | PROJECT.md specifies; reviews are per quarter | Low | Filter by review period |
| Lead assignment | Who conducted the review | Low | `lead` column in new table |
| Lock flag | Prevent edits after finalization | Low | `is_locked` boolean in new table |
| Notes field | Qualitative feedback alongside scores | Low | `notes` TEXT column |
| Create/Edit review form | Side-panel form with score sliders/selects (1-3) | Med | New table CRUD |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Schema Support |
|---------|-------------------|------------|----------------|
| OT threshold visual warnings in scheduler | Proactive OT management saves labor costs; view already computes `is_over_ot_threshold` | Low | View column exists |
| Conditional row styling (variance, OT, status) | Color-coded rows make scanning fast; AG Grid `rowClassRules` | Low | No schema needed |
| Pinned totals rows across payroll views | Instant summary without scrolling; AG Grid `pinnedBottomRowData` | Low | Client-side aggregation |
| Column state persistence (localStorage) | Users keep their preferred column widths/order/visibility across sessions | Med | No schema needed; AG Grid `columnApi` state save/restore |
| Hours comparison variance thresholds | Configurable tolerance (e.g., +/- 0.5 hrs) before flagging mismatch | Low | Could be org-level setting or hardcoded |
| Bulk status update for time off | Approve/deny multiple requests at once during busy seasons | Med | AG Grid row selection + batch action |
| Employee photo/avatar in grid rows | Quick visual identification in schedule/register grids | Low | `hr_employee.profile_photo_url` exists |
| Print-friendly schedule view | Farm managers print weekly schedules for field posting | Med | AG Grid print layout or custom print stylesheet |
| Keyboard-driven grid navigation | Power users navigate and act without mouse; AG Grid has built-in keyboard nav | Low | AG Grid Community built-in |
| Housing occupancy percentage bar | Visual indicator in housing list showing fill rate | Low | Requires `max_beds` data |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| AG Grid Enterprise features (Master/Detail, Row Grouping, Pivot) | Licence cost ($999+); PROJECT.md constrains to Community | Use full-width detail rows (Community) for expansion; pre-aggregate in SQL views instead of client-side grouping |
| Drag-and-drop schedule builder | Massive complexity; farm scheduling is task-based, not calendar-based | Simple create form with employee/task/date/time fields |
| Automated approval workflows | PROJECT.md explicitly scopes out automation; manual toggle is the design | Inline status toggle with `reviewed_by` audit trail |
| Payroll import/processing | PROJECT.md out of scope; payroll comes from external processor | Read-only display of imported `hr_payroll` data |
| Real-time collaborative editing | PROJECT.md out of scope; standard request/response model | Normal page refresh / loader revalidation |
| Mobile-responsive grid layouts | PROJECT.md: web-first; AG Grid on mobile is poor UX anyway | Responsive column hiding at most; no mobile-specific layouts |
| Complex RBAC in grid (field-level permissions) | Over-engineering; `hr_module_access` handles module-level CRUD | Module-level can_edit/can_delete/can_verify via existing access system |
| Inline cell editing in grids | Error-prone for payroll/review data; side-panel forms are safer and more consistent | Side-panel forms for all Create/Edit operations |
| Chart/graph visualizations | AG Grid Charts is Enterprise-only; adding a charting library is scope creep | Tabular data with pinned totals and conditional formatting tells the story |
| PTO balance/accrual tracking | Schema only tracks `pto_hours_accrued` per payroll period; no running balance system | Display accrued hours from payroll data; no balance ledger |
| Email/push notifications for approvals | No notification infrastructure exists; manual workflow per PROJECT.md | Status visible in grid; managers check pending tab |

## Feature Dependencies

```
Register submodule (DONE) --> All other submodules (pattern source)
                              |
AG Grid integration ---------> All submodules (shared grid component)
  |
  +--> AG Grid theme (DESIGN.md) --> All submodules (consistent styling)
  |
  +--> Full-width detail row component --> Scheduler, Hours Comparison, Housing, Payroll views
  |
  +--> Side-panel form component --> All submodules (Create/Edit)

Schema dependencies:
  hr_employee (EXISTS) --> Housing tenant list (query by site_id)
  hr_employee (EXISTS) --> All submodules (employee references)
  ops_task_schedule (EXISTS) --> Scheduler submodule
  ops_task_weekly_schedule view (EXISTS) --> Scheduler weekly grid
  hr_time_off_request (EXISTS) --> Time Off submodule
  hr_payroll (EXISTS) --> Payroll Data, Payroll Comparison, Payroll Comp Manager
  hr_disciplinary_warning (EXISTS) --> Employee Review context (not a submodule itself but related)
  org_site + org_site_category (EXISTS) --> Housing submodule

NEW schema needed:
  hr_employee_review (NEW TABLE) --> Employee Review submodule
  hours_comparison SQL view (NEW VIEW) --> Hours Comparison submodule
  org_site.max_beds or housing capacity (SCHEMA ADDITION) --> Housing occupancy display
  payroll_by_task SQL view (NEW VIEW) --> Payroll Comparison "by task" view
  payroll_by_comp_manager SQL view (NEW VIEW) --> Payroll Comp Manager submodule
```

## MVP Recommendation

Prioritize (build first -- these establish the AG Grid pattern and use existing schema directly):

1. **Scheduler** -- Weekly schedule view uses an existing SQL view with no schema changes. Establishes the AG Grid weekly-grid pattern and full-width detail row. Most visual impact.
2. **Time Off** -- Simple CRUD with status filters. Establishes inline status toggle pattern. Existing schema is complete.
3. **Payroll Data** -- Direct table display of `hr_payroll` with column groups. No computed views needed. Establishes the wide-table column grouping pattern.
4. **Housing** -- Simple filter on `org_site` with employee detail rows. Needs minor schema addition (`max_beds`) but otherwise straightforward.

Defer (build second -- these need new SQL views or tables):

5. **Hours Comparison** -- Needs a new SQL view joining schedule and payroll data. Most complex data transformation. Build after Scheduler and Payroll Data are working so the source data patterns are understood.
6. **Payroll Comparison** -- Needs aggregation views. Build after Payroll Data establishes the column/formatting patterns.
7. **Payroll Comp Manager** -- Needs pre-grouped SQL view (since AG Grid Community lacks row grouping). Build after Payroll Comparison.
8. **Employee Review** -- Needs new `hr_employee_review` table migration. Independent of payroll but last because it is the only submodule requiring a new table.

## Schema Gaps Summary

| Gap | Submodule | What's Needed | Complexity |
|-----|-----------|---------------|------------|
| `hr_employee_review` table | Employee Review | New table: employee_id, org_id, year, quarter, productivity (1-3), attendance (1-3), quality (1-3), engagement (1-3), average, notes, lead (hr_employee_id), is_locked, audit columns | Med |
| Hours comparison view | Hours Comparison | New SQL view joining `ops_task_schedule` aggregated hours with `hr_payroll.total_hours` per employee per pay period, computing variance | High |
| Payroll by task view | Payroll Comparison | New SQL view aggregating `hr_payroll` grouped by `hr_department_id` (proxy for task) with totals | Med |
| Payroll by comp manager view | Payroll Comp Manager | New SQL view aggregating `hr_payroll` joined to `hr_employee.compensation_manager_id` | Med |
| Housing capacity | Housing | Add `max_beds INTEGER` to `org_site` (or housing-specific child table); compute available via count of `hr_employee` where `site_id = org_site.id` | Low |

## Sources

- [AG Grid Community vs Enterprise](https://www.ag-grid.com/react-data-grid/community-vs-enterprise/) -- feature availability confirmation
- [AG Grid HR Example](https://www.ag-grid.com/example-hr/) -- reference implementation per PROJECT.md
- Project schema: `supabase/migrations/` SQL files (read directly)
- PROJECT.md requirements and constraints (read directly)
