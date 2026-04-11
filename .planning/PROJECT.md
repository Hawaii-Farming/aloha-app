# Aloha ERP App

## What This Is

Aloha is a farm operations ERP for Hawaii Farming. v1.0 wired up the HR module with AG Grid tables and CRUD forms on a Supabase-inspired theme. v2.0 replaced that theme with the polished Aloha design system (light-first, dark adapted) across the app shell — sidebar, top navbar, mobile drawer, design tokens, shared primitives, and AG Grid theme — without touching feature behavior.

## Core Value

Every module renders real data from the database and supports full CRUD operations through a polished, consistent shell and design system that feels fast and clear to field and office users alike.

## Current State

**Shipped:** v2.0 Aloha Design System Retheme (2026-04-10)

**Next milestone:** TBD — start with `/gsd-new-milestone`. Likely candidates: role-specific app shells (Doer / Manager / Executive), command palette implementation, page-level redesigns inheriting new tokens, Framer Motion page transitions.

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
- ✓ DESIGN.md rewritten as Aloha theme source of truth (Inter 16px, green-500→emerald-600 gradient, slate neutrals, rounded-2xl, shadow scale, light-first) — v2.0
- ✓ Tailwind 4 `@theme` tokens + Inter variable font + WCAG AA verification script — v2.0
- ✓ Shared primitives restyled (Button, Card, Badge, Avatar, Input/Textarea/Select, Sheet) with zero caller prop changes — v2.0
- ✓ 72px workspace navbar with gradient Aloha logo, ⌘K search trigger, profile menu, and org-derived avatar initials — v2.0
- ✓ Workspace sidebar 220/68px with gradient active pill, accordion sub-items, persisted collapse, and structural parity with prototype (NAVIGATION/MODULES headers, chevron dropdowns, Focused footer) — v2.0
- ✓ Framer Motion mobile drawer with backdrop, hamburger trigger, explicit close, and shared nav source — v2.0
- ✓ AG Grid theme rewrite (`themeQuartz.withParams` to Aloha tokens) across all HR grids with bounded flex-chain fill and toolbar search rounded-md — v2.0
- ✓ Dark-mode elevated navbar/sidebar surfaces + themed scrollbars + WCAG AA audit across shell, primitives, and grid — v2.0
- ✓ Sidebar toggle relocated to navbar (leftmost, before logo) and command-palette module navigation fixed — v2.0

### Active

(To be defined for next milestone via `/gsd-new-milestone`.)

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

Shipped v2.0 with 4 phases, 22 plans across 166 commits (144 files changed, +21,255/-1,445 lines). Timeline: 1 day (2026-04-10, ~12h sprint).

- **Design tokens**: DESIGN.md rewritten as Aloha theme spec (Inter 16px, slate neutrals, green-500→emerald-600 gradient primary, rounded-2xl scale, shadow tokens, light-first). Tailwind 4 `@theme` block carries palette, radius, font, and shadow tokens. `scripts/verify-wcag.mjs` enforces 24 contrast assertions.
- **Primitives**: Button, Card, Badge, Avatar, Input, Textarea, Select, Sheet restyled via cva using Phase 7 tokens — zero caller prop changes. §9.1 Option A focus ring (`ring-2 ring-primary ring-offset-2`) applied across all form primitives.
- **Workspace shell**: 72px navbar with gradient AlohaLogoSquare, ⌘K search trigger (renderTrigger seam over existing NavbarSearch), WorkspaceNavbarProfileMenu, and `getOrgInitials`-derived avatar. 220/68px sidebar with gradient active pill, accordion sub-items, persisted collapse cookie, NAVIGATION/MODULES section headers, chevron module dropdowns, "Focused" footer, and themed scrollbars. Sidebar toggle sits leftmost in navbar (before logo).
- **Mobile shell**: WorkspaceMobileHeader (hamburger + logo + avatar) + WorkspaceMobileDrawer (Framer Motion spring + fade, black/30 backdrop, explicit X close, auto-close on route change). Drawer reuses the same nav data source as the desktop sidebar.
- **AG Grid**: `ag-grid-theme.ts` rewritten via `themeQuartz.withParams` to Aloha hexes and Inter Variable for both themes. Workspace layout uses a bounded flex chain so every HR grid fills its container. Toolbar search input overridden to rounded-md.
- **Dark mode**: Navbar and sidebar render on distinct elevated dark surfaces (not page bg). All token pairs pass WCAG AA in both themes. next-themes toggle produces no layout shifts.
- **UAT bug fixes**: BUG-01 (active-pill immediacy on module click and initial route load), BUG-02 (command-palette navigation to module-level links).
- **Dual tenant model (unchanged)**: Template auth (accounts/memberships) coexists with business auth (org/hr_employee). All data queries org-scoped. v2.0 shipped without touching loaders, actions, i18n, CSRF, or CRUD flows.
- **Post-ship polish**: Quick task 260410-sl6 landed a mobile responsiveness pass (AG Grid search input shrink, mobile search dialog, container-query detail rows, toolbar reorder, navbar search label-inclusive filtering).

## Constraints

- **UI Library**: AG Grid Community (free) only — no Enterprise modules
- **Design**: Must follow DESIGN.md color tokens, typography, spacing for both dark and light themes
- **Pattern**: Replicate register submodule pattern (loader + action + component) with AG Grid replacing TanStack Table
- **Schema**: Use existing tables/views where possible; only create hr_employee_review migration
- **Stack**: React Router 7 SSR, Supabase, TypeScript, Tailwind CSS 4, Shadcn UI — no new UI libraries beyond AG Grid
- **v2.0 retheme**: Shell chrome + design tokens only — no feature changes, no new pages, no role/device switching. Preserve Shadcn/Radix, Tailwind 4, AG Grid. Light mode canonical, dark adapted. WCAG AA both themes. No breaking changes to component props or route loaders.

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
| Aloha design system as DESIGN.md rewrite (v2.0) | Single source of truth — every token, primitive, and shell surface inherits from one spec | ✓ Good — Phases 8/9/10 consumed it without drift |
| Light-first palette with derived dark (v2.0) | Dark mode stops being a second design pass; WCAG AA verified via script | ✓ Good — 24 contrast assertions green, no token regressions |
| cva + Phase 7 tokens for primitive restyle (v2.0) | Zero caller prop changes; visual-only updates across Button/Card/Badge/Avatar/Input/Textarea/Select/Sheet | ✓ Good — Phase 8 shipped without touching consumers |
| Framer Motion for mobile drawer only (v2.0) | Targeted dependency — spring + fade match prototype timing without adopting it for page transitions yet | ✓ Good — single import surface |
| `themeQuartz.withParams` for AG Grid (v2.0) | Drives all HR grids from Aloha tokens; no per-grid code changes | ✓ Good — grids inherited theme automatically |
| Bounded flex chain for workspace content area (v2.0) | Fixes AG Grid shrink/collapse without per-grid height hacks | ✓ Good — every HR grid fills its container |
| `renderTrigger` seam on NavbarSearch (v2.0) | Keeps existing search behavior intact while letting the new navbar render its own trigger | ✓ Good — backward compatible, used by navbar + mobile header |
| Sidebar toggle moved to navbar leftmost position (v2.0) | Matches prototype; retires detached edge toggle | ✓ Good — one affordance, discoverable |
| Org-derived avatar initials via `getOrgInitials` (v2.0) | Personalizes shell to tenant; sourced from loaded org context | ✓ Good — no extra query, pure helper |

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
*Last updated: 2026-04-10 — after v2.0 Aloha Design System Retheme milestone*
