# Phase 5: Hours Comparison - Research

**Researched:** 2026-04-08
**Domain:** SQL view aggregation, AG Grid conditional styling, client-side detail row expansion
**Confidence:** HIGH

## Summary

Phase 5 builds a read-only analytical view comparing scheduled hours (from `ops_task_schedule`) against payroll hours (from `hr_payroll`) per employee per pay period. The implementation follows well-established patterns from Phases 1-4: a new SQL view for the comparison data, a custom AG Grid list view with PayPeriodFilter toolbar, variance highlighting via `cellClassRules`, and client-side detail row expansion via an API route.

All building blocks already exist in the codebase. The SQL view follows the `app_hr_payroll_by_employee` pattern. The list view follows `payroll-comp-manager-list-view.tsx` (closest template). The detail row follows the scheduler's client-side fetch pattern via `schedule-history.ts` API route. The variance highlighting uses the existing `varianceHighlightCellClassRules` utility from `row-class-rules.ts`.

**Primary recommendation:** Build the SQL view first, then the API route for detail data, then the config + registry + loader integration, then the list view component.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Create a new SQL view `app_hr_hours_comparison` that LEFT JOINs aggregated `ops_task_schedule` hours with `hr_payroll` totals per employee per pay period
- **D-02:** Schedule hours aggregation includes ALL entries (both planned and executed, regardless of `ops_task_tracker_id`)
- **D-03:** Hours formula: `EXTRACT(EPOCH FROM (stop_time - start_time)) / 3600.0` for schedule hours, rounded to 2 decimal places
- **D-04:** View exposes: `hr_employee_id`, `org_id`, `pay_period_start`, `pay_period_end`, `full_name`, `profile_photo_url`, `department_name`, `scheduled_hours`, `payroll_hours` (from `hr_payroll.total_hours`), `variance` (payroll_hours - scheduled_hours)
- **D-05:** View is org-scoped with RLS via `hr_employee` membership (same pattern as `app_hr_payroll_by_employee`)
- **D-06:** Entries with NULL `stop_time` in `ops_task_schedule` contribute 0 hours
- **D-07:** Columns: employee photo + full name (AvatarRenderer), department, scheduled hours, payroll hours, variance
- **D-08:** Hours columns use `hoursFormatter` from `payroll-formatters.tsx`; variance column uses custom formatter showing +/- prefix
- **D-09:** Conditional cell styling on variance column: amber when absolute variance > 0 hours, red when absolute variance > 4 hours
- **D-10:** Use AG Grid `cellClassRules` on the variance column
- **D-11:** Reuse existing `PayPeriodFilter` component
- **D-12:** Filter via URL searchParams (`?period_start`/`?period_end`) triggering loader revalidation
- **D-13:** Default to most recent pay period when no filter selected
- **D-14:** Pay periods loaded from distinct pairs in `hr_payroll`
- **D-15:** Row-click expands full-width detail row showing daily schedule breakdown
- **D-16:** Detail row columns: date, day of week, department, task, start time, end time, hours
- **D-17:** Detail row data loaded via client-side fetch (API route) on expand
- **D-18:** Detail row queries `ops_task_schedule` filtered by `hr_employee_id` + date range
- **D-19:** Create `hr-payroll-hours.config.ts` with `viewType: { list: 'custom' }`
- **D-20:** Register slug `payroll_hours` in `registry.ts`
- **D-21:** Custom list view component `payroll-hours-list-view.tsx` in `app/components/ag-grid/`
- **D-22:** Add `payroll_hours` branch to sub-module.tsx custom loader
- **D-23:** Reuse existing `payPeriods` pre-load
- **D-24:** No create/edit forms (read-only)

