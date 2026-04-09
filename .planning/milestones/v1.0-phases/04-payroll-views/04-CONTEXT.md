# Phase 4: Payroll Views - Context

**Gathered:** 2026-04-08 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Build three payroll display submodules: (1) Payroll Comparison — aggregated by task and by employee with a toggle between views and pinned totals row, (2) Payroll Comp Manager — payroll data filtered/grouped by compensation manager with manager selector and summary totals, (3) Payroll Data — detailed hr_payroll line items with column groups (Hours/Earnings/Deductions/Employer Costs), pay period and employee filters, and CSV export. All three are read-only display views (payroll is imported externally).

</domain>

<decisions>
## Implementation Decisions

### Data Source Strategy
- **D-01:** Create SQL views for aggregated data: `app_hr_payroll_by_task` (grouped by department/task per pay period) and `app_hr_payroll_by_employee` (grouped by employee per pay period) for Payroll Comparison
- **D-02:** Create SQL view `app_hr_payroll_by_comp_manager` joining `hr_payroll` with `hr_employee.compensation_manager_id` and resolving manager name for Comp Manager submodule
- **D-03:** Payroll Data uses the raw `hr_payroll` table directly (already has all columns) — no new view needed, but join employee name/photo via a view `app_hr_payroll_detail` for display
- **D-04:** All views are org-scoped with RLS via `hr_employee` membership (same pattern as `app_hr_time_off_requests`)

### Payroll Comparison — View Toggle
- **D-05:** Two views accessible via URL searchParams toggle (`?view=by_task` / `?view=by_employee`) — server-side loader switches between views based on param, consistent with status filter tabs pattern from Phase 3
- **D-06:** Toggle rendered as tab-style buttons in the toolbar (reuse `StatusFilterTabs` component pattern or similar toggle component)
- **D-07:** By-task view columns: department, task, employee count, total regular hours, total OT hours, total gross wage, total net pay
- **D-08:** By-employee view columns: avatar + employee name, department, total regular hours, total OT hours, total gross wage, total net pay
- **D-09:** Pinned bottom row shows grand totals using AG Grid `pinnedBottomRowData` — calculated from SQL view aggregation (SUM returned as a totals row from the view, or computed client-side from loaded data)

