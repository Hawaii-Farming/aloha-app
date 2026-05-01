---
quick_id: 260501-azo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - ../../../aloha-data-migrations/supabase/migrations/{NEW timestamp}_hr_payroll_rbac_helpers.sql
  - ../../../aloha-data-migrations/supabase/migrations/{NEW timestamp}_hr_payroll_rbac_views.sql
  - ../../../aloha-data-migrations/supabase/migrations/{NEW timestamp}_hr_payroll_nav_gate.sql
  - app/components/ag-grid/payroll-comparison-list-view.tsx
  - app/components/ag-grid/payroll-comp-manager-list-view.tsx
  - app/lib/crud/hr-payroll-data.config.tsx
autonomous: true
must_haves:
  truths:
    - "Owner / Admin viewing any payroll view sees all employee rows AND all dollar columns populated."
    - "Manager viewing any payroll view sees only rows where `compensation_manager_id = self_employee_id` (plus self) AND all dollar columns populated."
    - "Team Lead viewing any payroll view sees all employee rows but every dollar column returns NULL from the database (and is hidden in the AG Grid UI)."
    - "Employee viewing the workspace sidebar sees no `Payroll Comp` and no `Payroll Data` sub-modules; direct URL navigation to those sub-modules redirects via the existing `requireSubModuleAccess` gate."
    - "RLS / org isolation on the payroll views is preserved — gating layers ON TOP of the existing `org_id IN get_user_org_ids()` policy, never replaces it."
  artifacts:
    - path: "aloha-data-migrations/supabase/migrations/{NEW}_hr_payroll_rbac_helpers.sql"
      provides: "auth_employee_id(text) and auth_access_level(text) SQL helpers (SECURITY DEFINER, STABLE)"
      contains: "CREATE OR REPLACE FUNCTION public.auth_employee_id"
    - path: "aloha-data-migrations/supabase/migrations/{NEW}_hr_payroll_rbac_views.sql"
      provides: "Rewritten hr_payroll_employee_comparison + hr_payroll_task_comparison views with row scope + dollar masking"
      contains: "CREATE OR REPLACE VIEW public.hr_payroll_employee_comparison"
    - path: "aloha-data-migrations/supabase/migrations/{NEW}_hr_payroll_nav_gate.sql"
      provides: "Raise sys_access_level_id on org_sub_module rows for Payroll Comp / Payroll Data so Employee tier loses sidebar entries"
      contains: "UPDATE public.org_sub_module"
    - path: "app/components/ag-grid/payroll-comparison-list-view.tsx"
      provides: "Hide $ columns from byTaskColDefs / byEmployeeColDefs when access_level_id = 'Team Lead'"
      contains: "useRouteLoaderData('routes/workspace/layout')"
    - path: "app/components/ag-grid/payroll-comp-manager-list-view.tsx"
      provides: "Hide $ columns from colDefs when access_level_id = 'Team Lead'"
      contains: "useRouteLoaderData('routes/workspace/layout')"
    - path: "app/lib/crud/hr-payroll-data.config.tsx"
      provides: "Filter agGridColDefs to drop $ columns when access_level_id = 'Team Lead' (push the filter into the list view since the config is module-scope, see action)"
  key_links:
    - from: "hr_payroll_employee_comparison view"
      to: "auth_access_level(org_id) + auth_employee_id(org_id)"
      via: "WHERE clause + CASE expressions in SELECT list"
      pattern: "auth_access_level\\(.*org_id\\)"
    - from: "payroll-comparison-list-view.tsx / payroll-comp-manager-list-view.tsx"
      to: "workspace layout loader data (currentOrg.access_level_id)"
      via: "useRouteLoaderData('routes/workspace/layout')"
      pattern: "useRouteLoaderData\\(['\\\"]routes/workspace/layout"
    - from: "hr_rba_navigation"
      to: "org_sub_module.sys_access_level_id"
      via: "Layer-2 RBAC join (emp_al.level >= req_al.level)"
      pattern: "emp_al\\.level >= req_al\\.level"
---

<objective>
Gate the payroll views (`hr_payroll`, `hr_payroll_employee_comparison`, `hr_payroll_task_comparison`) and the workspace sidebar so each access level sees only what the locked visibility matrix allows. Two layers: (a) database — push helpers + redefine views so row scope and dollar-column masking happen server-side and survive bulk export / direct PostgREST calls; (b) frontend — drop dollar columns from the rendered grid for Team Lead so the UI matches the masked NULLs.

Visibility matrix (locked):
| access_level_id | Row scope | Columns |
|---|---|---|
| Owner, Admin | all employees | dollars + hours |
| Manager | self + direct reports (`compensation_manager_id = self employee id`) | dollars + hours |
| Team Lead | all employees | hours only (dollars NULL) |
| Employee | hidden from sidebar (no payroll access at all) | — |

