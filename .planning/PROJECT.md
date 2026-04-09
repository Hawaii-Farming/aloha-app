# HR Module Submodules

## What This Is

Wire up all HR submodules in the Aloha ERP app with AG Grid Community tables, side-panel CRUD forms, and row-click detail views. The register submodule is already built as the base pattern; this project replicates and adapts that pattern across 7 remaining HR submodules backed by existing Supabase schema tables and views.

## Core Value

Every HR submodule renders real data from the database and supports full CRUD operations through AG Grid tables styled to the Supabase-inspired design system.

## Requirements

### Validated

- Existing register submodule (HR employee list with CRUD) — serves as base pattern
- Database schema for hr_employee, hr_time_off_request, hr_travel_request, hr_disciplinary_warning, hr_payroll, ops_task_schedule, ops_task_tracker, ops_task_weekly_schedule view, org_site (housing)
- CRUD registry pattern (`getModuleConfig`) for sub-module routing
- Supabase RLS policies on all HR tables
- Workspace layout with org-scoped navigation
- ✓ AG Grid Community integration as new dependency (replacing TanStack Table for HR module) — v1.0
- ✓ AG Grid themed to DESIGN.md (Supabase-inspired dark/light theme) — v1.0
- ✓ Scheduler submodule — weekly schedule grid with week navigation, dept filter, OT highlights, history, create form — v1.0
- ✓ Time Off submodule — status filter tabs, inline approve/deny with denial reason, create form — v1.0
- ✓ Hours Comparison submodule — scheduled vs payroll hours with variance highlighting, daily drill-down — v1.0
- ✓ Payroll Comparison submodule — by-task/by-employee toggle with pay period filter and pinned totals — v1.0
- ✓ Payroll Comp Manager submodule — manager selector, pay period filter, summary totals — v1.0
- ✓ Payroll Data submodule — full payroll line items with column groups, employee/period filters, CSV export — v1.0
- ✓ Housing submodule — occupancy grid with tenant detail rows, auto-resolved category on create — v1.0
- ✓ Employee Review submodule — quarterly scores with color coding, Year-Quarter filter, lock enforcement — v1.0
- ✓ Full-width detail rows in AG Grid Community for all row-click-to-expand interactions — v1.0
- ✓ Side-panel forms for Create/Edit following register pattern — v1.0

### Active

(None — all v1 requirements shipped. Next milestone will define new requirements.)

### Out of Scope

- AG Grid Enterprise features — using Community (free) tier only; all described UX achieved with Community
- Mobile-specific layouts — web-first; AG Grid responsive column hiding covers basic needs
- Real-time collaboration / live updates — standard request/response model sufficient
- Payroll import/processing — hr_payroll is imported externally, this project only displays it
- Approval workflow automation — status changes are manual toggles in the row
- Inline cell editing in grids — side-panel forms are safer and more consistent
- Chart/graph visualizations — AG Grid Charts is Enterprise-only; tabular data sufficient

## Context

Shipped v1.0 with 6 phases, 21 plans across 199 commits (283 files changed, +31,810/-12,692 lines). Timeline: 3 days (2026-04-07 → 2026-04-09).

- **AG Grid**: v35.2.1 Community with custom Supabase-themed dark/light config via `themeQuartz.withParams()`. AgGridWrapper provides SSR safety, column mapping, detail rows, CSV export, and column state persistence.
- **8 HR submodules**: Register (converted from TanStack Table), Scheduler, Time Off, Payroll Comparison, Payroll Comp Manager, Payroll Data, Hours Comparison, Housing, Employee Review — all with AG Grid tables and side-panel CRUD forms.
- **SQL views**: 10+ custom views for aggregation (payroll by task/employee/manager, hours comparison FULL OUTER JOIN, housing occupancy, employee reviews, time off requests, weekly schedule).
- **Migrations pushed**: org_site max_beds, app_hr_housing, hr_employee_review table + RLS, app_hr_employee_reviews view — all on hosted Supabase.
- **Design**: DESIGN.md Supabase-inspired theme with dark-mode-native colors, emerald green accents, Geist font. AG Grid themed via ag-theme-quartz base.
- **Dual tenant model**: Template auth (accounts/memberships) coexists with business auth (org/hr_employee). All data queries org-scoped.

## Constraints

- **UI Library**: AG Grid Community (free) only — no Enterprise modules
- **Design**: Must follow DESIGN.md color tokens, typography, spacing for both dark and light themes
- **Pattern**: Replicate register submodule pattern (loader + action + component) with AG Grid replacing TanStack Table
- **Schema**: Use existing tables/views where possible; only create hr_employee_review migration
- **Stack**: React Router 7 SSR, Supabase, TypeScript, Tailwind CSS 4, Shadcn UI — no new UI libraries beyond AG Grid

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AG Grid Community over Enterprise | Free tier covers all described UX; Enterprise features (Master/Detail, Row Grouping) not needed | ✓ Good — all 55 requirements met without Enterprise |
| Full-width detail rows for row expansion | Community alternative to Enterprise Master/Detail; achieves same click-to-expand UX | ✓ Good — works across all 8 submodules |
| AG Grid replaces TanStack Table for HR | HR demo reference requires AG Grid; TanStack Table remains for other modules | ✓ Good — clean separation, register converted successfully |
| Side-panel forms (not modals) | Matches existing register pattern; consistent UX across all submodules | ✓ Good — consistent create/edit UX |
| Manual status toggle for approvals | Time off pending/approved is toggled in-row; no automated workflow | ✓ Good — simple and predictable |
| autoHeight domLayout for AG Grid | Natural page flow without fixed grid height | ✓ Good — no scroll-within-scroll issues |
| URL searchParams for filter state | Enables loader revalidation on filter changes without local state | ✓ Good — used in scheduler, payroll, hours comparison |
| FULL OUTER JOIN for hours comparison | Shows employees with schedule-only or payroll-only entries | ✓ Good — catches discrepancies both ways |
| GENERATED ALWAYS AS STORED for review avg | DB-computed average prevents client-side tampering | ✓ Good — data integrity enforced at schema level |
| Server-side category/lock enforcement | Housing category and review lock checks in action, not client | ✓ Good — prevents form tampering |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 after v1.0 milestone*
