# Phase 2: Scheduler - Research

**Researched:** 2026-04-08
**Domain:** AG Grid weekly schedule view, week navigation, OT highlighting, detail rows, CRUD forms
**Confidence:** HIGH

## Summary

Phase 2 builds the Scheduler submodule on top of Phase 1's AG Grid foundation. The `ops_task_weekly_schedule` SQL view already computes all necessary data -- Sun-Sat time range columns, total hours, OT threshold, and OT flag -- so the grid is a direct column mapping. The main technical challenges are: (1) the view has no `id`, `is_deleted`, or `end_date` columns, so `loadTableData` cannot be used directly and a custom loader query is required; (2) the view lacks `profile_photo_url`, requiring a migration to add it; (3) week navigation needs URL search params for `week_start_date` with server-side revalidation; (4) the detail row for historical data requires client-side fetch to a new API route querying `ops_task_schedule` by employee.

**Primary recommendation:** Use a custom list view component (`SchedulerListView`) that extends `AgGridListView` with week navigation toolbar and department filter, backed by a custom loader function instead of `loadTableData`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Map `ops_task_weekly_schedule` view columns directly to AG Grid ColDefs -- one row per employee-task combination per week
- **D-02:** Display employee name (with avatar via AvatarRenderer), department, work authorization, task, and total hours columns alongside day columns
- **D-03:** Use conditional cell styling (rowClassRules/cellClassRules) to highlight overtime rows -- amber/red when `is_over_ot_threshold` is true
- **D-04:** Day columns that are null render as empty cells
- **D-05:** Week navigation controls in toolbar area above AG Grid
- **D-06:** Navigation includes Previous/Next Week buttons and "Current Week" button/label showing week_start_date range
- **D-07:** Week changes filter via `week_start_date` parameter -- server-side filtering via loader revalidation using URL search params
- **D-08:** Department filter dropdown in toolbar filtering by `hr_department_id`
- **D-09:** Department options loaded via `loadFormOptions()` for `hr_department`
- **D-10:** Row-click expands full-width detail row (Phase 1 useDetailRow + InlineDetailRow pattern)
- **D-11:** Detail row queries `ops_task_schedule` filtered by `hr_employee_id`
- **D-12:** Historical data displayed as nested AG Grid sub-table with columns: date, department, status, task, start time, end time, hours
- **D-13:** Detail row data loaded via client-side fetch on expand (React Query or useFetcher to API route)
- **D-14:** Secondary view/tab showing historical schedule data aggregated by date
- **D-15:** Toggle between "Weekly Schedule" and "History" views -- Claude's discretion on UX
- **D-16:** Side-panel form (Shadcn Sheet via CreatePanel pattern)
- **D-17:** Form fields: employee dropdown (FK), task dropdown (FK), date picker, start time, end time
- **D-18:** New entries are "planned" -- `ops_task_tracker_id` is NULL
- **D-19:** Create action writes to `ops_task_schedule` using `crudCreateAction()`
- **D-20:** Create `ops-task-schedule.config.ts` in `app/lib/crud/`, registered in `registry.ts`
- **D-21:** Config uses `viewType: 'agGrid'` and references `ops_task_weekly_schedule` view
- **D-22:** Config columns include day columns (Sunday-Saturday) as text, plus employee, department, task, total hours, OT threshold

