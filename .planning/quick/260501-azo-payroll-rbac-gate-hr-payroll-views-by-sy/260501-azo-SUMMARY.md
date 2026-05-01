---
quick_id: 260501-azo
plan: 01
type: execute
wave: 1
status: awaiting-human-verify
completed_date: 2026-05-01
files_created:
  - ../../../aloha-data-migrations/supabase/migrations/20260501120000_hr_payroll_rbac_helpers.sql
  - ../../../aloha-data-migrations/supabase/migrations/20260501120100_hr_payroll_rbac_views.sql
  - ../../../aloha-data-migrations/supabase/migrations/20260501120200_hr_payroll_nav_gate.sql
files_modified:
  - app/components/ag-grid/payroll-comparison-list-view.tsx
  - app/components/ag-grid/payroll-comp-manager-list-view.tsx
  - app/components/ag-grid/ag-grid-list-view.tsx
  - app/lib/crud/hr-payroll-data.config.tsx
commits:
  - 4eb7ef2 feat(quick-260501-azo): payroll RBAC frontend $ column gating for Team Lead
uncommitted_for_human_review:
  - aloha-data-migrations/supabase/migrations/20260501120000_hr_payroll_rbac_helpers.sql
  - aloha-data-migrations/supabase/migrations/20260501120100_hr_payroll_rbac_views.sql
  - aloha-data-migrations/supabase/migrations/20260501120200_hr_payroll_nav_gate.sql
---

# Quick Task 260501-azo: Payroll RBAC Gate (Helpers + Views + Nav Gate + Frontend Hide) — Summary

One-liner: Server-side RBAC for `hr_payroll` views — two SECURITY DEFINER STABLE helpers (`auth_employee_id`, `auth_access_level`), three view rewrites with row-scope WHERE + per-$-column NULL mask for Team Lead, an `org_sub_module` nav-gate UPDATE that hides four payroll/hours sub-modules from the Employee tier, and a cosmetic frontend filter that drops the now-empty $ columns from the rendered AG Grids when the current user is Team Lead.

## What Shipped

### DB-side (3 migration files in sibling repo, NOT committed — left for human review)

| Timestamp | Filename | Purpose |
|---|---|---|
| 20260501120000 | `_hr_payroll_rbac_helpers.sql` | `auth_employee_id(TEXT)` + `auth_access_level(TEXT)` — both `SECURITY DEFINER STABLE`, `SET search_path = public`, granted `EXECUTE TO authenticated`. |
| 20260501120100 | `_hr_payroll_rbac_views.sql` | Rewrites `hr_payroll_employee_comparison`, rewrites `hr_payroll_task_comparison`, defines new `hr_payroll_data_secure`. All `WITH (security_invoker = true)`, all granted `SELECT TO authenticated`. |
| 20260501120200 | `_hr_payroll_nav_gate.sql` | `UPDATE org_sub_module SET sys_access_level_id = 'Team Lead' WHERE sys_sub_module_id IN ('Hours Comp','Payroll Comp','Payroll Comp Manager','Payroll Data')` |

### $ columns masked per view (NULL when `auth_access_level(org_id) = 'Team Lead'`)

`hr_payroll_employee_comparison` and `hr_payroll_task_comparison` (same set):
- `total_cost`
- `regular_pay`
- `discretionary_overtime_pay`
- `total_cost_delta`
- `regular_pay_delta`
- `discretionary_overtime_pay_delta`
- `other_pay_delta`

`hr_payroll_data_secure` (35 columns from `hr_payroll`):
`hourly_rate, regular_pay, overtime_pay, discretionary_overtime_pay, holiday_pay, pto_pay, sick_pay, funeral_pay, other_pay, bonus_pay, auto_allowance, per_diem, salary, gross_wage, fit, sit, social_security, medicare, comp_plus, hds_dental, pre_tax_401k, auto_deduction, child_support, program_fees, net_pay, labor_tax, other_tax, workers_compensation, health_benefits, other_health_charges, admin_fees, hawaii_get, other_charges, tdi, total_cost`.

### Row-scope predicates added

Common pattern wrapped on top of the existing `org_id IN get_user_org_ids()` RLS:
- Owner / Admin / Team Lead → see all org rows
- Manager:
  - `hr_payroll_employee_comparison`: `compensation_manager_id = auth_employee_id(org)` OR `hr_employee_id = auth_employee_id(org)` (direct reports + self)
  - `hr_payroll_task_comparison`: `compensation_manager_id = auth_employee_id(org)` only (no `hr_employee_id` column on this view)
  - `hr_payroll_data_secure`: `hr_employee_id = auth_employee_id(org)` OR `EXISTS (SELECT 1 FROM hr_employee e WHERE e.id = hr_payroll.hr_employee_id AND e.compensation_manager_id = auth_employee_id(org))`
