# Phase 4: Payroll Views - Research

**Researched:** 2026-04-08
**Domain:** AG Grid read-only views with SQL aggregation views, column groups, pinned totals, and toolbar filters
**Confidence:** HIGH

## Summary

Phase 4 builds three read-only payroll display submodules using established patterns from Phases 1-3. The core work involves: (1) creating four SQL views for aggregated/joined payroll data, (2) building three CRUD module configs with AG Grid column definitions, and (3) creating two custom list view components (Payroll Comparison and Comp Manager) with toolbar filters.

The AG Grid Community features needed (column groups, pinnedBottomRowData, CSV export) are all available in the installed v35.2.1. The main technical gap is that `AgGridWrapper` does not currently pass `pinnedBottomRowData` through to `AgGridReact` -- this prop must be added to the wrapper interface.

**Primary recommendation:** Follow the Scheduler custom list view pattern for Payroll Comparison and Comp Manager (compose AgGridWrapper directly with custom toolbars), and use standard AgGridListView with filterSlot for Payroll Data. Create SQL views following the time-off view pattern with org-scoped JOINs.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Create SQL views `app_hr_payroll_by_task` and `app_hr_payroll_by_employee` for Payroll Comparison aggregated data
- **D-02:** Create SQL view `app_hr_payroll_by_comp_manager` joining hr_payroll with hr_employee.compensation_manager_id
- **D-03:** Payroll Data uses `app_hr_payroll_detail` view (join employee name/photo)
- **D-04:** All views org-scoped with RLS via hr_employee membership
- **D-05:** View toggle via URL searchParams (`?view=by_task` / `?view=by_employee`), server-side loader switches
- **D-06:** Toggle rendered as tab-style buttons in toolbar
- **D-07-D-08:** Specific columns defined for by-task and by-employee views
- **D-09:** Pinned bottom row for grand totals using AG Grid `pinnedBottomRowData`
- **D-10:** Manager selector dropdown loaded from hr_employee where referenced as compensation_manager_id
- **D-11:** Manager selection via URL searchParams (`?manager=<id>`) triggering loader revalidation
- **D-12-D-14:** Specific columns for comp manager view with pinned totals
- **D-15-D-21:** AG Grid column groups for Payroll Data organized into Employee Info, Pay Period, Hours, Earnings, Deductions, Employer Costs
- **D-22-D-25:** Pay period dropdown filter on all three submodules, default to most recent
- **D-26-D-27:** Employee filter on Payroll Data only via URL searchParams
- **D-28-D-30:** Three new config files registered in registry.ts with `viewType: { list: 'agGrid' }` (for Payroll Data) or `viewType: { list: 'custom' }` (for Comparison and Comp Manager)
- **D-31:** Payroll Comparison and Comp Manager use custom list views; Payroll Data uses standard AgGridListView with filterSlot
- **D-32-D-33:** CSV export via existing CsvExportButton on all three submodules

