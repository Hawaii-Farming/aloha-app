---
phase: 09-app-shell-navbar-sidebar-drawer
plan: 06
subsystem: app-shell/sidebar+navbar
tags: [sidebar, navbar, gap-closure, ui, wave-1]
requires: [phase-09-01-sidebar-shell, phase-09-02-workspace-navbar]
provides:
  - sidebar-module-header-navigation
  - sidebar-chevron-dedicated-toggle
  - navbar-above-sidebar-stacking
  - sidebar-below-navbar-top-offset
affects:
  - app/components/sidebar/module-sidebar-navigation.tsx
  - app/components/sidebar/workspace-sidebar.tsx
  - app/components/workspace-shell/workspace-navbar.tsx
  - app/components/workspace-shell/workspace-mobile-header.tsx
tech-stack:
  added: []
  patterns:
    - "className override on shadcn <Sidebar> to reposition fixed inner panel"
    - "Split label: <Link> for navigation + sibling <CollapsibleTrigger> for accordion"
    - "relative z-20 on header to establish stacking context above fixed sidebar z-10"
key-files:
  created: []
  modified:
    - app/components/sidebar/module-sidebar-navigation.tsx
    - app/components/sidebar/workspace-sidebar.tsx
    - app/components/workspace-shell/workspace-navbar.tsx
    - app/components/workspace-shell/workspace-mobile-header.tsx
decisions:
  - "Module header becomes <Link>; chevron becomes dedicated CollapsibleTrigger (preserves a11y)"
  - "Fix sidebar z-layering via className override on <Sidebar>, not by editing packages/ui/src/shadcn/sidebar.tsx"
  - "onClick on header Link also opens accordion if closed (UX parity across branches)"
metrics:
  duration: 8min
  completed: 2026-04-10
  tasks: 3
  files: 4
closes_gaps: [1, 5]
---

# Phase 9 Plan 6: Sidebar Layer Gap Closure Summary

Closed UAT gaps 1 and 5 — active-module gradient pill now follows the URL for every module (not just Human Resources), and the workspace navbar renders fully above the sidebar (logo + wordmark no longer covered).

## What Was Built

### Task 1 — Collapsed branch module header navigation (commit `4ecfb34`)

`app/components/sidebar/module-sidebar-navigation.tsx` (collapsed branch, lines ~103–118):
- Removed the `<CollapsibleTrigger asChild>` wrapping `SidebarMenuButton`.
- Replaced with `<SidebarMenuButton asChild>` wrapping a `<Link to={modulePath}>`.
- `onClick` on the Link expands the accordion if currently closed and calls `onNavigate?.()`.
- Outer `<Collapsible open={isOpen}>` wrapper kept so `CollapsibleContent` (sub-items popover) still renders in icon mode.

### Task 2 — Expanded branch: split label into Link + chevron trigger (commit `b9e31d5`)

`app/components/sidebar/module-sidebar-navigation.tsx` (expanded branch, lines ~171–205):
- Removed the `<CollapsibleTrigger asChild>` wrapping the full `SidebarGroupLabel`.
- `SidebarGroupLabel` now contains two siblings:
  - `<Link to={modulePath}>` with icon + uppercase module name (flex-1) — carries navigation + auto-opens accordion.
  - `<CollapsibleTrigger asChild><button aria-label="Toggle ... sub-items">` wrapping the chevron svg — dedicated accordion affordance.
- Removed `cursor-pointer` from `SidebarGroupLabel` and added `p-0` so the inner link carries its own padding.
- Hover background moved from the label onto the link/button children so the active-module gradient is not polluted by hover state.

### Task 3 — Sidebar below navbar + navbar stacking context (commit `ebd0783`)

`app/components/sidebar/workspace-sidebar.tsx`:
- `<Sidebar>` className extended with `md:top-[72px] md:h-[calc(100svh-72px)]` so the fixed inner panel (which has `fixed inset-y-0 h-svh z-10` in `packages/ui/src/shadcn/sidebar.tsx`) is pushed below the 72px navbar on md and up.

`app/components/workspace-shell/workspace-navbar.tsx`:
- `<header>` className gained `relative z-20` so it establishes a stacking context above the sidebar panel's `z-10`.

`app/components/workspace-shell/workspace-mobile-header.tsx`:
- `<header>` className gained `relative z-20` for symmetry with the desktop navbar.

`packages/ui/src/shadcn/sidebar.tsx` was NOT modified — fix routed entirely through the `className` prop on `<Sidebar>` per plan guardrail.

## UAT Gaps Closed

- **Test 1 (gap 1)** — "All active modules render with the green→emerald gradient pill (not just Human Resources)". Closed by Tasks 1+2: module headers now navigate, URL follows clicks, `isModuleActive` now matches every clicked module.
- **Test 5 (gap 5)** — "Workspace navbar renders above/in front of the sidebar". Closed by Task 3: navbar has `relative z-20` and sidebar is offset down 72px via `md:top-[72px] md:h-[calc(100svh-72px)]`.

## Requirements Satisfied

- **SIDEBAR-01** — Confirmed: 220/68 widths untouched; navigation affordance added without altering dimensions.
- **SIDEBAR-02** — Gradient pill now actually reaches every active module.
- **NAVBAR-01** — Navbar 72px height, tokens, and layout unchanged; only `relative z-20` added to guarantee it paints above the sidebar.

## Deviations from Plan

None — all three tasks executed exactly as written. Pre-commit `prettier-plugin-tailwindcss` reordered some Tailwind class tokens on commit (cosmetic only); all required literal substrings (`to={modulePath}`, `md:top-[72px]`, `relative z-20`) remain intact and verified via grep.

## Verification

- `pnpm typecheck` → passes (exit 0).
- `pnpm lint` → 0 errors, 4 pre-existing warnings only (all in `packages/ui/src/shadcn/data-table.tsx`, unrelated `react-hooks/incompatible-library` for TanStack Table).
- Grep assertions:
  - `to={modulePath}` in `module-sidebar-navigation.tsx` → 2 matches (collapsed + expanded branches).
  - `md:top-[72px]` in `workspace-sidebar.tsx` → 1 match.
  - `relative z-20` in `workspace-navbar.tsx` → 1 match.
  - `relative z-20` in `workspace-mobile-header.tsx` → 1 match.
- Manual browser verification deferred to the phase-level UAT re-run (after all gap-closure plans merge).

## Commits

- `4ecfb34` fix(09-06): make collapsed sidebar module header navigate
- `b9e31d5` fix(09-06): make expanded sidebar module header navigate + chevron toggle
- `ebd0783` fix(09-06): push sidebar below navbar + stack navbar above sidebar

## Known Stubs

None. No hardcoded empty data, no placeholder UI introduced.

## Self-Check: PASSED

- FOUND: app/components/sidebar/module-sidebar-navigation.tsx (modified)
- FOUND: app/components/sidebar/workspace-sidebar.tsx (modified)
- FOUND: app/components/workspace-shell/workspace-navbar.tsx (modified)
- FOUND: app/components/workspace-shell/workspace-mobile-header.tsx (modified)
- FOUND: commit 4ecfb34
- FOUND: commit b9e31d5
- FOUND: commit ebd0783
