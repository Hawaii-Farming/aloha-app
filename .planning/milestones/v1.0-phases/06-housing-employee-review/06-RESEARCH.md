# Phase 6: Housing & Employee Review - Research

**Researched:** 2026-04-08
**Domain:** AG Grid submodule CRUD (housing occupancy + employee reviews), SQL migrations, side-panel forms
**Confidence:** HIGH

## Summary

Phase 6 implements two HR submodules -- housing management and employee reviews -- following the established AG Grid pattern from Phases 1-5. Housing reuses the existing `org_site` table with a new `max_beds` column and a filtered SQL view. Employee review requires a new `hr_employee_review` table with generated average column, unique constraints, and named FK constraints (two FKs to `hr_employee`).

Both submodules follow the proven pattern: SQL view + CRUD config + custom or standard list view + detail row expansion + side-panel forms. The codebase has mature infrastructure for all of these patterns, so no new libraries or paradigm shifts are needed. The main complexity is in the employee review scoring UX (cellClassRules for 1-3 color coding) and the Year-Quarter filter (new filter component modeled after PayPeriodFilter).

**Primary recommendation:** Follow the existing custom list view pattern (like `payroll-hours-list-view.tsx`) for both submodules, with dedicated detail row components and filter components. Housing can use `viewType: 'agGrid'` with custom `agGridColDefs` and `agGridDetailRow`, while employee review needs `viewType: 'custom'` for the Year-Quarter filter integration.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Add `max_beds INTEGER` column to `org_site` via ALTER TABLE migration
- **D-02:** Create SQL view `app_hr_housing` joining `org_site` with `org_site_category` WHERE `category_name = 'housing'` AND `sub_category_name IS NULL`
- **D-03:** View computes `available_beds = max_beds - tenant_count` where `tenant_count = COUNT(hr_employee WHERE site_id = org_site.id AND is_deleted = false)`
- **D-04:** View exposes: `id`, `org_id`, `name`, `max_beds`, `tenant_count`, `available_beds`, `notes`, `is_active`
- **D-05:** View is org-scoped with RLS via `hr_employee` membership
- **D-06:** Grid columns: housing name, max beds, tenant count, available beds
- **D-07:** Row-click full-width detail row shows tenant list (employees assigned to housing site via `hr_employee.site_id`)
- **D-08:** Detail row data loaded via client-side API fetch on expand (same pattern as hours comparison Phase 5 D-17)
- **D-09:** Detail row displays: avatar + employee name, department, start date, work authorization status
- **D-10:** Create/edit housing form (side panel): housing name (text, required), max beds (number, required), notes (textarea, optional)
- **D-11:** Register `housing` slug in CRUD registry pointing to new `hrHousingConfig`
- **D-12:** New migration creates `hr_employee_review` table with UUID PK, org_id, hr_employee_id, review_year, review_quarter (1-4)
- **D-13:** Score columns: productivity, attendance, quality, engagement (INTEGER 1-3 each)
- **D-14:** `average NUMERIC GENERATED ALWAYS AS ((productivity + attendance + quality + engagement) / 4.0) STORED`
- **D-15:** `notes TEXT`, `lead_id TEXT REFERENCES hr_employee(id)`, `is_locked BOOLEAN NOT NULL DEFAULT false`
- **D-16:** Standard audit columns
- **D-17:** UNIQUE constraint on `(org_id, hr_employee_id, review_year, review_quarter)`
- **D-18:** Named FK constraints for `hr_employee_id` and `lead_id` (PostgREST disambiguation)
- **D-19:** Standard org-scoped RLS policies
- **D-20:** Create SQL view `app_hr_employee_reviews` joining with `hr_employee` for name/photo/department and resolving `lead_id` to lead name
- **D-21:** Grid columns: avatar + employee name, department, start date, quarter, scores (4), average, notes (truncated), lead name, lock icon
- **D-22:** Score cells use `cellClassRules` color coding: 1=red, 2=amber, 3=green
- **D-23:** Average column formatted to 1 decimal place
- **D-24:** Year-Quarter filter via URL searchParams (`?year=2026&quarter=1`)
- **D-25:** Locked reviews show lock icon; edit form disables fields when locked
- **D-26:** Create/edit review form fields defined
- **D-27:** Row-click full-width detail row showing complete review details

