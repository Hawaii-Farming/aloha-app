---
slug: ui-schema-alignment-audit
status: root_cause_found
trigger: |
  DATA_START
  Database schema recently modified. Database is single source of truth.
  UI must align with updated schema. Audit for inconsistencies/missing
  mappings in: Time Off, Payroll (section data + per employee),
  Employee Review (blank/incomplete states). Identify discrepancies between
  UI and DB (including views), determine root causes, propose fixes.
  DATA_END
created: 2026-04-30
updated: 2026-04-30
---

# Debug Session: UI ↔ Database Schema Alignment Audit

## Symptoms

- **Expected:** UI fully aligned with current hosted DB schema. Time Off, Payroll, and Employee Review render real data, no blanks, no broken column mappings.
- **Actual:** Suspected inconsistencies. Employee Review shows blank/incomplete states. Payroll (section + per-employee) and Time Off may have missing or stale mappings.
- **Errors:** Not yet captured — investigation needs to enumerate.
- **Timeline:** Triggered by recent schema modifications (commits `3f7a0f5`, `ca2d48c`, `bbfce0a`, `5dfb5f5`, `e2c1c1c`).
- **Reproduction:** Navigate to Time Off, Payroll (Data / Comp / Comp Manager / Hours Comp), and Employee Review.

## Scope

- Time Off module (list + detail)
- Payroll module — Payroll Data, Payroll Comparison, Payroll Comp Manager, Hours Comp
- Employee Review module
- Cross-cut: SQL views referenced by these modules vs. actual hosted schema

## Current Focus

```yaml
hypothesis: |
  The custom-view loader path in app/routes/workspace/sub-module.tsx does
  NOT call flattenRow on rows. Configs that rely on postgrest embed
  flattening (subject:hr_employee(...) -> subject_*) only work for
  modules that go through loadTableData (the regular path). Custom-view
  modules (Employee Review, Payroll Data/Comp/Comp Manager/Hours Comp)
  return nested rows but their list-view components and column configs
  expect flat keys (full_name, department_name, payroll_hours, etc.) —
  some of which don't exist on the underlying view at all.
test: |
  Compared each module's config select / column keys against the actual
  view/table columns in app/lib/database.types.ts and against the loader
  branch in sub-module.tsx (custom vs. regular).
expecting: |
  Configs/components reference fields that either are not produced by
  the loader (because flatten is skipped) or do not exist on the view.
next_action: |
  Present root-cause + targeted fix plan per module to user. Awaiting
  decision on fix path.
reasoning_checkpoint: null
tdd_checkpoint: null
```

## Evidence

- timestamp: 2026-04-30 — `app/lib/crud/registry.ts:30-53` — Sub-module slug→config registry. Confirms the entries we audit: `'Time Off' → hrTimeOffConfig`, `'Payroll Comp' / 'Payroll Comparison' → hrPayrollComparisonConfig`, `'Payroll Comp Manager' → hrPayrollCompManagerConfig`, `'Payroll Data' → hrPayrollDataConfig`, `'Hours Comp' → hrPayrollHoursConfig`, `'Employee Review' → hrEmployeeReviewConfig`.

- timestamp: 2026-04-30 — `app/lib/crud/crud-helpers.server.ts:7-26,170-172` — `flattenRow()` defined here. Called only from `loadTableData()` (line 172) and `loadDetailData()` (line 219). Logic: nested objects under any key `K` become `K_<nestedKey>` (e.g. `subject.preferred_name → subject_preferred_name`).

- timestamp: 2026-04-30 — `app/routes/workspace/sub-module.tsx:64-273` — Custom-loader branch (when `config.viewType.list === 'custom'`). It calls `queryUntypedView(client, viewName).select(config?.select ?? '*')` then `castRows(data)` and returns rows as-is. **It does NOT call `flattenRow`.** This is the path Employee Review, Payroll Data, Payroll Comparison, Payroll Comp Manager, Hours Comp, Scheduler, and Housing all use.

- timestamp: 2026-04-30 — `app/routes/workspace/sub-module.tsx:276-291` — Regular loader path runs `loadTableData(...)` which DOES flatten (because `select` is provided). Time Off uses this path (its `viewType.list = 'agGrid'`).

### Per-module findings

#### Time Off (`hr-time-off.config.ts`)

