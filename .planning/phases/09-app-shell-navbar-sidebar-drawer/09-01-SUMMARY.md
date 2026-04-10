---
phase: 09-app-shell-navbar-sidebar-drawer
plan: 01
subsystem: app-shell/sidebar
tags: [sidebar, aloha-theme, ui, wave-1]
requires: [phase-07-tokens, phase-08-primitives]
provides:
  - sidebar-220-68-widths
  - gradient-active-module-pill
  - green-50-subitem-chip-with-rail
  - module-nav-onNavigate-prop
  - module-nav-forceExpanded-prop
affects:
  - packages/ui/src/shadcn/sidebar.tsx
  - app/components/sidebar/workspace-sidebar.tsx
  - app/components/sidebar/module-sidebar-navigation.tsx
tech-stack:
  added: []
  patterns:
    - "Literal green/emerald classes as intentional exception (D-09, D-11)"
    - "forceExpanded prop to skip collapsed branch for drawer reuse outside <Sidebar>"
key-files:
  created: []
  modified:
    - packages/ui/src/shadcn/sidebar.tsx
    - app/components/sidebar/module-sidebar-navigation.tsx
    - app/components/sidebar/workspace-sidebar.tsx
decisions:
  - "Literal Tailwind classes for active-state greens per D-09/D-11 (no tokens)"
  - "forceExpanded wraps only the collapsed branch so desktop behavior is preserved"
  - "No refactor of auto-expand useState/toggleModule per D-12"
metrics:
  duration: 3min
  completed: 2026-04-10
  tasks: 3
  files: 3
---

# Phase 9 Plan 1: Sidebar Shell Restyle Summary

Restyled the desktop sidebar to the Aloha visual spec (220/68 widths, gradient active module pill, green-50 sub-item chip with green-200 left rail, PanelLeft toggle) and added `onNavigate`/`forceExpanded` props to `ModuleSidebarNavigation` so Plan 09-03's mobile drawer can reuse the navigation without duplicating configuration.

## What Was Built

### Task 1 — Sidebar width constants (commit `0ea7db2`)

`packages/ui/src/shadcn/sidebar.tsx`:
- `SIDEBAR_WIDTH` bumped from `'14rem'` to `'13.75rem'` (220px).
- `SIDEBAR_WIDTH_ICON` bumped from `'4rem'` to `'4.25rem'` (68px).
- `SIDEBAR_WIDTH_MOBILE` left at `'18rem'` (still used by the shared Sheet path until Plan 09-03 replaces it).
- No API changes — constants flow through unchanged as CSS custom properties on `SidebarProvider`.

### Task 2 — Module sidebar navigation restyle + drawer-reuse props (commit `24b30f6`)

`app/components/sidebar/module-sidebar-navigation.tsx`:
- Extended `ModuleSidebarNavigationProps` with:
  - `onNavigate?: () => void` — called synchronously from each leaf `<a>` onClick before navigation (no-op by default for desktop).
  - `forceExpanded?: boolean` — when true, the collapsed-branch is skipped and the expanded branch renders unconditionally (fixes the "both branches render" bug when used outside `<Sidebar>` in drawers).
- Active module button (both collapsed + expanded branches): `bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 rounded-xl`. Inactive: `bg-transparent text-foreground hover:bg-muted rounded-xl`.
- Active sub-item chip (both branches): `bg-green-50 text-green-700 font-medium rounded-lg`. Inactive: `bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg`.
- Expanded-branch accordion body wrapped in `<div className="ml-5 border-l-2 border-green-200 pl-3">` for the green-200 left rail.
- Leaf `<a>` elements wired with `onClick={() => onNavigate?.()}`.
- Auto-expand `useState` and `toggleModule` helper left untouched per D-12 ("we restyle, we don't refactor").

Note: `prettier-plugin-tailwindcss` reordered class tokens on commit (e.g., `rounded-xl` moved, `ml-5` moved before `border-l-2`). The literal substrings required by the acceptance grep (`from-green-500 to-emerald-600`, `shadow-green-500/25`, `bg-green-50`, `text-green-700`, `border-l-2 border-green-200`) all remain present; runtime behavior is identical.

### Task 3 — Workspace sidebar wrapper (commit `ff9c8e4`)

`app/components/sidebar/workspace-sidebar.tsx`:
- `ChevronsLeft` import replaced with `PanelLeft`; `SidebarEdgeToggle` now renders the `PanelLeft` glyph, keeping the existing `useSidebar().toggleSidebar` wiring, position, and rotation animation.
- Added `data-test="workspace-sidebar-toggle"` for Plan 09-05 smoke checks.
- `<Sidebar>` root given `className="bg-card border-r border-border"` for the Phase 7 token-driven surface.
- `collapsible="icon"` contract, `SidebarProfileMenu` footer, and cookie persistence via `defaultOpen={layoutState.open}` all untouched.

## Requirements Satisfied

- **SIDEBAR-01** — 220/68 widths via constants → rendered sidebar dimensions.
- **SIDEBAR-02** — Gradient active module pill (literal green→emerald).
- **SIDEBAR-03** — Green-50 sub-item chip + green-200 left rail.
- **SIDEBAR-04** — PanelLeft glyph on edge toggle; cookie wiring unchanged.
- **DRAWER-05 foundation** — `onNavigate` + `forceExpanded` props now available to Plan 09-03.

## Deviations from Plan

None — plan executed exactly as written.

One automatic formatter change was applied by `prettier-plugin-tailwindcss` during the pre-commit hook (Tailwind class token reordering). This is expected and cosmetic; all required substrings remain present and runtime behavior is unchanged.

## Verification

- `pnpm typecheck` → exits 0.
- `pnpm lint` → 0 errors, 4 pre-existing warnings only (all in `packages/ui/src/shadcn/data-table.tsx` — unrelated `react-hooks/incompatible-library` warnings from TanStack Table).
- Grep assertions from plan acceptance criteria all pass for the required literal substrings.
- Manual visual verification deferred to Plan 09-05 per plan.

## Commits

- `0ea7db2` refactor(09-01): bump sidebar widths to 220/68 per Aloha spec
- `24b30f6` feat(09-01): restyle module sidebar nav with Aloha active states
- `ff9c8e4` refactor(09-01): workspace sidebar PanelLeft toggle + card surface

## Known Stubs

None. No hardcoded empty data, no placeholder UI introduced.

## Self-Check: PASSED

- FOUND: packages/ui/src/shadcn/sidebar.tsx (modified)
- FOUND: app/components/sidebar/module-sidebar-navigation.tsx (modified)
- FOUND: app/components/sidebar/workspace-sidebar.tsx (modified)
- FOUND: commit 0ea7db2
- FOUND: commit 24b30f6
- FOUND: commit ff9c8e4