Output:
- 3 NEW migration files in `../aloha-data-migrations/supabase/migrations/` (helpers, views, nav gate).
- 3 frontend file edits gating $ columns in the grids when `access_level_id === 'Team Lead'`.
</objective>

<execution_context>
- Repo: `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app` (this repo) and sibling `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-data-migrations` (schema repo — migrations live here, NOT in this repo).
- Hosted Supabase (no Docker). NEVER run `supabase db push`. Generate the migration files only; the human applies them.
- The `hr_payroll_task_comparison` view definition is NOT committed to `aloha-data-migrations/supabase/migrations/` (only `hr_payroll_employee_comparison` and `hr_payroll_by_task` are). It exists in the hosted DB and in `app/lib/database.types.ts`. Use the `aloha` MCP server's database tools (or `mcp__aloha__*` if available) to read the current view source via `pg_get_viewdef('public.hr_payroll_task_comparison'::regclass, true)` and copy that text as the starting point before adding the RBAC layer. If MCP is unavailable, ask the human to paste the current `\d+ hr_payroll_task_comparison` output before continuing.
- Migration filenames follow `YYYYMMDDHHMMSS_<snake_case>.sql` (Supabase CLI format). Pick three sequential unused timestamps after the last existing migration (`20260401000201_auth_auto_link_employee.sql`). Suggested: `20260501120000_hr_payroll_rbac_helpers.sql`, `20260501120100_hr_payroll_rbac_views.sql`, `20260501120200_hr_payroll_nav_gate.sql`.
- All payroll views use `WITH (security_invoker = true)` already — preserve that so RLS on `hr_payroll`/`hr_employee` still applies.
- `sys_access_level.id` values (text, exact case): `Owner`, `Admin`, `Manager`, `Team Lead`, `Employee` (whitespace and capitalization matter — the table is `id TEXT PRIMARY KEY` with proper-case values).
- `hr_employee` PK is `id` (text), with `user_id`, `org_id`, `sys_access_level_id`, `compensation_manager_id`, `is_deleted` columns. Confirmed in `app/lib/database.types.ts:3076-3112`.
- `hr_payroll.org_id` is `TEXT` (see migration 029 line 3) — the helper signatures must take `target_org TEXT`, not UUID.
- The "Payroll Data" sub-module reads the BASE `hr_payroll` table directly (config: `views.list = 'hr_payroll'`), NOT a view. Row-scope and column-mask therefore have to be applied via either (i) a NEW wrapping view + redirect the config, or (ii) a column-level GRANT change. We use option (i) below — simpler and keeps RLS local.
- `hr_payroll_comp_manager` is NOT a view — it's a sub-module slug whose backing list source is `hr_payroll_employee_comparison`. Gating that one view covers Comp Manager.
- `hr_rba_navigation` (migration 031) already implements Layer-2 RBAC: `emp_al.level >= req_al.level` where `req_al` comes from `org_sub_module.sys_access_level_id`. Bumping the required level on the relevant `org_sub_module` rows is sufficient — no view rewrite needed. The Employee tier is the lowest level, so any required level above Employee will hide it.
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

# Schema we are modifying / depending on (read these first)
@../aloha-data-migrations/supabase/migrations/20260401000002_sys_access_level.sql
@../aloha-data-migrations/supabase/migrations/20260401000024_hr_employee.sql
@../aloha-data-migrations/supabase/migrations/20260401000029_hr_payroll.sql
@../aloha-data-migrations/supabase/migrations/20260401000031_hr_rba_navigation.sql
@../aloha-data-migrations/supabase/migrations/20260401000072_hr_payroll_by_task.sql
@../aloha-data-migrations/supabase/migrations/20260401000073_hr_payroll_employee_comparison.sql
@../aloha-data-migrations/supabase/migrations/20260401000200_sys_rls_policies.sql

# App-side wiring
@app/lib/workspace/org-workspace-loader.server.ts
@app/lib/workspace/use-module-access.ts
@app/lib/crud/hr-payroll-data.config.tsx
@app/lib/crud/hr-payroll-comparison.config.ts
@app/lib/crud/hr-payroll-comp-manager.config.ts
@app/lib/crud/hr-payroll-hours.config.ts
@app/components/ag-grid/payroll-comparison-list-view.tsx
@app/components/ag-grid/payroll-comp-manager-list-view.tsx
@app/components/ag-grid/payroll-data-filter-bar.tsx
@app/components/ag-grid/payroll-hours-list-view.tsx
@app/routes/workspace/sub-module.tsx

<interfaces>
<!-- Key shapes the executor needs without re-reading the codebase. -->