### Claude's Discretion
- Detail row sub-table pagination/scrolling behavior
- Exact amber/red color values for variance highlighting (follow DESIGN.md tokens)
- Whether to show a summary/totals row at the bottom (pinned row with aggregate scheduled vs payroll hours)
- Loading states for pay period filter changes and detail row expansion
- CSV export column selection (all visible columns)
- Variance column sort behavior (by absolute value vs signed value)

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HCMP-01 | Comparison grid showing photo + full name, scheduled hours, payroll hours, variance | SQL view `app_hr_hours_comparison` provides all fields; AvatarRenderer + hoursFormatter reusable; custom variance formatter needed |
| HCMP-02 | Pay period selector to scope the comparison | `PayPeriodFilter` component is drop-in; URL searchParams pattern established in all payroll views |
| HCMP-03 | Row-click detail showing daily schedule breakdown | `useDetailRow` hook + API route pattern from scheduler; new API endpoint for schedule-by-period data |
| HCMP-04 | Variance highlighting with conditional cell styling | `varianceHighlightCellClassRules` exists in `row-class-rules.ts`; needs threshold adjustment (0 for amber, 4 for red per D-09) |
| HCMP-05 | New SQL view joining ops_task_schedule with hr_payroll.total_hours | Follows `app_hr_payroll_by_employee` pattern; aggregation formula verified from weekly schedule view |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ag-grid-community | 35.x | Data grid | Already installed, used across all HR submodules [VERIFIED: codebase] |
| ag-grid-react | 35.x | React wrapper | Already installed [VERIFIED: codebase] |
| react-router | 7.12.0 | SSR routing, loaders | Already installed [VERIFIED: codebase] |
| @supabase/supabase-js | 2.89.0 | Database client | Already installed [VERIFIED: codebase] |
| date-fns | 4.1.0 | Date formatting in detail rows | Already installed [VERIFIED: codebase] |

**Installation:** No new packages needed. This phase uses only existing dependencies.

## Architecture Patterns

### File Structure for Phase 5
```
supabase/migrations/
  YYYYMMDDHHMMSS_app_hr_hours_comparison.sql  # New view

app/lib/crud/
  hr-payroll-hours.config.ts     # New config (D-19)
  registry.ts                     # Add payroll_hours entry (D-20)

app/components/ag-grid/
  payroll-hours-list-view.tsx     # New custom list view (D-21)

app/routes/api/
  schedule-by-period.ts           # New API route for detail row data (D-17)

app/routes/workspace/
  sub-module.tsx                  # Add payroll_hours loader branch (D-22)
```

### Pattern 1: SQL View — Hours Comparison (HCMP-05)
**What:** Create `app_hr_hours_comparison` view that LEFT JOINs aggregated schedule hours with payroll totals per employee per pay period
**When to use:** Always — this is the primary data source for the grid
**Key design:**
- Aggregate `ops_task_schedule` entries by employee + pay period date range (NOT by week)
- LEFT JOIN with `hr_payroll` aggregated `total_hours` so employees with schedule data but no payroll still appear
- Include ALL schedule entries regardless of `ops_task_tracker_id` (D-02)
- NULL `stop_time` contributes 0 hours (D-06)
- Variance = payroll_hours - scheduled_hours (positive = payroll > schedule)

```sql
-- Source: Verified from existing payroll views + weekly schedule view patterns
CREATE OR REPLACE VIEW app_hr_hours_comparison AS
WITH schedule_agg AS (
    SELECT
        s.org_id,
        s.hr_employee_id,
        p.pay_period_start,
        p.pay_period_end,
        ROUND(
            SUM(
                CASE WHEN s.stop_time IS NOT NULL
                     THEN EXTRACT(EPOCH FROM (s.stop_time - s.start_time)) / 3600.0
                     ELSE 0 END
            )::NUMERIC, 2
        ) AS scheduled_hours
    FROM ops_task_schedule s
    -- Cross-join with distinct pay periods from hr_payroll to bucket schedule entries
    JOIN (
        SELECT DISTINCT org_id, pay_period_start, pay_period_end
        FROM hr_payroll
        WHERE is_deleted = false
    ) p ON p.org_id = s.org_id
        AND s.start_time::DATE >= p.pay_period_start
        AND s.start_time::DATE <= p.pay_period_end
    WHERE s.is_deleted = false
      AND s.start_time IS NOT NULL
    GROUP BY s.org_id, s.hr_employee_id, p.pay_period_start, p.pay_period_end
),
payroll_agg AS (
    SELECT
        org_id,
        hr_employee_id,
        pay_period_start,
        pay_period_end,
        SUM(total_hours) AS payroll_hours
    FROM hr_payroll
    WHERE is_deleted = false
    GROUP BY org_id, hr_employee_id, pay_period_start, pay_period_end
)
SELECT
    COALESCE(sa.org_id, pa.org_id) AS org_id,
    COALESCE(sa.hr_employee_id, pa.hr_employee_id) AS hr_employee_id,
    COALESCE(sa.pay_period_start, pa.pay_period_start) AS pay_period_start,
    COALESCE(sa.pay_period_end, pa.pay_period_end) AS pay_period_end,
    e.first_name || ' ' || e.last_name AS full_name,
    e.profile_photo_url,
    d.name AS department_name,
    COALESCE(sa.scheduled_hours, 0) AS scheduled_hours,
    COALESCE(pa.payroll_hours, 0) AS payroll_hours,
    ROUND((COALESCE(pa.payroll_hours, 0) - COALESCE(sa.scheduled_hours, 0))::NUMERIC, 2) AS variance
FROM schedule_agg sa
FULL OUTER JOIN payroll_agg pa
    ON sa.org_id = pa.org_id
    AND sa.hr_employee_id = pa.hr_employee_id
    AND sa.pay_period_start = pa.pay_period_start
    AND sa.pay_period_end = pa.pay_period_end
JOIN hr_employee e ON e.id = COALESCE(sa.hr_employee_id, pa.hr_employee_id)
LEFT JOIN hr_department d ON d.id = e.hr_department_id
WHERE e.is_deleted = false;

GRANT SELECT ON app_hr_hours_comparison TO authenticated;
```
[VERIFIED: Pattern from `20260409000001_app_hr_payroll_views.sql` and `20260408000001_update_ops_task_weekly_schedule_view.sql`]