- Backing table: `hr_time_off_request` (table; columns confirmed in `database.types.ts:3602`).
- Loader path: REGULAR (`viewType: { list: 'agGrid' }`). `flattenRow` runs.
- `select` embeds `subject:hr_employee!hr_employee_id(...)`, `requester:hr_employee!requested_by(...)`, `reviewer:hr_employee!reviewed_by(...)`. All FK columns and target columns exist. ✓
- Column keys reference flattened embeds: `subject_preferred_name`, `subject_compensation_manager_id`, `requester_preferred_name`, `reviewer_preferred_name`. After flatten these resolve. ✓
- **Issue 1 — broken search:** `search.columns: ['full_name', 'request_reason', 'notes']`. `hr_time_off_request` has `request_reason` and `notes` but NO `full_name` column. The search query is built as PostgREST `.or('full_name.ilike.%x%, request_reason.ilike.%x%, notes.ilike.%x%')` — this fires only on user search input. When typed, the request will fail with a 400 from PostgREST.
- **Issue 2 — partial display in detail row:** `time-off-detail-row.tsx:81-85` renders `subject_hr_department_id` / `subject_hr_work_authorization_id` / `subject_compensation_manager_id` directly — these are UUIDs, not names. To display labels, the embed should also pull the name columns from `hr_department`, `hr_work_authorization`, and a compensation_manager preferred_name.

#### Employee Review (`hr-employee-review.config.ts`) — **BLANK / INCOMPLETE STATE ROOT CAUSE**

- Backing table: `hr_employee_review` (table; columns confirmed in `database.types.ts:3151`).
- Loader path: CUSTOM (`viewType: { list: 'custom' }`). `flattenRow` is NOT called.
- `select` is `'*, subject:hr_employee!hr_employee_id(preferred_name, profile_photo_url, hr_department_id, start_date), lead:hr_employee!lead_id(preferred_name)'`.
- Result rows therefore have nested objects: `row.subject = { preferred_name, profile_photo_url, hr_department_id, start_date }` and `row.lead = { preferred_name }`. Top-level `full_name`, `department_name`, `quarter_label`, `lead_name` do NOT exist.
- **Issue 1 — list view fields wrong:** `employee-review-list-view.tsx:39-110` declares `field: 'full_name'`, `field: 'department_name'`, `field: 'quarter_label'`, `field: 'lead_name'`. None of these are produced by the loader. Result: each row's "Employee", "Dept", "Quarter", "Lead" cells are empty → blank/incomplete UI as reported.
- **Issue 2 — config columns also wrong:** The `columns` block in the config uses `subject_preferred_name`, `subject_hr_department_id`, `subject_start_date`, `lead_preferred_name` — which would only exist after `flattenRow`. Since `flattenRow` is skipped, even if AG Grid used `config.columns` it would still find no values. (In practice list-view `colDefs` override but the inconsistency in expectation is itself a sign of the bug.)
- **Issue 3 — `quarter_label` is never produced:** Config comment says it's "synthesized at the column-renderer level," but `employee-review-list-view.tsx` declares `field: 'quarter_label'` with no `valueGetter`. There is no synthesis. Build a value getter from `review_year`/`review_quarter`.
- **Issue 4 — search references non-existent fields:** `search.columns: ['subject_preferred_name', 'subject_hr_department_id']` — postgrest `.or(...)` won't accept dotted embedded selects in this form. Search input would 400.

#### Payroll Data (`hr-payroll-data.config.tsx`)

- Backing table: `hr_payroll` (table; full column list at `database.types.ts:3362`).
- Loader path: CUSTOM. No `select` is set, so the loader does `select('*')` and `castRows` returns rows as-is.
- `hr_payroll` has `employee_name` (good) but does NOT have `department_name` or `work_authorization_name`. It has `hr_department_id` and `hr_work_authorization_id` (UUIDs).
- **Issue:** `hr-payroll-data.config.tsx` agGridColDefs reference `department_name`, `work_authorization_name`. These will render blank.
- **Fix options:**
  - (a) Add a `select` in the config that embeds `hr_department:hr_department(id, name)` and `hr_work_authorization:hr_work_authorization(id, name)` — but **the custom loader doesn't flatten**, so the AG Grid column cannot use a flat key.
  - (b) Have the custom-loader branch call `flattenRow` on the resulting rows whenever `config?.select` is set (mirror the regular path).
  - (c) Provide ag-grid `valueGetter` that reads `data.hr_department?.name`.
  - The cleanest is **(b) — flatten in the custom-loader path when `select` is provided.** That single change unblocks Time Off (already works), Employee Review, and Payroll Data with config-only fixes.

