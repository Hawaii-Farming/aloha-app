# Roadmap: HR Module Submodules

## Overview

Wire up all HR submodules with AG Grid Community tables, starting from a shared grid foundation and progressing through each submodule category. Phase 1 builds the reusable AG Grid infrastructure (theming, wrapper, detail rows, side-panel forms). Phases 2-6 deliver each submodule vertical slice against that foundation, ordered by complexity and dependency: Scheduler first (most complex, validates the grid patterns), then Time Off (status workflow), Payroll Views (three related read-only views), Hours Comparison (cross-table joins), and finally Housing plus Employee Review (both need schema migrations).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: AG Grid Foundation** - Shared grid infrastructure, theming, wrapper component, detail rows, side-panel forms, and cell renderers
- [ ] **Phase 2: Scheduler** - Weekly schedule grid with week navigation, historical data, overtime flags, and create form
- [ ] **Phase 3: Time Off** - Time off request grid with status filter tabs, inline approve/deny toggle, and create form
- [ ] **Phase 4: Payroll Views** - Three payroll display submodules: Comparison (by task/employee), Comp Manager, and Payroll Data
- [ ] **Phase 5: Hours Comparison** - Scheduled vs payroll hours comparison grid with variance highlighting and daily breakdown
- [ ] **Phase 6: Housing & Employee Review** - Housing sites with tenant details and employee review scoring with new schema migrations

## Phase Details

### Phase 1: AG Grid Foundation
**Goal**: All shared AG Grid infrastructure is built and themed so submodule phases can compose grids without reinventing plumbing
**Depends on**: Nothing (first phase)
**Requirements**: GRID-01, GRID-02, GRID-03, GRID-04, GRID-05, GRID-06, GRID-07, GRID-08, GRID-09, GRID-10, GRID-11, GRID-12, GRID-13, GRID-14, GRID-15
**Success Criteria** (what must be TRUE):
  1. AG Grid renders in both dark and light themes matching DESIGN.md colors with no visual glitches
  2. Register submodule is converted from TanStack Table to AG Grid with sorting, filtering, quick-filter search, pagination, column resize/reorder, and CSV export all working
  3. Clicking a row expands a full-width detail row below it with custom content
  4. A side-panel (Shadcn Sheet) opens for create/edit with form fields, save, and cancel
  5. Status badges, formatted dates/currency, and employee avatars render correctly in grid cells
**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Install AG Grid, create theme config and cell renderers/formatters
- [x] 01-02-PLAN.md — Create AgGridWrapper component and column mapper utility
- [x] 01-03-PLAN.md — Detail row expansion, column state persistence, CSV export, conditional styling
- [x] 01-04-PLAN.md — Convert register submodule to AG Grid with visual verification
**UI hint**: yes

### Phase 2: Scheduler
**Goal**: Users can view the weekly employee schedule, navigate between weeks, see overtime flags, drill into historical data, and create new schedule entries
**Depends on**: Phase 1
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08
**Success Criteria** (what must be TRUE):
  1. Weekly schedule grid displays employee rows with Sun-Sat day columns populated from ops_task_weekly_schedule view
  2. User can navigate between weeks (previous/next/current) and the grid updates to show that week's data
  3. Employees exceeding the OT threshold are visually flagged in the grid
  4. Clicking a row expands to show that employee's historical schedule entries
  5. User can create a new schedule entry via the side-panel form and see it appear in the grid
**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — View migration (add profile_photo_url, department/work auth names), CRUD config, Zod schema
- [x] 02-02-PLAN.md — SchedulerListView with week navigation, department filter, OT highlighting, schema reset
- [x] 02-03-PLAN.md — Detail row expansion, history toggle, create panel, visual verification
**UI hint**: yes

### Phase 3: Time Off
**Goal**: Users can view, filter, create, and approve/deny time off requests
**Depends on**: Phase 1
**Requirements**: TOFF-01, TOFF-02, TOFF-03, TOFF-04, TOFF-05
**Success Criteria** (what must be TRUE):
  1. Time off grid displays all request fields including photo, name, dates, PTO days, reason, and status
  2. User can switch between All/Pending/Approved/Denied tabs and the grid filters accordingly
  3. User can approve or deny a request inline and the status updates immediately in the row
  4. Denying a request requires entering a denial reason before the action completes
  5. User can create a new time off request via the side-panel form
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — SQL view (app_hr_time_off_requests) and RLS policies
- [x] 03-02-PLAN.md — CRUD config updates, Zod schema, and action infrastructure extensions
- [x] 03-03-PLAN.md — Actions cell renderer, create route wiring, schema reset, visual verification
**UI hint**: yes