**Important note:** The weekly schedule view (`ops_task_weekly_schedule`) is Sunday-anchored weekly and does NOT align to `hr_payroll` pay periods. The new view must aggregate `ops_task_schedule` directly by pay period date range using `start_time::DATE BETWEEN pay_period_start AND pay_period_end`.

### Pattern 2: Custom List View (HCMP-01, HCMP-02, HCMP-04)
**What:** `payroll-hours-list-view.tsx` composing AgGridWrapper directly with toolbar
**When to use:** For all custom payroll-style views needing non-standard toolbars
**Template:** `payroll-comp-manager-list-view.tsx` (closest match — PayPeriodFilter + search + CSV export + detail rows)

Key differences from template:
- No ManagerFilter or CheckDateFilter — only PayPeriodFilter + search + CSV
- Variance column needs custom `cellClassRules` (not row-level rules)
- No client-side grouping needed — view already provides one row per employee per period
- Detail row fetches data from new API route (not stashed in `_detailRows`)

[VERIFIED: `payroll-comp-manager-list-view.tsx` pattern at lines 526-588]

### Pattern 3: Client-Side Detail Row Fetch (HCMP-03)
**What:** API route returns daily schedule breakdown; detail row component fetches on expand
**When to use:** When detail data is large and shouldn't be loaded upfront
**Template:** `schedule-history.ts` API route + `ScheduleDetailRowInner` fetch pattern

```typescript
// Source: Verified from app/routes/api/schedule-history.ts + scheduler-list-view.tsx
// API route: /api/schedule-by-period?employeeId=X&orgId=Y&periodStart=YYYY-MM-DD&periodEnd=YYYY-MM-DD
// Returns: { data: [{ date, day_of_week, department_name, task_name, start_time, end_time, hours }] }
```

The detail component uses `useEffect` to fetch on mount (justified: data load on expand, same as scheduler pattern).
[VERIFIED: `scheduler-list-view.tsx` lines 82-114]

### Pattern 4: Variance Highlighting (HCMP-04)
**What:** `cellClassRules` on variance column for amber/red highlighting
**Existing utility:** `varianceHighlightCellClassRules(thresholdRed, thresholdAmber)` in `row-class-rules.ts`

Per D-09: amber when |variance| > 0, red when |variance| > 4. The existing utility accepts thresholds:
```typescript
// Source: app/components/ag-grid/row-class-rules.ts
varianceHighlightCellClassRules(4, 0.01)
// Returns: { 'text-red-500 font-semibold': |val| >= 4, 'text-amber-500': |val| >= 0.01 && < 4 }
```

Note: Using 0.01 instead of 0 as the amber threshold to avoid floating-point false positives on exact matches.
[VERIFIED: `row-class-rules.ts` lines 14-28]