- Employee → matches no branch → empty result set on direct PostgREST

### Nav-gate (`org_sub_module` rows raised to `Team Lead` requirement)

| sys_sub_module_id | Old level | New level |
|---|---|---|
| `Hours Comp` | (was Employee) | `Team Lead` |
| `Payroll Comp` | (was Employee) | `Team Lead` |
| `Payroll Comp Manager` | (was Employee) | `Team Lead` |
| `Payroll Data` | (was Employee) | `Team Lead` |

The Layer-2 RBAC predicate `emp_al.level >= req_al.level` in `hr_rba_navigation` filters out rows where the employee's tier is below `Team Lead` (i.e. only `Employee` is excluded; `Owner`/`Admin`/`Manager`/`Team Lead` retain the entries).

### Frontend (committed in `aloha-app`, commit `4eb7ef2`)

| File | Change |
|---|---|
| `app/components/ag-grid/payroll-comparison-list-view.tsx` | Added `useRouteLoaderData('routes/workspace/layout')` lookup; filters `byTaskColDefs` / `byEmployeeColDefs` to drop `regular_pay, total_cost, regular_pay_delta, discretionary_overtime_pay_delta, total_cost_delta` when `access_level_id === 'Team Lead'`. |
| `app/components/ag-grid/payroll-comp-manager-list-view.tsx` | Added the same workspace lookup; introduces `visibleColDefs` filtered to drop `regular_pay, regular_pay_delta, total_cost, total_cost_delta` for Team Lead; `<AgGridWrapper>` consumes `visibleColDefs`. |
| `app/components/ag-grid/ag-grid-list-view.tsx` | Added module-scope `PAYROLL_DOLLAR_FIELDS` Set (35 fields). When `subModuleSlug === 'Payroll Data' && isTeamLead`, the `dataColDefs` useMemo filters those fields out. Other sub-modules using this list view are untouched. |
| `app/lib/crud/hr-payroll-data.config.tsx` | `views.list: 'hr_payroll' → 'hr_payroll_data_secure'`. `views.detail` left as `hr_payroll` (sub-module sets `noDetailRow: true` so detail isn't rendered). Added 5-line note above the views block referencing the migration. |

## Verification (automated)

- `pnpm typecheck` → clean (one type-narrow needed in `ag-grid-list-view.tsx` because `colDefs` array is `(ColDef | ColGroupDef)[]`; switched to `'field' in c ? c.field : undefined`).
- `pnpm lint:fix` → 4 pre-existing warnings in `packages/ui/src/shadcn/data-table.tsx` (TanStack Table `useReactTable` flagged by react-hooks/incompatible-library). Unrelated to this task.
- `pnpm format:fix` → cache hit (no diffs).
- All three migration filenames present, all four `useRouteLoaderData` references present in the right files, `hr_payroll_data_secure` referenced in the config.

## Deviations from Plan

None. Auto-fix #1 was a single 3-line type-narrow in `ag-grid-list-view.tsx` (covered as Rule 1 / TS error during typecheck) — the plan's filter snippet `(c) => !c.field || ...` typechecks fine for `ColDef[]` (used in the two payroll list views), but the generic list view's `agGridColDefs` is the wider `(ColDef | ColGroupDef)[]`. Switched to `'field' in c` guard. No behavior change vs the spec.

## Authentication Gates

None.

## Self-Check: PASSED

Files:
- FOUND: `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-data-migrations/supabase/migrations/20260501120000_hr_payroll_rbac_helpers.sql`
- FOUND: `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-data-migrations/supabase/migrations/20260501120100_hr_payroll_rbac_views.sql`
- FOUND: `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-data-migrations/supabase/migrations/20260501120200_hr_payroll_nav_gate.sql`
- FOUND: `app/components/ag-grid/payroll-comparison-list-view.tsx` (modified)
- FOUND: `app/components/ag-grid/payroll-comp-manager-list-view.tsx` (modified)
- FOUND: `app/components/ag-grid/ag-grid-list-view.tsx` (modified)
- FOUND: `app/lib/crud/hr-payroll-data.config.tsx` (modified)

Commits:
- FOUND: `4eb7ef2` (frontend RBAC commit on `dev-jean`)

Next: human applies the three migrations, regenerates `database.types`, verifies the visibility matrix per Task 3 checkpoint instructions in PLAN.md.