#### Payroll Comparison / Payroll Comp (`hr-payroll-comparison.config.ts`)

- Loader path: CUSTOM. The `Payroll Comparison`/`Payroll Comp` slug branch in `sub-module.tsx:124-138` overrides the query: it queries `hr_payroll_by_task` view directly with `select('*')`.
- Actual `hr_payroll_by_task` columns (`database.types.ts:9320`): `check_date`, `compensation_manager_id`, `discretionary_overtime_hours`, `discretionary_overtime_pay`, `hr_employee_id`, `is_manager`, `org_id`, `regular_hours`, `regular_pay`, `scheduled_hours`, `status`, `task`, `total_cost`, `total_hours`, `workers_compensation_code`.
- **Issue:** Config `columns` and `payroll-comparison-list-view.tsx` reference `department_name`, `employee_count`, `total_regular_hours`, `total_overtime_hours`, `total_gross_wage`, `total_net_pay`, `gross_wage`, `full_name`, `employee_name`. **None of these exist on `hr_payroll_by_task`.** The view is per-(employee, check_date, task), not aggregated by department.
- This view either was renamed/restructured during the recent schema churn, or the UI was written for a different/aggregated view. The component does its own client-side aggregation (lines 197-272), but it tries to read `row.department_name`, `row.employee_name`, `row.gross_wage` — none present.

#### Payroll Comp Manager (`hr-payroll-comp-manager.config.ts`)

- Loader path: CUSTOM. The `Payroll Comp Manager` branch queries `hr_payroll_employee_comparison` view (`sub-module.tsx:139-147`).
- Actual `hr_payroll_employee_comparison` columns (`database.types.ts:9355`): `check_date`, `compensation_manager_id`, `discretionary_overtime_hours`, `discretionary_overtime_pay`, `discretionary_overtime_pay_delta`, `hours_delta`, `hr_employee_id`, `org_id`, `other_pay_delta`, `regular_pay`, `regular_pay_delta`, `scheduled_hours`, `status`, `task`, `total_cost`, `total_cost_delta`, `total_hours`, `workers_compensation_code`.
- **Issue:** Config `columns` reference `full_name`, `department_name`, `gross_wage`, `net_pay`, `overtime_hours`. **None of these exist on `hr_payroll_employee_comparison`.** The view exposes deltas (`*_delta`) and the new task/cost fields.
- `payroll-comp-manager-list-view.tsx` reads `data.full_name`, `data.department_name`, `data.gross_wage` — all `undefined`.
- The loader also `.order('full_name')` on a view that has no `full_name` column → this will currently throw a 400 from PostgREST when the page loads. **Hard error, not just blank cells.**

#### Hours Comp (`hr-payroll-hours.config.ts`)

- Loader path: CUSTOM. The `Hours Comp` branch queries `hr_payroll_employee_comparison` view (`sub-module.tsx:148-168`) and orders by `full_name`.
- **Issue:** Same as Payroll Comp Manager — `full_name`, `department_name`, `payroll_hours`, `variance` do NOT exist on `hr_payroll_employee_comparison`. The view exposes `total_hours`, `scheduled_hours`, `hours_delta` (which is the variance). `.order('full_name')` will 400.

## Eliminated

- "View names are wrong/missing" — `hr_payroll_by_task`, `hr_payroll_employee_comparison`, `hr_employee_review`, `hr_time_off_request`, `hr_payroll`, `org_site_housing_tenant_count`, `ops_task_weekly_schedule` are all present in `database.types.ts`. The hosted DB has them.
- "FK relationships changed" — Embed FKs (`hr_employee_id`, `requested_by`, `reviewed_by`, `lead_id`, `compensation_manager_id`) all still exist with the names the configs expect.
- "Generated types are stale" — Types match the configs' table-column expectations for base tables (`hr_payroll` has `employee_name`, etc.). The mismatch is between configs and **views** (which have a deliberately narrower / aggregated column set), and between configs and the loader's flatten behavior.

