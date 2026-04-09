# Phase 03: Time Off - Research

**Researched:** 2026-04-08
**Domain:** AG Grid CRUD submodule with SQL view, status filtering, inline approve/deny workflow
**Confidence:** HIGH

## Summary

Phase 3 builds a Time Off submodule using the established AG Grid + CRUD registry pattern from Phase 1. The primary new work is: (1) a SQL view joining `hr_time_off_request` with `hr_employee` for display columns, (2) status filter tabs in the toolbar, (3) an inline Actions cell renderer for approve/deny with denial reason capture, and (4) config updates to route to AgGridListView.

The existing infrastructure handles most of this. The `crudBulkTransitionAction` already supports `transitionFields` with `'now'` and `'currentEmployee'` value types for setting `reviewed_by` and `reviewed_at`. However, `denial_reason` is an arbitrary string not supported by the current `transitionFields` type -- this requires extending the action or adding a new intent. The `loadTableData` helper filters on `end_date IS NULL` which will fail since `hr_time_off_request` has no `end_date` column -- either a custom loader branch or a view-level workaround is needed. Additionally, `hr_time_off_request` has no RLS policies, which must be added.

**Primary recommendation:** Use a custom loader branch (like scheduler) for the view query with status filter support, extend `transitionFields` to support `'literal:string'` values for denial_reason, and create the SQL view with LEFT JOINs for employee-resolved fields.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Create SQL view `app_hr_time_off_requests` joining `hr_time_off_request` with `hr_employee`
- D-02: View joins employee FK for `full_name`, `preferred_name`, `profile_photo_url`, `hr_department_id` (with department name), `work_authorization_id` (with status name), and `compensation_manager_id` (with manager name)
- D-03: View resolves `requested_by` and `reviewed_by` FK references to employee names
- D-04: Use `viewType: { list: 'agGrid' }` on `hrTimeOffConfig` to route to standard `AgGridListView`
- D-05: Display columns per TOFF-01: avatar + full name, department, work auth status, comp manager, start date, return date, PTO days, non-PTO days, sick leave days, request reason, denial reason, requested by name, reviewed by name, status badge
- D-06: Employee column uses `AvatarRenderer` from Phase 1
- D-07: Status column uses `StatusBadgeRenderer` from Phase 1
- D-08: Date columns use AG Grid date `valueFormatter` with `date-fns`
- D-09: Status filter tabs (All / Pending / Approved / Denied) as toolbar button group
- D-10: Tab selection updates URL searchParams (`?status=pending`) triggering server-side loader revalidation
- D-11: "All" tab shows all non-deleted requests
- D-12: Active tab highlighted with DESIGN.md accent styling
- D-13: "Actions" cell renderer column with Approve and Deny buttons on pending rows
- D-14: Approve calls `bulk_transition` transitioning pending to approved, setting `reviewed_by` and `reviewed_at`
- D-15: Deny opens a popover/dialog requiring `denial_reason` text before submitting
- D-16: Deny calls `bulk_transition` with status `denied` plus `transitionFields: { denial_reason, reviewed_by, reviewed_at }`
- D-17: Approved/denied rows show status badge but no action buttons (denied can transition back to pending)
- D-18: After transition, grid revalidates
- D-19: Use existing `CreatePanel` pattern
- D-20: Form fields: employee dropdown, start date, return date, PTO days, non-PTO days, sick leave days, request reason
- D-21: `requested_by` auto-set to current logged-in employee
- D-22: `requested_at` auto-set to `now()` by database default
- D-23: New requests default to `status: 'pending'`
- D-24: Update Zod schema to make `request_reason` required
- D-25: Update config with `viewType: { list: 'agGrid' }`
- D-26: Update config `views.list` to reference `app_hr_time_off_requests` view
- D-27: Expand `columns` array for all TOFF-01 display fields
- D-28: Add `select` property if PostgREST embedding needed

### Claude's Discretion
- Action button styling (icon vs text, sizing)
- Denial reason popover vs dialog
- Tab button group styling
- Column ordering and default visibility
- Loading states during transitions
- Whether to show toast on approve/deny

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOFF-01 | Time off grid displaying all request fields with employee-joined data | SQL view `app_hr_time_off_requests` resolves all FKs; AgGridListView with expanded columns config |
| TOFF-02 | Status filter tabs (All/Pending/Approved/Denied) | Custom loader branch with `?status=` searchParam filtering; toolbar button group component |
| TOFF-03 | Inline status toggle (approve/deny) updating status, reviewed_by, reviewed_at | Actions cell renderer + extended `crudBulkTransitionAction` with `transitionFields` |
| TOFF-04 | Denial reason required when denying | Popover/dialog in Actions renderer; extend `transitionFields` to support literal string values |
| TOFF-05 | Create time off request form (side panel) | Existing `CreatePanel` with updated config; server-side auto-set of `requested_by` |
</phase_requirements>

