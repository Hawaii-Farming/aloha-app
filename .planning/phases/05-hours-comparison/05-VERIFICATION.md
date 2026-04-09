---
phase: 05-hours-comparison
verified: 2026-04-08T00:00:00Z
status: human_needed
score: 4/4 must-haves verified
re_verification: false
human_verification:
  - test: "Navigate to the Hours Comparison submodule (payroll_hours slug) and confirm the AG Grid renders with all required columns: employee photo, full name, department, scheduled hours, payroll hours, variance"
    expected: "Grid displays rows with avatar, employee name + department subtitle, numeric columns for scheduled/payroll/variance, and a pinned TOTAL row at bottom"
    why_human: "Cannot render React components or verify AG Grid output programmatically"
  - test: "Verify pay period filter defaults to most recent period and that changing the selection reloads grid data"
    expected: "PayPeriodFilter dropdown is pre-selected to the most recent period; selecting a different period navigates with ?period_start=&period_end= params and the grid updates"
    why_human: "URL-driven filter behavior and SSR reload require browser interaction"
  - test: "Verify variance cell highlighting: amber for any non-zero variance, red+bold for absolute variance >= 4 hours"
    expected: "Cells with |variance| between 0.01 and 3.99 show amber text; cells with |variance| >= 4 show red bold text"
    why_human: "AG Grid cellClassRules require browser rendering to confirm applied CSS classes"
  - test: "Click an employee row and confirm the detail row expands showing daily schedule entries with date, day of week, department, task, start time, end time, hours"
    expected: "Full-width detail row appears below the clicked row, fetches /api/schedule-by-period, and renders a scrollable table with all 7 columns plus a sticky total footer"
    why_human: "Row expansion and API fetch require browser interaction"
  - test: "Check the pinned TOTAL row variance sign: it should match the sign convention of individual rows (payroll - scheduled). The totals row currently computes scheduled - payroll which is the opposite sign."
    expected: "If payroll hours exceed scheduled hours for all employees, the TOTAL variance should be positive (matching individual rows). Confirm whether the sign inversion in the totals row is visually confusing or acceptable."
    why_human: "Sign convention correctness requires domain knowledge and human judgment — code discrepancy confirmed programmatically (see Anti-Patterns section)"
---

# Phase 5: Hours Comparison Verification Report

**Phase Goal:** Users can compare scheduled hours against payroll hours per employee and investigate daily breakdowns for discrepancies
**Verified:** 2026-04-08
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Comparison grid shows employee photo/name, scheduled hours, payroll hours, and variance per employee | VERIFIED | `payroll-hours-list-view.tsx`: `AVATAR_COL`, `full_name` with `EmployeeDeptRenderer`, `scheduled_hours`, `payroll_hours`, `variance` ColDefs all present (lines 230–276) |
| 2 | User can select a pay period to scope the comparison | VERIFIED | `PayPeriodFilter` rendered in toolbar (line 406); `sub-module.tsx` loader branch reads `period_start`/`period_end` params and defaults to `payPeriods[0]` when none set (lines 127–147) |
| 3 | Variance cells are highlighted with conditional styling (red/amber) when hours mismatch | VERIFIED | `varianceHighlightCellClassRules(4, 0.01)` applied to variance `ColDef` (line 272); function in `row-class-rules.ts` applies `text-red-500 font-semibold` when |val| >= 4, `text-amber-500` when |val| >= 0.01 and < 4 |
| 4 | Clicking a row expands to show daily schedule breakdown (day, dept, task, start/end time, hours) | VERIFIED | `HoursDetailInner` fetches `/api/schedule-by-period` on mount with `useEffect` (line 80–109); renders table with Date, Day, Department, Task, Start Time, End Time, Hours columns (lines 148–169); `useDetailRow` hook wires click handler (lines 321–332) |