## Root Cause

There are **two distinct root causes** working together:

1. **Custom-view loader skips row flattening.** `app/routes/workspace/sub-module.tsx:111-213` runs the custom branch that queries with `config.select` (which contains postgrest embeds) but never calls `flattenRow`. Modules whose configs/components expect flat keys like `subject_preferred_name` or `lead_preferred_name` therefore receive nested objects (`row.subject.preferred_name`) and render blank cells. This is the direct cause of Employee Review's blank/incomplete state.

2. **Payroll views were narrowed/restructured but configs were not updated.** The `hr_payroll_by_task` view exposes per-(employee, check_date, task) rows with `regular_hours`, `regular_pay`, `total_hours`, `total_cost`, `discretionary_overtime_*`, `scheduled_hours`, `is_manager` — but the configs for Payroll Comparison and Payroll Comp Manager still reference the old aggregate column names (`department_name`, `employee_count`, `gross_wage`, `net_pay`, `overtime_hours`, `total_*`). The `hr_payroll_employee_comparison` view similarly exposes `*_delta` fields but configs/components still ask for `full_name`, `department_name`, `payroll_hours`, `variance`. Additionally, the loader `.order('full_name')` on these views will produce a hard PostgREST error.

## Fix Plan

### Fix A — Single-line fix for Employee Review (and any future custom-loader module that uses embeds)

In `app/routes/workspace/sub-module.tsx`, after `castRows(data)` in the custom branch, flatten when `config.select` is set:

```ts
import { flattenRow } from '~/lib/crud/crud-helpers.server'; // export it
// ...
const raw = castRows(data);
const rows = config?.select ? raw.map(flattenRow) : raw;
```

Plus export `flattenRow` from `crud-helpers.server.ts` (currently file-private).

### Fix B — Employee Review list view alignment

After Fix A, update `app/components/ag-grid/employee-review-list-view.tsx`:
- `field: 'full_name'` → `field: 'subject_preferred_name'`
- `field: 'department_name'` → `field: 'subject_hr_department_id'` (UUID — needs a lookup or wider embed; see Fix B2)
- `field: 'quarter_label'` → add `valueGetter: (p) => p.data ? \`Q${p.data.review_quarter} ${p.data.review_year}\` : ''`
- `field: 'lead_name'` → `field: 'lead_preferred_name'`

#### Fix B2 — Department display

Either (i) widen the embed in `hr-employee-review.config.ts` to pull department name: change `subject:hr_employee!hr_employee_id(preferred_name, profile_photo_url, hr_department_id, start_date, hr_department:hr_department(name))` and use `subject_hr_department_name` (after deeper flatten — current flattenRow only goes one level deep, so this would need either a 2-level flatten or a postgrest `select` alias), OR (ii) add a separate `hr_department` lookup as a `selfJoins`-style helper (see how time-off-detail-row already inlines IDs).
The simplest path is (i) with deeper flatten support, or (i) using PostgREST aliasing: `department_name:hr_department(name)` returns `{ department_name: { name: 'Foo' } }` which after one flatten becomes `department_name_name`. Cleanest is to have flattenRow recurse one extra level when nested objects contain only scalars.

Recommended: extend `flattenRow` to recurse — for each value that is a plain object, flatten its scalars; if the nested object itself contains another object, prefix with both keys (`a.b.c → a_b_c`). This is a small, additive change.

#### Fix B3 — Search

Update `hr-employee-review.config.ts` `search.columns` to be an empty list (or delete) until search is reimplemented to work on flattened keys via `or(...)`. Or implement client-side search in the list view.

### Fix C — Time Off

- Update `hr-time-off.config.ts` `search.columns` from `['full_name', 'request_reason', 'notes']` to `['request_reason', 'notes', 'denial_reason']`. (Drop `full_name`; if name search is required, do client-side filter on `subject_preferred_name`.)
- Optionally widen embeds to pull `hr_department.name`, `hr_work_authorization.name`, and a compensation_manager preferred_name so the detail row shows labels instead of UUIDs (depends on Fix A2 deeper flatten).

### Fix D — Payroll Data

