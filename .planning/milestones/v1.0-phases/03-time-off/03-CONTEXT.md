# Phase 3: Time Off - Context

**Gathered:** 2026-04-08 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Time Off submodule: time off request grid displaying employee-joined data (photo, name, department, status, compensation manager, dates, PTO/sick/request-off days, reason, requested/reviewed by), status filter tabs (All/Pending/Approved/Denied), inline approve/deny toggle with denial reason capture, and a side-panel create form for new time off requests writing to `hr_time_off_request`.

</domain>

<decisions>
## Implementation Decisions

### Grid Display & Data Source
- **D-01:** Create a new SQL view `app_hr_time_off_requests` joining `hr_time_off_request` with `hr_employee` (for employee name, photo, department, work authorization status, compensation manager) — similar pattern to `ops_task_weekly_schedule` view
- **D-02:** View joins employee FK (`hr_employee_id`) to get `full_name`, `preferred_name`, `profile_photo_url`, `hr_department_id` (with department name), `work_authorization_id` (with status name), and `compensation_manager_id` (with manager name)
- **D-03:** View also resolves `requested_by` and `reviewed_by` FK references to employee names for display
- **D-04:** Use `viewType: { list: 'agGrid' }` on the updated `hrTimeOffConfig` to route to the standard `AgGridListView` component — no custom view component needed (unlike scheduler which needed custom toolbar for week navigation)
- **D-05:** Display columns per TOFF-01: avatar + full name, department, work auth status, comp manager, start date, return date, PTO days, non-PTO days (request off), sick leave days, request reason, denial reason, requested by name, reviewed by name, status badge
- **D-06:** Employee column uses `AvatarRenderer` from Phase 1 for photo + name display
- **D-07:** Status column uses `StatusBadgeRenderer` from Phase 1 with existing workflow config colors (pending=warning/amber, approved=success/green, denied=destructive/red)
- **D-08:** Date columns use AG Grid date `valueFormatter` with locale-aware formatting via `date-fns`

### Status Filter Tabs
- **D-09:** Status filter tabs (All / Pending / Approved / Denied) rendered as toolbar button group above the AG Grid, visually matching the register toolbar pattern
- **D-10:** Tab selection updates URL searchParams (`?status=pending`) triggering server-side loader revalidation — the loader filters the view query by status
- **D-11:** "All" tab shows all non-deleted requests (no status filter applied)
- **D-12:** Active tab visually highlighted with DESIGN.md accent styling

### Inline Status Toggle (Approve/Deny)
- **D-13:** Add an "Actions" cell renderer column with Approve and Deny buttons visible on pending requests
- **D-14:** Approve action calls `bulk_transition` intent on the existing sub-module action endpoint, transitioning status from `pending` to `approved` and setting `reviewed_by` and `reviewed_at`
- **D-15:** Deny action first opens a popover/dialog requiring a `denial_reason` text input before submitting — the denial cannot proceed without a reason (TOFF-04)
- **D-16:** Deny submission calls `bulk_transition` with status `denied` plus `transitionFields: { denial_reason, reviewed_by, reviewed_at }`
- **D-17:** Approved/denied rows show the current status badge but no further action buttons (approved has no transitions, denied can transition back to pending per workflow config)
- **D-18:** After successful status transition, the grid revalidates to reflect the updated status

### Create Time Off Request Form
- **D-19:** Use existing `CreatePanel` (Shadcn Sheet side-panel) pattern from Phase 1
- **D-20:** Form fields per TOFF-05: employee dropdown (FK `hr_employee`, required), start date (date picker, required), return date (date picker, optional), PTO days (number, optional), non-PTO days (number, optional), sick leave days (number, optional), request reason (textarea, required per TOFF-05)
- **D-21:** `requested_by` auto-set to the current logged-in employee's `hr_employee_id` from workspace context (not a form field)
- **D-22:** `requested_at` auto-set to `now()` by the database default
- **D-23:** New requests default to `status: 'pending'` (database default)
- **D-24:** Update `hrTimeOffConfig` Zod schema to make `request_reason` required (currently optional)

### CRUD Module Config Updates
- **D-25:** Update `hrTimeOffConfig` to add `viewType: { list: 'agGrid' }` so it routes to AgGridListView
- **D-26:** Update config `views.list` to reference the new `app_hr_time_off_requests` view instead of raw table
- **D-27:** Expand `columns` array to include all TOFF-01 display fields (department, work auth, comp manager, requested_by name, reviewed_by name)
- **D-28:** Add `select` property to config if PostgREST embedding is needed for the view's FK columns