### Claude's Discretion
- Detail row layout and styling within the full-width renderer
- Exact color shades for score 1-3 visualization (use DESIGN.md tokens)
- Loading skeleton design for detail row data fetch
- Whether to show empty state illustrations or simple text for zero housing sites / zero reviews
- Exact form field ordering and grouping in create/edit panels

### Deferred Ideas (OUT OF SCOPE)
None

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOUS-01 | Housing sites grid showing name, max beds, available beds | D-02/D-04 view provides data; D-06 defines columns; agGrid config pattern from time-off/hours-comp |
| HOUS-02 | Row-click detail showing tenant list | D-07/D-08 client-side fetch pattern from payroll-hours-list-view.tsx HoursDetailInner |
| HOUS-03 | Create/edit housing form (side panel) | D-10 field spec; CreatePanel + formFields pattern from hr-time-off.config.ts |
| HOUS-04 | Schema addition: max_beds on org_site | D-01 ALTER TABLE migration; existing org_site migration at 20260401000012 |
| EREV-01 | Employee review grid with scores | D-20/D-21 view + columns; custom list view pattern from payroll-hours-list-view.tsx |
| EREV-02 | Year-Quarter filter | D-24 URL searchParams; PayPeriodFilter pattern at pay-period-filter.tsx |
| EREV-03 | Create/edit review form with 1-3 selects | D-26 field spec; select type with options in formFields |
| EREV-04 | Lock flag preventing edits | D-25 is_locked check; form disable pattern |
| EREV-05 | hr_employee_review table migration with RLS | D-12 through D-19; supabase/CLAUDE.md table creation pattern |
| EREV-06 | Row-click detail showing review details | D-27 detail row; custom agGridDetailRow component |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ag-grid-community | 35.2.1 | Data grid rendering | Already installed and used across all phases [VERIFIED: package.json] |
| ag-grid-react | 35.2.1 | React AG Grid wrapper | Already installed [VERIFIED: package.json] |
| zod | 3.25.74 | Form schema validation | Project standard [VERIFIED: pnpm catalog] |
| react-hook-form | 7.69.0 | Form state management | Project standard [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Date formatting in filters | Already installed [VERIFIED: package.json] |
| lucide-react | 0.562.0 | Lock icon, bed icon | Already installed [VERIFIED: package.json] |

No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended File Structure
```
supabase/migrations/
  20260411000001_org_site_max_beds.sql           # ALTER TABLE org_site ADD max_beds
  20260411000002_app_hr_housing.sql              # CREATE VIEW app_hr_housing
  20260411000003_hr_employee_review.sql          # CREATE TABLE hr_employee_review + RLS
  20260411000004_app_hr_employee_reviews.sql     # CREATE VIEW app_hr_employee_reviews

app/lib/crud/
  hr-housing.config.ts                           # Housing CRUD config
  hr-employee-review.config.ts                   # Employee review CRUD config
  registry.ts                                    # Add housing + employee_review entries

app/components/ag-grid/
  housing-list-view.tsx                          # Housing custom list view (or use agGrid viewType)
  housing-detail-row.tsx                         # Housing tenant detail row component
  employee-review-list-view.tsx                  # Employee review custom list view
  employee-review-detail-row.tsx                 # Review detail row component
  year-quarter-filter.tsx                        # Year-Quarter filter component
  row-class-rules.ts                             # Add scoreColorCellClassRules

app/routes/api/
  housing-tenants.ts                             # API route for housing tenant data fetch
```

### Pattern 1: Housing View (agGrid ViewType with Custom Detail Row)

Housing can use the standard `AgGridListView` with `viewType: 'agGrid'` because it has standard CRUD form fields and doesn't need a custom toolbar filter. The detail row loads tenant data on expand.

```typescript
// Source: hr-time-off.config.ts pattern [VERIFIED: codebase]
export const hrHousingConfig: CrudModuleConfig<typeof schema> = {
  tableName: 'org_site',
  pkType: 'text',
  pkColumn: 'id',
  orgScoped: true,
  viewType: { list: 'agGrid' },
  views: {
    list: 'app_hr_housing',
    detail: 'app_hr_housing',
  },
  agGridColDefs: housingColDefs,
  agGridDetailRow: HousingDetailRow,
  noPagination: true,
  // formFields for create/edit side panel...
};
```

### Pattern 2: Employee Review (Custom ViewType with Year-Quarter Filter)

Employee review needs `viewType: 'custom'` because the Year-Quarter filter requires custom loader logic in `sub-module.tsx` (like payroll submodules). The loader branch filters by `year` and `quarter` searchParams.

```typescript
// Source: hr-payroll-hours.config.ts pattern [VERIFIED: codebase]
export const hrEmployeeReviewConfig: CrudModuleConfig<typeof schema> = {
  tableName: 'hr_employee_review',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,
  viewType: { list: 'custom' },
  customViews: {
    list: () => import('~/components/ag-grid/employee-review-list-view'),
  },
  views: {
    list: 'app_hr_employee_reviews',
    detail: 'app_hr_employee_reviews',
  },
  noPagination: true,
  // formFields for create/edit...
};
```

### Pattern 3: Score Color CellClassRules

Score cells (1-3) need color coding via `cellClassRules`, extending the existing pattern in `row-class-rules.ts`.

```typescript
// Source: row-class-rules.ts varianceHighlightCellClassRules pattern [VERIFIED: codebase]
export function scoreColorCellClassRules(): Record<
  string,
  (params: CellClassParams) => boolean
> {
  return {
    'text-red-600 dark:text-red-400 font-semibold': (params) =>
      Number(params.value) === 1,
    'text-amber-600 dark:text-amber-400': (params) =>
      Number(params.value) === 2,
    'text-green-600 dark:text-green-400': (params) =>
      Number(params.value) === 3,
  };
}
```

### Pattern 4: Year-Quarter Filter Component

Modeled after `PayPeriodFilter` which uses `useSearchParams` for URL state.

```typescript
// Source: pay-period-filter.tsx pattern [VERIFIED: codebase]
export function YearQuarterFilter({ years }: { years: number[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = searchParams.get('year') ?? '';
  const currentQuarter = searchParams.get('quarter') ?? '';
  // Two selects: year dropdown + quarter dropdown (1-4)
  // Changes update searchParams triggering loader revalidation
}
```

### Pattern 5: Client-Side Detail Row Data Fetch (Housing Tenants)

Same pattern as `HoursDetailInner` in `payroll-hours-list-view.tsx` -- API route + useEffect fetch on mount.

```typescript
// Source: payroll-hours-list-view.tsx HoursDetailInner [VERIFIED: codebase]
// API route: app/routes/api/housing-tenants.ts
// Queries: hr_employee WHERE site_id = :siteId AND org_id = :orgId AND is_deleted = false
// Returns: { data: [{ full_name, department_name, start_date, work_auth, profile_photo_url }] }
```

### Pattern 6: Named FK Constraints for hr_employee_review

Two FKs to `hr_employee` require named constraints per `supabase/CLAUDE.md`.

```sql
-- Source: supabase/CLAUDE.md Named FK Constraints section [VERIFIED: codebase]
CREATE TABLE IF NOT EXISTS hr_employee_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES org(id),
  hr_employee_id TEXT NOT NULL,
  lead_id TEXT,
  -- ... other columns ...
  CONSTRAINT fk_hr_employee_review_employee
    FOREIGN KEY (hr_employee_id) REFERENCES hr_employee(id),
  CONSTRAINT fk_hr_employee_review_lead
    FOREIGN KEY (lead_id) REFERENCES hr_employee(id)
);
```

### Pattern 7: Custom Loader Branch in sub-module.tsx

Employee review needs a loader branch in `sub-module.tsx` for Year-Quarter filtering, following the payroll/hours_comp pattern.

```typescript
// Source: sub-module.tsx loader lines 91-177 [VERIFIED: codebase]
} else if (subModuleSlug === 'employee_review') {
  const year = url.searchParams.get('year');
  const quarter = url.searchParams.get('quarter');
  if (year) query = query.eq('review_year', parseInt(year, 10));
  if (quarter) query = query.eq('review_quarter', parseInt(quarter, 10));
  query = query.order('full_name');
}
```

### Anti-Patterns to Avoid
- **Hand-computing `available_beds` in app layer:** The SQL view handles this; never calculate tenant counts client-side [VERIFIED: D-03 decision]
- **Using Enterprise Master/Detail for tenant expansion:** Project uses Community full-width detail rows via `useDetailRow` hook [VERIFIED: detail-row-wrapper.tsx]
- **Inline cell editing for scores:** Side-panel forms are the project pattern; no inline editing [VERIFIED: REQUIREMENTS.md Out of Scope]
- **Server-side filtering without URL searchParams:** All filters use searchParams for loader revalidation, enabling shareable URLs [VERIFIED: scheduler/payroll patterns]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grid rendering | Custom table components | AG Grid Community 35.2.1 | Already integrated project-wide |
| Detail row expand/collapse | Custom accordion logic | `useDetailRow` hook | Handles transactions, state, re-expansion on revalidation |
| Column state persistence | localStorage wrapper | `saveColumnState`/`restoreColumnState` | Versioned JSON format with corruption recovery |
| Form field rendering | Custom form inputs | `FormFieldGrid` + `CreatePanel` | Handles FK options, combobox, all field types |
| CRUD operations | Custom Supabase calls | `crudCreateAction`/`crudUpdateAction` | Org-scoping, audit fields, validation built in |
| FK option loading | Custom option queries | `loadFormOptions` | Handles org-scoped FK tables, label resolution |

## Common Pitfalls

### Pitfall 1: GENERATED ALWAYS Columns in INSERT/UPDATE
**What goes wrong:** Inserting or updating a row that includes the `average` column value causes PostgreSQL to error because it's a GENERATED ALWAYS AS stored column.
**Why it happens:** The CRUD action sends all form fields to Supabase, including computed columns.
**How to avoid:** The Zod schema for employee review MUST NOT include `average`. The form should not have an `average` field. The CRUD action only sends fields from the schema, so omitting `average` from the schema is sufficient.
**Warning signs:** "cannot insert a non-DEFAULT value into column 'average'" error.

### Pitfall 2: Housing CRUD Targets Wrong Table
**What goes wrong:** The housing config's `views.list` is `app_hr_housing` (a view), but `tableName` must be `org_site` (the actual table) for create/update operations.
**Why it happens:** Views are read-only in Supabase; CRUD writes go to the underlying table.
**How to avoid:** Set `tableName: 'org_site'` and `views.list: 'app_hr_housing'` in the config. The CRUD action writes to `org_site`, while the loader reads from the view.
**Warning signs:** "permission denied for view" or "cannot insert into a view" errors.

### Pitfall 3: PostgREST FK Disambiguation for lead_id
**What goes wrong:** Supabase embedded resource queries fail when two FKs point to `hr_employee` without named constraints.
**Why it happens:** PostgREST can't auto-resolve which FK to follow for `hr_employee` joins.
**How to avoid:** Named FK constraints (`fk_hr_employee_review_employee`, `fk_hr_employee_review_lead`) and explicit hint syntax in the view join: `employee:hr_employee!fk_hr_employee_review_employee(...)`.
**Warning signs:** "Could not determine a relationship between hr_employee_review and hr_employee" error.

### Pitfall 4: Housing Form Needs org_site_category_id
**What goes wrong:** Creating a housing site via the form fails because `org_site_category_id` is NOT NULL but not in the form.
**Why it happens:** The housing form only has name, max_beds, notes per D-10. But `org_site` requires `org_site_category_id`.
**How to avoid:** Use `additionalCreateFields` or hardcode the housing category ID in the CRUD action. The config should look up the housing category ID and auto-set it, similar to `additionalCreateFields: { requested_by: 'currentEmployee' }` in time-off. Alternatively, a custom create action that resolves the housing category.
**Warning signs:** "violates not-null constraint" on org_site_category_id.

### Pitfall 5: Locked Review Edit Prevention
**What goes wrong:** Users can still submit edits to locked reviews if only the UI disables fields.
**Why it happens:** Client-side disable is bypassable; server-side validation is needed.
**How to avoid:** The edit action must check `is_locked` before allowing updates. Add a check in the CRUD update flow or use a custom action.
**Warning signs:** Locked reviews getting modified.

### Pitfall 6: Housing Detail Row Height
**What goes wrong:** Detail row renders with wrong height, cutting off tenant list or leaving excessive whitespace.
**Why it happens:** AG Grid requires explicit row height for full-width rows; tenant count varies.
**How to avoid:** Use `getRowHeight` callback that calculates based on expected tenant count (e.g., `tenantCount * 40 + 32` for padding). If tenant count isn't known at render time (async fetch), use a reasonable default (200px) and potentially resize after fetch.
**Warning signs:** Scrollbar inside detail row, or large empty space below tenant list.

## Code Examples

### SQL: ALTER TABLE org_site for max_beds
```sql
-- Source: D-01 decision + org_site migration [VERIFIED: codebase]
ALTER TABLE org_site ADD COLUMN IF NOT EXISTS max_beds INTEGER;
COMMENT ON COLUMN org_site.max_beds IS 'Maximum bed capacity for housing sites; NULL for non-housing sites';
```

### SQL: app_hr_housing view
```sql
-- Source: D-02/D-03/D-04/D-05 decisions [VERIFIED: codebase patterns]
CREATE OR REPLACE VIEW app_hr_housing AS
SELECT
    s.id,
    s.org_id,
    s.name,
    s.max_beds,
    COUNT(e.id) FILTER (WHERE e.is_deleted = false) AS tenant_count,
    s.max_beds - COUNT(e.id) FILTER (WHERE e.is_deleted = false) AS available_beds,
    s.notes,
    s.is_active
FROM org_site s
INNER JOIN org_site_category c
    ON c.id = s.org_site_category_id
    AND c.category_name = 'housing'
    AND c.sub_category_name IS NULL
LEFT JOIN hr_employee e
    ON e.site_id = s.id
WHERE s.is_deleted = false
GROUP BY s.id, s.org_id, s.name, s.max_beds, s.notes, s.is_active;

GRANT SELECT ON app_hr_housing TO authenticated;
```

### SQL: hr_employee_review table
```sql
-- Source: D-12 through D-19 decisions + supabase/CLAUDE.md [VERIFIED: codebase patterns]
CREATE TABLE IF NOT EXISTS hr_employee_review (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    hr_employee_id      TEXT NOT NULL,
    review_year         INTEGER NOT NULL,
    review_quarter      INTEGER NOT NULL CHECK (review_quarter BETWEEN 1 AND 4),
    productivity        INTEGER NOT NULL CHECK (productivity BETWEEN 1 AND 3),
    attendance          INTEGER NOT NULL CHECK (attendance BETWEEN 1 AND 3),
    quality             INTEGER NOT NULL CHECK (quality BETWEEN 1 AND 3),
    engagement          INTEGER NOT NULL CHECK (engagement BETWEEN 1 AND 3),
    average             NUMERIC GENERATED ALWAYS AS (
                            (productivity + attendance + quality + engagement) / 4.0
                        ) STORED,
    notes               TEXT,
    lead_id             TEXT,
    is_locked           BOOLEAN NOT NULL DEFAULT false,
    created_by          TEXT REFERENCES hr_employee(id),
    updated_by          TEXT REFERENCES hr_employee(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted          BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_hr_employee_review_quarter
        UNIQUE (org_id, hr_employee_id, review_year, review_quarter),
    CONSTRAINT fk_hr_employee_review_employee
        FOREIGN KEY (hr_employee_id) REFERENCES hr_employee(id),
    CONSTRAINT fk_hr_employee_review_lead
        FOREIGN KEY (lead_id) REFERENCES hr_employee(id)
);

ALTER TABLE hr_employee_review ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_employee_review_read" ON hr_employee_review
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM hr_employee e
        WHERE e.org_id = hr_employee_review.org_id
          AND e.user_id = auth.uid()
          AND e.is_deleted = false
    ));

CREATE POLICY "hr_employee_review_insert" ON hr_employee_review
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM hr_employee e
        WHERE e.org_id = hr_employee_review.org_id
          AND e.user_id = auth.uid()
          AND e.is_deleted = false
    ));

CREATE POLICY "hr_employee_review_update" ON hr_employee_review
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM hr_employee e
        WHERE e.org_id = hr_employee_review.org_id
          AND e.user_id = auth.uid()
          AND e.is_deleted = false
    ));

GRANT SELECT, INSERT, UPDATE ON hr_employee_review TO authenticated;

CREATE INDEX idx_hr_employee_review_org ON hr_employee_review (org_id);
CREATE INDEX idx_hr_employee_review_employee ON hr_employee_review (hr_employee_id);
CREATE INDEX idx_hr_employee_review_period ON hr_employee_review (org_id, review_year, review_quarter);
```

### SQL: app_hr_employee_reviews view
```sql
-- Source: D-20/D-21 decisions [VERIFIED: codebase patterns]
CREATE OR REPLACE VIEW app_hr_employee_reviews AS
SELECT
    r.id,
    r.org_id,
    r.hr_employee_id,
    e.first_name || ' ' || e.last_name AS full_name,
    e.profile_photo_url,
    d.name AS department_name,
    wa.name AS work_authorization_name,
    e.start_date,
    r.review_year,
    r.review_quarter,
    r.review_year || '-Q' || r.review_quarter AS quarter_label,
    r.productivity,
    r.attendance,
    r.quality,
    r.engagement,
    r.average,
    r.notes,
    r.lead_id,
    lead.first_name || ' ' || lead.last_name AS lead_name,
    r.is_locked,
    r.created_at,
    r.updated_at,
    r.created_by,
    r.updated_by,
    r.is_deleted
FROM hr_employee_review r
INNER JOIN hr_employee e
    ON e.id = r.hr_employee_id
LEFT JOIN hr_department d
    ON d.id = e.hr_department_id
LEFT JOIN hr_work_authorization wa
    ON wa.id = e.hr_work_authorization_id
LEFT JOIN hr_employee lead
    ON lead.id = r.lead_id
WHERE r.is_deleted = false;

GRANT SELECT ON app_hr_employee_reviews TO authenticated;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TanStack Table for register | AG Grid for all submodules | Phase 1 | All new submodules use AG Grid |
| Server-side pagination | Client-side with noPagination | Phase 2+ | Custom views load all rows, AG Grid handles client pagination |
| Standard loadTableData | Custom loader branches in sub-module.tsx | Phase 2+ | Slug-based branching for filter logic |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `org_site_category` has a row with `category_name = 'housing'` and `sub_category_name IS NULL` in the database | SQL view for housing | View returns no rows; need to seed category data |
| A2 | `hr_work_authorization` table has a `name` column for the view join | Employee review view SQL | View creation fails; need to check actual column name |
| A3 | Housing form `org_site_category_id` can be resolved at create time from the 'housing' category name | Pitfall 4 | Create fails if category lookup doesn't work; may need custom action |

## Open Questions

1. **Housing category ID resolution at create time**
   - What we know: `org_site.org_site_category_id` is NOT NULL, and housing form (D-10) doesn't include a category field
   - What's unclear: How to auto-set the housing category ID -- use `additionalCreateFields`? Custom action? Hardcoded ID?
   - Recommendation: Add a custom create handler or use the loader to pre-resolve the housing category ID and pass it as a hidden field, or extend `additionalCreateFields` to support a 'housingCategory' type

2. **Distinct year values for Year-Quarter filter**
   - What we know: Filter needs year options; D-24 specifies URL searchParams `?year=2026&quarter=1`
   - What's unclear: Where to get the list of available years -- distinct from existing reviews? Or a hardcoded range?
   - Recommendation: Query distinct `review_year` values from `hr_employee_review` in the loader (like payPeriods query) and pass to the filter component. Default to current year if no reviews exist.

3. **Housing edit: which fields are editable?**
   - What we know: D-10 says name, max_beds, notes for create/edit
   - What's unclear: Whether `org_site.id` (TEXT PK) needs to be editable or if it's auto-generated for housing
   - Recommendation: Housing sites use the existing `org_site` table with TEXT PK. The edit form should allow editing name, max_beds, notes. The PK (id) should be set on create only (like `orgSiteConfig` pattern with `showOnCreate: true, showOnEdit: false`).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 + Playwright 1.57.x |
| Config file | `vitest.config.ts`, `e2e/playwright.config.ts` |
| Quick run command | `pnpm typecheck` |
| Full suite command | `pnpm typecheck && pnpm lint` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOUS-01 | Housing grid renders with columns | smoke/manual | `pnpm typecheck` | N/A - visual |
| HOUS-02 | Detail row shows tenants | smoke/manual | `pnpm typecheck` | N/A - visual |
| HOUS-03 | Create/edit form works | smoke/manual | `pnpm typecheck` | N/A - visual |
| HOUS-04 | max_beds column exists | migration | `pnpm supabase db push` | N/A - migration |
| EREV-01 | Review grid renders | smoke/manual | `pnpm typecheck` | N/A - visual |
| EREV-02 | Year-Quarter filter works | smoke/manual | `pnpm typecheck` | N/A - visual |
| EREV-03 | Create/edit form with selects | smoke/manual | `pnpm typecheck` | N/A - visual |
| EREV-04 | Locked reviews prevent edit | smoke/manual | `pnpm typecheck` | N/A - visual |
| EREV-05 | hr_employee_review table with RLS | migration | `pnpm supabase db push` | N/A - migration |
| EREV-06 | Detail row shows review | smoke/manual | `pnpm typecheck` | N/A - visual |

### Sampling Rate
- **Per task commit:** `pnpm typecheck`
- **Per wave merge:** `pnpm typecheck && pnpm lint`
- **Phase gate:** Full typecheck + lint + manual smoke test of both grids

### Wave 0 Gaps
None -- existing test infrastructure covers typecheck validation. No new test files needed for this phase (follows established pattern of Phases 2-5 which had no dedicated unit tests for grid views).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Handled by existing auth layer |
| V3 Session Management | no | Handled by existing session layer |
| V4 Access Control | yes | RLS policies on hr_employee_review; org-scoped via hr_employee membership |
| V5 Input Validation | yes | Zod schemas for form data; CHECK constraints on score columns (1-3) and quarter (1-4) |
| V6 Cryptography | no | No crypto needed |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-org data access | Information Disclosure | RLS policies with hr_employee org membership check |
| Locked review bypass | Tampering | Server-side is_locked check before UPDATE |
| Score value manipulation | Tampering | CHECK constraints (1-3) + Zod validation |
| Housing category injection | Tampering | Server-side category resolution, not client-provided |

## Sources

### Primary (HIGH confidence)
- Codebase files read directly: registry.ts, org-site.config.ts, hr-time-off.config.ts, hr-payroll-hours.config.ts, payroll-hours-list-view.tsx, sub-module.tsx, detail-row-wrapper.tsx, pay-period-filter.tsx, row-class-rules.ts, column-mapper.ts, ag-grid-list-view.tsx, types.ts, create-panel.tsx, schedule-by-period.ts
- Supabase schema files: org_site.sql, org_site_category.sql, hr_employee.sql
- Supabase CLAUDE.md: table creation pattern, RLS policies, named FK constraints

### Secondary (MEDIUM confidence)
- AG Grid 35.2.1 cellClassRules API -- used in existing codebase (varianceHighlightCellClassRules, statusCellClassRules) [VERIFIED: codebase]
- PostgreSQL GENERATED ALWAYS AS STORED syntax -- standard PG 12+ feature [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all patterns verified in codebase
- Architecture: HIGH - all patterns have direct precedent in Phases 1-5
- Pitfalls: HIGH - identified from real patterns and constraints in the codebase
- SQL migrations: HIGH - schema patterns well-documented in supabase/CLAUDE.md

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable -- no external API changes expected)