### Pattern 5: Config + Registry + Loader (D-19 to D-24)
**What:** Standard CRUD config → registry → custom loader chain
**Template:** `hr-payroll-comp-manager.config.ts`

```typescript
// Source: app/lib/crud/hr-payroll-comp-manager.config.ts
export const hrPayrollHoursConfig: CrudModuleConfig<typeof schema> = {
  tableName: 'hr_payroll', // Not used for queries (custom view)
  pkType: 'uuid',
  pkColumn: 'hr_employee_id', // PK for detail row expansion
  orgScoped: true,
  views: { list: 'app_hr_hours_comparison', detail: 'hr_payroll' },
  columns: [
    { key: 'full_name', label: 'Employee', sortable: true },
    { key: 'department_name', label: 'Department', sortable: true },
    { key: 'scheduled_hours', label: 'Scheduled Hrs', type: 'number' },
    { key: 'payroll_hours', label: 'Payroll Hrs', type: 'number' },
    { key: 'variance', label: 'Variance', type: 'number' },
  ],
  search: { columns: ['full_name', 'department_name'], placeholder: 'Search employees...' },
  formFields: [], // Read-only — no create/edit
  schema,
  viewType: { list: 'custom' },
  customViews: { list: () => import('~/components/ag-grid/payroll-hours-list-view') },
  noPagination: true,
};
```
[VERIFIED: Pattern from `hr-payroll-comp-manager.config.ts`]

**Loader branch in sub-module.tsx:** Add `payroll_hours` between existing payroll branches. The `startsWith('payroll_')` check already handles payPeriods pre-load. Add default period logic similar to `payroll_data` branch.
[VERIFIED: `sub-module.tsx` lines 67-83 and 127-155]

### Anti-Patterns to Avoid
- **Reusing `ops_task_weekly_schedule` for aggregation:** It is Sunday-anchored weekly and does NOT align to pay periods
- **Loading all detail data in the main loader:** Kills initial load performance; use client-side fetch
- **Using `watch()` in React components:** Use `useWatch` if needed (CLAUDE.md rule)
- **Adding explicit generics to `useForm`:** Not applicable (no forms in this phase), but mentioning for consistency

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pay period filtering | Custom date range picker | `PayPeriodFilter` component | Already handles URL params, period display, selection |
| Hours formatting | Custom formatter | `hoursFormatter` from `payroll-formatters.tsx` | Consistent with all payroll views |
| Detail row expand/collapse | Manual row injection | `useDetailRow` hook | Handles transactions, state, re-expansion on revalidation |
| Column state persistence | Custom localStorage logic | `saveColumnState`/`restoreColumnState` | Versioned format, auto-cleanup |
| CSV export | Custom export logic | `CsvExportButton` component | Works with AG Grid API |
| Conditional cell styling | Inline style logic | `varianceHighlightCellClassRules` utility | Reusable, parameterized thresholds |

**Key insight:** Every UI building block for this phase already exists in the codebase. The only net-new components are the SQL view, the API route, the config file, and the list view composition.

## Common Pitfalls

### Pitfall 1: Pay Period Boundary Mismatch
**What goes wrong:** Schedule entries fall outside pay period boundaries if using `>=`/`<=` with timestamps instead of dates
**Why it happens:** `ops_task_schedule.start_time` is TIMESTAMPTZ, but `hr_payroll.pay_period_start/end` are DATE
**How to avoid:** Cast `start_time::DATE` before comparing to pay period dates in the SQL view
**Warning signs:** Scheduled hours don't match expected totals; entries near midnight are counted in wrong period

### Pitfall 2: FULL OUTER JOIN Producing Duplicates
**What goes wrong:** Employees appear multiple times if the JOIN keys don't match exactly
**Why it happens:** NULL handling in COALESCE or mismatched org_id/period combinations
**How to avoid:** Ensure both CTEs group by the same key set (org_id, hr_employee_id, pay_period_start, pay_period_end) and use COALESCE consistently
**Warning signs:** Row count exceeds number of unique employees in a period

### Pitfall 3: Missing Default Pay Period
**What goes wrong:** Grid loads empty on first visit with no period selected
**Why it happens:** No default period logic in the loader branch
**How to avoid:** Copy the `payroll_data` default period pattern — select most recent period from pre-loaded `payPeriods` when no URL params present
**Warning signs:** Empty grid on initial page load, works after selecting a period