## Architecture Patterns

### Critical Finding: `loadTableData` Incompatibility

The standard `loadTableData` in `crud-helpers.server.ts` (line 133-140) always applies these filters:
```typescript
.eq('is_deleted', false)
.is('end_date', null)  // or .not('end_date', 'is', null) for inactive
```

The `hr_time_off_request` table has `is_deleted` but NO `end_date` column. The SQL view will also lack `end_date`. This means using the standard `loadTableData` path will cause a PostgREST error. [VERIFIED: codebase grep confirms no end_date in migration]

**Solution:** Use a custom loader branch in `sub-module.tsx` (same pattern as scheduler's `viewType.list === 'custom'`) OR use `viewType: { list: 'agGrid' }` with the standard path BUT the view must include `end_date` as a computed NULL column, OR modify `loadTableData` to skip `end_date` filter when the view lacks it.

**Recommended approach:** Add a loader condition for `agGrid` views that use SQL views lacking `end_date`. The simplest fix: include `NULL::DATE AS end_date` in the SQL view so `loadTableData` works unchanged. This avoids forking the loader. [ASSUMED]

### Critical Finding: `transitionFields` Type Limitation

The `crudBulkTransitionAction` (line 135) types `transitionFields` as:
```typescript
transitionFields?: Record<string, 'now' | 'currentEmployee'>;
```

This only supports `'now'` (sets to current timestamp) and `'currentEmployee'` (sets to current employee ID). For the deny action, we need to pass `denial_reason` as an arbitrary user-provided string. [VERIFIED: codebase read of crud-action.server.ts]

**Solution:** Extend the type to support literal values. Options:
1. Add `'literal'` type with a separate `literalValues` field
2. Detect string values that aren't `'now'`/`'currentEmployee'` and treat as literal
3. Add a new `extraFields` param alongside `transitionFields`

**Recommended:** Add a new `extraFields?: Record<string, unknown>` parameter to `crudBulkTransitionAction` that merges arbitrary key-value pairs into the update. This is backward-compatible and doesn't change the existing `transitionFields` semantics. [ASSUMED]

### Critical Finding: Missing RLS Policies

The `hr_time_off_request` table has NO RLS policies or GRANT statements. [VERIFIED: grep of supabase directory found zero matches] The table needs:
1. `ALTER TABLE hr_time_off_request ENABLE ROW LEVEL SECURITY;`
2. Standard org-scoped read/write/update policies per `supabase/CLAUDE.md` pattern
3. `GRANT SELECT, INSERT, UPDATE ON hr_time_off_request TO authenticated;`

### Critical Finding: `requested_by` Auto-Setting

The `crudCreateAction` sets `org_id`, `created_by`, and `updated_by` automatically but NOT `requested_by`. Since `requested_by` is `NOT NULL` in the schema, the create action will fail unless:
1. The form includes `requested_by` as a hidden field (bad -- exposes employee ID to client)
2. The create action is extended to auto-set `requested_by` from `employeeId`
3. A server-side hook/override sets it before insert

**Recommended:** Add `requested_by` to the insert data in the create action. The cleanest way: add a config-level `autoFields` map (e.g., `{ requested_by: 'currentEmployee' }`) that the create action reads, or handle it in the sub-module-create action route specifically for time_off. [ASSUMED]

### SQL View Pattern

Based on the scheduler view (`ops_task_weekly_schedule`), the time off view should:

```sql
CREATE OR REPLACE VIEW app_hr_time_off_requests AS
SELECT
    r.id,
    r.org_id,
    r.hr_employee_id,
    e.first_name || ' ' || e.last_name AS full_name,
    e.preferred_name,
    e.profile_photo_url,
    d.name AS department_name,
    wa.name AS work_authorization_name,
    cm.first_name || ' ' || cm.last_name AS compensation_manager_name,
    r.start_date,
    r.return_date,
    r.pto_days,
    r.non_pto_days,
    r.sick_leave_days,
    r.request_reason,
    r.denial_reason,
    r.notes,
    r.status,
    r.requested_at,
    req.first_name || ' ' || req.last_name AS requested_by_name,
    r.reviewed_at,
    rev.first_name || ' ' || rev.last_name AS reviewed_by_name,
    r.is_deleted,
    NULL::DATE AS end_date,  -- compatibility with loadTableData
    r.created_at,
    r.updated_at
FROM hr_time_off_request r
JOIN hr_employee e ON e.id = r.hr_employee_id
LEFT JOIN hr_department d ON d.id = e.hr_department_id
LEFT JOIN hr_work_authorization wa ON wa.id = e.hr_work_authorization_id
LEFT JOIN hr_employee cm ON cm.id = e.compensation_manager_id
JOIN hr_employee req ON req.id = r.requested_by
LEFT JOIN hr_employee rev ON rev.id = r.reviewed_by;
```

[VERIFIED: pattern matches `ops_task_weekly_schedule` view structure. LEFT JOINs used for nullable FKs]

### Status Filter in Loader

The loader needs to read `?status=` from URL searchParams and filter the view:

```typescript
// In the standard loadTableData path, add filter_status support
// URL: ?status=pending -> filter_status=pending
// Or handle via the existing filter_<column> mechanism
```

The existing `loadTableData` already supports `filter_<column>=value` from searchParams (line 153-160 of crud-helpers.server.ts). So `?filter_status=pending` would work out of the box IF `status` is in `allowedColumns`. The toolbar just needs to set `filter_status` instead of `status` in the URL. [VERIFIED: codebase read of loadTableData]

### Actions Cell Renderer Pattern

New component needed: `TimeOffActionsRenderer` -- an AG Grid cell renderer that:
1. Reads `status` from `params.data`
2. Shows Approve/Deny buttons when status is `pending`
3. Approve button: submits `bulk_transition` via `useFetcher` for single row
4. Deny button: opens a Popover with textarea for `denial_reason`, then submits
5. No buttons for `approved`/`denied` rows (or optionally "Revert to Pending" for denied)

This should be placed in `app/components/ag-grid/cell-renderers/time-off-actions-renderer.tsx`.

### Recommended Project Structure

```
supabase/migrations/
  YYYYMMDD_app_hr_time_off_requests_view.sql  -- SQL view
  YYYYMMDD_hr_time_off_request_rls.sql        -- RLS policies

app/components/ag-grid/cell-renderers/
  time-off-actions-renderer.tsx               -- Approve/Deny cell renderer

app/lib/crud/
  hr-time-off.config.ts                       -- Updated config (existing file)
  crud-action.server.ts                       -- Extended with extraFields (existing file)
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status badge rendering | Custom status cells | `StatusBadgeRenderer` from Phase 1 | Already maps pending/approved/denied to correct Badge variants |
| Avatar + name display | Custom employee cells | `AvatarRenderer` from Phase 1 | Handles photo fallback and name display |
| Column mapping | Manual ColDef arrays | `mapColumnsToColDefs` + `agGridColDefs` override | Auto-maps types to filters/renderers |
| Side-panel create form | Custom form component | `CreatePanel` from Phase 1 | Handles fetcher, revalidation, form reset |
| Bulk status transition | Custom update logic | `crudBulkTransitionAction` (extended) | Already handles status + audit fields |
| Date formatting | Custom date formatters | `DatePillRenderer` from column-mapper | Already locale-aware via date-fns |
| URL param state | useState for filters | `useSearchParams` + loader revalidation | Server-side filtering with URL persistence |

## Common Pitfalls

### Pitfall 1: PostgREST `end_date` Filter on Views Without It
**What goes wrong:** `loadTableData` always applies `.is('end_date', null)` filter. Views without `end_date` column will return PostgREST 400 error.
**Why it happens:** The active/inactive toggle assumes all tables have an `end_date` column (true for `hr_employee` but not for request-style tables).
**How to avoid:** Include `NULL::DATE AS end_date` in the SQL view definition so the filter is valid but always passes.
**Warning signs:** Empty grid with no error message (PostgREST errors may be swallowed).

### Pitfall 2: `requested_by` NOT NULL Constraint on Create
**What goes wrong:** Creating a time off request fails with database constraint violation because `requested_by` is NOT NULL but not auto-populated.
**Why it happens:** `crudCreateAction` only auto-sets `org_id`, `created_by`, `updated_by` -- not domain-specific NOT NULL fields.
**How to avoid:** Either (a) add `requested_by` to the Zod schema and have the server action inject it before validation, or (b) extend `crudCreateAction` params to accept `additionalFields` that get merged.
**Warning signs:** 500 error on form submit with "null value in column requested_by violates not-null constraint".

### Pitfall 3: `denial_reason` Not Supported by `transitionFields` Type
**What goes wrong:** Passing `{ denial_reason: 'some text' }` as `transitionFields` fails TypeScript check (expects `'now' | 'currentEmployee'`).
**Why it happens:** The type was designed for audit fields, not arbitrary user input.
**How to avoid:** Add `extraFields` parameter to `crudBulkTransitionAction` for arbitrary key-value pairs.
**Warning signs:** TypeScript compilation error; or if cast to `any`, the value gets treated as a keyword instead of a literal.

### Pitfall 4: RLS Blocking All Queries
**What goes wrong:** View queries return empty results or 403 because the underlying table has no RLS policies.
**Why it happens:** When RLS is enabled on a table but no policies exist, ALL access is denied. If RLS is NOT enabled, any authenticated user can read any org's data.
**How to avoid:** Add both `ENABLE ROW LEVEL SECURITY` and the standard org-scoped policies in the same migration.
**Warning signs:** Empty grid for users who should see data, or cross-org data leakage.

### Pitfall 5: AG Grid Cell Renderer with React Hooks
**What goes wrong:** Using `useFetcher` inside an AG Grid cell renderer can cause issues because cell renderers may unmount/remount during grid operations.
**Why it happens:** AG Grid manages cell lifecycle independently from React.
**How to avoid:** Use a Popover/Dialog that renders outside the grid cell (via portal), and handle the fetcher at the parent level or use a shared callback passed via AG Grid context.
**Warning signs:** Stale fetcher state, double submissions, or missing revalidation after approve/deny.

## Code Examples

### Example 1: Status Filter Toolbar Tabs

```typescript
// Source: Pattern derived from scheduler week/dept filter + register inactive toggle
// [VERIFIED: useSearchParams pattern from ag-grid-list-view.tsx and sub-module.tsx]

const STATUS_TABS = ['all', 'pending', 'approved', 'denied'] as const;

function StatusFilterTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('filter_status') ?? 'all';

  const handleTabChange = useCallback((status: string) => {
    const next = new URLSearchParams(searchParams);
    if (status === 'all') {
      next.delete('filter_status');
    } else {
      next.set('filter_status', status);
    }
    next.set('page', '1'); // Reset pagination
    setSearchParams(next, { preventScrollReset: true });
  }, [searchParams, setSearchParams]);

  return (
    <div className="flex items-center gap-1">
      {STATUS_TABS.map((tab) => (
        <Button
          key={tab}
          size="sm"
          variant={currentStatus === tab ? 'default' : 'ghost'}
          onClick={() => handleTabChange(tab)}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </Button>
      ))}
    </div>
  );
}
```

### Example 2: Actions Cell Renderer (Simplified)

```typescript
// Source: Pattern from BulkActions in ag-grid-list-view.tsx
// [VERIFIED: useFetcher + bulk_transition pattern]

