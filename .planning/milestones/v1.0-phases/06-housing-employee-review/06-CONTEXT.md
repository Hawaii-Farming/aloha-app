# Phase 6: Housing & Employee Review - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage housing site occupancy and conduct quarterly employee performance reviews. Housing shows org_site records filtered to category=housing with bed capacity and tenant details. Employee review introduces a new hr_employee_review table with quarterly 1-3 scores, average calculation, and lock mechanism. Both submodules follow the established AG Grid pattern with full-width detail rows and side-panel CRUD forms.

</domain>

<decisions>
## Implementation Decisions

### Housing Data Source
- **D-01:** Add `max_beds INTEGER` column to `org_site` via ALTER TABLE migration — housing-specific capacity field (NULL for non-housing sites)
- **D-02:** Create SQL view `app_hr_housing` joining `org_site` with `org_site_category` WHERE `category_name = 'housing'` AND `sub_category_name IS NULL` — filters to housing sites only
- **D-03:** View computes `available_beds = max_beds - tenant_count` where `tenant_count = COUNT(hr_employee WHERE site_id = org_site.id AND is_deleted = false)`
- **D-04:** View exposes: `id`, `org_id`, `name`, `max_beds`, `tenant_count`, `available_beds`, `notes`, `is_active`
- **D-05:** View is org-scoped with RLS via `hr_employee` membership (standard pattern)

### Housing Grid & Tenant Display
- **D-06:** Grid columns: housing name, max beds, tenant count, available beds — focused occupancy view
- **D-07:** Row-click full-width detail row shows tenant list (employees assigned to that housing site via `hr_employee.site_id`)
- **D-08:** Detail row data loaded via client-side API fetch on expand (same pattern as scheduler Phase 2 D-13 and hours comparison Phase 5 D-17) — queries `hr_employee` filtered by `site_id`
- **D-09:** Detail row displays: avatar + employee name, department, start date, work authorization status
- **D-10:** Create/edit housing form (side panel): housing name (text, required), max beds (number, required), notes (textarea, optional)
- **D-11:** Register `housing` slug in CRUD registry pointing to new `hrHousingConfig`

### Employee Review Table (hr_employee_review)
- **D-12:** New migration creates `hr_employee_review` table with: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `org_id TEXT NOT NULL REFERENCES org(id)`, `hr_employee_id TEXT NOT NULL REFERENCES hr_employee(id)`, `review_year INTEGER NOT NULL`, `review_quarter INTEGER NOT NULL CHECK (review_quarter BETWEEN 1 AND 4)`
- **D-13:** Score columns: `productivity INTEGER NOT NULL CHECK (productivity BETWEEN 1 AND 3)`, `attendance INTEGER NOT NULL CHECK (attendance BETWEEN 1 AND 3)`, `quality INTEGER NOT NULL CHECK (quality BETWEEN 1 AND 3)`, `engagement INTEGER NOT NULL CHECK (engagement BETWEEN 1 AND 3)`
- **D-14:** `average NUMERIC GENERATED ALWAYS AS ((productivity + attendance + quality + engagement) / 4.0) STORED` — computed column, no application-layer calculation needed
- **D-15:** `notes TEXT`, `lead_id TEXT REFERENCES hr_employee(id)` (review lead/supervisor), `is_locked BOOLEAN NOT NULL DEFAULT false`
- **D-16:** Standard audit columns: `created_by`, `updated_by`, `created_at`, `updated_at`, `is_deleted`
- **D-17:** UNIQUE constraint on `(org_id, hr_employee_id, review_year, review_quarter)` — one review per employee per quarter
- **D-18:** Named FK constraints for `hr_employee_id` and `lead_id` (two FKs to same table — PostgREST disambiguation required per supabase/CLAUDE.md)
- **D-19:** Standard org-scoped RLS policies (read, insert, update) via `hr_employee` membership

### Employee Review Grid & Scoring UX
- **D-20:** Create SQL view `app_hr_employee_reviews` joining `hr_employee_review` with `hr_employee` for employee name/photo/department and resolving `lead_id` to lead name
- **D-21:** Grid columns: avatar + employee name, department, start date, quarter (e.g. "2026-Q1"), productivity, attendance, quality, engagement, average, notes (truncated), lead name, lock icon
- **D-22:** Score cells use `cellClassRules` color coding: 1=destructive/red, 2=warning/amber, 3=success/green — consistent with Phase 1 conditional styling pattern
- **D-23:** Average column formatted to 1 decimal place
- **D-24:** Year-Quarter filter via URL searchParams (`?year=2026&quarter=1`) triggering loader revalidation — similar to pay period filter pattern
- **D-25:** Locked reviews show lock icon in grid; create/edit form disables all fields when `is_locked = true` with visual indicator
- **D-26:** Create/edit review form (side panel): employee dropdown (FK hr_employee, required), year (number, required), quarter (select 1-4, required), productivity (select 1-3, required), attendance (select 1-3, required), quality (select 1-3, required), engagement (select 1-3, required), notes (textarea, optional), lead (FK hr_employee dropdown, optional), locked (checkbox)
- **D-27:** Row-click full-width detail row showing complete review details (all scores, notes, lead, dates, lock status) — richer view than the truncated grid row