### Claude's Discretion
- Week navigation button styling and placement details within toolbar
- Historical summary view toggle UX (tabs vs button toggle vs dropdown)
- Detail row sub-table pagination/scrolling behavior
- Time input component choice (native time input vs custom time picker)
- How to compute current week's `week_start_date` (Sunday-anchored)
- Department filter: combobox vs select dropdown
- Loading states for week transitions and detail row expansion

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCHED-01 | Weekly schedule grid using `ops_task_weekly_schedule` view with Sun-Sat columns | Custom loader querying view with `week_start_date` filter; AG Grid ColDefs map view columns directly |
| SCHED-02 | Week navigation controls (previous/next/current) filtering by `week_start_date` | URL search params + loader revalidation; Sunday-anchored week computation with date-fns |
| SCHED-03 | Employee name (with photo), department, work auth, task, total hours per row | View migration needed to add `profile_photo_url`; FK label resolution for department/work auth via view JOINs |
| SCHED-04 | OT flag/highlight when employee exceeds threshold | `otWarningRowClassRules` from Phase 1 row-class-rules.ts applies directly -- view provides `is_over_ot_threshold` |
| SCHED-05 | Row-click detail showing historical schedule data | Custom detail component (not InlineDetailRow); client-side fetch via API route querying `ops_task_schedule` |
| SCHED-06 | Create schedule entry form (side panel) | CreatePanel + ops-task-schedule.config.ts with Zod schema; `crudCreateAction()` writes to `ops_task_schedule` |
| SCHED-07 | Department filter for schedule grid | Select dropdown in toolbar with FK options from `hr_department`; filters view by `hr_department_id` |
| SCHED-08 | Historical data summary view | Toggle button in toolbar switching between weekly grid and aggregated history table |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ag-grid-community | 35.x (installed) | Schedule grid rendering | Already installed in Phase 1 [VERIFIED: codebase] |
| ag-grid-react | 35.x (installed) | React bindings for AG Grid | Already installed in Phase 1 [VERIFIED: codebase] |
| date-fns | 4.1.0 (installed) | Week start date computation, date formatting | Already in project deps [VERIFIED: CLAUDE.md stack] |
| zod | 3.25.74 (installed) | Form validation schema | Already in project deps [VERIFIED: CLAUDE.md stack] |
| react-hook-form | 7.69.0 (installed) | Create form state management | Already in project deps [VERIFIED: CLAUDE.md stack] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.90.12 (installed) | Detail row data fetching | Client-side historical data fetch on expand [VERIFIED: CLAUDE.md stack] |

No new dependencies needed. All libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── lib/crud/
│   └── ops-task-schedule.config.ts     # CrudModuleConfig for scheduler
├── components/ag-grid/
│   └── scheduler-list-view.tsx         # Custom list view with week nav
├── routes/api/
│   └── schedule-history.ts             # API route for detail row data
```

### Pattern 1: Custom List View (viewType: 'custom')
**What:** Instead of using the generic `AgGridListView`, the scheduler needs a custom list view component because its toolbar is fundamentally different (week navigation + department filter + view toggle instead of search + inactive toggle). [VERIFIED: codebase ag-grid-list-view.tsx]
**When to use:** When the submodule needs a non-standard toolbar or data loading pattern.
**Implementation approach:**

The config should use `viewType: { list: 'custom' }` with a `customViews.list` lazy loader pointing to a `SchedulerListView` component. This component composes `AgGridWrapper` directly (not `AgGridListView`) and builds its own toolbar with week navigation, department filter, and view toggle.

This avoids modifying the shared `AgGridListView` which works well for standard CRUD grids. The scheduler's toolbar is fundamentally different -- no search/inactive toggle, instead week navigation + department filter + history toggle. [VERIFIED: codebase sub-module.tsx resolveListView]

```typescript
// In ops-task-schedule.config.ts
viewType: {
  list: 'custom',
},
customViews: {
  list: () => import('~/components/ag-grid/scheduler-list-view'),
},
```

### Pattern 2: Custom Loader for View Queries
**What:** The `loadTableData` helper hardcodes `.eq('is_deleted', false)` and `.is('end_date', null)` which do not exist on the `ops_task_weekly_schedule` view. The scheduler loader must query the view directly using `queryUntypedView`. [VERIFIED: codebase crud-helpers.server.ts lines 133-139]
**When to use:** When querying views that lack standard CRUD columns.

```typescript
// In sub-module.tsx loader (or scheduler-specific loader)
const weekStart = url.searchParams.get('week') ?? getCurrentWeekStart();
const deptFilter = url.searchParams.get('dept');

let query = queryUntypedView(client, 'ops_task_weekly_schedule')
  .select('*')
  .eq('org_id', accountSlug)
  .eq('week_start_date', weekStart);

