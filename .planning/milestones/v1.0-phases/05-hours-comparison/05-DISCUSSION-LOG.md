# Phase 5: Hours Comparison - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 05-hours-comparison
**Mode:** auto
**Areas discussed:** Schedule hours scope, Variance highlighting, Detail row expansion, Grid columns

---

## Schedule Hours Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All entries (planned + executed) | Include both planned (ops_task_tracker_id IS NULL) and executed schedule entries | auto |
| Planned only | Only include planned entries matching weekly schedule view pattern | |
| Executed only | Only include entries with ops_task_tracker_id (tracked/completed) | |

**Auto-selected:** All entries (planned + executed) — comparison against payroll should reflect actual work, not just plans.

---

## Variance Highlighting

| Option | Description | Selected |
|--------|-------------|----------|
| Absolute threshold (amber >0h, red >4h) | Simple fixed thresholds for any mismatch and significant discrepancy | auto |
| Percentage-based (amber >5%, red >15%) | Proportional thresholds relative to total hours | |
| Single color (red for any mismatch) | Binary — either matching or not | |

**Auto-selected:** Absolute threshold (amber >0h, red >4h) — simple, clear, configurable in V2.

---

## Detail Row Expansion

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side fetch on expand | API route returns daily breakdown when row clicked — matches scheduler pattern | auto |
| Server-side pre-load | Load all detail data in initial loader — simpler but heavier | |

**Auto-selected:** Client-side fetch on expand — matches Phase 2 scheduler detail row pattern, avoids heavy initial load.

---

## Grid Columns

| Option | Description | Selected |
|--------|-------------|----------|
| Focused (photo, name, dept, scheduled, payroll, variance) | Clean comparison view with essential columns only | auto |
| Extended (add regular/OT breakdown) | Split scheduled and payroll into regular + OT sub-columns | |
| Full (add pay structure, hourly rate) | Include employment details alongside comparison | |

**Auto-selected:** Focused — dedicated comparison view, not full payroll detail. Users can check Payroll Data for detailed breakdown.

---

## Claude's Discretion

- Detail row sub-table pagination/scrolling behavior
- Exact amber/red color values (from DESIGN.md tokens)
- Whether to include a pinned totals row
- Loading states for filter changes and detail expansion
- Variance column sort behavior

## Deferred Ideas

None — analysis stayed within phase scope.