### Claude's Discretion
- Detail row layout and styling within the full-width renderer
- Exact color shades for score 1-3 visualization (use DESIGN.md tokens)
- Loading skeleton design for detail row data fetch
- Whether to show empty state illustrations or simple text for zero housing sites / zero reviews
- Exact form field ordering and grouping in create/edit panels

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Housing schema
- `supabase/migrations/20260401000012_org_site.sql` — org_site table structure, housing-relevant columns (site_id_parent, category)
- `supabase/migrations/20260401000011_org_site_category.sql` — Category hierarchy (housing is a top-level category)
- `supabase/migrations/20260401000020_hr_employee.sql` — hr_employee.site_id FK to org_site for housing assignment (line 58, comment line 95)

### Existing configs
- `app/lib/crud/org-site.config.ts` — Current org_site CRUD config (warehouses slug); reference for housing config structure
- `app/lib/crud/hr-employee.config.ts` — Employee config with housing_site FK filter pattern (line 242: `fkFilter: { org_site_category_id: 'housing' }`)
- `app/lib/crud/registry.ts` — CRUD registry where housing and employee_review slugs need registration

### AG Grid patterns
- `app/components/ag-grid/ag-grid-list-view.tsx` — Standard AG Grid list view component (used by time-off Phase 3)
- `app/components/ag-grid/inline-detail-row.tsx` — Full-width detail row component
- `app/components/ag-grid/detail-row-wrapper.tsx` — Detail row wrapper with expand/collapse
- `app/components/ag-grid/cell-renderers/avatar-renderer.tsx` — Employee avatar cell renderer
- `app/components/ag-grid/cell-renderers/status-badge-renderer.tsx` — Status badge renderer
- `app/components/ag-grid/row-class-rules.ts` — Conditional row/cell styling rules
- `app/components/ag-grid/pay-period-filter.tsx` — Filter component pattern (reference for Year-Quarter filter)

### Database patterns
- `supabase/CLAUDE.md` — Table creation pattern, RLS policies, named FK constraints, soft delete conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AgGridListView` component: Standard AG Grid list view with toolbar, search, pagination — use for both housing and employee review grids
- `InlineDetailRow` + `DetailRowWrapper`: Full-width detail row expansion pattern — reuse for housing tenant list and review details
- `AvatarRenderer`: Employee photo + name cell renderer — use in both grids
- `StatusBadgeRenderer`: Status badge cell — could adapt for lock icon display
- `PayPeriodFilter`: Filter component with URL searchParams — pattern reference for Year-Quarter filter
- `CreatePanel` (Shadcn Sheet): Side-panel form pattern — use for both housing and review create/edit forms
- `hrEmployeeConfig.formFields` line 242: FK filter pattern `{ org_site_category_id: 'housing' }` — already filters org_site to housing in employee form
- `cellClassRules` in `row-class-rules.ts`: Conditional cell styling — extend for score color coding

### Established Patterns
- SQL view + AG Grid config + loader/action pattern: All Phase 2-5 submodules follow this
- Client-side detail row data loading via API route or useFetcher: Scheduler (Phase 2) and Hours Comparison (Phase 5)
- URL searchParams for filter state with loader revalidation: Pay period, status tabs, department filter
- CRUD registry mapping URL slug to config: All submodules registered in registry.ts

### Integration Points
- `app/lib/crud/registry.ts`: Add `housing` and `employee_review` entries
- `app/config/module-icons.config.ts`: Already has `housing: BedDouble` and `employee_review: UserCheck` icons registered
- `app/routes/workspace/`: Sub-module routing via `:subModule` param already handles dynamic grid rendering
- `supabase/migrations/`: New migration for hr_employee_review table and ALTER TABLE org_site for max_beds

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Phase follows established AG Grid submodule pattern from Phases 1-5.

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope.

</deferred>

---

*Phase: 06-housing-employee-review*
*Context gathered: 2026-04-08*