### Claude's Discretion
- Exact toggle button styling for Payroll Comparison view switch
- Manager dropdown component choice (combobox vs select)
- Pay period dropdown display formatting details
- Default column visibility (which groups start expanded/collapsed in Payroll Data)
- Loading states for filter changes
- Whether to show toast on CSV export completion
- Pinned totals row styling (bold, background color)
- Column group header styling

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PCMP-01 | Aggregated by task view showing payroll data grouped by department/task | SQL view `app_hr_payroll_by_task` with GROUP BY department/task; custom list view with column defs |
| PCMP-02 | Aggregated by employee view showing total compensation per employee | SQL view `app_hr_payroll_by_employee` with GROUP BY employee; same custom list view with alternate columns |
| PCMP-03 | Toggle between task vs employee views | URL searchParams `?view=by_task`/`?view=by_employee` with tab-style buttons; loader branch per value |
| PCMP-04 | Pay period filter for both views | Pay period dropdown in toolbar; `?period_start`/`?period_end` searchParams; shared across all 3 submodules |
| PCMP-05 | Pinned totals row at bottom with grand totals | AG Grid `pinnedBottomRowData` prop; compute from loaded data client-side |
| PCMP-06 | New SQL views for payroll-by-task and payroll-by-employee aggregations | Two CREATE OR REPLACE VIEW migrations with SUM/GROUP BY |
| PMGR-01 | Payroll data filtered by compensation manager | SQL view `app_hr_payroll_by_comp_manager` joining hr_payroll with hr_employee.compensation_manager_id |
| PMGR-02 | Manager selector/filter dropdown | Distinct managers query; Shadcn Select or Combobox in toolbar; `?manager=<id>` searchParam |
| PMGR-03 | Summary totals per manager (pinned bottom row) | AG Grid `pinnedBottomRowData` computed from filtered data |
| PMGR-04 | New SQL view for comp manager aggregation | CREATE OR REPLACE VIEW with JOIN to resolve manager name |
| PDAT-01 | Full payroll line items grid with all hr_payroll columns | `app_hr_payroll_detail` view joining employee name/photo; agGridColDefs with all 40+ columns |
| PDAT-02 | Column groups organizing 40+ fields into sections | AG Grid ColGroupDef with `children` array; 6 groups per D-15 through D-21 |
| PDAT-03 | Pay period filter | Same pay period dropdown as PCMP-04 |
| PDAT-04 | Employee filter | Employee dropdown from loadFormOptions FK; `?employee=<id>` searchParam |
| PDAT-05 | CSV export for payroll data | Existing CsvExportButton, already available |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ag-grid-community | 35.2.1 | Data grid with column groups, pinned rows, CSV export | Already installed and themed from Phase 1 [VERIFIED: node_modules] |
| ag-grid-react | 35.2.1 | React wrapper for AG Grid | Already installed [VERIFIED: node_modules] |
| @supabase/supabase-js | 2.89.0 | Database queries via PostgREST | Already configured [VERIFIED: CLAUDE.md] |
| date-fns | 4.1.0 | Date formatting for pay period display | Already installed [VERIFIED: CLAUDE.md] |

### No new dependencies needed
All Phase 4 features use existing AG Grid Community capabilities (column groups, pinnedBottomRowData, CSV export) and existing project infrastructure.

## Architecture Patterns

### Recommended Structure
```
supabase/migrations/
  20260409000001_app_hr_payroll_by_task_view.sql
  20260409000002_app_hr_payroll_by_employee_view.sql
  20260409000003_app_hr_payroll_by_comp_manager_view.sql
  20260409000004_app_hr_payroll_detail_view.sql

app/lib/crud/
  hr-payroll-comparison.config.ts      # Config for payroll comparison submodule
  hr-payroll-comp-manager.config.ts    # Config for comp manager submodule
  hr-payroll-data.config.ts            # Config for payroll data submodule

app/components/ag-grid/
  payroll-comparison-list-view.tsx      # Custom view with toggle + period filter
  payroll-comp-manager-list-view.tsx    # Custom view with manager + period filter
```

### Pattern 1: SQL Aggregation Views (for Comparison)
**What:** GROUP BY views that aggregate hr_payroll data into summary rows
**When to use:** PCMP-01, PCMP-02, PCMP-06
**Example:**
```sql
-- Source: time-off view pattern from 20260408000002_app_hr_time_off_requests_view.sql [VERIFIED: codebase]
CREATE OR REPLACE VIEW app_hr_payroll_by_task AS
SELECT
    p.org_id,
    p.pay_period_start,
    p.pay_period_end,
    d.name AS department_name,
    p.hr_department_id,
    -- Aggregated columns
    COUNT(DISTINCT p.hr_employee_id) AS employee_count,
    SUM(p.regular_hours) AS total_regular_hours,
    SUM(p.overtime_hours) AS total_overtime_hours,
    SUM(p.gross_wage) AS total_gross_wage,
    SUM(p.net_pay) AS total_net_pay,
    -- Compatibility columns for loadTableData
    false AS is_deleted,
    NULL::DATE AS end_date
FROM hr_payroll p
LEFT JOIN hr_department d ON d.id = p.hr_department_id
WHERE p.is_deleted = false
GROUP BY p.org_id, p.pay_period_start, p.pay_period_end, d.name, p.hr_department_id;

GRANT SELECT ON app_hr_payroll_by_task TO authenticated;
```

