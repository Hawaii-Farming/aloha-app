# Phase 2: Scheduler - Context

**Gathered:** 2026-04-08 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Scheduler submodule: weekly employee schedule grid using the `ops_task_weekly_schedule` SQL view with Sun-Sat day columns, week navigation (previous/next/current), overtime flags, row-click detail expansion showing historical schedule data, department filter, historical summary view, and a side-panel create form for new schedule entries writing to `ops_task_schedule`.

</domain>

<decisions>
## Implementation Decisions

### Weekly Grid Layout
- **D-01:** Map `ops_task_weekly_schedule` view columns directly to AG Grid ColDefs — one row per employee-task combination per week, with `sunday` through `saturday` as string columns displaying time ranges (e.g., "06:00 - 14:00")
- **D-02:** Display employee name (with avatar via AvatarRenderer from Phase 1), department (FK label), work authorization, task name, and total hours columns alongside the day columns
- **D-03:** Use conditional cell styling (from Phase 1 rowClassRules/cellClassRules) to highlight overtime rows — apply amber/red styling when `is_over_ot_threshold` is true
- **D-04:** Day columns that are null (employee not scheduled that day) render as empty cells

### Week Navigation
- **D-05:** Place week navigation controls in the toolbar area above the AG Grid, consistent with the DataTableToolbar pattern from Phase 1
- **D-06:** Navigation includes Previous Week / Next Week buttons and a "Current Week" button/label showing the active `week_start_date` range (e.g., "Mar 30 - Apr 5, 2026")
- **D-07:** Week changes filter the `ops_task_weekly_schedule` view by `week_start_date` parameter — server-side filtering via loader revalidation using URL search params

### Department Filter
- **D-08:** Department filter dropdown in the toolbar (alongside week navigation) filtering by `hr_department_id`
- **D-09:** Department options loaded from FK options (same pattern as register submodule — `loadFormOptions()` for `hr_department`)

### Detail Row Expansion
- **D-10:** Row-click expands full-width detail row (Phase 1 useDetailRow + InlineDetailRow pattern) showing that employee's historical schedule entries
- **D-11:** Detail row queries `ops_task_schedule` filtered by `hr_employee_id` (and optionally by a date range) to show historical data
- **D-12:** Historical data displayed as a nested AG Grid sub-table with columns: date, department, status, task, start time, end time, hours
- **D-13:** Detail row data loaded via client-side fetch on expand (React Query or useFetcher to an API route) to avoid loading all historical data upfront

### Historical Summary View
- **D-14:** A secondary view/tab showing historical schedule data aggregated by date: date, number of employees, total hours
- **D-15:** This can be a toggle between "Weekly Schedule" and "History" views in the toolbar, or a separate sub-tab — Claude's discretion on exact UX

### Create Schedule Entry
- **D-16:** Side-panel form (Shadcn Sheet via CreatePanel pattern from Phase 1) for creating new `ops_task_schedule` entries
- **D-17:** Form fields: employee dropdown (FK `hr_employee`, required), task dropdown (FK `ops_task`, required), date picker (required), start time (time input), end time (time input)
- **D-18:** New schedule entries are "planned" entries — `ops_task_tracker_id` is NULL (distinguishing from executed/tracked entries)
- **D-19:** Create action writes to `ops_task_schedule` table using existing `crudCreateAction()` pattern with org scoping

### CRUD Module Config
- **D-20:** Create a new `ops-task-schedule.config.ts` in `app/lib/crud/` for the scheduler submodule, registered in `registry.ts`
- **D-21:** The config uses `viewType: 'agGrid'` and references the `ops_task_weekly_schedule` view for the list view
- **D-22:** The config's `columns` definition includes the day columns (Sunday-Saturday) as text type, plus employee, department, task, total hours, and OT threshold columns

### Claude's Discretion
- Week navigation button styling and placement details within the toolbar
- Historical summary view toggle UX (tabs vs button toggle vs dropdown)
- Detail row sub-table pagination/scrolling behavior
- Time input component choice (native time input vs custom time picker)
- How to compute the current week's `week_start_date` (Sunday-anchored, matching the SQL view)
- Department filter: combobox vs select dropdown
- Loading states for week transitions and detail row expansion

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `supabase/migrations/20260401000038_ops_task_weekly_schedule_view.sql` — Weekly schedule SQL view definition with Sun-Sat columns, total hours, OT threshold, and OT flag
- `supabase/migrations/20260401000037_ops_task_schedule.sql` — ops_task_schedule table (planned + executed entries), unique indexes, FK relationships
- `supabase/migrations/20260401000036_ops_task_tracker.sql` — ops_task_tracker table (header record for task events)

