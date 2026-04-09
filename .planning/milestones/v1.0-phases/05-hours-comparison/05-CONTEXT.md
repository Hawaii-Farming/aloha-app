# Phase 5: Hours Comparison - Context

**Gathered:** 2026-04-08 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Hours Comparison submodule: a comparison grid showing scheduled hours (aggregated from `ops_task_schedule`) vs payroll hours (from `hr_payroll`) per employee per pay period, with variance highlighting and row-click daily schedule breakdown. This is a read-only analytical view — no create/edit forms.

</domain>

<decisions>
## Implementation Decisions

### SQL View — Hours Comparison
- **D-01:** Create a new SQL view `app_hr_hours_comparison` that LEFT JOINs aggregated `ops_task_schedule` hours with `hr_payroll` totals per employee per pay period
- **D-02:** Schedule hours aggregation includes ALL entries (both planned and executed, regardless of `ops_task_tracker_id`) — comparison against payroll should reflect actual work, not just planned shifts
- **D-03:** Hours formula: `EXTRACT(EPOCH FROM (stop_time - start_time)) / 3600.0` for schedule hours, rounded to 2 decimal places
- **D-04:** View exposes: `hr_employee_id`, `org_id`, `pay_period_start`, `pay_period_end`, `full_name`, `profile_photo_url`, `department_name`, `scheduled_hours`, `payroll_hours` (from `hr_payroll.total_hours`), `variance` (payroll_hours - scheduled_hours)
- **D-05:** View is org-scoped with RLS via `hr_employee` membership (same pattern as `app_hr_payroll_by_employee`)
- **D-06:** Entries with NULL `stop_time` in `ops_task_schedule` contribute 0 hours (unresolved entries excluded from calculation)

### Grid Columns
- **D-07:** Columns: employee photo + full name (AvatarRenderer), department, scheduled hours, payroll hours, variance — focused comparison view, not full payroll detail
- **D-08:** Hours columns use `hoursFormatter` from `payroll-formatters.tsx`; variance column uses custom formatter showing +/- prefix

### Variance Highlighting
- **D-09:** Conditional cell styling on the variance column: amber when absolute variance > 0 hours (any mismatch), red when absolute variance > 4 hours (significant discrepancy)
- **D-10:** Use AG Grid `cellClassRules` on the variance column (consistent with Phase 1 conditional styling pattern)

### Pay Period Filter
- **D-11:** Reuse existing `PayPeriodFilter` component from `pay-period-filter.tsx` — drop-in reusable
- **D-12:** Filter via URL searchParams (`?period_start=YYYY-MM-DD&period_end=YYYY-MM-DD`) triggering loader revalidation — same pattern as all payroll submodules
- **D-13:** Default to most recent pay period when no filter selected (same as payroll views)
- **D-14:** Pay periods loaded from distinct `pay_period_start`/`pay_period_end` pairs in `hr_payroll` — reuse existing payroll pre-load pattern in sub-module.tsx

### Detail Row Expansion
- **D-15:** Row-click expands full-width detail row showing daily schedule breakdown for that employee within the selected pay period
- **D-16:** Detail row columns: date, day of week, department, task, start time, end time, hours
- **D-17:** Detail row data loaded via client-side fetch (API route) on expand — matches Phase 2 scheduler detail row pattern, avoids loading all detail data upfront
- **D-18:** Detail row queries `ops_task_schedule` filtered by `hr_employee_id` + date range (`pay_period_start` to `pay_period_end`)

### CRUD Module Config & Registry
- **D-19:** Create `hr-payroll-hours.config.ts` in `app/lib/crud/` with `viewType: { list: 'custom' }` routing to a custom list view component
- **D-20:** Register slug `payroll_hours` in `registry.ts` mapped to the new config
- **D-21:** Custom list view component `payroll-hours-list-view.tsx` in `app/components/ag-grid/` — follows `payroll-comp-manager-list-view.tsx` toolbar pattern (PayPeriodFilter + search + CSV export)

### Loader Integration
- **D-22:** Add `payroll_hours` branch to sub-module.tsx custom loader — queries `app_hr_hours_comparison` view filtered by pay period
- **D-23:** Reuse existing `payPeriods` pre-load (already covered by `startsWith('payroll_')` check in sub-module.tsx)
- **D-24:** No create/edit forms — this is a read-only comparison view (hide create button via empty `formFields`)