### Payroll Comp Manager — Manager Filtering
- **D-10:** Manager selector dropdown in the toolbar, loaded from `hr_employee` where the employee is referenced as `compensation_manager_id` by at least one other employee (distinct managers)
- **D-11:** Manager selection updates URL searchParams (`?manager=<id>`) triggering loader revalidation — consistent with scheduler department filter and time off status filter patterns
- **D-12:** Grid displays payroll records for employees assigned to the selected compensation manager
- **D-13:** Summary totals as pinned bottom row (total hours, total gross, total net for the selected manager's employees)
- **D-14:** Columns: avatar + employee name, department, check date, regular hours, OT hours, gross wage, net pay (key summary fields, not all 40+ columns)

### Payroll Data — Column Groups & Full Display
- **D-15:** Use AG Grid column groups (`children` property on ColDef) to organize 40+ columns into collapsible sections: Employee Info, Pay Period, Hours, Earnings, Deductions, Employer Costs
- **D-16:** Employee Info group: employee name (with avatar), department, work authorization, pay structure, hourly rate, OT threshold
- **D-17:** Pay Period group: payroll ID, payroll processor, check date, pay period start, pay period end, invoice number, is_standard
- **D-18:** Hours group: regular, overtime, holiday, PTO, sick, funeral, total, PTO accrued
- **D-19:** Earnings group: regular pay, overtime pay, holiday pay, PTO pay, sick pay, funeral pay, other pay, bonus pay, auto allowance, per diem, salary, gross wage
- **D-20:** Deductions group: FIT, SIT, social security, medicare, comp plus, HDS dental, pre-tax 401k, auto deduction, child support, program fees, net pay
- **D-21:** Employer Costs group: labor tax, other tax, workers comp, health benefits, other health charges, admin fees, Hawaii GET, other charges, TDI, total cost

### Pay Period Filtering (All Three Submodules)
- **D-22:** Pay period dropdown filter in the toolbar for all three submodules, loaded from distinct `pay_period_start`/`pay_period_end` pairs in `hr_payroll`
- **D-23:** Display format: "MM/DD/YYYY - MM/DD/YYYY" showing period start through end
- **D-24:** Filter via URL searchParams (`?period_start=YYYY-MM-DD&period_end=YYYY-MM-DD`) triggering loader revalidation
- **D-25:** Default to most recent pay period when no filter selected

### Employee Filter (Payroll Data Only)
- **D-26:** Employee dropdown filter in the toolbar for Payroll Data submodule, loaded from `hr_employee` FK options (same as other submodules)
- **D-27:** Filter via URL searchParams (`?employee=<id>`) for server-side filtering

### CRUD Module Configs
- **D-28:** Create three new config files: `hr-payroll-comparison.config.ts`, `hr-payroll-comp-manager.config.ts`, `hr-payroll-data.config.ts`
- **D-29:** Register three new slugs in `registry.ts`: `payroll_comparison`, `payroll_comp_manager`, `payroll_data` — the existing `payroll` slug config can be updated or deprecated
- **D-30:** All three configs use `viewType: { list: 'agGrid' }` routing to `AgGridListView`
- **D-31:** Payroll Comparison and Comp Manager need custom list views (like Scheduler) for toolbar toggle/filter controls; Payroll Data can use standard `AgGridListView` with `filterSlot` for toolbar filters

### CSV Export
- **D-32:** CSV export enabled on all three submodules via existing `CsvExportButton` from Phase 1
- **D-33:** Payroll Data CSV includes all visible columns (respects column visibility state)

### Claude's Discretion
- Exact toggle button styling for Payroll Comparison view switch
- Manager dropdown component choice (combobox vs select)
- Pay period dropdown display formatting details
- Default column visibility (which groups start expanded/collapsed in Payroll Data)
- Loading states for filter changes
- Whether to show toast on CSV export completion
- Pinned totals row styling (bold, background color)
- Column group header styling

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `supabase/migrations/20260401000025_hr_payroll.sql` — hr_payroll table with 40+ columns organized into Hours/Earnings/Deductions/Employer Costs sections, indexes on org/employee/check_date/period
- `supabase/migrations/20260401000020_hr_employee.sql` — hr_employee table with `compensation_manager_id` FK (self-referential, named constraint `fk_hr_employee_compensation_manager`)
- `supabase/migrations/20260408000002_app_hr_time_off_requests_view.sql` — Reference pattern for creating joined SQL views with RLS

### Existing Payroll Config
- `app/lib/crud/hr-payroll.config.ts` — Current payroll config with basic columns and schema (needs to be split/replaced for three submodules)
- `app/lib/crud/registry.ts` — Module config registry (payroll slug already registered at line 30)

### AG Grid Foundation (Phase 1)
- `app/components/ag-grid/ag-grid-list-view.tsx` — Standard AG Grid list view with toolbar, filterSlot, column visibility, detail rows, create panel, bulk actions, CSV export
- `app/components/ag-grid/ag-grid-wrapper.tsx` — Shared AG Grid wrapper with SSR safety and theming
- `app/components/ag-grid/cell-renderers/avatar-renderer.tsx` — Employee photo/avatar cell renderer
- `app/components/ag-grid/column-mapper.ts` — Maps CrudModuleConfig columns to AG Grid ColDefs
- `app/components/ag-grid/csv-export-button.tsx` — CSV export button component
- `app/components/ag-grid/status-filter-tabs.tsx` — Reusable filter tabs component (pattern for view toggle)

### CRUD Pattern
- `app/routes/workspace/sub-module.tsx` — Sub-module route with loader, action, and view resolution
- `app/lib/crud/crud-helpers.server.ts` — loadTableData, queryUntypedView helpers
- `app/lib/crud/load-form-options.server.ts` — FK dropdown options loader
- `app/lib/crud/types.ts` — CrudModuleConfig, ListViewProps, ColumnConfig type definitions

### Prior Phase Patterns
- `app/components/ag-grid/status-filter-tabs.tsx` — StatusFilterTabs used in Phase 3 for URL searchParams filtering (reuse pattern for view toggle and period filter)

### Design System
- `DESIGN.md` — Supabase-inspired color palette, typography, spacing tokens

### Requirements
- `.planning/REQUIREMENTS.md` §Payroll Comparison — PCMP-01 through PCMP-06
- `.planning/REQUIREMENTS.md` §Payroll Comp Manager — PMGR-01 through PMGR-04
- `.planning/REQUIREMENTS.md` §Payroll Data — PDAT-01 through PDAT-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AgGridListView`: Standard AG Grid view with toolbar, search, column visibility, CSV export, detail rows, create panel, bulk actions, filterSlot — can be used directly for Payroll Data, extended for Comparison/Comp Manager
- `AgGridWrapper`: SSR-safe grid wrapper with theme integration
- `AvatarRenderer`: Employee photo cell renderer — reuse for employee columns
- `StatusFilterTabs`: Tab-style filter component using URL searchParams — reuse pattern for view toggle in Payroll Comparison
- `CsvExportButton`: CSV export button — reuse across all three submodules
- `mapColumnsToColDefs`: Column config to AG Grid ColDef converter
- `loadFormOptions()`: FK dropdown options loader — reuse for employee/manager dropdowns
- `filterSlot` prop on ListViewProps: Enables reusable toolbar customization for any submodule (used in Phase 3 for time off status tabs)
- `hrPayrollConfig`: Existing payroll config with basic columns and Zod schema — starting point for three new configs

### Established Patterns
- CrudModuleConfig registry with `viewType: { list: 'agGrid' }` routes to AgGridListView
- URL searchParams for server-side filtering (week nav in scheduler, status tabs in time off) — same pattern for pay period, manager, and view toggle filters
- SQL views for joined data display (ops_task_weekly_schedule, app_hr_time_off_requests) — same pattern for payroll aggregation views
- Custom list views for complex toolbar (SchedulerListView) — same pattern for Payroll Comparison and Comp Manager

### Integration Points
- `registry.ts`: Register three new submodule slugs (payroll_comparison, payroll_comp_manager, payroll_data)
- `sub-module.tsx` route: Handles AG Grid routing and custom loaders for views
- Workspace navigation: Payroll submodules appear under HR module via `org_sub_module` configuration
- `hr_payroll` table: All data sourced from externally imported payroll records — read-only display, no create/edit forms needed

</code_context>

<specifics>
## Specific Ideas

- All three payroll submodules are read-only displays — no create/edit/delete forms needed (payroll is imported externally per PROJECT.md)
- The hr_payroll table already has 40+ well-organized columns with clear groupings (Hours, Earnings, Deductions, Employer Costs) that map directly to AG Grid column groups
- `compensation_manager_id` on `hr_employee` is a self-referential FK to another employee with manager role — the SQL view needs to resolve this to a name
- Pinned bottom row for totals is a native AG Grid Community feature (`pinnedBottomRowData`) — no Enterprise license needed
- Column groups with collapsible headers is also AG Grid Community — allows users to expand/collapse sections of the 40+ column grid

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope

</deferred>

---

*Phase: 04-payroll-views*
*Context gathered: 2026-04-08*