OrgWorkspace.currentOrg (from app/lib/workspace/org-workspace-loader.server.ts:14-27):
```typescript
interface OrgWorkspace {
  currentOrg: {
    org_id: string;        // text, == accountSlug
    org_name: string;
    employee_id: string;   // hr_employee.id for the current user in this org
    access_level_id: string; // 'Owner' | 'Admin' | 'Manager' | 'Team Lead' | 'Employee'
  };
  // ...
}
```

Workspace layout loader returns (from app/routes/workspace/layout.tsx:21-38):
```typescript
{ workspace: OrgWorkspace, layoutState: ..., accountSlug: string }
```
Route id: `routes/workspace/layout` (used as the key in `useRouteLoaderData`).

Existing pattern for reading workspace data inside an inner component
(app/lib/workspace/use-module-access.ts:14-37):
```typescript
const data = useRouteLoaderData('routes/workspace/sub-module') as { moduleAccess?: ... } | undefined;
```
We use the same pattern but with key `'routes/workspace/layout'` and read `workspace.currentOrg.access_level_id`.

hr_employee shape (app/lib/database.types.ts:3076-3112) — text id, text org_id, text sys_access_level_id, text compensation_manager_id (nullable), boolean is_deleted.

hr_payroll columns relevant to "dollars vs hours" classification (migration 029):
  Hours (do NOT mask): regular_hours, overtime_hours, discretionary_overtime_hours,
                        holiday_hours, pto_hours, sick_hours, funeral_hours,
                        total_hours, pto_hours_accrued, overtime_threshold
  Dollars (MASK for Team Lead): hourly_rate, regular_pay, overtime_pay,
                        discretionary_overtime_pay, holiday_pay, pto_pay, sick_pay,
                        funeral_pay, other_pay, bonus_pay, auto_allowance, per_diem,
                        salary, gross_wage, fit, sit, social_security, medicare,
                        comp_plus, hds_dental, pre_tax_401k, auto_deduction,
                        child_support, program_fees, net_pay, labor_tax, other_tax,
                        workers_compensation, health_benefits, other_health_charges,
                        admin_fees, hawaii_get, other_charges, tdi, total_cost
  Identity / metadata (NEVER mask): id, org_id, hr_employee_id, payroll_id,
                        pay_period_start, pay_period_end, check_date, invoice_number,
                        payroll_processor, is_standard, employee_name, hr_department_id,
                        hr_work_authorization_id, wc, pay_structure, created_*, updated_*,
                        is_deleted

hr_payroll_employee_comparison output columns (migration 073, lines 46-71):
  Hours: scheduled_hours, total_hours, discretionary_overtime_hours, hours_delta
  Dollars to mask: total_cost, regular_pay, discretionary_overtime_pay,
                   total_cost_delta, regular_pay_delta, discretionary_overtime_pay_delta,
                   other_pay_delta
  Identity: org_id, hr_employee_id, compensation_manager_id, task, status,
            workers_compensation_code, check_date

hr_payroll_task_comparison output columns (from app/lib/database.types.ts:10305-10324
— FETCH THE FULL DEFINITION FROM THE LIVE DB FIRST):
  Hours: scheduled_hours, total_hours, discretionary_overtime_hours, hours_delta
  Dollars to mask: total_cost, regular_pay, discretionary_overtime_pay,
                   total_cost_delta, regular_pay_delta, discretionary_overtime_pay_delta,
                   other_pay_delta
  Identity: org_id, compensation_manager_id, task, status,
            workers_compensation_code, check_date
  (No hr_employee_id — this view is per-task, not per-employee. So Manager row-scope
  on this view filters on `compensation_manager_id = auth_employee_id(org_id)` only,
  no `hr_employee_id` column to compare.)

ColDef pattern for $ vs hours (payroll-comparison-list-view.tsx:114-130):
  numericCol(field, header, { currency: true })  -> uses CurrencyRenderer = $ column
  numericCol(field, header, { formatter: hoursFormatter })  -> hours column
  deltaCol(field, header, 'currency')  -> $ delta column
  deltaCol(field, header, 'hours')  -> hours delta column

