---
phase: 03-time-off
verified: 2026-04-09T01:00:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Navigate to the time off submodule and confirm real data renders"
    expected: "AG Grid shows rows from app_hr_time_off_requests with photo, employee name, department, work auth, comp manager, start/return dates, PTO days, sick days, reason, status badge columns"
    why_human: "Cannot query the live database without Docker/Supabase running; migrations were created but supabase:reset was skipped (Docker not running during both Plan 02 and Plan 03 execution)"
  - test: "Click All / Pending / Approved / Denied filter tabs and verify grid filters"
    expected: "Active tab is highlighted (secondary variant), inactive tabs are ghost. Grid rows filter to the selected status with no page reload — URL shows filter_status=pending etc."
    why_human: "UI behavior and visual state of button group cannot be verified programmatically"
  - test: "Click Approve on a pending row"
    expected: "Status badge changes to Approved, reviewed_by and reviewed_at fields populate in the database, row action buttons disappear (non-pending rows return null from renderer)"
    why_human: "Requires live database write and grid revalidation verification"
  - test: "Click Deny on a pending row and attempt to submit without entering a denial reason"
    expected: "Confirm Deny button is disabled until text is entered in the textarea. After entering text and confirming, status changes to Denied and denial_reason is stored"
    why_human: "Popover interaction and form validation state require browser testing"
  - test: "Open the Create side panel and submit a new time off request"
    expected: "Form shows employee dropdown, start date (required), return date, PTO days, sick leave days, non-PTO days, reason (required). After submit, new record appears with requested_by auto-set to the current employee"
    why_human: "Requires live database and session context to verify requested_by auto-population"
---

# Phase 3: Time Off Verification Report