**Critical note:** Views need `is_deleted` and `end_date` compatibility columns if using `loadTableData`, OR the loader must use the `queryUntypedView` custom path (like scheduler does). Since these are aggregated views without a single `is_deleted` per row, using `queryUntypedView` with explicit filtering is the correct approach. [VERIFIED: sub-module.tsx loader line 63-108]

### Pattern 2: Custom List View with Toolbar Filters
**What:** Compose AgGridWrapper directly (not AgGridListView) with custom toolbar for filter controls
**When to use:** PCMP-01-06, PMGR-01-04
**Established by:** SchedulerListView [VERIFIED: scheduler-list-view.tsx]

The pattern:
1. Config uses `viewType: { list: 'custom' }` and `customViews: { list: () => import(...) }`
2. Custom list view receives `ListViewProps` (same as AgGridListView)
3. Composes `AgGridWrapper` directly with custom toolbar above it
4. Filter state via `useSearchParams()` for server-side loader revalidation
5. Sub-module.tsx has a `viewType === 'custom'` branch in the loader that calls `queryUntypedView`

### Pattern 3: AG Grid Column Groups (ColGroupDef)
**What:** Organize 40+ columns into collapsible header groups
**When to use:** PDAT-02
**Example:**
```typescript
// Source: AG Grid v35 docs [ASSUMED - standard AG Grid API]
import type { ColDef, ColGroupDef } from 'ag-grid-community';

const columnGroupDefs: (ColDef | ColGroupDef)[] = [
  {
    headerName: 'Hours',
    children: [
      { field: 'regular_hours', headerName: 'Regular', type: 'numericColumn' },
      { field: 'overtime_hours', headerName: 'OT', type: 'numericColumn' },
      { field: 'holiday_hours', headerName: 'Holiday', type: 'numericColumn' },
      // ...
    ],
  },
  {
    headerName: 'Earnings',
    children: [
      { field: 'regular_pay', headerName: 'Regular Pay', type: 'numericColumn' },
      // ...
    ],
  },
];
```

### Pattern 4: Pinned Bottom Totals Row
**What:** AG Grid `pinnedBottomRowData` for grand totals at the bottom of the grid
**When to use:** PCMP-05, PMGR-03
**Example:**
```typescript
// Source: AG Grid Community API [ASSUMED - standard AG Grid v35 API]
const totalsRow = useMemo(() => {
  if (!data.length) return [];
  return [{
    department_name: 'TOTAL',
    employee_count: data.reduce((sum, r) => sum + (r.employee_count as number), 0),
    total_regular_hours: data.reduce((sum, r) => sum + (r.total_regular_hours as number), 0),
    total_gross_wage: data.reduce((sum, r) => sum + (r.total_gross_wage as number), 0),
    total_net_pay: data.reduce((sum, r) => sum + (r.total_net_pay as number), 0),
  }];
}, [data]);

// Pass to AgGridWrapper (after extending it)
<AgGridWrapper pinnedBottomRowData={totalsRow} ... />
```

### Pattern 5: URL searchParams for Server-Side Filtering
**What:** Filter controls update URL searchParams, React Router revalidates the loader
**When to use:** All filters (pay period, manager, view toggle, employee)
**Established by:** Scheduler week navigation, Time Off status filter [VERIFIED: codebase]

```typescript
// Source: status-filter-tabs.tsx pattern [VERIFIED: codebase]
const [searchParams, setSearchParams] = useSearchParams();

const handlePeriodChange = (start: string, end: string) => {
  const next = new URLSearchParams(searchParams);
  next.set('period_start', start);
  next.set('period_end', end);
  setSearchParams(next, { preventScrollReset: true });
};
```