Two-part:
1. Add `select` to `hr-payroll-data.config.tsx`: `'*, hr_department:hr_department(name), hr_work_authorization:hr_work_authorization(name)'`.
2. After Fix A + deeper flatten, change agGridColDefs:
   - `field: 'department_name'` → `field: 'hr_department_name'`
   - `field: 'work_authorization_name'` → `field: 'hr_work_authorization_name'`

### Fix E — Payroll Comparison / Payroll Comp

The current `hr_payroll_by_task` view does NOT expose department/employee/gross_wage. Two options:
- **(E1, recommended) Adjust the UI to the new schema.** Change config columns and `payroll-comparison-list-view.tsx` to use the available columns: aggregate by `compensation_manager_id` or `task`, sum `regular_pay`/`total_cost`, count distinct `hr_employee_id` for "Employees" if needed.  Add an embed in `sub-module.tsx`'s `Payroll Comparison` branch: `.select('*, hr_employee:hr_employee_id(preferred_name, hr_department_id, hr_department:hr_department(name))')` then flatten. This gives `hr_employee_preferred_name` and `hr_employee_hr_department_name`.
- **(E2)** Restore the previous aggregate view at the DB level. Out of scope for UI fix; flag for human DB owner.

### Fix F — Payroll Comp Manager and Hours Comp

The `.order('full_name')` calls in `sub-module.tsx:147,168,193` on views that have no `full_name` column will hard-fail. Change to:
- Payroll Comp Manager: `.order('hr_employee_id')` (already done on line 147 — wait, let me re-check… line 147 IS `.order('hr_employee_id')`. Good. But line 168 uses `.order('full_name')` for Hours Comp, and line 193 for Payroll Data. Both will fail.).
- Hours Comp & Payroll Data: change `.order('full_name')` to `.order('hr_employee_id')` until the embed for `hr_employee.preferred_name` is wired in. After embeds + flatten: order client-side or via the embed-prefixed key (PostgREST may not support ordering by embedded fields without a foreign-table sort param — use `.order('preferred_name', { foreignTable: 'hr_employee' })`).

For Payroll Comp Manager / Hours Comp, also need an embed for the employee:
```
.select('*, hr_employee:hr_employee_id(preferred_name, hr_department_id, hr_department:hr_department(name))')
```
Then update the list-view colDefs to use `hr_employee_preferred_name`, `hr_employee_hr_department_name`. Map the variance/payroll-hours headings to `hours_delta`, `total_hours` etc. that the view actually exposes.

## Resolution

- root_cause: |
    Two compounding issues:
    (1) The custom-view loader path (sub-module.tsx) does not call
        flattenRow, so postgrest embeds remain nested. Configs/components
        expecting `subject_preferred_name`, `lead_preferred_name`, etc.
        receive `undefined`. This causes Employee Review's blank cells.
    (2) Payroll views (`hr_payroll_by_task`, `hr_payroll_employee_comparison`)
        have a different/narrower column shape than the UI expects.
        Configs and list-view colDefs reference `full_name`,
        `department_name`, `gross_wage`, `payroll_hours`, `variance`,
        `total_*` aggregates that do not exist on those views.
        `.order('full_name')` calls in the loader will hard-fail with 400.
- fix: |
    Phase 1 (small, foundational):
      • Export and call flattenRow in the custom-view loader path when
        config.select is set (single addition in sub-module.tsx).
      • Make flattenRow recurse one level (so deeper embeds work).
    Phase 2 (per-module):
      • Time Off: drop `full_name` from search.columns.
      • Employee Review: switch list-view fields to flattened keys; add
        quarter_label valueGetter.
      • Payroll Data: add `select` with hr_department / hr_work_authorization
        embeds; switch column fields to `hr_department_name` etc.; change
        loader `.order('full_name')` → `.order('hr_employee_id')` until
        sort-by-embed wired up.
      • Payroll Comp / Comp Manager / Hours Comp: rewrite to read from
        the actual view shape (deltas, total_hours, regular_pay, total_cost)
        and embed `hr_employee` for display fields. Fix `.order('full_name')`.
- verification: |
    After fix, confirm in browser for a populated org:
      - Time Off list renders Employee column with names; search works.
      - Employee Review list renders Employee, Dept, Quarter, Lead columns
        non-blank.
      - Payroll Data renders Department + Work Auth columns non-blank.
      - Payroll Comp / Comp Manager / Hours Comp pages load without 400
        errors and show real numbers from the new view shape.
- files_changed: []