### Pitfall 4: Detail Row API Missing Org Scoping
**What goes wrong:** Security bypass — employee schedule data leaks across orgs
**Why it happens:** API route queries `ops_task_schedule` without `org_id` filter
**How to avoid:** Always include `eq('org_id', orgId)` in the API route query; validate orgId param
**Warning signs:** Seeing schedule data for employees from other organizations

### Pitfall 5: Floating-Point Variance Highlighting
**What goes wrong:** Rows with 0.000001 variance show amber when they should be "matching"
**Why it happens:** Floating-point arithmetic in SQL ROUND vs JavaScript number comparison
**How to avoid:** Use threshold > 0 (e.g., 0.01) for amber instead of strict > 0; SQL ROUND to 2 decimals
**Warning signs:** All rows show amber even when hours appear to match

## Code Examples

### Variance Formatter (Custom +/- Prefix)
```typescript
// New formatter for the variance column showing +/- prefix
// Source: Follows hoursFormatter pattern from payroll-formatters.tsx
function varianceFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}`;
}
```
[ASSUMED: Custom implementation needed; pattern based on existing hoursFormatter]

### Detail Row Component Fetch Pattern
```typescript
// Source: Verified pattern from scheduler-list-view.tsx lines 82-114
function HoursDetailInner({ data, accountSlug }: {
  data: Record<string, unknown>;
  accountSlug: string;
}) {
  const [detailData, setDetailData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const employeeId = data.hr_employee_id as string;
  const periodStart = data.pay_period_start as string;
  const periodEnd = data.pay_period_end as string;

  // Justified: fetch on mount when detail row is expanded
  useEffect(() => {
    let cancelled = false;
    async function fetchSchedule() {
      const res = await fetch(
        `/api/schedule-by-period?employeeId=${encodeURIComponent(employeeId)}&orgId=${encodeURIComponent(accountSlug)}&periodStart=${periodStart}&periodEnd=${periodEnd}`
      );
      const json = await res.json() as { data?: RowData[] };
      if (!cancelled && json.data) setDetailData(json.data);
      if (!cancelled) setLoading(false);
    }
    fetchSchedule();
    return () => { cancelled = true; };
  }, [employeeId, accountSlug, periodStart, periodEnd]);
  // ... render detail table
}
```
[VERIFIED: Pattern from scheduler-list-view.tsx]

### Loader Branch Addition
```typescript
// Source: sub-module.tsx existing pattern, lines 98-155
} else if (subModuleSlug === 'payroll_hours') {
  let periodStart = url.searchParams.get('period_start');
  let periodEnd = url.searchParams.get('period_end');

  // Default to most recent pay period
  if (!periodStart && !periodEnd && payPeriods.length > 0) {
    const defaultPeriod = payPeriods[0] as Record<string, unknown>;
    periodStart = String(defaultPeriod.pay_period_start ?? '');
    periodEnd = String(defaultPeriod.pay_period_end ?? '');
  }

  if (periodStart && periodEnd) {
    query = query
      .eq('pay_period_start', periodStart)
      .eq('pay_period_end', periodEnd);
  }
  query = query.order('full_name');
```
[VERIFIED: Pattern from sub-module.tsx payroll_data branch]

## Discretion Recommendations

Based on research of existing patterns, here are recommendations for Claude's discretion areas:

| Area | Recommendation | Rationale |
|------|---------------|-----------|
| Detail row scrolling | Fixed height (360px) with overflow-y-auto | Matches payroll comp manager detail row pattern |
| Summary/totals row | Yes — pinned bottom row with total scheduled, total payroll, total variance | Consistent with all payroll views (PCMP-05, PMGR-03) |
| Loading state for detail | "Loading schedule data..." centered text | Matches scheduler detail row loading state |
| CSV export | All visible columns | Matches existing CsvExportButton behavior |
| Variance sort | Sort by signed value (default AG Grid numeric sort) | Signed sort is more intuitive for finding overpaid/underpaid employees |
| Amber/red colors | Use `text-amber-500` and `text-red-500 font-semibold` | Matches existing `varianceHighlightCellClassRules` output classes |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 + Playwright 1.57.x |
| Config file | `vitest.config.ts` (unit), `e2e/playwright.config.ts` (E2E) |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm typecheck && pnpm vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HCMP-01 | Grid renders employee photo, scheduled/payroll hours, variance | manual-only | Visual verification in browser | N/A |
| HCMP-02 | Pay period selector scopes comparison data | manual-only | Visual verification — URL params change triggers reload | N/A |
| HCMP-03 | Row-click shows daily schedule breakdown | manual-only | Visual verification — expand row, check API call | N/A |
| HCMP-04 | Variance cells highlighted amber/red | manual-only | Visual verification in browser | N/A |
| HCMP-05 | SQL view returns correct joined data | smoke | `pnpm supabase:reset` (view creation succeeds) | N/A |

### Sampling Rate
- **Per task commit:** `pnpm typecheck`
- **Per wave merge:** `pnpm typecheck && pnpm format:fix && pnpm lint:fix`
- **Phase gate:** Full typecheck + visual verification of all 5 HCMP requirements

### Wave 0 Gaps
None -- this phase is read-only UI composition with no unit-testable logic beyond the SQL view. The SQL view is validated by `supabase:reset` succeeding. All other requirements need visual verification.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `requireUserLoader(request)` in workspace layout |
| V3 Session Management | yes | Request-scoped Supabase client with cookie session |
| V4 Access Control | yes | `requireModuleAccess()` + `requireSubModuleAccess()` in sub-module loader; RLS on views |
| V5 Input Validation | yes | URL searchParams validated (period_start/period_end are dates); API route validates orgId/employeeId |
| V6 Cryptography | no | No secrets or encryption needed |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-org data access via API route | Information Disclosure | `eq('org_id', orgId)` filter on all queries; validate orgId param |
| URL param injection in period filter | Tampering | Supabase parameterized queries handle SQL injection; date format validated by Supabase |
| Unauthorized schedule detail access | Information Disclosure | API route must verify user is authenticated and has org membership |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | FULL OUTER JOIN is the right strategy for combining schedule + payroll data | Architecture Patterns | If LEFT JOIN from payroll is preferred (only show employees with payroll records), the view SQL changes but the component stays the same |
| A2 | 0.01 is a good floating-point threshold for "any mismatch" amber highlighting | Common Pitfalls | If exact zero-check is wanted, may get false positives from rounding |
| A3 | The `payroll_hours` slug is already configured in `org_sub_module` database records | Architecture Patterns | If not, need to add the sub-module registration to the database |

## Open Questions

1. **Does `payroll_hours` exist in `org_sub_module`?**
   - What we know: CONTEXT.md says "already configured in database"
   - What's unclear: Not verified by querying the database
   - Recommendation: Verify during implementation; if missing, add via migration or seed data

2. **Should employees with ONLY schedule data (no payroll) appear?**
   - What we know: D-01 says LEFT JOIN, D-04 lists payroll_hours as a column
   - What's unclear: Whether showing employees with 0 payroll hours but >0 scheduled hours is useful
   - Recommendation: Use FULL OUTER JOIN per the view design — shows both directions of mismatch

## Sources

### Primary (HIGH confidence)
- `app/components/ag-grid/payroll-comp-manager-list-view.tsx` — Template for custom list view pattern
- `app/components/ag-grid/row-class-rules.ts` — Existing variance highlighting utility
- `app/components/ag-grid/detail-row-wrapper.tsx` — useDetailRow hook implementation
- `app/routes/api/schedule-history.ts` — API route pattern for client-side detail fetch
- `app/routes/workspace/sub-module.tsx` — Custom loader branching pattern
- `app/lib/crud/hr-payroll-comp-manager.config.ts` — Config template
- `supabase/migrations/20260409000001_app_hr_payroll_views.sql` — SQL view patterns
- `supabase/migrations/20260401000037_ops_task_schedule.sql` — Schedule table schema
- `supabase/migrations/20260401000025_hr_payroll.sql` — Payroll table schema
- `supabase/migrations/20260408000001_update_ops_task_weekly_schedule_view.sql` — Hours calculation formula

### Secondary (MEDIUM confidence)
- CONTEXT.md D-01 through D-24 — User decisions constraining implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed, no new packages
- Architecture: HIGH — all patterns verified from existing codebase (Phases 1-4)
- Pitfalls: HIGH — identified from direct analysis of schema types and existing code patterns

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable — internal project patterns)