### Anti-Patterns to Avoid
- **Using loadTableData for aggregated views:** loadTableData expects `is_deleted` column and standard table patterns. Use `queryUntypedView` with explicit filtering for custom views. [VERIFIED: scheduler loader pattern]
- **Client-side filtering for pay period/manager:** Server-side filtering via URL searchParams + loader revalidation is the established pattern. Client-side filtering would be inconsistent and may fail with large datasets.
- **Adding forms/create buttons to read-only views:** All three payroll submodules are display-only (payroll is externally imported). No CreatePanel or formFields needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Column grouping UI | Custom collapsible headers | AG Grid ColGroupDef `children` | Native AG Grid Community feature with expand/collapse built in [ASSUMED] |
| Pinned totals row | Custom footer component | AG Grid `pinnedBottomRowData` | Native feature, handles scroll sync automatically [ASSUMED] |
| CSV export | Custom file download | `CsvExportButton` + AG Grid `exportDataAsCsv` | Already built in Phase 1 [VERIFIED: csv-export-button.tsx] |
| Filter toolbar | Custom form state | URL searchParams + useSearchParams | Established pattern from Phases 2-3 [VERIFIED: codebase] |
| Date formatting | Custom formatters | date-fns `format()` | Already used throughout project [VERIFIED: scheduler-list-view.tsx] |

## Common Pitfalls

### Pitfall 1: AgGridWrapper Missing pinnedBottomRowData Prop
**What goes wrong:** The `AgGridWrapper` component does NOT currently accept or pass through `pinnedBottomRowData` to `AgGridReact`. Attempting to use it will result in the prop being silently ignored.
**Why it happens:** The wrapper was built for Phase 1 use cases that didn't need pinned rows.
**How to avoid:** Extend `AgGridWrapperProps` interface to include `pinnedBottomRowData?: Record<string, unknown>[]` and pass it through in `AgGridInner`.
**Warning signs:** Totals row doesn't appear despite correct data.

### Pitfall 2: Aggregated Views Missing Compatibility Columns
**What goes wrong:** `loadTableData` expects `is_deleted` and calls `.eq('is_deleted', false)`. Aggregated views (GROUP BY) don't have a per-row `is_deleted`.
**Why it happens:** Views are aggregated across many rows, so a single `is_deleted` column is meaningless.
**How to avoid:** Use the custom loader path (`viewType === 'custom'`) with `queryUntypedView` and apply `WHERE p.is_deleted = false` in the SQL view definition itself.
**Warning signs:** PostgREST error "column is_deleted does not exist".

### Pitfall 3: Sub-module.tsx Custom Loader Only Handles Scheduler
**What goes wrong:** The current `viewType === 'custom'` branch in `sub-module.tsx` loader is hardcoded for scheduler (references `week_start_date`, `dept` params).
**Why it happens:** Phase 2 added the custom loader path specifically for the scheduler use case.
**How to avoid:** Either (a) generalize the custom loader branch with a config-driven approach, or (b) add separate `if` branches for payroll submodules (checking slug), or (c) add a `customLoader` function to `CrudModuleConfig` that configs can provide. Option (c) is most extensible.
**Warning signs:** Payroll views try to filter by `week_start_date` which doesn't exist in payroll views.

### Pitfall 4: Pay Period Default Selection
**What goes wrong:** When no period filter is selected, the page shows all pay periods mixed together, making totals meaningless.
**Why it happens:** Default to "all" is the implicit behavior when no searchParam is set.
**How to avoid:** The loader must query distinct pay periods, determine the most recent one, and apply it as default when no `?period_start`/`?period_end` params are present.
**Warning signs:** First page load shows garbled data mixing multiple pay periods.

### Pitfall 5: Column Group Defs vs ColDef Array Type
**What goes wrong:** The `agGridColDefs` property on `CrudModuleConfig` is typed as `ColDef[]`, but column groups require `ColGroupDef[]` (different type).
**Why it happens:** `ColGroupDef` has a `children` property and no `field`, while `ColDef` has `field` and no `children`.
**How to avoid:** Use `(ColDef | ColGroupDef)[]` as the type for Payroll Data column definitions. May need to update the config type or use a separate property. Since Payroll Data uses standard AgGridListView, the `agGridColDefs` type must be widened OR use a custom list view too.
**Warning signs:** TypeScript error on ColGroupDef assignment to ColDef[].