if (deptFilter) {
  query = query.eq('hr_department_id', deptFilter);
}

const { data, error } = await query.order('full_name');
```

### Pattern 3: Sunday-Anchored Week Computation
**What:** The SQL view computes `week_start_date` as `start_time::DATE - EXTRACT(DOW FROM start_time)::INTEGER`, which gives the preceding Sunday. The client must compute the same way. [VERIFIED: codebase migration 20260401000038 line 14]
**When to use:** All week navigation operations.

```typescript
import { startOfWeek, addWeeks, subWeeks, format } from 'date-fns';

// date-fns startOfWeek defaults to Sunday (weekStartsOn: 0)
function getCurrentWeekStart(): string {
  return format(startOfWeek(new Date()), 'yyyy-MM-dd');
}

function getWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = addDays(start, 6);
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
}
```

### Pattern 4: Composite Row ID for AG Grid
**What:** The view has no single `id` column. Each row is uniquely identified by `hr_employee_id` + `task` + `week_start_date`. AG Grid's `getRowId` needs a composite key. [VERIFIED: codebase view SQL -- no id in SELECT]
**When to use:** Required for detail row expansion to work correctly.

```typescript
getRowId: (params) => {
  const d = params.data;
  return `${d.hr_employee_id}_${d.task}_${d.week_start_date}`;
}
```

### Pattern 5: Client-Side Detail Row Data Loading
**What:** Historical schedule data is loaded on-demand when a row is expanded, not upfront. Use an API route that the detail component calls via React Query or useFetcher. [VERIFIED: CONTEXT.md D-13]
**When to use:** Detail row expansion in the scheduler grid.

The API route queries `ops_task_schedule` directly (not the weekly view) filtered by `hr_employee_id` and optionally a date range.

### Pattern 6: Historical Summary Aggregation
**What:** SCHED-08 requires an aggregated history view showing date, employee count, total hours. This can query `ops_task_schedule` grouped by date. [VERIFIED: REQUIREMENTS.md SCHED-08]
**Recommendation:** Use a simple button toggle in the toolbar between "Schedule" and "History" modes. When "History" is active, the grid renders a different dataset with different ColDefs. This avoids separate routes or tabs.

### Anti-Patterns to Avoid
- **Modifying loadTableData for scheduler:** The helper has assumptions (is_deleted, end_date columns) that don't apply to views. Use `queryUntypedView` directly instead of trying to make `loadTableData` work. [VERIFIED: codebase crud-helpers.server.ts]
- **Modifying AgGridListView:** The existing component is well-structured for standard CRUD. Adding week navigation into it would pollute the shared component. Use a custom view instead. [VERIFIED: codebase ag-grid-list-view.tsx]
- **Loading all historical data in the page loader:** Historical data could be large. Load it on-demand via API route when detail row expands. [VERIFIED: CONTEXT.md D-13]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Week start date computation | Custom date math | `date-fns startOfWeek()` | Handles timezone edge cases, DST [VERIFIED: date-fns installed] |
| Form validation | Manual validation | Zod schema + `crudCreateAction()` | Existing pattern handles org scoping, audit fields [VERIFIED: codebase crud-action.server.ts] |
| FK dropdown options | Custom queries | `loadFormOptions()` | Handles org scoping, error recovery, parallel loading [VERIFIED: codebase load-form-options.server.ts] |
| OT row highlighting | Custom CSS logic | `otWarningRowClassRules` | Already built in Phase 1 for this exact use case [VERIFIED: codebase row-class-rules.ts] |
| Detail row expand/collapse | Custom state management | `useDetailRow` hook | Handles transactions, re-insertion on revalidation [VERIFIED: codebase detail-row-wrapper.tsx] |

## Common Pitfalls

### Pitfall 1: View Missing profile_photo_url
**What goes wrong:** SCHED-03 and D-02 require employee avatar display, but `ops_task_weekly_schedule` view does not include `e.profile_photo_url` in its SELECT.
**Why it happens:** The view was written before the avatar requirement was specified.
**How to avoid:** Create a migration to add `profile_photo_url` to the view's SELECT clause: `e.profile_photo_url`.
**Warning signs:** Avatar column shows empty for all rows.

### Pitfall 2: loadTableData Cannot Query This View
**What goes wrong:** `loadTableData` calls `.eq('is_deleted', false)` and `.is('end_date', null)` which would fail on `ops_task_weekly_schedule` (those columns don't exist on the view output).
**Why it happens:** `loadTableData` was designed for standard CRUD tables with soft delete and active/inactive patterns.
**How to avoid:** Write a custom query function in the loader using `queryUntypedView`. Do NOT pass the view through `loadTableData`.
**Warning signs:** PostgREST error "column is_deleted does not exist" or "column end_date does not exist".

### Pitfall 3: No Single Primary Key on View Rows
**What goes wrong:** AG Grid detail row expansion, row selection, and `getRowId` all require a unique row identifier. The view has no `id` column.
**Why it happens:** The view groups by employee + task + week, producing composite uniqueness.
**How to avoid:** Generate a composite key: `${hr_employee_id}_${task}_${week_start_date}` for `getRowId`. Pass this as `pkColumn` equivalent in the custom view.
**Warning signs:** Detail rows expand on wrong parent, row selection selects wrong rows.

### Pitfall 4: Week Navigation Timezone Mismatch
**What goes wrong:** Client computes Sunday of current week in local timezone, but server view uses `start_time::DATE` which depends on database timezone setting.
**Why it happens:** The view uses `EXTRACT(DOW FROM start_time)` on `TIMESTAMPTZ` which PostgreSQL evaluates in the session timezone (typically UTC for Supabase).
**How to avoid:** Always format dates as `yyyy-MM-dd` strings. Use `date-fns` `startOfWeek` with explicit `weekStartsOn: 0` (Sunday). The SQL view uses `AT TIME ZONE 'UTC'` for day column formatting, so week_start_date calculation is consistent.
**Warning signs:** Grid shows wrong week or empty data when navigating weeks.

### Pitfall 5: Create Form Writes to Table, Grid Reads from View
**What goes wrong:** After creating a schedule entry via `crudCreateAction()` writing to `ops_task_schedule`, the grid won't update because it reads from a different view.
**Why it happens:** The config's `tableName` points to `ops_task_schedule` (for create/update/delete), but the list view queries `ops_task_weekly_schedule`.
**How to avoid:** After successful create, trigger `revalidator.revalidate()` which re-runs the loader and re-queries the view. This is already the pattern in `CreatePanel`. The new entry will appear in the view if `ops_task_tracker_id IS NULL`, `start_time IS NOT NULL`, and `is_deleted = false`.
**Warning signs:** Create appears successful but grid doesn't show the new entry.

### Pitfall 6: Department FK Label Resolution
**What goes wrong:** The view returns `hr_department_id` (a TEXT FK) but not the department name. The grid would show raw IDs instead of human-readable names.
**Why it happens:** The view only outputs `hr_department_id`, not a joined department name.
**How to avoid:** Two options: (a) add `d.name AS department` to the view migration via a JOIN, or (b) resolve FK labels client-side using the `fkOptions` map. Option (a) is cleaner -- add `hr_department.name AS department_name` to the view.
**Warning signs:** Grid department column shows IDs like "dept_harvest" instead of "Harvest".

### Pitfall 7: Work Authorization FK Label Resolution
**What goes wrong:** Same as Pitfall 6 but for `hr_work_authorization_id`.
**How to avoid:** Add `wa.name AS work_authorization_name` to the view migration.

## Code Examples

### Week Navigation Component
```typescript
// Source: project patterns + date-fns
interface WeekNavigationProps {
  weekStart: string;
  onWeekChange: (weekStart: string) => void;
}

