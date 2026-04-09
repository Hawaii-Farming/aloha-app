# Phase 4: Payroll Views - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 04-payroll-views
**Mode:** auto
**Areas discussed:** View toggle UX, Pay period filtering, Column grouping strategy, Comp manager filtering, Pinned totals, Data source strategy

---

## Data Source Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| SQL views for aggregations | Server-side aggregation views + raw table for detail | ✓ |
| Client-side aggregation | Load raw data, aggregate in JS | |
| Materialized views | Pre-computed, refresh on schedule | |

**User's choice:** SQL views for aggregations (auto-selected — recommended default)
**Notes:** Consistent with prior phases (ops_task_weekly_schedule, app_hr_time_off_requests). Server-side aggregation is more performant and keeps the pattern consistent.

---

## View Toggle UX (Payroll Comparison)

| Option | Description | Selected |
|--------|-------------|----------|
| URL searchParams toggle | Tab-style toggle using searchParams like status filter tabs | ✓ |
| Client-side tab switch | Two grids, show/hide on client | |
| Separate submodules | Two distinct sub-module entries in nav | |

**User's choice:** URL searchParams toggle (auto-selected — recommended default)
**Notes:** Consistent with StatusFilterTabs pattern from Phase 3. Server-side data switching keeps each view's data load separate.

---

## Pay Period Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown from distinct periods | Load distinct pay_period_start/end pairs from hr_payroll | ✓ |
| Date range picker | Free-form date range selection | |
| Month/year selector | Simplified monthly selection | |

**User's choice:** Dropdown from distinct periods (auto-selected — recommended default)
**Notes:** Data-driven approach ensures only valid periods are selectable. Pay periods are externally defined (imported payroll), so a constrained dropdown is more accurate than free-form dates.

---

## Column Grouping (Payroll Data)

| Option | Description | Selected |
|--------|-------------|----------|
| AG Grid column groups | Native columnGroupDefs with collapsible headers | ✓ |
| Flat columns with prefixes | All columns flat, named with group prefix | |
| Tabbed sections | Separate tabs for each column group | |

**User's choice:** AG Grid column groups (auto-selected — recommended default)
**Notes:** Native AG Grid Community feature. Groups map directly to hr_payroll table structure (Hours/Earnings/Deductions/Employer Costs). Collapsible headers let users focus on relevant sections.

---

## Comp Manager Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Toolbar dropdown with searchParams | Manager selector in toolbar, filter via URL params | ✓ |
| Column filter | AG Grid built-in column filter on manager column | |
| Sidebar filter panel | Dedicated filter panel | |

**User's choice:** Toolbar dropdown with searchParams (auto-selected — recommended default)
**Notes:** Consistent with scheduler department filter and time off status filter patterns. Server-side filtering via loader revalidation.

---

## Pinned Totals

| Option | Description | Selected |
|--------|-------------|----------|
| AG Grid pinnedBottomRowData | Native pinned bottom row with calculated sums | ✓ |
| Separate summary section | HTML summary above/below grid | |
| Footer row via CSS | Custom styled last row | |

**User's choice:** AG Grid pinnedBottomRowData (auto-selected — recommended default)
**Notes:** Native AG Grid Community feature. Stays in sync with column visibility and scrolling. Clean integration with existing grid infrastructure.

---

## Claude's Discretion

- Toggle button styling, manager dropdown component, pay period display format
- Default column visibility and group expansion state in Payroll Data
- Loading states, toast notifications, pinned row styling, column group header styling

## Deferred Ideas

None — all decisions stayed within phase scope.