### Pitfall 6: Currency Formatting Consistency
**What goes wrong:** Monetary values displayed as raw numbers without $ sign or 2 decimal places.
**Why it happens:** AG Grid `numericColumn` type doesn't auto-format as currency.
**How to avoid:** Add `valueFormatter` to all currency columns: `(params) => params.value != null ? '$' + Number(params.value).toFixed(2) : ''`
**Warning signs:** Gross wage showing as "1234.5" instead of "$1,234.50".

## Code Examples

### Pay Period Dropdown Component
```typescript
// Reusable component for all three payroll submodules
// Source: StatusFilterTabs pattern [VERIFIED: codebase]
import { useSearchParams } from 'react-router';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@aloha/ui/select';
import { format, parseISO } from 'date-fns';

interface PayPeriodOption {
  period_start: string;
  period_end: string;
}

interface PayPeriodFilterProps {
  periods: PayPeriodOption[];
}

function PayPeriodFilter({ periods }: PayPeriodFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStart = searchParams.get('period_start') ?? '';

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    const [start, end] = value.split('|');
    if (start && end) {
      next.set('period_start', start);
      next.set('period_end', end);
    }
    setSearchParams(next, { preventScrollReset: true });
  };

  return (
    <Select
      value={currentStart ? `${currentStart}|${searchParams.get('period_end')}` : ''}
      onValueChange={handleChange}
    >
      <SelectTrigger className="h-8 w-[240px]">
        <SelectValue placeholder="Select pay period" />
      </SelectTrigger>
      <SelectContent>
        {periods.map((p) => (
          <SelectItem
            key={`${p.period_start}|${p.period_end}`}
            value={`${p.period_start}|${p.period_end}`}
          >
            {format(parseISO(p.period_start), 'MM/dd/yyyy')} - {format(parseISO(p.period_end), 'MM/dd/yyyy')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Currency Value Formatter
```typescript
// Reusable across all payroll column definitions [ASSUMED - standard pattern]
import type { ValueFormatterParams } from 'ag-grid-community';

function currencyFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hoursFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  return value.toFixed(1);
}
```

### Extending AgGridWrapper for pinnedBottomRowData
```typescript
// Add to AgGridWrapperProps interface [VERIFIED: ag-grid-wrapper.tsx needs modification]
interface AgGridWrapperProps {
  // ... existing props ...
  pinnedBottomRowData?: Record<string, unknown>[];
}
// Then pass through in AgGridInner to <AgGridReact pinnedBottomRowData={pinnedBottomRowData} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| loadTableData for all views | queryUntypedView for custom views | Phase 2 | Aggregated views without is_deleted use custom loader path |
| Single payroll config | Three separate configs | This phase | Split hrPayrollConfig into comparison, comp manager, data |
| agGridColDefs: ColDef[] only | May need ColDef or ColGroupDef | This phase | Column groups need the wider type for Payroll Data |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | AG Grid v35 Community supports ColGroupDef with `children` for column grouping | Architecture Patterns | Would need Enterprise license or custom header; HIGH risk |
| A2 | AG Grid v35 Community supports `pinnedBottomRowData` prop | Architecture Patterns | Would need custom footer component; MEDIUM risk |
| A3 | ColGroupDef and ColDef can be mixed in the same `columnDefs` array | Code Examples | TypeScript type mismatch; LOW risk (well-documented API) |

## Open Questions

1. **Sub-module.tsx custom loader generalization**
   - What we know: Current custom loader branch is scheduler-specific (hardcoded `week_start_date`, `dept` filters)
   - What's unclear: Best way to generalize for payroll submodules (config-driven vs slug-based branching)
   - Recommendation: Add a `customLoader` function to `CrudModuleConfig` type that receives `(client, orgId, searchParams)` and returns table data. Each config provides its own query logic. This is the most extensible approach without bloating sub-module.tsx.

2. **CrudModuleConfig type for column groups**
   - What we know: `agGridColDefs` is typed as `ColDef[]`, column groups need `(ColDef | ColGroupDef)[]`
   - What's unclear: Whether to widen the existing type or add a new property
   - Recommendation: Widen `agGridColDefs` to `(ColDef | ColGroupDef)[]` since AG Grid accepts both in `columnDefs`. This is backward-compatible.