function WeekNavigation({ weekStart, onWeekChange }: WeekNavigationProps) {
  const current = new Date(weekStart + 'T00:00:00');
  const weekEnd = addDays(current, 6);
  const label = `${format(current, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onWeekChange(format(subWeeks(current, 1), 'yyyy-MM-dd'))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onWeekChange(getCurrentWeekStart())}
      >
        Today
      </Button>
      <span className="text-sm font-medium min-w-[180px] text-center">
        {label}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onWeekChange(format(addWeeks(current, 1), 'yyyy-MM-dd'))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### Custom Scheduler Loader Pattern
```typescript
// Source: project patterns (queryUntypedView + loadFormOptions)
export async function loadSchedulerData(params: {
  client: SupabaseClient<Database>;
  orgId: string;
  searchParams: URLSearchParams;
}) {
  const weekStart = params.searchParams.get('week') ?? getCurrentWeekStart();
  const deptFilter = params.searchParams.get('dept') ?? null;

  let query = queryUntypedView(params.client, 'ops_task_weekly_schedule')
    .select('*')
    .eq('org_id', params.orgId)
    .eq('week_start_date', weekStart)
    .order('full_name');

  if (deptFilter) {
    query = query.eq('hr_department_id', deptFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Response(error.message, { status: 500 });
  }

  return { data: castRows(data), weekStart };
}
```

### Zod Schema for Create Form
```typescript
// Source: ops_task_schedule table schema
const opsTaskScheduleSchema = z.object({
  hr_employee_id: z.string().min(1, 'Employee is required'),
  ops_task_id: z.string().min(1, 'Task is required'),
  start_time: z.string().min(1, 'Date/time is required'),
  stop_time: z.string().optional(),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TanStack Table for grids | AG Grid Community | Phase 1 (this project) | All new grids use AG Grid, register converted |

## View Migration Required

The `ops_task_weekly_schedule` view needs updates to support SCHED-03 requirements. A new migration should `CREATE OR REPLACE VIEW` with:

1. Add `e.profile_photo_url` to the SELECT [needed for avatar display]
2. Add department name via JOIN: currently only has `e.hr_department_id` but needs `d.name AS department_name`
3. Add work authorization name via JOIN: needs `wa.name AS work_authorization_name`

The view already JOINs `hr_employee e` and `ops_task t`, but does not JOIN `hr_department` or `hr_work_authorization`. These JOINs need to be added as LEFT JOINs (employee may not have department or work auth assigned).

**Migration approach:** `CREATE OR REPLACE VIEW ops_task_weekly_schedule AS ...` with the updated query. This is safe -- it doesn't affect the underlying table.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `date-fns` `startOfWeek` defaults to Sunday (weekStartsOn: 0) | Architecture Patterns | Week computation would be off by a day -- LOW risk, easily verified |
| A2 | `queryUntypedView` returns a Supabase query builder that supports `.eq()`, `.order()` chaining | Code Examples | Would need different query approach -- LOW risk, verified pattern in codebase |
| A3 | The view's `week_start_date` is a `DATE` type that can be filtered with `.eq('week_start_date', 'yyyy-MM-dd')` | Architecture Patterns | Filter might not match -- MEDIUM risk, needs testing |

## Open Questions

1. **RLS on ops_task_schedule**
   - What we know: The table has no RLS enabled, no policies exist in migrations
   - What's unclear: Whether this is intentional (relying on app-layer org filtering) or an oversight
   - Recommendation: App-layer filtering via `.eq('org_id', ...)` is sufficient for now; the view also filters by org_id. If RLS is needed later, it follows standard pattern from supabase/CLAUDE.md

2. **Historical summary aggregation query**
   - What we know: SCHED-08 needs date, employee count, total hours aggregated
   - What's unclear: Whether to create a new SQL view or compute client-side
   - Recommendation: Query `ops_task_schedule` directly in the API route with GROUP BY date, since this is a secondary view and doesn't need a dedicated view

3. **Time input component**
   - What we know: Form needs start_time and end_time inputs
   - What's unclear: Whether to use native `<input type="time">` or a custom component
   - Recommendation: Use native `<input type="time">` -- it provides adequate UX, requires no new dependencies, and the value format (HH:mm) maps cleanly to timestamptz construction

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCHED-01 | Weekly grid renders view data | E2E | `pnpm --filter e2e playwright test scheduler` | No - Wave 0 |
| SCHED-02 | Week navigation updates grid | E2E | `pnpm --filter e2e playwright test scheduler` | No - Wave 0 |
| SCHED-03 | Employee details displayed per row | E2E | `pnpm --filter e2e playwright test scheduler` | No - Wave 0 |
| SCHED-04 | OT flag highlighting | unit | `pnpm vitest run app/components/ag-grid/__tests__/row-class-rules.test.ts` | No - covered by Phase 1 |
| SCHED-05 | Detail row shows history | E2E | `pnpm --filter e2e playwright test scheduler` | No - Wave 0 |
| SCHED-06 | Create form writes entry | E2E | `pnpm --filter e2e playwright test scheduler` | No - Wave 0 |
| SCHED-07 | Department filter works | E2E | `pnpm --filter e2e playwright test scheduler` | No - Wave 0 |
| SCHED-08 | History summary view | E2E | `pnpm --filter e2e playwright test scheduler` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm typecheck`
- **Per wave merge:** `pnpm typecheck && pnpm lint`
- **Phase gate:** Full typecheck + lint green before verify

### Wave 0 Gaps
- [ ] Week start date computation utility -- unit testable with Vitest
- [ ] E2E tests require seed data in `ops_task_schedule` for the test org

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Handled by existing auth guard |
| V3 Session Management | no | Handled by existing session management |
| V4 Access Control | yes | `requireModuleAccess()` / `requireSubModuleAccess()` in loader |
| V5 Input Validation | yes | Zod schema validation in `crudCreateAction()` |
| V6 Cryptography | no | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-org data access via URL params | Information Disclosure | `.eq('org_id', accountSlug)` on all queries |
| Malicious week_start_date param | Tampering | Validate as date string, compute default from `date-fns` |
| CSRF on create action | Tampering | Existing CSRF token validation in form actions |

## Project Constraints (from CLAUDE.md)

- AG Grid Community only -- no Enterprise modules
- Must follow DESIGN.md color tokens for dark/light themes
- `useEffect` is a code smell -- justify if used (detail row data loading is a valid case via React Query)
- No `any` types
- `interface` for props, `type` for utilities/unions
- Functional components only
- `useCallback` for event handlers passed as props
- Schema in separate `.schema.ts` file
- Always include `<FormMessage />` in every form field
- Add `data-test` attributes for E2E test selectors
- Implicit type inference unless impossible
- `useFetcher()` for mutations without navigation
- Server state via `loader` data as `props.loaderData`

## Sources

### Primary (HIGH confidence)
- Codebase: `supabase/migrations/20260401000038_ops_task_weekly_schedule_view.sql` -- view definition verified
- Codebase: `supabase/migrations/20260401000037_ops_task_schedule.sql` -- table schema verified
- Codebase: `app/lib/crud/crud-helpers.server.ts` -- loadTableData limitations verified
- Codebase: `app/components/ag-grid/ag-grid-list-view.tsx` -- list view pattern verified
- Codebase: `app/components/ag-grid/detail-row-wrapper.tsx` -- useDetailRow pattern verified
- Codebase: `app/components/ag-grid/row-class-rules.ts` -- OT warning rules verified
- Codebase: `app/lib/crud/crud-action.server.ts` -- create action pattern verified
- Codebase: `app/routes/workspace/sub-module.tsx` -- route loader/view resolution verified
- Codebase: `app/lib/crud/registry.ts` -- module config registry verified

### Secondary (MEDIUM confidence)
- date-fns `startOfWeek` defaulting to Sunday -- [ASSUMED] based on training data, easily verified

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, no new deps
- Architecture: HIGH - patterns verified against existing codebase
- Pitfalls: HIGH - each pitfall verified by reading actual source code

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable -- no external dependency changes expected)