**Phase Goal:** Users can view, filter, create, and approve/deny time off requests
**Verified:** 2026-04-09
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Time off grid displays all request fields including photo, name, dates, PTO days, reason, and status | VERIFIED | `hr-time-off.config.ts` defines 14 columns including `full_name`, `profile_photo_url` (via view), `start_date`, `return_date`, `pto_days`, `sick_leave_days`, `non_pto_days`, `request_reason`, `status`. View joins `hr_employee` for `profile_photo_url`. Config routes to `agGrid` via `viewType.list = 'agGrid'`. |
| 2 | User can switch between All/Pending/Approved/Denied tabs and the grid filters accordingly | VERIFIED | `status-filter-tabs.tsx` renders buttons for each `workflow.states` key + "All". Updates `filter_status` URL param via `setSearchParams`. Loader reads `filter_status` via `loadTableData` (`crud-helpers.server.ts` line 154-157) and applies `.eq('status', value)` when column is in `allowedColumns`. `status` is in `timeOffColumns` so it flows through. |
| 3 | User can approve or deny a request inline and the status updates immediately in the row | VERIFIED | `time-off-actions-renderer.tsx` renders Approve/Deny buttons for `status === 'pending'` rows only. Approve submits `bulk_transition` intent with `newStatus: 'approved'`. `sub-module.tsx` line 182 passes `extraFields: body.extraFields` through to `crudBulkTransitionAction`. After fetcher returns to idle, `revalidator.revalidate()` is called to refresh grid data. |
| 4 | Denying a request requires entering a denial reason before the action completes | VERIFIED | Deny button opens a Popover with a Textarea for `denialReason`. "Confirm Deny" button is `disabled={!denialReason.trim() \|\| isSubmitting}`. On confirm, submits with `extraFields: { denial_reason: denialReason }`. `crudBulkTransitionAction` merges `extraFields` via `Object.assign(updateData, params.extraFields)`. |
| 5 | User can create a new time off request via the side-panel form | VERIFIED | `hrTimeOffConfig.formFields` includes all TOFF-05 fields: `hr_employee_id` (fk, required), `start_date` (date, required), `return_date`, `pto_days`, `sick_leave_days`, `non_pto_days`, `request_reason` (textarea, required). `additionalCreateFields: { requested_by: 'currentEmployee' }` is defined in config and wired through `sub-module-create.tsx` line 155 to `crudCreateAction`'s `additionalFields` param. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260408000002_app_hr_time_off_requests_view.sql` | SQL view joining hr_time_off_request with employee, dept, work auth, comp manager, requested_by, reviewed_by | VERIFIED | `CREATE OR REPLACE VIEW app_hr_time_off_requests` — 7 JOINs, all required columns, `NULL::DATE AS end_date` for loadTableData compatibility, `GRANT SELECT TO authenticated` |
| `supabase/migrations/20260408000003_hr_time_off_request_rls.sql` | RLS policies and GRANT for hr_time_off_request | VERIFIED | `ALTER TABLE hr_time_off_request ENABLE ROW LEVEL SECURITY`, 3 org-scoped policies (read/write/update), `GRANT SELECT, INSERT, UPDATE TO authenticated`, no DELETE grant |
| `app/lib/crud/hr-time-off.config.ts` | Config with agGrid viewType, 14 display columns, workflow transitionFields, additionalCreateFields | VERIFIED | `viewType: { list: 'agGrid' }`, `views.list: 'app_hr_time_off_requests'`, 14 columns in `timeOffColumns`, `workflow.transitionFields` for approved/denied, `additionalCreateFields: { requested_by: 'currentEmployee' }`, `agGridColDefs` with Actions column pinned right |
| `app/lib/crud/crud-action.server.ts` | Extended crudBulkTransitionAction with extraFields, crudCreateAction with additionalFields | VERIFIED | `extraFields?: Record<string, unknown>` on `crudBulkTransitionAction` (line 147) and `crudTransitionAction` (line 189); `Object.assign(updateData, params.extraFields)` applied in both; `additionalFields` on `crudCreateAction` (line 18) with currentEmployee/currentOrg loop |
| `app/lib/crud/types.ts` | additionalCreateFields on CrudModuleConfig, filterSlot on ListViewProps | VERIFIED | `additionalCreateFields?: Record<string, 'currentEmployee' \| 'currentOrg'>` at line 192; `filterSlot?: ReactNode` at line 30 |
| `app/components/ag-grid/status-filter-tabs.tsx` | StatusFilterTabs button group using searchParams | VERIFIED | Substantive: renders "All" + one button per `workflow.states`. Uses `filter_status` URL param, `preventScrollReset: true`. Active/ghost variant toggle. `data-test` attributes on container and each button. Named export. |
| `app/components/ag-grid/ag-grid-list-view.tsx` | Destructures and passes filterSlot to DataTableToolbar | VERIFIED | `filterSlot` destructured at line 90, passed to `<DataTableToolbar filterSlot={filterSlot}>` at line 266 |
| `app/components/ag-grid/cell-renderers/time-off-actions-renderer.tsx` | TimeOffActionsRenderer with Approve/Deny and denial reason popover | VERIFIED | Approve: Check icon button, submits bulk_transition approved + transitionFields. Deny: X icon button in PopoverTrigger, popover with Textarea + disabled Confirm Deny until text entered. `return null` for non-pending rows. `revalidator.revalidate()` after fetcher completes. |
| `app/routes/workspace/sub-module-create.tsx` | Passes additionalCreateFields to crudCreateAction | VERIFIED | Line 155: `additionalFields: config?.additionalCreateFields` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `status-filter-tabs.tsx` | `ag-grid-list-view.tsx` | `filterSlot` prop | WIRED | `sub-module.tsx` passes `filterSlot={config.workflow ? <StatusFilterTabs workflow={config.workflow} /> : undefined}` (lines 269-271); `ag-grid-list-view.tsx` passes through to `DataTableToolbar` |
| `hr-time-off.config.ts` | `app_hr_time_off_requests` view | `views.list` property | WIRED | `views.list: 'app_hr_time_off_requests'`; sub-module loader reads `config.views.list` at line 55, passes to `queryUntypedView` |
| `time-off-actions-renderer.tsx` | `sub-module.tsx` action | `useFetcher` submitting `bulk_transition` | WIRED | Renderer submits JSON with `intent: 'bulk_transition'`; sub-module.tsx action handler reads `body.extraFields` and passes to `crudBulkTransitionAction` at line 182 |
| `sub-module-create.tsx` | `crudCreateAction` | `additionalFields: config.additionalCreateFields` | WIRED | Line 155 passes `additionalFields: config?.additionalCreateFields`; `crudCreateAction` applies currentEmployee value from authenticated session |
| `hr-time-off.config.ts` | `ag-grid-list-view.tsx` | `viewType.list = 'agGrid'` via `resolveListView` | WIRED | Registry maps `time_off` to `hrTimeOffConfig`; `sub-module.tsx` `resolveListView` branches on `viewType.list === 'agGrid'` to render `AgGridListView` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `AgGridListView` (time off) | `tableData` from loader | `queryUntypedView(client, 'app_hr_time_off_requests')` in `crud-helpers.server.ts` → Supabase PostgREST query against the SQL view | Yes — view JOINs `hr_time_off_request` with `hr_employee`, `hr_department`, `hr_work_authorization`; returns real rows | FLOWING |
| `StatusFilterTabs` | `filter_status` from `useSearchParams` | URL param → server loader applies `.eq('status', value)` | Yes — server-side filter via Supabase `.eq()` on real view | FLOWING |
| `TimeOffActionsRenderer` | `status`, `id` from `props.data` | Row data from `tableData` loader | Yes — real data from view; approve/deny writes to `hr_time_off_request` table | FLOWING |

**Note:** Migrations for the view and RLS were not applied to the local database during plan execution (Docker/Supabase was not running). The SQL syntax follows established project patterns and is high-confidence correct, but cannot be confirmed to apply without errors until Docker is available.