3. **Read-only submodule pattern**
   - What we know: All three payroll submodules are display-only (no create/edit/delete)
   - What's unclear: Whether to skip formFields entirely or keep them empty
   - Recommendation: Set `formFields: []` and omit the Create button in custom views. For Payroll Data using AgGridListView, consider a flag to hide the Create button.

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
| PCMP-01 | By-task aggregated view renders | e2e | `pnpm playwright test payroll-comparison` | No - Wave 0 |
| PCMP-03 | Toggle switches between views | e2e | `pnpm playwright test payroll-comparison` | No - Wave 0 |
| PCMP-05 | Pinned totals row visible | e2e | `pnpm playwright test payroll-comparison` | No - Wave 0 |
| PMGR-02 | Manager selector filters data | e2e | `pnpm playwright test payroll-comp-manager` | No - Wave 0 |
| PDAT-02 | Column groups render with collapse | e2e | `pnpm playwright test payroll-data` | No - Wave 0 |
| PDAT-05 | CSV export downloads file | e2e | `pnpm playwright test payroll-data` | No - Wave 0 |
| ALL | TypeScript compilation | unit | `pnpm typecheck` | Yes |
| ALL | SQL views valid | manual | `pnpm supabase:reset` | N/A |

### Sampling Rate
- **Per task commit:** `pnpm typecheck`
- **Per wave merge:** `pnpm typecheck && pnpm supabase:reset`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- None critical -- typecheck covers compilation. SQL views validated via `supabase:reset`. E2E tests are not blocking for this read-only display phase.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Existing requireUserLoader |
| V3 Session Management | No | Existing session cookies |
| V4 Access Control | Yes | RLS via hr_employee membership on all views; requireModuleAccess/requireSubModuleAccess in loader |
| V5 Input Validation | Yes | URL searchParams sanitized (date strings only, no user free-text in SQL); PostgREST parameterized queries |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for SQL Views

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-org data leak | Information Disclosure | RLS policies on underlying tables; views inherit RLS; org_id filter in loader |
| URL param injection | Tampering | PostgREST parameterized queries; searchParam values used as `.eq()` parameters not raw SQL |
| Unauthorized payroll access | Elevation of Privilege | requireModuleAccess + requireSubModuleAccess guards in loader; RLS on hr_payroll |

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/20260401000025_hr_payroll.sql` - Full hr_payroll table schema with all 40+ columns [VERIFIED: codebase]
- `supabase/migrations/20260401000020_hr_employee.sql` - compensation_manager_id self-referential FK [VERIFIED: codebase]
- `supabase/migrations/20260408000002_app_hr_time_off_requests_view.sql` - Reference SQL view pattern [VERIFIED: codebase]
- `app/components/ag-grid/ag-grid-wrapper.tsx` - Current wrapper interface (missing pinnedBottomRowData) [VERIFIED: codebase]
- `app/components/ag-grid/ag-grid-list-view.tsx` - Standard list view with filterSlot [VERIFIED: codebase]
- `app/components/ag-grid/scheduler-list-view.tsx` - Custom list view pattern [VERIFIED: codebase]
- `app/routes/workspace/sub-module.tsx` - Loader with custom/standard branches [VERIFIED: codebase]
- `app/lib/crud/types.ts` - CrudModuleConfig type definition [VERIFIED: codebase]
- `app/lib/crud/registry.ts` - Module config registry [VERIFIED: codebase]
- `ag-grid-community` v35.2.1 installed [VERIFIED: node_modules/ag-grid-community/package.json]

### Secondary (MEDIUM confidence)
- AG Grid column groups and pinnedBottomRowData are documented Community features [ASSUMED - standard AG Grid API, well-known]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all dependencies already installed, no new packages
- Architecture: HIGH - replicating established patterns from Phases 1-3
- SQL views: HIGH - following time-off view pattern with well-understood JOINs and GROUP BY
- Pitfalls: HIGH - identified from direct codebase inspection (wrapper gaps, loader branching, type mismatches)

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable -- internal patterns, no external API changes)