**Score:** 4/4 truths verified (code) — human browser testing required

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260410000001_app_hr_hours_comparison.sql` | Hours comparison SQL view | VERIFIED | Contains `CREATE OR REPLACE VIEW app_hr_hours_comparison`, `schedule_agg` CTE with `EXTRACT(EPOCH ...)`, `payroll_agg` CTE with `SUM(total_hours)`, `FULL OUTER JOIN payroll_agg`, all required column COALESCEs, `GRANT SELECT ... TO authenticated` |
| `app/routes/api/schedule-by-period.ts` | Detail row data API endpoint | VERIFIED | Exports `loader`, validates all 4 required params (returns 400 if missing), queries `ops_task_schedule` with org+employee+date-range filters, returns enriched `{ data: [...] }` with all 7 expected fields |
| `app/lib/crud/hr-payroll-hours.config.ts` | CRUD config for payroll_hours slug | VERIFIED | Exports `hrPayrollHoursConfig` with `views.list: 'app_hr_hours_comparison'`, `viewType: { list: 'custom' }`, `pkColumn: 'hr_employee_id'`, empty `formFields`, `customViews.list` dynamic import |
| `app/lib/crud/registry.ts` | Registry entry for payroll_hours | VERIFIED | Imports `hrPayrollHoursConfig` (line 12) and maps `['payroll_hours', hrPayrollHoursConfig]` (line 39) |
| `app/routes/workspace/sub-module.tsx` | Custom loader branch for payroll_hours | VERIFIED | `subModuleSlug === 'payroll_hours'` branch at line 127; reads period params, defaults to `payPeriods[0]`, applies `.eq('pay_period_start', ...)` + `.eq('pay_period_end', ...)`, orders by `full_name` |
| `app/components/ag-grid/payroll-hours-list-view.tsx` | Custom list view component | VERIFIED | 462-line substantive file; exports `default function PayrollHoursListView`; all required sub-components present (HoursDetailInner, EmployeeDeptRenderer, PinnedAwareAvatarRenderer); toolbar, grid, detail rows, pinned totals all wired |
| `app/routes.ts` | Route registration for schedule-by-period | VERIFIED | Line 16: `route('api/schedule-by-period', 'routes/api/schedule-by-period.ts')` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `payroll-hours-list-view.tsx` | `/api/schedule-by-period` | `fetch` in `useEffect` on detail row expand | WIRED | `HoursDetailInner` constructs `URLSearchParams` and calls `fetch('/api/schedule-by-period?...')` (lines 85–104) |
| `registry.ts` | `hr-payroll-hours.config.ts` | `import` + `Map.set` | WIRED | Import on line 12, `['payroll_hours', hrPayrollHoursConfig]` on line 39 |
| `sub-module.tsx` | `app_hr_hours_comparison` | `queryUntypedView` in loader | WIRED | `viewName` comes from `config.views.list = 'app_hr_hours_comparison'`; `query = queryUntypedView(client, viewName)` at line 85 |
| `payroll-hours-list-view.tsx` | `useDetailRow` hook | `pkColumn: 'hr_employee_id'` | WIRED | Lines 321–332: `useDetailRow({ sourceData: rawRows, pkColumn: 'hr_employee_id', detailComponent, gridRef })` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `payroll-hours-list-view.tsx` | `rawRows` via `tableData.data` | `sub-module.tsx` loader → `queryUntypedView(client, 'app_hr_hours_comparison')` with period filter | Yes — DB query against view with `org_id`, `pay_period_start`, `pay_period_end` filters | FLOWING |
| `payroll-hours-list-view.tsx` | `payPeriods` via `useLoaderData()` | `sub-module.tsx` loader → `queryUntypedView(client, 'hr_payroll').select('pay_period_start, pay_period_end')` | Yes — DB query for distinct pay periods | FLOWING |
| `HoursDetailInner` | `detailData` | `fetch('/api/schedule-by-period?...')` → `schedule-by-period.ts` loader → `client.from('ops_task_schedule').select(...)` | Yes — DB query with org+employee+date-range filters | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| SQL view migration has correct structure | `grep -c "CREATE OR REPLACE VIEW app_hr_hours_comparison"` | 1 match | PASS |
| SQL view has FULL OUTER JOIN | `grep -c "FULL OUTER JOIN payroll_agg"` | 1 match | PASS |
| SQL view GRANT is present | `grep -c "GRANT SELECT ON app_hr_hours_comparison TO authenticated"` | 1 match | PASS |
| API route registers correctly | `grep -c "schedule-by-period" app/routes.ts` | 1 match | PASS |
| API route exports loader | `grep -c "export const loader" schedule-by-period.ts` | 1 match | PASS |
| Registry maps payroll_hours | `grep -c "payroll_hours" registry.ts` | 1 match | PASS |
| Component fetches API | `grep -c "schedule-by-period" payroll-hours-list-view.tsx` | 1 match | PASS |
| Variance cell class rules applied | `varianceHighlightCellClassRules(4, 0.01)` present in ColDef | confirmed | PASS |
| PayPeriodFilter in toolbar | `grep -c "PayPeriodFilter"` | 1 match | PASS |
| Visual browser rendering | Requires running app | N/A | SKIP — route to human |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HCMP-01 | 05-02-PLAN.md | Comparison grid with photo, full name, scheduled hours, payroll hours, variance | SATISFIED | All 5 ColDefs present in `payroll-hours-list-view.tsx`; view returns `profile_photo_url`, `full_name`, `scheduled_hours`, `payroll_hours`, `variance` |
| HCMP-02 | 05-02-PLAN.md | Pay period selector to scope the comparison | SATISFIED | `PayPeriodFilter` in toolbar; loader branch applies period filter with default-to-most-recent logic |
| HCMP-03 | 05-01-PLAN.md, 05-02-PLAN.md | Row-click full-width detail showing daily schedule breakdown | SATISFIED | `HoursDetailInner` fetches `/api/schedule-by-period`; detail table has all 7 columns (date, day, dept, task, start, end, hours) |
| HCMP-04 | 05-02-PLAN.md | Variance highlighting (red/amber) when hours mismatch | SATISFIED | `varianceHighlightCellClassRules(4, 0.01)` applied; amber at |var| >= 0.01, red at |var| >= 4 |
| HCMP-05 | 05-01-PLAN.md | SQL view joining ops_task_schedule aggregated hours with hr_payroll.total_hours per employee per pay period | SATISFIED | Migration file creates `app_hr_hours_comparison` with schedule_agg CTE, payroll_agg CTE, FULL OUTER JOIN, and variance column; pushed to hosted Supabase per 05-03-SUMMARY.md |

All 5 HCMP requirements are accounted for across plans 01–02. Plan 03 covers all 5 (HCMP-01 through HCMP-05) for database schema application. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/components/ag-grid/payroll-hours-list-view.tsx` | 308 | Totals row variance formula: `totalScheduled - totalPayroll` (opposite sign to SQL view's `payroll_hours - scheduled_hours`) | Warning | The pinned TOTAL row displays variance with reversed sign convention relative to individual data rows. If payroll exceeds scheduled for all employees (positive variance per SQL), the TOTAL row will show a negative sum. Does not block functionality but creates display inconsistency. |

### Human Verification Required

#### 1. Full Grid Rendering

**Test:** Navigate to the Hours Comparison submodule in the HR module (payroll_hours slug under the workspace). Confirm the AG Grid loads and displays all required columns.
**Expected:** Grid shows avatar, employee name with department subtitle, Scheduled Hrs, Payroll Hrs, and Variance columns. A pinned TOTAL row appears at the bottom.
**Why human:** AG Grid rendering and column visibility cannot be verified without a browser.

#### 2. Pay Period Filter Default and Switching

**Test:** On first load, confirm the pay period filter is pre-selected to the most recent period. Then select a different period from the dropdown.
**Expected:** Grid loads with most recent period selected. Changing the period updates the URL params and reloads the grid with filtered data.
**Why human:** URL-driven filter behavior and SSR data reload require browser interaction.

#### 3. Variance Cell Highlighting

**Test:** Look at the Variance column cells. Identify rows where variance is small (< 4h) and rows where variance is large (>= 4h).
**Expected:** Small non-zero variance cells show amber text; large variance cells (>= 4h) show red bold text; zero-variance cells show no highlighting.
**Why human:** AG Grid `cellClassRules` apply CSS classes dynamically; requires browser rendering to confirm.

#### 4. Detail Row Expansion

**Test:** Click on an employee row to expand the detail. Wait for the daily schedule data to load.
**Expected:** A full-width detail row expands below the clicked row, showing a scrollable table with Date, Day, Department, Task, Start Time, End Time, and Hours columns. A footer row shows total hours and record count.
**Why human:** Row expansion, API fetch, and detail table rendering require browser interaction.

#### 5. Totals Row Variance Sign Convention

**Test:** Compare the sign of individual row variances (from DB) against the pinned TOTAL row variance. If most employees have payroll > scheduled (positive per SQL view), the TOTAL row shows a negative number (computed as scheduled - payroll).
**Expected:** Either (a) confirm the sign difference is acceptable for the use case, or (b) fix the totals row formula to `totalPayroll - totalScheduled` to match the SQL view convention.
**Why human:** Requires domain knowledge judgment on whether reversed sign in totals is acceptable or a bug.

### Gaps Summary

No blocking gaps identified. All required artifacts exist, are substantive, and are wired. The data flow from database through loader to component to detail API is fully connected.

One warning: the pinned totals row computes variance with the opposite sign from the SQL view (scheduled - payroll vs payroll - scheduled). This is a display inconsistency but does not block the core comparison goal — individual row variances from the database are displayed correctly.

All 5 HCMP requirements are satisfied at the code level. Human browser verification is required because the phase included a visual checkpoint (05-03-PLAN.md Task 2) that was auto-approved without recorded human confirmation.

---

_Verified: 2026-04-08_
_Verifier: Claude (gsd-verifier)_
