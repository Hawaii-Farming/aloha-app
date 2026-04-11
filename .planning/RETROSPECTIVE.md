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

## Milestone: v2.0 — Aloha Design System Retheme

**Shipped:** 2026-04-10
**Phases:** 4 | **Plans:** 22 | **Requirements:** 40

### What Was Built
- DESIGN.md rewritten as Aloha theme source of truth (Inter 16px, green-500→emerald-600 gradient, slate neutrals, rounded-2xl scale, shadow tokens, light-first)
- Tailwind 4 `@theme` tokens + Inter Variable font + `scripts/verify-wcag.mjs` (24 contrast assertions)
- Shared primitives restyled via cva: Button, Card, Badge, Avatar, Input/Textarea/Select, Sheet — zero caller prop changes
- 72px WorkspaceNavbar with AlohaLogoSquare, renderTrigger-seamed ⌘K search, WorkspaceNavbarProfileMenu, org-derived avatar initials
- 220/68px sidebar with gradient active pill, accordion sub-items, persisted collapse, NAVIGATION/MODULES headers, chevron dropdowns, "Focused" footer, themed scrollbars
- WorkspaceMobileHeader + WorkspaceMobileDrawer (Framer Motion spring + fade, explicit close, shared nav source)
- AG Grid theme rewrite via `themeQuartz.withParams` + workspace layout bounded flex chain + toolbar search rounded-md
- BUG-01 active-pill immediacy + BUG-02 cmdk module navigation + full WCAG AA audit in both themes

### What Worked
- **Token-first foundation (Phase 7 before primitives)**: Every downstream phase consumed DESIGN.md tokens directly; no palette drift between phases
- **cva + additive props for primitive restyle**: Phase 8 shipped 6 primitives with zero caller prop changes — pure visual updates
- **`renderTrigger` seam on NavbarSearch**: Backward-compatible extension point for the new navbar without forking search behavior
- **Prototype as visual source of truth**: `../aloha-design/prototype` gave Phase 10 concrete targets for parity (sidebar structure, scrollbar styling, dark-mode surfaces) — stopped visual bikeshedding
- **WCAG verification script in Phase 7**: Caught 6 contrast failures early, escalated to human for palette decisions instead of silent retuning (Rule 4)
- **Single-day sprint**: 4 phases, 22 plans, 166 commits in ~12h — momentum carried through because foundation was locked before primitives shipped
- **Phase 10 as gap-closure phase**: Rather than cramming parity work into Phase 9, deferring to a dedicated Phase 10 kept Phase 9's scope tight and made the parity audit explicit

### What Was Inefficient
- **Roadmap/requirements drift during execution**: PRIM-01..06 stayed unchecked in REQUIREMENTS.md even after Phase 8 shipped; progress table in ROADMAP.md showed "0/0" for Phase 8 mid-milestone. Same pattern as v1.0 — still not fixed.
- **SUMMARY.md structure not machine-readable**: `gsd-tools summary-extract --pick one_liner` returned garbage ("Found during:", "Before:", "One-liner:") because summaries use different heading layouts per phase. MILESTONES.md needed manual rewrite.
- **Post-ship polish creep**: Quick task 260410-sl6 landed ~30 mobile-responsiveness fixes after the milestone was declared shipped. These should have been a Phase 11 (mobile polish) rather than a "quick" task.
- **No pre-ship milestone audit run**: `/gsd-audit-milestone` was skipped; we only discovered the unchecked PRIM requirements during `/gsd-complete-milestone`.
- **Phase 9 scope grew mid-flight**: Plans 09-06, 09-07, 09-08 were added as gap closures after the initial 5-plan phase was declared done, inflating Phase 9 from 5→8 plans.

### Patterns Established
- **Token-first design system flow**: DESIGN.md → Tailwind `@theme` → cva primitives → shell → feature surfaces. Every layer consumes the layer above via CSS variables, not hard-coded hex.
- **`renderTrigger` render-prop seam**: When extending shell components (navbar, search) without breaking existing callers, expose a render-prop slot rather than forking.
- **`getOrgInitials` helper**: Derive avatar fallbacks from loaded org context — no extra query, pure function, reusable.
- **Bounded flex chain for AG Grid containers**: Workspace layout guarantees `min-h-0` propagates so grid virtual scroller gets a bounded parent; eliminates per-grid height hacks.
- **Framer Motion as targeted dep, not page-transition library**: Installed only for mobile drawer; single import surface; page transitions deferred.
- **Prototype repo as visual reference**: `../aloha-design/prototype` becomes the canonical target for "does it match?" audits — faster than token-by-token specs.
- **WCAG verification script as phase gate**: Automated contrast assertions run as part of phase closure, not as a final sweep.

### Key Lessons
1. **Lock the foundation before building on it.** Phase 7 (tokens) finished completely before Phase 8 (primitives) started — zero rework when downstream consumers pulled from locked CSS variables.
2. **A prototype repo beats a spec document for visual parity work.** Phase 10 wouldn't have hit structural parity without `../aloha-design/prototype` as the concrete target.
3. **Restyles should be visual-only by contract.** Zero caller prop changes across 8 primitives is possible and keeps blast radius contained — make it an explicit rule for future restyle phases.
4. **Requirements and roadmap drift is a recurring v1.0→v2.0 pattern.** The GSD workflow needs a mid-phase progress sync step or this will repeat in v3.0. Not a one-off.
5. **"Quick tasks" after milestone close are a smell.** 260410-sl6's 30 mobile fixes should have been their own phase. If you're doing >5 commits of polish, it's a phase, not a quick task.
6. **Audit before archive, not during.** Running `/gsd-complete-milestone` without `/gsd-audit-milestone` first meant discovering unchecked requirements at archive time. Audit should be a hard gate.

### Cost Observations
- Model mix: ~100% opus (executor + planner), Claude Code default
- Sessions: ~5 (one per phase + milestone setup + close)
- Notable: 1-day turnaround (12h sprint) for a full design-system retheme across shell + primitives + grid is fast; the token-first approach meant phases could execute in parallel waves without conflict

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 6 | 21 | Foundation-first approach; pattern replication across submodules |
| v2.0 | 4 | 22 | Token-first design system; cva primitives with zero prop changes; prototype repo as visual reference; dedicated gap-closure phase |

### Top Lessons (Verified Across Milestones)

1. Foundation phases that build reusable infrastructure dramatically accelerate subsequent work (v1.0: AG Grid wrapper → 8 submodules; v2.0: DESIGN.md tokens → primitives/shell/grid)
2. SQL views / shared theme files for aggregation/styling keep application code simple and maintainable
3. Roadmap/requirements drift during execution is a recurring pain point — appears in both v1.0 and v2.0; GSD workflow needs a mid-phase sync
4. Visual reference material (prototype repo, reference grids) beats prose specs for UI parity work
5. Phases should have sharp scope; gap-closure work belongs in a dedicated phase, not appended to an in-flight one