### Phase 4: Payroll Views
**Goal**: Users can view payroll data across three perspectives: aggregated by task, aggregated by employee, filtered by compensation manager, and as detailed line items
**Depends on**: Phase 1
**Requirements**: PCMP-01, PCMP-02, PCMP-03, PCMP-04, PCMP-05, PCMP-06, PMGR-01, PMGR-02, PMGR-03, PMGR-04, PDAT-01, PDAT-02, PDAT-03, PDAT-04, PDAT-05
**Success Criteria** (what must be TRUE):
  1. Payroll Comparison submodule shows aggregated-by-task and aggregated-by-employee views with a toggle to switch between them, and pinned totals row at bottom
  2. Payroll Comp Manager submodule shows payroll data filtered by compensation manager with a manager selector and summary totals
  3. Payroll Data submodule displays all hr_payroll columns organized into column groups (Hours/Earnings/Deductions/Employer Costs) with pay period and employee filters
  4. CSV export works on payroll data grids
  5. All three payroll submodules filter by pay period
**Plans:** 4 plans

Plans:
- [x] 04-01-PLAN.md — SQL views, payroll formatters, infrastructure extensions, configs, registry, loader generalization
- [x] 04-02-PLAN.md — Payroll Comparison custom list view with toggle, period filter, pinned totals
- [x] 04-03-PLAN.md — Payroll Comp Manager custom list view with manager selector, period filter, pinned totals
- [x] 04-04-PLAN.md — Payroll Data filter bar, Create button hiding, schema reset, visual verification
**UI hint**: yes

### Phase 5: Hours Comparison
**Goal**: Users can compare scheduled hours against payroll hours per employee and investigate daily breakdowns for discrepancies
**Depends on**: Phase 1
**Requirements**: HCMP-01, HCMP-02, HCMP-03, HCMP-04, HCMP-05
**Success Criteria** (what must be TRUE):
  1. Comparison grid shows employee photo/name, scheduled hours, payroll hours, and variance per employee
  2. User can select a pay period to scope the comparison
  3. Variance cells are highlighted with conditional styling (red/amber) when hours mismatch
  4. Clicking a row expands to show daily schedule breakdown (day, dept, task, start/end time, hours)
**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md — SQL view (app_hr_hours_comparison) and schedule-by-period API route
- [x] 05-02-PLAN.md — CRUD config, registry, loader branch, and custom list view component
- [x] 05-03-PLAN.md — Schema reset and visual verification
**UI hint**: yes

### Phase 6: Housing & Employee Review
**Goal**: Users can manage housing site occupancy and conduct quarterly employee performance reviews
**Depends on**: Phase 1
**Requirements**: HOUS-01, HOUS-02, HOUS-03, HOUS-04, EREV-01, EREV-02, EREV-03, EREV-04, EREV-05, EREV-06
**Success Criteria** (what must be TRUE):
  1. Housing grid shows housing sites with max beds and available beds; clicking a row expands to show assigned tenants
  2. User can create/edit housing sites via side-panel form
  3. Employee review grid shows quarterly scores (productivity, attendance, quality, engagement), average, and lock status with a Year-Quarter filter
  4. User can create/edit reviews via side-panel form with 1-3 score selects; locked reviews cannot be edited
  5. Clicking a review row expands to show full review details
  6. hr_employee_review table and org_site.max_beds schema migrations are applied with RLS policies
**Plans:** 4 plans

Plans:
- [x] 06-01-PLAN.md — SQL migrations: org_site max_beds, app_hr_housing view, hr_employee_review table + RLS, app_hr_employee_reviews view
- [x] 06-02-PLAN.md — Housing CRUD config, detail row with tenant API, registry entry, category auto-resolution
- [ ] 06-03-PLAN.md — Employee review config, custom list view, Year-Quarter filter, score color coding, lock enforcement
- [ ] 06-04-PLAN.md — Schema push to hosted Supabase, typecheck, visual verification
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. AG Grid Foundation | 0/4 | Planning complete | - |
| 2. Scheduler | 0/3 | Planning complete | - |
| 3. Time Off | 0/TBD | Not started | - |
| 4. Payroll Views | 0/4 | Planning complete | - |
| 5. Hours Comparison | 0/3 | Planning complete | - |
| 6. Housing & Employee Review | 0/4 | Planning complete | - |