### Behavioral Spot-Checks

Step 7b: SKIPPED — requires Supabase running (Docker not available); server-side code connects to live DB.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| TOFF-01 | 03-01-PLAN, 03-02-PLAN | Time off request grid displaying photo, full name, dept, status, comp manager, start date, return date, PTO days, request off, sick leave, reason, justification, requested by, updated by, pending, approved | SATISFIED | View provides all joined columns; config `timeOffColumns` maps all 14 display fields; `agGridColDefs` via `mapColumnsToColDefs` renders them |
| TOFF-02 | 03-03-PLAN | Status filter tabs (All / Pending / Approved / Denied) filtering `hr_time_off_request.status` | SATISFIED | `StatusFilterTabs` renders button group; `filter_status` URL param triggers `.eq('status', value)` in loader |
| TOFF-03 | 03-03-PLAN | Inline status toggle (approve/deny) updating `status`, `reviewed_by`, `reviewed_at` in row | SATISFIED | `TimeOffActionsRenderer` submits `bulk_transition` with `transitionFields: { reviewed_by: 'currentEmployee', reviewed_at: 'now' }`; `crudBulkTransitionAction` applies all three fields |
| TOFF-04 | 03-03-PLAN | Denial reason field displayed/required when denying a request | SATISFIED | Popover with Textarea; "Confirm Deny" disabled when `denialReason.trim()` is empty; `extraFields: { denial_reason: denialReason }` submitted and merged into DB update |
| TOFF-05 | 03-02-PLAN, 03-03-PLAN | Create form: employee dropdown (required), leave start date (required), PTO days, request off days, sick leave days, request reason (required) | SATISFIED | `formFields` includes all 6 fields with correct types and `required: true` on employee, start_date, request_reason; Zod schema enforces `min(1)` on all three |

All 5 requirements are accounted for across the 3 plans. No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `time-off-actions-renderer.tsx` | 24 | `eslint-disable react-hooks/refs` — rule `react-hooks/refs` does not exist in this project's ESLint config | Info | No functional impact; the disable comment is a no-op. The ref mutation in render body is intentional for detecting fetcher completion in an AG Grid cell renderer context. |

No stub patterns, placeholder comments, hardcoded empty returns, or missing implementations found.

### Human Verification Required

#### 1. Time off grid renders real data

**Test:** With Docker running, execute `pnpm supabase:reset && pnpm supabase:typegen`, start dev server, navigate to `http://localhost:5173/home/{account}/hr/time_off`
**Expected:** AG Grid displays rows with all TOFF-01 columns: employee avatar + name, department, work authorization, comp manager name, start date, return date, PTO days, request off days, sick leave days, reason, denial reason, requested by name, reviewed by name, status badge
**Why human:** Supabase migrations were created but never applied (Docker was not running during plan execution). Database state is unverified.

#### 2. Status filter tabs render and filter correctly

**Test:** Click "Pending", "Approved", "Denied", and "All" tabs in the toolbar above the grid
**Expected:** Active tab uses `secondary` button variant (visually distinct). Grid refreshes and shows only matching rows. URL updates to include `filter_status=pending` etc. "All" removes the filter_status param.
**Why human:** Visual tab styling and grid filtering behavior require browser interaction.

#### 3. Inline approve works

**Test:** On a pending row, click the checkmark (Approve) button
**Expected:** Status badge changes to "Approved". Row's action buttons disappear (non-pending rows return null from renderer). `reviewed_by` and `reviewed_at` are set in the database.
**Why human:** Requires live database write and grid revalidation.

#### 4. Inline deny with required denial reason

**Test:** On a pending row, click the X (Deny) button. Attempt to submit without entering a reason.
**Expected:** Popover opens. "Confirm Deny" is disabled. After entering a reason and clicking Confirm Deny, status changes to "Denied" and `denial_reason` is stored.
**Why human:** Popover state and button disabled logic require browser interaction.

#### 5. Create form auto-sets requested_by

**Test:** Click Create, fill out the form (employee, start date, reason), submit.
**Expected:** New record appears in the grid with `requested_by` set to the current authenticated employee (not requiring the user to select it). The form shows the 6 required/optional fields per TOFF-05.
**Why human:** Requires authenticated session context to verify server-side `requested_by` auto-population.

### Gaps Summary

No gaps found in code implementation. All 5 truths are verified, all 9 artifacts are substantive and wired, all 5 key links are connected, and all 5 requirements are satisfied.

The only pending items are human verification — specifically confirming that the SQL migrations apply cleanly when Docker is available, and that the full UI behavior matches specification in a running browser session. This is a consequence of Docker not being available during plan execution (noted in both 03-01-SUMMARY.md and 03-03-SUMMARY.md).

---

_Verified: 2026-04-09_
_Verifier: Claude (gsd-verifier)_