### AG Grid Foundation (Phase 1)
- `app/components/ag-grid/ag-grid-list-view.tsx` — Main AG Grid list view component with toolbar, column visibility, detail rows, create panel integration
- `app/components/ag-grid/ag-grid-wrapper.tsx` — Shared AG Grid wrapper with SSR safety, theming, pagination
- `app/components/ag-grid/column-mapper.ts` — Maps CrudModuleConfig columns to AG Grid ColDefs
- `app/components/ag-grid/detail-row-wrapper.tsx` — useDetailRow hook for expand/collapse mechanics
- `app/components/ag-grid/inline-detail-row.tsx` — InlineDetailRow component for full-width detail content
- `app/components/ag-grid/cell-renderers/avatar-renderer.tsx` — Employee photo/avatar cell renderer
- `app/components/ag-grid/row-class-rules.ts` — Conditional row/cell styling utilities

### CRUD Pattern
- `app/lib/crud/types.ts` — CrudModuleConfig, ListViewProps, ColumnConfig type definitions
- `app/lib/crud/registry.ts` — Module config registry (getModuleConfig)
- `app/lib/crud/ops-task-tracker.config.ts` — Existing ops_task_tracker config (reference for similar ops_task_schedule config)
- `app/lib/crud/crud-action.server.ts` — CRUD action helpers (crudCreateAction)
- `app/lib/crud/crud-helpers.server.ts` — loadTableData, queryUntypedView helpers
- `app/lib/crud/load-form-options.server.ts` — FK dropdown options loader

### Design System
- `DESIGN.md` — Supabase-inspired color palette, typography, spacing tokens

### Requirements
- `.planning/REQUIREMENTS.md` §Scheduler — SCHED-01 through SCHED-08 requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AgGridListView` component: Full AG Grid list view with toolbar, search, column visibility, CSV export, detail rows, create panel — can be extended or composed for scheduler-specific toolbar
- `AgGridWrapper`: SSR-safe grid wrapper with theme integration — reuse directly
- `useDetailRow` hook: Expand/collapse detail row mechanics — reuse for historical schedule detail
- `InlineDetailRow`: Full-width detail row rendering — reuse for historical data sub-table
- `AvatarRenderer`: Employee photo cell renderer — reuse for employee column
- `mapColumnsToColDefs`: Column config to AG Grid ColDef converter — reuse for scheduler columns
- `CreatePanel`: Side-panel form with Shadcn Sheet — reuse for schedule entry create form
- `loadFormOptions()`: FK dropdown options loader — reuse for employee and task dropdowns
- `crudCreateAction()`: Validated create operation — reuse for schedule entry creation
- `DataTableToolbar`: Existing toolbar component — extend with week navigation controls

### Established Patterns
- CrudModuleConfig registry: Maps submodule slug to table/view, columns, form fields, schema — scheduler config follows this pattern
- Server-side data loading via `loadTableData()` with URL search params for pagination/filtering — extend with `week_start_date` param
- `viewType: 'agGrid'` on config routes to AG Grid rendering in sub-module.tsx
- Sub-module route (sub-module.tsx) uses `resolveListView()` for custom view loading

### Integration Points
- `registry.ts`: Register new `ops-task-schedule` config mapped to scheduler submodule slug
- `sub-module.tsx` route: Scheduler uses the same route with AG Grid list view, plus custom toolbar for week navigation
- Workspace navigation: Scheduler appears under HR module, linked via `org_sub_module` configuration
- Loader: Query `ops_task_weekly_schedule` view with `week_start_date` filter, plus load department/employee/task FK options

</code_context>

<specifics>
## Specific Ideas

- The `ops_task_weekly_schedule` view already computes Sun-Sat time ranges, total hours, OT threshold, and OT flag — the grid is a direct mapping of view columns to AG Grid ColDefs
- Planned schedule entries (ops_task_tracker_id IS NULL) are what the create form writes — distinct from executed/tracked entries
- The view groups by employee + task per week, so one employee can appear in multiple rows if they have multiple tasks

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope

</deferred>

---

*Phase: 02-scheduler*
*Context gathered: 2026-04-08*
