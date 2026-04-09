# Milestones

## v1.0 HR Module Submodules (Shipped: 2026-04-09)

**Phases completed:** 6 phases, 21 plans, 43 tasks

**Key accomplishments:**

- AG Grid Community v35.2.1 installed with DESIGN.md-themed light/dark config, Shadcn Badge status renderer, employee avatar renderer, and date/currency value formatters
- AgGridWrapper with ClientOnly SSR safety, next-themes dark/light bridging, and mapColumnsToColDefs utility that auto-converts CrudModuleConfig columns to AG Grid ColDef[]
- Detail row expansion hook with accordion behavior, column state persistence to localStorage, CSV export button, and conditional row/cell styling utilities with Tailwind classes
- AgGridListView drop-in component replacing TableListView for register submodule with search, bulk actions, CSV export, column visibility, and column state persistence
- Updated ops_task_weekly_schedule view with employee photo/department/work-auth columns, CRUD config with custom list viewType, and Zod schema for schedule creation
- SchedulerListView component with week navigation toolbar, department filter, OT row highlighting, and custom sub-module loader for weekly schedule view
- Schedule history API with per-employee detail expansion, date-aggregated summary toggle, and CreatePanel for new schedule entries
- SQL view app_hr_time_off_requests joining employee profile, department, work auth, comp manager, and request/review names with org-scoped RLS policies
- Updated hrTimeOffConfig with agGrid viewType, 14 TOFF-01 columns, required request_reason, workflow transitionFields, and extended CRUD actions with extraFields/additionalFields parameters
- StatusFilterTabs button group for status filtering, TimeOffActionsRenderer with inline approve/deny and denial reason popover, filterSlot wiring through AgGridListView toolbar
- Four SQL payroll views, three CRUD configs with ColGroupDef column groups, and generalized sub-module loader for payroll period/manager filtering
- Payroll Comparison custom list view with by-task/by-employee toggle, pay period filter, pinned grand totals, and CSV export
- Payroll Comp Manager custom list view with manager selector dropdown, pay period filter, pinned summary totals row, and CSV export
- PayrollDataFilterBar with pay period and employee filters, Create button hidden for read-only payroll configs, default pay period selection
- SQL view comparing scheduled vs payroll hours per employee per pay period, plus API endpoint for daily schedule drill-down
- Hours Comparison AG Grid with pay period filter, variance highlighting (amber >0h, red >=4h), and API-driven daily schedule detail rows
- Applied app_hr_hours_comparison view migration to hosted Supabase and verified all HCMP requirements end-to-end
- 4 SQL migrations: org_site max_beds column, app_hr_housing occupancy view, hr_employee_review table with scored averages and RLS, app_hr_employee_reviews display view
- Housing AG Grid config with occupancy columns, tenant detail row via API fetch, and auto-resolved category on create
- Employee review AG Grid with score color coding (1=red/2=amber/3=green), Year-Quarter filter, lock enforcement, and detail row expansion
- Pushed 4 SQL migrations to hosted Supabase (org_site_max_beds, app_hr_housing, hr_employee_review, app_hr_employee_reviews) and regenerated TypeScript types

---