ColDef pattern for $ in hr-payroll-data.config.tsx:26-31, 75-115:
  currency(field, header) helper -> $ column (uses CurrencyRenderer)
  hours(field, header) helper    -> hours column (uses hoursFormatter)
  Plain `{ field, headerName }`  -> identity / text column
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create three migration files (helpers + view rewrites + nav gate)</name>
  <files>
    ../aloha-data-migrations/supabase/migrations/{ts1}_hr_payroll_rbac_helpers.sql
    ../aloha-data-migrations/supabase/migrations/{ts2}_hr_payroll_rbac_views.sql
    ../aloha-data-migrations/supabase/migrations/{ts3}_hr_payroll_nav_gate.sql
  </files>
  <action>
    Pick three sequential unused timestamps AFTER `20260401000201` (the last existing migration). Recommended: `20260501120000`, `20260501120100`, `20260501120200`. Verify they don't already exist with `ls ../aloha-data-migrations/supabase/migrations/ | tail -5` first.

    --- File 1: `{ts1}_hr_payroll_rbac_helpers.sql` ---
    Create two SECURITY DEFINER STABLE SQL helpers, modeled on `get_user_org_ids()` (sys_rls_policies.sql:29-41):

    ```sql
    -- auth_employee_id(target_org)
    -- ===========================
    -- Returns the current user's hr_employee.id within the given org.
    -- SECURITY DEFINER + STABLE so RLS on hr_employee is bypassed safely
    -- and the planner can fold repeated calls in views.
    -- Returns NULL if the user has no employee record in the org.
    CREATE OR REPLACE FUNCTION public.auth_employee_id(target_org TEXT)
    RETURNS TEXT
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT id FROM public.hr_employee
      WHERE user_id = auth.uid()
        AND org_id = target_org
        AND is_deleted = false
      LIMIT 1;
    $$;

    GRANT EXECUTE ON FUNCTION public.auth_employee_id(TEXT) TO authenticated;

    -- auth_access_level(target_org)
    -- =============================
    -- Returns the current user's sys_access_level_id within the given org
    -- (one of 'Owner','Admin','Manager','Team Lead','Employee'). Same
    -- SECURITY DEFINER + STABLE rationale as above.
    CREATE OR REPLACE FUNCTION public.auth_access_level(target_org TEXT)
    RETURNS TEXT
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT sys_access_level_id FROM public.hr_employee
      WHERE user_id = auth.uid()
        AND org_id = target_org
        AND is_deleted = false
      LIMIT 1;
    $$;

    GRANT EXECUTE ON FUNCTION public.auth_access_level(TEXT) TO authenticated;
    ```

    --- File 2: `{ts2}_hr_payroll_rbac_views.sql` ---

    Step A: Read the current definition of `hr_payroll_task_comparison` from the hosted DB. Use the aloha MCP server (or any available db introspection tool) to run:
    ```sql
    SELECT pg_get_viewdef('public.hr_payroll_task_comparison'::regclass, true);
    ```
    Save that text — it's the baseline for the rewrite. If MCP is not reachable, STOP and ask the human to paste the output of `\d+ hr_payroll_task_comparison` and the view definition before continuing.

    Step B: Write THREE `CREATE OR REPLACE VIEW` statements in this file, in this exact order:

    1. `public.hr_payroll_employee_comparison` — copy the body from `20260401000073_hr_payroll_employee_comparison.sql` verbatim, then:
       - Append a top-level row-scope filter to the final `SELECT ... FROM current_p c FULL OUTER JOIN previous_p pr ...` by wrapping the whole final SELECT in a subquery and adding:
         ```sql
         WHERE
           public.auth_access_level(COALESCE(c.org_id, pr.org_id)) IN ('Owner','Admin','Team Lead')
           OR (
             public.auth_access_level(COALESCE(c.org_id, pr.org_id)) = 'Manager'
             AND (
               COALESCE(c.compensation_manager_id, pr.compensation_manager_id)
                 = public.auth_employee_id(COALESCE(c.org_id, pr.org_id))
               OR COALESCE(c.hr_employee_id, pr.hr_employee_id)
                 = public.auth_employee_id(COALESCE(c.org_id, pr.org_id))
             )
           );
         ```
         (Manager sees direct reports OR self.)
       - Wrap each $ output column with `CASE WHEN public.auth_access_level(<org_expr>) = 'Team Lead' THEN NULL ELSE <expr> END AS <name>`. The $ columns are listed in `<interfaces>` above (total_cost, regular_pay, discretionary_overtime_pay, total_cost_delta, regular_pay_delta, discretionary_overtime_pay_delta, other_pay_delta). The `<org_expr>` is `COALESCE(c.org_id, pr.org_id)` (matches the row-scope predicate).
       - Keep `WITH (security_invoker = true)`.
       - Re-issue the existing `GRANT SELECT ON ... TO authenticated;` and `COMMENT ON VIEW ...` at the bottom.

    2. `public.hr_payroll_task_comparison` — based on the hosted-fetched definition from Step A:
       - Add the same row-scope WHERE, but WITHOUT the `hr_employee_id` branch (this view has no `hr_employee_id` column). The Manager branch becomes:
         ```sql
         OR (
           public.auth_access_level(<org_expr>) = 'Manager'
           AND <comp_mgr_expr> = public.auth_employee_id(<org_expr>)
         )
         ```
         where `<comp_mgr_expr>` is the view's `compensation_manager_id` source column (resolve from the introspected definition; likely `COALESCE(c.compensation_manager_id, pr.compensation_manager_id)` mirroring the employee_comparison view).
       - Mask the same set of $ columns listed in `<interfaces>` (total_cost, regular_pay, discretionary_overtime_pay, total_cost_delta, regular_pay_delta, discretionary_overtime_pay_delta, other_pay_delta).
       - Preserve `WITH (security_invoker = true)` and re-grant `SELECT TO authenticated`.

    3. `public.hr_payroll_data_secure` (NEW view) — wrapping `hr_payroll`:
       ```sql
       CREATE OR REPLACE VIEW public.hr_payroll_data_secure
       WITH (security_invoker = true) AS
       SELECT
         id, org_id, hr_employee_id, payroll_id,
         pay_period_start, pay_period_end, check_date, invoice_number,
         payroll_processor, is_standard,
         employee_name, hr_department_id, hr_work_authorization_id, wc, pay_structure,
         overtime_threshold,
         -- Hours (always visible)
         regular_hours, overtime_hours, discretionary_overtime_hours,
         holiday_hours, pto_hours, sick_hours, funeral_hours,
         total_hours, pto_hours_accrued,
         -- Dollars (NULL for Team Lead)
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE hourly_rate END AS hourly_rate,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE regular_pay END AS regular_pay,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE overtime_pay END AS overtime_pay,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE discretionary_overtime_pay END AS discretionary_overtime_pay,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE holiday_pay END AS holiday_pay,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE pto_pay END AS pto_pay,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE sick_pay END AS sick_pay,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE funeral_pay END AS funeral_pay,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE other_pay END AS other_pay,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE bonus_pay END AS bonus_pay,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE auto_allowance END AS auto_allowance,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE per_diem END AS per_diem,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE salary END AS salary,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE gross_wage END AS gross_wage,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE fit END AS fit,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE sit END AS sit,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE social_security END AS social_security,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE medicare END AS medicare,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE comp_plus END AS comp_plus,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE hds_dental END AS hds_dental,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE pre_tax_401k END AS pre_tax_401k,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE auto_deduction END AS auto_deduction,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE child_support END AS child_support,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE program_fees END AS program_fees,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE net_pay END AS net_pay,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE labor_tax END AS labor_tax,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE other_tax END AS other_tax,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE workers_compensation END AS workers_compensation,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE health_benefits END AS health_benefits,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE other_health_charges END AS other_health_charges,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE admin_fees END AS admin_fees,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE hawaii_get END AS hawaii_get,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE other_charges END AS other_charges,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE tdi END AS tdi,
         CASE WHEN public.auth_access_level(org_id) = 'Team Lead' THEN NULL ELSE total_cost END AS total_cost,
         created_at, created_by, updated_at, updated_by, is_deleted
       FROM public.hr_payroll
       WHERE
         is_deleted = false
         AND (
           public.auth_access_level(org_id) IN ('Owner','Admin','Team Lead')
           OR (
             public.auth_access_level(org_id) = 'Manager'
             AND (
               hr_employee_id = public.auth_employee_id(org_id)
               OR EXISTS (
                 SELECT 1 FROM public.hr_employee e
                 WHERE e.id = hr_payroll.hr_employee_id
                   AND e.compensation_manager_id = public.auth_employee_id(org_id)
               )
             )
           )
         );

       GRANT SELECT ON public.hr_payroll_data_secure TO authenticated;

       COMMENT ON VIEW public.hr_payroll_data_secure IS
         'RBAC-gated wrapper over hr_payroll: row scope per access level, dollar columns NULL for Team Lead. Frontend reads this view (not the base table) for the Payroll Data sub-module.';
       ```

    --- File 3: `{ts3}_hr_payroll_nav_gate.sql` ---
    Bump `org_sub_module.sys_access_level_id` to `Team Lead` (the lowest level above Employee that should still see Payroll) for any rows whose `sys_sub_module_id` matches the payroll sub-modules — so the existing `emp_al.level >= req_al.level` predicate in `hr_rba_navigation` excludes Employees:

    ```sql
    -- Raise the required access level for Payroll sub-modules so the
    -- Employee tier (lowest level) is filtered out by hr_rba_navigation's
    -- Layer-2 RBAC predicate (emp_al.level >= req_al.level). Owner/Admin/
    -- Manager/Team Lead all retain access; Employee loses the sidebar entry.
    UPDATE public.org_sub_module
       SET sys_access_level_id = 'Team Lead'
     WHERE sys_sub_module_id IN ('Payroll Comp', 'Payroll Data', 'Payroll Comp Manager', 'Hours Comp');
    ```
    NOTE: Verify the actual sys_sub_module_id values via the aloha MCP database tool BEFORE writing the IN-list. The sub-module slugs used in the app routing are `Payroll Comp`, `Payroll Data`, `Payroll Comp Manager`, `Hours Comp` (from `app/routes/workspace/sub-module.tsx:69-72,116-202`), but the `sys_sub_module.id` PK strings might differ (e.g. capitalization, spaces). Run:
    ```sql
    SELECT id FROM public.sys_sub_module WHERE id ILIKE '%payroll%' OR id ILIKE '%hours comp%';
    ```
    and use the EXACT returned ids in the UPDATE. If any id doesn't match, ask the human before guessing.

    DO NOT run `pnpm supabase db diff` or `supabase db push`. The migration files ARE the deliverable. Per CLAUDE.md and `aloha-data-migrations/supabase/migrations/README.md`, only the human applies them.
  </action>
  <verify>
    <automated>ls -1 /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-data-migrations/supabase/migrations/ | grep -E "hr_payroll_rbac_(helpers|views)|hr_payroll_nav_gate" | wc -l | grep -q '^[[:space:]]*3$' &amp;&amp; grep -c "auth_access_level\|auth_employee_id" /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-data-migrations/supabase/migrations/*hr_payroll_rbac_views.sql | grep -v ':0$' &amp;&amp; grep -q "Team Lead" /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-data-migrations/supabase/migrations/*hr_payroll_nav_gate.sql</automated>
  </verify>
  <done>
    Three new migration files exist in `aloha-data-migrations/supabase/migrations/`:
    1. helpers file defines `auth_employee_id(TEXT)` and `auth_access_level(TEXT)` with `SECURITY DEFINER STABLE` and grants EXECUTE to authenticated.
    2. views file redefines `hr_payroll_employee_comparison` and `hr_payroll_task_comparison` with row-scope WHERE + per-column Team-Lead masking, AND defines the new `hr_payroll_data_secure` wrapping view, all `WITH (security_invoker = true)` and granted to authenticated.
    3. nav-gate file raises the required `sys_access_level_id` on the four Payroll/Hours sub-module rows to `Team Lead`.
    No `supabase db push` was run. The user is the one to apply these.
  </done>
</task>

<task type="auto">
  <name>Task 2: Frontend column gating for Team Lead + repoint Payroll Data to the secure view</name>
  <files>
    app/components/ag-grid/payroll-comparison-list-view.tsx
    app/components/ag-grid/payroll-comp-manager-list-view.tsx
    app/lib/crud/hr-payroll-data.config.tsx
  </files>
  <action>
    Three edits — keep them tight, no refactors.

    **2a. `app/components/ag-grid/payroll-comparison-list-view.tsx`**

    At the top, add an import alongside the other react-router imports:
    ```typescript
    import { useRouteLoaderData, useSearchParams } from 'react-router';
    ```

    Inside `PayrollComparisonListView` (after the existing `useSearchParams` line near line 204), grab the access level via the workspace layout loader (mirroring the `use-module-access.ts:14-17` pattern):
    ```typescript
    const layoutData = useRouteLoaderData('routes/workspace/layout') as
      | { workspace?: { currentOrg?: { access_level_id?: string } } }
      | undefined;
    const isTeamLead =
      layoutData?.workspace?.currentOrg?.access_level_id === 'Team Lead';
    ```

    Find the existing line `const colDefs = isByEmployee ? byEmployeeColDefs : byTaskColDefs;` (around line 219) and replace it with a filter:
    ```typescript
    // Team Lead sees hours only — DB already NULLs $ columns; this hides
    // the empty columns from the grid for a clean UI. Owner/Admin/Manager
    // see everything.
    const $FIELDS = new Set([
      'regular_pay',
      'total_cost',
      'regular_pay_delta',
      'discretionary_overtime_pay_delta',
      'total_cost_delta',
    ]);
    const baseColDefs = isByEmployee ? byEmployeeColDefs : byTaskColDefs;
    const colDefs = isTeamLead
      ? baseColDefs.filter((c) => !c.field || !$FIELDS.has(c.field))
      : baseColDefs;
    ```

    Update `numericFields` in the `totalsRow` useMemo to drop the same $ fields when Team Lead (so the TOTAL row doesn't try to sum NULLs and show 0 in a hidden column header — easiest is to just leave it; the columns aren't rendered so the sums aren't visible. So no edit needed in `numericFields`).

    **2b. `app/components/ag-grid/payroll-comp-manager-list-view.tsx`**

    Add `useRouteLoaderData` to the existing react-router import:
    ```typescript
    import {
      useLoaderData,
      useNavigate,
      useParams,
      useRouteLoaderData,
      useSearchParams,
    } from 'react-router';
    ```

    Inside `PayrollCompManagerListView` (after the existing `useLoaderData` near line 196), add:
    ```typescript
    const layoutData = useRouteLoaderData('routes/workspace/layout') as
      | { workspace?: { currentOrg?: { access_level_id?: string } } }
      | undefined;
    const isTeamLead =
      layoutData?.workspace?.currentOrg?.access_level_id === 'Team Lead';
    ```

    The `colDefs` array is module-scope (line 83). Build a filtered variant inside the component before the AgGridWrapper render:
    ```typescript
    const $FIELDS = new Set([
      'regular_pay',
      'regular_pay_delta',
      'total_cost',
      'total_cost_delta',
    ]);
    const visibleColDefs = isTeamLead
      ? colDefs.filter((c) => !c.field || !$FIELDS.has(c.field))
      : colDefs;
    ```
    Then in the JSX change `colDefs={colDefs}` to `colDefs={visibleColDefs}`.

    **2c. `app/lib/crud/hr-payroll-data.config.tsx`**

    Two edits:
    1. Repoint the list source from the base table to the new secure view. Change:
       ```typescript
       views: {
         list: 'hr_payroll',
         detail: 'hr_payroll',
       },
       ```
       to:
       ```typescript
       views: {
         list: 'hr_payroll_data_secure',
         detail: 'hr_payroll',
       },
       ```
       (Detail still points to the base `hr_payroll` — detail rows aren't currently rendered for this sub-module since `noDetailRow: true`, so this is moot but kept for contract correctness.)

    2. Because `hr_payroll_data_secure` does NOT exist in `app/lib/database.types.ts` yet (types are regenerated by the human via `npx supabase gen types --lang typescript --linked`), the `queryUntypedView()` helper used by the loader (already used for views not in types — see `app/routes/workspace/sub-module.tsx:111-113`) handles the runtime query fine. Add a one-line note above the `views` block:
       ```typescript
       // hr_payroll_data_secure is a SECURITY-DEFINER-helper-gated wrapper
       // over hr_payroll: row scope per access_level, $ columns NULL for
       // Team Lead. Defined in aloha-data-migrations migration
       // {ts2}_hr_payroll_rbac_views.sql. Not yet in database.types — the
       // sub-module loader uses queryUntypedView so this is fine.
       ```

    For the column-hide UI when Team Lead: `hr-payroll-data.config.tsx` exports a static `agGridColDefs` consumed by the generic `ag-grid-list-view.tsx`. The cleanest place to filter is in the list-view component, but to keep this quick task atomic, filter at the config consumer. Search for where `agGridColDefs` is consumed:
    ```bash
    grep -rn "agGridColDefs\|config\.agGridColDefs" app/components/ag-grid/ag-grid-list-view.tsx app/components/crud/ 2>/dev/null | head -10
    ```
    Open that consumer (likely `app/components/ag-grid/ag-grid-list-view.tsx`), add the same `useRouteLoaderData('routes/workspace/layout')` lookup near the top of the component, and filter `agGridColDefs` to drop $ fields when Team Lead. The full $ field list to hide for Payroll Data (matches the `currency(...)` calls in the config, lines 55, 83-115):
    ```typescript
    const PAYROLL_DOLLAR_FIELDS = new Set([
      'hourly_rate', 'regular_pay', 'overtime_pay', 'holiday_pay', 'pto_pay',
      'sick_pay', 'funeral_pay', 'other_pay', 'bonus_pay', 'auto_allowance',
      'per_diem', 'salary', 'gross_wage', 'fit', 'sit', 'social_security',
      'medicare', 'comp_plus', 'hds_dental', 'pre_tax_401k', 'auto_deduction',
      'child_support', 'program_fees', 'net_pay', 'labor_tax', 'other_tax',
      'workers_compensation', 'health_benefits', 'other_health_charges',
      'admin_fees', 'hawaii_get', 'other_charges', 'tdi', 'total_cost',
    ]);
    ```
    Gate it on `subModuleSlug === 'Payroll Data' && isTeamLead` so it only fires for the Payroll Data sub-module (not all consumers of `ag-grid-list-view`). Read the surrounding props in the list-view component to find `subModuleSlug` (it's on `ListViewProps` or available via `useParams`).

    Run typecheck:
    ```bash
    pnpm typecheck
    ```
    Fix any type errors before declaring done. Run `pnpm lint:fix` and `pnpm format:fix` as per CLAUDE.md.

    Note on `payroll-hours-list-view.tsx` and `payroll-data-filter-bar.tsx`: per the spec, payroll-hours is already hours-only (verified: no CurrencyRenderer / no $ field references). The filter bar has no $ columns. No changes needed there.
  </action>
  <verify>
    <automated>pnpm typecheck 2>&amp;1 | tail -5 &amp;&amp; grep -c "useRouteLoaderData" app/components/ag-grid/payroll-comparison-list-view.tsx app/components/ag-grid/payroll-comp-manager-list-view.tsx | grep -v ':0$' &amp;&amp; grep -q "hr_payroll_data_secure" app/lib/crud/hr-payroll-data.config.tsx</automated>
  </verify>
  <done>
    - `payroll-comparison-list-view.tsx` and `payroll-comp-manager-list-view.tsx` read `access_level_id` from the workspace layout loader and filter $ ColDefs out when value is `'Team Lead'`.
    - `hr-payroll-data.config.tsx` lists `hr_payroll_data_secure` as `views.list`.
    - The `agGridColDefs` consumer for Payroll Data filters $ fields when current user is Team Lead.
    - `pnpm typecheck` passes (no new errors introduced).
    - `pnpm lint:fix` and `pnpm format:fix` ran clean.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    DB-side RBAC migrations for payroll views (helpers, view rewrites, nav gate) + frontend $-column hiding for Team Lead.
  </what-built>
  <how-to-verify>
    1. Review the three new SQL migration files in `../aloha-data-migrations/supabase/migrations/`. Confirm filenames, timestamps, and that no existing migration was edited.
    2. Apply the migrations to the hosted DB:
       ```bash
       cd ../aloha-data-migrations &amp;&amp; supabase db push
       ```
       (Reminder: only YOU run this — Claude does not.)
    3. Regenerate the app's database types so `hr_payroll_data_secure` shows up:
       ```bash
       cd ../../aloha-app &amp;&amp; npx supabase gen types --lang typescript --linked > app/lib/database.types.ts
       ```
    4. Spin up the app: `pnpm dev`.
    5. Sign in as one user per access level (Owner, Admin, Manager, Team Lead, Employee) and visit `/home/&lt;org&gt;/human_resources/Payroll Comp` and `/home/&lt;org&gt;/human_resources/Payroll Data`. Verify the matrix:
       - Owner/Admin: all rows, all $ columns populated.
       - Manager: only direct-report rows + self, all $ columns populated.
       - Team Lead: all rows, $ columns absent from the grid (and NULL if you check the network response).
       - Employee: no `Payroll Comp` / `Payroll Data` entries in the sidebar; direct URL navigation hits `/no-access`.
    6. Sanity check on cross-org isolation: confirm switching orgs still scopes payroll rows correctly (RLS should still hold via `security_invoker = true`).
    7. If anything looks wrong, describe the failure and the access-level user; otherwise type "approved".
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
  - [ ] Three SQL migration files exist with correct timestamps after `20260401000201`.
  - [ ] Helper functions `auth_employee_id(text)` and `auth_access_level(text)` are SECURITY DEFINER + STABLE and granted EXECUTE to `authenticated`.
  - [ ] `hr_payroll_employee_comparison`, `hr_payroll_task_comparison`, and `hr_payroll_data_secure` views all carry `WITH (security_invoker = true)`, the row-scope WHERE that branches on `auth_access_level(org_id)`, and the per-$-column `CASE WHEN auth_access_level(...) = 'Team Lead' THEN NULL` mask.
  - [ ] `hr_payroll_data.config.tsx` lists `hr_payroll_data_secure` as `views.list`.
  - [ ] `payroll-comparison-list-view.tsx` and `payroll-comp-manager-list-view.tsx` filter $ ColDefs when `access_level_id === 'Team Lead'`.
  - [ ] `pnpm typecheck` passes.
  - [ ] `pnpm lint:fix` + `pnpm format:fix` ran clean.
  - [ ] Human ran `supabase db push` (not Claude) and verified the visibility matrix in dev.
</verification>

<success_criteria>
  - The five-row visibility matrix above holds for Owner / Admin / Manager / Team Lead / Employee on `Payroll Comp` and `Payroll Data` (and `Payroll Comp Manager` / `Hours Comp` if those sub-modules are exposed).
  - Sidebar entries for `Payroll Comp` and `Payroll Data` disappear for Employee tier.
  - All gating is enforced at the database layer; the frontend $ hide is cosmetic only (DB already NULLs).
  - Existing org RLS isolation continues to hold (multi-tenant correctness preserved).
</success_criteria>

<output>
  After completion, create `.planning/quick/260501-azo-payroll-rbac-gate-hr-payroll-views-by-sy/260501-azo-SUMMARY.md` with: filenames of the three migrations + their picked timestamps, list of $ columns masked per view, list of `org_sub_module` rows updated by the nav-gate migration, and the file diffs in the three frontend files.
</output>