### Claude's Discretion
- Detail row sub-table pagination/scrolling behavior
- Exact amber/red color values for variance highlighting (follow DESIGN.md tokens)
- Whether to show a summary/totals row at the bottom (pinned row with aggregate scheduled vs payroll hours)
- Loading states for pay period filter changes and detail row expansion
- CSV export column selection (all visible columns)
- Variance column sort behavior (by absolute value vs signed value)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `supabase/migrations/20260401000037_ops_task_schedule.sql` — ops_task_schedule table with start_time, stop_time, hr_employee_id, ops_task_tracker_id columns
- `supabase/migrations/20260401000025_hr_payroll.sql` — hr_payroll table with total_hours, pay_period_start, pay_period_end, regular_hours, overtime_hours
- `supabase/migrations/20260409000001_app_hr_payroll_views.sql` — Existing payroll views (app_hr_payroll_by_employee pattern for the new view)
- `supabase/migrations/20260408000001_update_ops_task_weekly_schedule_view.sql` — Weekly schedule view (reference for hours calculation formula)

### Payroll Components (Phase 4)
- `app/components/ag-grid/payroll-comparison-list-view.tsx` — Reference custom list view pattern with PayPeriodFilter + toolbar
- `app/components/ag-grid/payroll-comp-manager-list-view.tsx` — Reference custom list view pattern (closest model for hours comparison)
- `app/components/ag-grid/pay-period-filter.tsx` — Reusable PayPeriodFilter component (drop-in)
- `app/components/ag-grid/payroll-formatters.tsx` — CurrencyRenderer, currencyFormatter, hoursFormatter (reuse hoursFormatter)

### AG Grid Foundation (Phase 1)
- `app/components/ag-grid/ag-grid-wrapper.tsx` — Shared AG Grid wrapper with SSR safety and theming
- `app/components/ag-grid/detail-row-wrapper.tsx` — useDetailRow hook for expand/collapse mechanics
- `app/components/ag-grid/inline-detail-row.tsx` — InlineDetailRow component for full-width detail content
- `app/components/ag-grid/cell-renderers/avatar-renderer.tsx` — Employee photo/avatar cell renderer
- `app/components/ag-grid/row-class-rules.ts` — Conditional row/cell styling utilities

### CRUD Pattern
- `app/lib/crud/registry.ts` — Module config registry (payroll_hours slug to add)
- `app/lib/crud/types.ts` — CrudModuleConfig, ListViewProps, ColumnConfig type definitions
- `app/routes/workspace/sub-module.tsx` — Sub-module route with custom loader branching for payroll slugs

### Scheduler Detail Row Pattern (Phase 2)
- `app/components/ag-grid/scheduler-list-view.tsx` — Reference for client-side detail row data loading pattern

### Design System
- `DESIGN.md` — Supabase-inspired color palette, typography, spacing tokens

### Requirements
- `.planning/REQUIREMENTS.md` §Hours Comparison — HCMP-01 through HCMP-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PayPeriodFilter`: Drop-in pay period selector — manages `?period_start`/`?period_end` URL params
- `hoursFormatter` / `CurrencyRenderer`: Numeric formatters from `payroll-formatters.tsx`
- `AvatarRenderer`: Employee photo cell renderer
- `useDetailRow` + `InlineDetailRow`: Full-width detail row expansion pattern
- `AgGridWrapper`: SSR-safe grid wrapper with theme integration
- `CsvExportButton`: CSV export button component
- `mapColumnsToColDefs`: Column config to AG Grid ColDef converter
- `payroll-comp-manager-list-view.tsx`: Closest template for the new custom list view (PayPeriodFilter + search + detail rows)

### Established Patterns
- Custom loader branching in `sub-module.tsx` by slug — payroll slugs already pre-load pay periods
- URL searchParams for server-side filtering (period_start/period_end) — consistent across all payroll views
- SQL views for joined/aggregated data with org-scoped RLS
- Custom list views for complex toolbars (compose AgGridWrapper directly)
- Client-side detail row data loading via API route on expand

### Integration Points
- `registry.ts`: Register `payroll_hours` slug with new config
- `sub-module.tsx`: Add `payroll_hours` branch to custom loader (between existing payroll branches)
- Workspace navigation: Hours Comparison appears under HR module via `org_sub_module` configuration (already configured in database)
- API route: New endpoint for detail row schedule data by employee + date range

</code_context>

<specifics>
## Specific Ideas

- The `ops_task_weekly_schedule` view is Sunday-anchored weekly and does NOT align to `hr_payroll` pay periods — the new view must aggregate `ops_task_schedule` directly by pay period date range
- All schedule entries (planned + executed) should be included in the comparison to reflect actual work against payroll
- The view structure follows `app_hr_payroll_by_employee` as the closest pattern — same org-scoping, same employee join, different aggregation source
- Variance = payroll_hours - scheduled_hours (positive = payroll records more hours than scheduled)

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope

</deferred>

---

*Phase: 05-hours-comparison*
*Context gathered: 2026-04-08*