### Claude's Discretion
- Action button styling in the Actions cell renderer (icon buttons vs text buttons, sizing)
- Denial reason popover vs small dialog — whichever fits better in the grid context
- Exact tab button group styling within the toolbar
- Column ordering and default visibility for lower-priority columns
- Loading states during status transitions
- Whether to show a toast notification on successful approve/deny

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `supabase/migrations/20260401000022_hr_time_off_request.sql` -- hr_time_off_request table definition with status CHECK constraint, named FK constraints for PostgREST disambiguation, and indexes
- `supabase/migrations/20260401000038_ops_task_weekly_schedule_view.sql` -- Reference pattern for creating joined SQL views (ops_task_weekly_schedule)

### Existing Config
- `app/lib/crud/hr-time-off.config.ts` -- Current hrTimeOffConfig with columns, formFields, workflow states, Zod schema (needs updates per decisions D-25 through D-28)
- `app/lib/crud/registry.ts` -- Module config registry (time_off already registered)

### AG Grid Foundation (Phase 1)
- `app/components/ag-grid/ag-grid-list-view.tsx` -- Standard AG Grid list view with toolbar, column visibility, detail rows, create panel, bulk actions
- `app/components/ag-grid/ag-grid-wrapper.tsx` -- Shared AG Grid wrapper with SSR safety and theming
- `app/components/ag-grid/cell-renderers/avatar-renderer.tsx` -- Employee photo/avatar cell renderer
- `app/components/ag-grid/column-mapper.ts` -- Maps CrudModuleConfig columns to AG Grid ColDefs

### CRUD Pattern
- `app/routes/workspace/sub-module.tsx` -- Sub-module route with loader, action (bulk_delete, bulk_transition), and view resolution
- `app/lib/crud/crud-action.server.ts` -- CRUD action helpers including crudBulkTransitionAction (for approve/deny)
- `app/lib/crud/crud-helpers.server.ts` -- loadTableData, queryUntypedView helpers
- `app/components/crud/create-panel.tsx` -- Side-panel create form component

### Design System
- `DESIGN.md` -- Supabase-inspired color palette, typography, spacing tokens

### Requirements
- `.planning/REQUIREMENTS.md` section "Time Off" -- TOFF-01 through TOFF-05 requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AgGridListView`: Standard AG Grid view with toolbar, search, column visibility, CSV export, detail rows, create panel, bulk actions -- can be used directly without a custom view component
- `AgGridWrapper`: SSR-safe grid wrapper with theme integration
- `AvatarRenderer`: Employee photo cell renderer -- reuse for employee column
- `StatusBadgeRenderer` (via workflow config): Status badge rendering with color mapping
- `CreatePanel`: Side-panel form with Shadcn Sheet
- `crudBulkTransitionAction`: Existing action for status transitions with `transitionFields` support -- reuse for approve/deny
- `loadFormOptions()`: FK dropdown options loader -- reuse for employee dropdown
- `mapColumnsToColDefs`: Column config to AG Grid ColDef converter
- `DataTableToolbar`: Toolbar component with search and action buttons
- `hrTimeOffConfig`: Already registered in registry with basic columns, form fields, workflow states, and Zod schema

### Established Patterns
- CrudModuleConfig registry with `viewType: { list: 'agGrid' }` routes to AgGridListView (used by register submodule)
- `bulk_transition` action intent in sub-module.tsx handles status changes with `statusColumn`, `newStatus`, and `transitionFields`
- Scheduler uses URL searchParams for server-side filtering (week, dept) -- same pattern for status filter tabs
- Named FK constraints on hr_time_off_request for PostgREST embedding (employee, requested_by, reviewed_by)

### Integration Points
- `registry.ts`: `time_off` slug already mapped to `hrTimeOffConfig` -- just needs config property updates
- `sub-module.tsx` route: Handles `viewType: 'agGrid'` routing to AgGridListView, and `bulk_transition` action
- Workspace navigation: Time Off appears under HR module via `org_sub_module` configuration
- Loader: May need a custom loader branch (like scheduler) if the view requires special query handling, or can use standard `loadTableData()` if the view includes `is_deleted` column

</code_context>

<specifics>
## Specific Ideas

- Time Off is simpler than Scheduler -- no custom view component needed, standard AgGridListView with status filter tabs in toolbar
- The `bulk_transition` action already supports `transitionFields` for setting `reviewed_by` and `reviewed_at` alongside status changes
- The existing workflow config on hrTimeOffConfig defines transitions: pending -> [approved, denied], denied -> [pending], approved -> [] -- this drives which action buttons appear per row
- PostgREST embedding via named FK constraints allows the view to resolve requested_by and reviewed_by to employee names

</specifics>

<deferred>
## Deferred Ideas

None -- analysis stayed within phase scope

</deferred>

---

*Phase: 03-time-off*
*Context gathered: 2026-04-08*
