# Phase 2: Scheduler - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 02-scheduler
**Mode:** auto
**Areas discussed:** Weekly grid layout, Week navigation UX, Historical detail data, Create form data flow

---

## Weekly Grid Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Direct column mapping | Map ops_task_weekly_schedule view columns directly to AG Grid ColDefs — Sun-Sat as string columns | ✓ |
| Calendar-style grid | Custom calendar layout with drag-and-drop | |
| Pivot table | AG Grid pivot mode grouping by day | |

**User's choice:** Direct column mapping (auto-selected — recommended default)
**Notes:** The SQL view already computes formatted time ranges per day, making direct column mapping the simplest and most natural approach. No data transformation needed.

---

## Week Navigation UX

| Option | Description | Selected |
|--------|-------------|----------|
| Toolbar controls | Previous/Next/Current buttons in toolbar above grid | ✓ |
| Inline header | Navigation embedded in grid header row | |
| Sidebar calendar | Calendar widget in sidebar for week selection | |

**User's choice:** Toolbar controls (auto-selected — recommended default)
**Notes:** Consistent with DataTableToolbar pattern from Phase 1. Week changes update URL search params and trigger loader revalidation.

---

## Historical Detail Data

| Option | Description | Selected |
|--------|-------------|----------|
| Nested AG Grid sub-table | Query ops_task_schedule on expand, show as sub-grid with date/dept/task/times | ✓ |
| Simple card layout | Display historical entries as styled cards | |
| Inline list | Render as a simple list of schedule entries | |

**User's choice:** Nested AG Grid sub-table (auto-selected — recommended default)
**Notes:** Reuses AG Grid components for consistency. Data loaded on-demand via client-side fetch to avoid upfront cost.

---

## Create Form Data Flow

| Option | Description | Selected |
|--------|-------------|----------|
| CrudModuleConfig pattern | Side-panel form writing to ops_task_schedule with FK dropdowns, following register pattern | ✓ |
| Inline grid editing | Edit directly in grid cells | |
| Modal form | Full-screen modal instead of side panel | |

**User's choice:** CrudModuleConfig pattern (auto-selected — recommended default)
**Notes:** Consistent with Phase 1 CreatePanel pattern. New entries are "planned" (ops_task_tracker_id = NULL).

---

## Claude's Discretion

- Week navigation button styling details
- Historical summary view toggle UX
- Detail row sub-table pagination
- Time input component choice
- Week start date computation
- Department filter component choice
- Loading states for transitions

## Deferred Ideas

None — analysis stayed within phase scope