function TimeOffActionsRenderer(props: CustomCellRendererProps) {
  const status = props.data?.status as string;
  if (status !== 'pending') return null;

  const id = props.data?.id as string;
  // Use fetcher for approve, popover + fetcher for deny
  // ...
}
```

### Example 3: Extended Bulk Transition Action

```typescript
// Source: Existing crudBulkTransitionAction pattern
// [VERIFIED: crud-action.server.ts line 129-164]

export async function crudBulkTransitionAction(
  params: CrudActionParams & {
    pkColumn: string;
    pkValues: string[];
    statusColumn: string;
    newStatus: string;
    transitionFields?: Record<string, 'now' | 'currentEmployee'>;
    extraFields?: Record<string, unknown>; // NEW: arbitrary fields like denial_reason
  },
) {
  const updateData: Record<string, unknown> = {
    [params.statusColumn]: params.newStatus,
    updated_by: params.employeeId,
  };

  if (params.transitionFields) {
    for (const [field, value] of Object.entries(params.transitionFields)) {
      if (value === 'now') {
        updateData[field] = new Date().toISOString();
      } else if (value === 'currentEmployee') {
        updateData[field] = params.employeeId;
      }
    }
  }

  // Merge extra fields (e.g., denial_reason)
  if (params.extraFields) {
    Object.assign(updateData, params.extraFields);
  }

  // ... rest unchanged
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 + Playwright 1.57.x |
| Config file | `vitest.config.ts` / `e2e/playwright.config.ts` |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm typecheck && pnpm vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOFF-01 | Grid displays all joined fields | manual-only | Visual verification in browser | N/A |
| TOFF-02 | Status tabs filter grid | manual-only | Visual verification + URL param check | N/A |
| TOFF-03 | Inline approve/deny updates row | manual-only | Visual verification in browser | N/A |
| TOFF-04 | Denial reason required for deny | manual-only | Visual verification in browser | N/A |
| TOFF-05 | Create form submits successfully | manual-only | Visual verification in browser | N/A |

### Sampling Rate
- **Per task commit:** `pnpm typecheck`
- **Per wave merge:** `pnpm typecheck && pnpm lint:fix`
- **Phase gate:** TypeCheck green + manual verification of all 5 success criteria

### Wave 0 Gaps
None -- this phase is primarily UI/config/SQL work verified via typecheck and manual testing.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Handled by existing `requireUserLoader` |
| V3 Session Management | no | Handled by existing Supabase SSR session |
| V4 Access Control | yes | RLS policies on `hr_time_off_request` + `requireModuleAccess` |
| V5 Input Validation | yes | Zod schema validation on create form + denial reason |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-org data access via missing RLS | Information Disclosure | Add org-scoped RLS policies (CRITICAL -- currently missing) |
| Unauthorized status transition | Elevation of Privilege | Validate transition is allowed per workflow config |
| Denial reason injection | Tampering | Sanitize/validate denial_reason length and content |
| CSRF on approve/deny | Tampering | Existing CSRF token validation in actions |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Adding `NULL::DATE AS end_date` to view is the best approach to handle `loadTableData` compatibility | Architecture Patterns | Medium -- could use custom loader branch instead, but more code |
| A2 | `extraFields` param is the cleanest way to extend `crudBulkTransitionAction` for denial_reason | Architecture Patterns | Low -- alternative approaches (new intent, separate action) all work |
| A3 | `requested_by` should be set server-side via create action extension | Architecture Patterns | Medium -- if not handled, creates fail with NOT NULL violation |

## Open Questions

1. **How should the Actions cell renderer handle fetcher state?**
   - What we know: AG Grid cell renderers can use React hooks but have unusual lifecycle
   - What's unclear: Whether `useFetcher` works reliably inside cell renderers or needs to be lifted to parent
   - Recommendation: Try `useFetcher` in cell renderer first; if issues, lift to parent via AG Grid `context` prop

2. **Should `filter_status` or a custom loader branch handle status filtering?**
   - What we know: `loadTableData` supports `filter_<column>=value` from URL params when column is in `allowedColumns`
   - What's unclear: Whether the "All" tab (no filter) interacts cleanly with the inactive toggle
   - Recommendation: Use `filter_status` through existing `loadTableData` -- it's the simplest path since the view will have `is_deleted` and computed `end_date`

## Sources

### Primary (HIGH confidence)
- `app/lib/crud/crud-action.server.ts` -- `crudBulkTransitionAction` type signature and behavior
- `app/lib/crud/crud-helpers.server.ts` -- `loadTableData` filter logic (end_date, is_deleted, filter_*)
- `supabase/migrations/20260401000022_hr_time_off_request.sql` -- table schema, constraints, indexes
- `supabase/migrations/20260401000020_hr_employee.sql` -- employee table with FK columns for view joins
- `app/components/ag-grid/ag-grid-list-view.tsx` -- AgGridListView component structure and BulkActions
- `app/routes/workspace/sub-module.tsx` -- loader/action patterns, view resolution
- `app/lib/crud/types.ts` -- CrudModuleConfig, WorkflowConfig, transitionFields types
- `app/components/ag-grid/column-mapper.ts` -- column type to ColDef mapping

### Secondary (MEDIUM confidence)
- `supabase/migrations/20260408000001_update_ops_task_weekly_schedule_view.sql` -- reference pattern for SQL views with employee joins

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, no new dependencies
- Architecture: HIGH -- patterns established in Phase 1/2, verified against codebase
- Pitfalls: HIGH -- identified from actual code analysis of type constraints and filter logic

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable -- no external dependencies changing)
