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
- AG Grid Community integration as new dependency (replacing TanStack Table for HR module) — Validated in Phase 1: AG Grid Foundation
- AG Grid themed to DESIGN.md (Supabase-inspired dark/light theme) — Validated in Phase 1: AG Grid Foundation

### Active
- [x] Scheduler submodule — weekly schedule grid (ops_task_weekly_schedule view) + historical data (ops_task_schedule) + Create form (employee, task, date, start/end time) — Validated in Phase 2
- [x] Time Off submodule — hr_time_off_request table with status filters (all/pending/approved) + Create form + inline status toggle — Validated in Phase 3
- [ ] Hours Comparison submodule — computed view comparing ops_task_schedule hours vs hr_payroll hours per employee + row-click daily breakdown
- [ ] Payroll Comparison submodule — hr_payroll aggregated by task and by employee (2 table views)
- [ ] Payroll Comp Manager submodule — hr_payroll data filtered/grouped by compensation_manager_id (to be confirmed from schema investigation)
- [ ] Payroll Data submodule — detailed hr_payroll records (full payroll line items per employee per pay period)
- [ ] Housing submodule — org_site (category=housing) with max beds/available beds + row-click tenant details (hr_employee where site_id = housing)
- [ ] Employee Review submodule — new table (hr_employee_review) with quarterly scores (productivity, attendance, quality, engagement 1-3), average, notes, lead, locked flag + filter by Year-Quarter
- [ ] Full-width detail rows in AG Grid Community for all row-click-to-expand interactions
- [ ] Side-panel forms for Create/Edit following register pattern (right-side panel with form fields, save/cancel)

### Out of Scope

- AG Grid Enterprise features — using Community (free) tier only
- Mobile-specific layouts — web-first
- Real-time collaboration / live updates — standard request/response
- Payroll import/processing — hr_payroll is imported externally, this project only displays it
- Approval workflow automation — status changes are manual toggles in the row

## Context

- **Existing pattern**: The register submodule (`sub-module.tsx`) uses `getModuleConfig()` registry, `loadTableData()`, and `TableListView` component. AG Grid replaces this for HR submodules.
- **Database**: All HR tables exist except `hr_employee_review` (needs migration). Scheduler uses ops_task_schedule + ops_task_tracker tables and ops_task_weekly_schedule view. Housing uses org_site with category filtering.
- **Design**: DESIGN.md defines Supabase-inspired theme with dark-mode-native colors, emerald green accents, Geist font. AG Grid must be themed to match (ag-theme-quartz as base, custom CSS overrides).
- **AG Grid reference**: https://www.ag-grid.com/example-hr/ adapted to our design system. Using full-width detail rows (Community feature) instead of Enterprise Master/Detail for row expansion.
- **Dual tenant model**: Template auth (accounts/memberships) coexists with business auth (org/hr_employee). All data queries are org-scoped via hr_employee membership.
- **Undetermined submodules**: Payroll Comp Manager and Payroll Data need schema investigation during research phase to confirm exact data shape and UI requirements.

## Constraints

- **UI Library**: AG Grid Community (free) only — no Enterprise modules
- **Design**: Must follow DESIGN.md color tokens, typography, spacing for both dark and light themes
- **Pattern**: Replicate register submodule pattern (loader + action + component) with AG Grid replacing TanStack Table
- **Schema**: Use existing tables/views where possible; only create hr_employee_review migration
- **Stack**: React Router 7 SSR, Supabase, TypeScript, Tailwind CSS 4, Shadcn UI — no new UI libraries beyond AG Grid

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AG Grid Community over Enterprise | Free tier covers all described UX; Enterprise features (Master/Detail, Row Grouping) not needed | -- Pending |
| Full-width detail rows for row expansion | Community alternative to Enterprise Master/Detail; achieves same click-to-expand UX | -- Pending |
| AG Grid replaces TanStack Table for HR | HR demo reference requires AG Grid; TanStack Table remains for other modules | -- Pending |
| Side-panel forms (not modals) | Matches existing register pattern; consistent UX across all submodules | -- Pending |
| Manual status toggle for approvals | Time off pending/approved is toggled in-row; no automated workflow | -- Pending |

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
*Last updated: 2026-04-09 after Phase 3 completion*
