# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — HR Module Submodules

**Shipped:** 2026-04-09
**Phases:** 6 | **Plans:** 21 | **Tasks:** 43

### What Was Built
- AG Grid Foundation: themed wrapper, detail rows, column persistence, CSV export, cell renderers
- 8 HR submodules with AG Grid tables: Register, Scheduler, Time Off, 3x Payroll, Hours Comparison, Housing, Employee Review
- 10+ SQL views for data aggregation (payroll by task/employee/manager, hours comparison, housing occupancy, reviews)
- 4 schema migrations pushed to hosted Supabase (org_site max_beds, app_hr_housing, hr_employee_review, app_hr_employee_reviews)
- Reusable patterns: filterSlot, additionalCreateFields, custom loader branching, inline action renderers

### What Worked
- **Pattern replication**: Building Phase 1 foundation first (AG Grid wrapper, theming, detail rows) made Phases 2-6 significantly faster — each submodule was a composition exercise, not greenfield
- **SQL views for aggregation**: Moving aggregation logic to PostgreSQL views kept loaders simple and type-safe
- **Custom list view pattern**: Submodules that needed special UX (scheduler week nav, payroll toggles, hours variance) got dedicated components while sharing the same wrapper infrastructure
- **Rapid velocity**: 21 plans in 3 days (avg ~3min/plan) — the GSD workflow kept momentum high with minimal context switching

### What Was Inefficient
- **Progress table in ROADMAP.md** not updated during execution — still shows "0/N" and "Planning complete" for all phases despite full completion
- **STATE.md metrics drift**: Velocity section shows 0 plans completed despite per-plan timing data existing in the same file
- **Schema push ceremony**: Each phase that needed hosted Supabase changes required a separate plan just for `supabase db push` + typegen — could be batched

### Patterns Established
- **AgGridWrapper + AgGridListView**: Two-level composition — wrapper for custom views, list view for standard CRUD grids
- **Custom loader branching**: `sub-module.tsx` routes to slug-specific loader logic for views needing extra data (pay periods, managers, week params)
- **filterSlot prop**: Toolbar customization without modifying the list view component
- **Detail row API fetch**: Expand-to-load pattern (housing tenants, schedule history, hours breakdown) using API routes
- **Server-side enforcement**: Category resolution, lock checks, and field injection in actions — never trust client-side state

### Key Lessons
1. Foundation-first phases pay for themselves — investing in reusable infrastructure (theming, wrapper, cell renderers) made every subsequent phase faster
2. SQL views are the right abstraction for read-heavy grids — they keep TypeScript loaders clean and push filtering/joining to the database
3. AG Grid Community is sufficient for complex HR UX — full-width detail rows, column groups, pinned rows, and conditional styling covered all 55 requirements without Enterprise
4. URL searchParams for filter state enables SSR revalidation naturally — better than local useState for filters that affect server data

### Cost Observations
- Model mix: 100% opus (executor + planner)
- Sessions: ~6 (one per phase + milestone setup)
- Notable: 3-day turnaround for 8 submodules is fast; foundation phase was the bottleneck, subsequent phases averaged under 30min each

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 6 | 21 | Foundation-first approach; pattern replication across submodules |

### Top Lessons (Verified Across Milestones)

1. Foundation phases that build reusable infrastructure dramatically accelerate subsequent work
2. SQL views for aggregation keep application code simple and maintainable
