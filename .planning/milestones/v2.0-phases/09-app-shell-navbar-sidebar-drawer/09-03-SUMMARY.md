---
phase: 09-app-shell-navbar-sidebar-drawer
plan: 03
subsystem: app-shell/mobile
tags: [mobile, drawer, navbar, framer-motion, a11y, wave-2]
wave: 2
requires:
  - 09-01 (forceExpanded + onNavigate props on ModuleSidebarNavigation)
  - 09-02 (AlohaLogoSquare primitive)
  - 08 (Avatar primitive @aloha/ui/avatar)
provides:
  - framer-motion-at-repo-root
  - app/components/workspace-shell/workspace-mobile-header.tsx
  - app/components/workspace-shell/workspace-mobile-drawer.tsx
affects:
  - Plan 09-04 (will mount both components in the workspace layout)
  - Plan 09-05 (manual + E2E smoke verification at 375px)
tech-stack:
  added:
    - framer-motion ^12.38.0 (resolved from ^12.0.0 range, repo root only)
  patterns:
    - AnimatePresence + two motion.* siblings for backdrop + panel
    - justified useEffect for global keydown listener (Escape)
    - justified useEffect + requestAnimationFrame for post-mount focus
    - forwarded hamburgerRef for focus return on close
    - forceExpanded prop on ModuleSidebarNavigation to reuse nav config
      outside a <Sidebar> context (single nav source → DRAWER-05)
key-files:
  created:
    - app/components/workspace-shell/workspace-mobile-header.tsx
    - app/components/workspace-shell/workspace-mobile-drawer.tsx
  modified:
    - package.json
    - pnpm-lock.yaml
decisions:
  - framer-motion installed at repo root only (pnpm add -w), NOT in
    packages/ui — keeps animation lib out of the UI package boundary
    per D-22.
  - Caret range ^12.0.0 requested; pnpm resolved to 12.38.0.
  - Drawer body uses <ModuleSidebarNavigation forceExpanded> instead of
    duplicating nav markup — single nav source (DRAWER-05).
  - Focus management uses requestAnimationFrame before focusing first
    nav link so the motion.nav panel is in the DOM before focus lands.
  - Full focus trap deferred to Phase 10 (RESEARCH Open Question 3);
    this plan ships focus-on-open + focus-return-on-close only (D-27).
metrics:
  duration: ~7min
  tasks: 3
  files: 4
  completed: 2026-04-10
requirements: [NAVBAR-04, DRAWER-01, DRAWER-02, DRAWER-03, DRAWER-04, DRAWER-05]
---

# Phase 9 Plan 3: Mobile Header + Drawer Summary

Installed framer-motion at the repo root and shipped the two mobile
shell components the workspace layout will mount in Plan 09-04: a 56px
compact header (hamburger + logo + avatar) and a spring-animated left
drawer that reuses `ModuleSidebarNavigation` via `forceExpanded` so the
nav config stays single-sourced.

## What Shipped

- **framer-motion at repo root.** `pnpm add framer-motion@^12.0.0 -w`
  resolved to `^12.38.0` in the root `package.json` `dependencies`. Not
  added to `packages/ui/package.json` (D-22 — keep animation lib out of
  the UI package). Typecheck passes; framer-motion ships its own types.
- **`WorkspaceMobileHeader`.** New
  `app/components/workspace-shell/workspace-mobile-header.tsx`. 56px
  (`h-14`) compact bar with `bg-card border-b border-border md:hidden`
  so it only appears below the Tailwind `md` breakpoint (NAVBAR-04 +
  SIDEBAR-05 mobile side). Hamburger button uses `Menu` from
  `lucide-react`, `aria-label="Open navigation menu"`,
  `aria-expanded={drawerOpen}`, and forwards the `hamburgerRef` so the
  drawer can restore focus on close. Reuses `AlohaLogoSquare size="sm"`
  from Plan 09-02 + Phase 8 Avatar with email-initial fallback. Data
  test attributes: `workspace-mobile-header`,
  `workspace-mobile-header-hamburger`, `workspace-mobile-header-avatar`.
- **`WorkspaceMobileDrawer`.** New
  `app/components/workspace-shell/workspace-mobile-drawer.tsx`. Wraps
  two `motion.*` siblings inside `AnimatePresence`:
  - Backdrop: `motion.div` with `initial={{ opacity: 0 }}`,
    `animate={{ opacity: 1 }}`, `exit={{ opacity: 0 }}`, class
    `fixed inset-0 bg-black/30 z-40 md:hidden`, `onClick={onClose}`,
    `aria-hidden="true"`.
  - Panel: `motion.nav` with `initial={{ x: '-100%' }}`,
    `animate={{ x: 0 }}`, `exit={{ x: '-100%' }}`, verbatim
    `transition={{ type: 'spring', damping: 25, stiffness: 300 }}`,
    class `fixed inset-y-0 left-0 w-[260px] bg-card z-50 flex flex-col
    shadow-xl md:hidden`, `role="dialog"`, `aria-modal="true"`,
    `aria-label="Mobile navigation"`.
  - Body renders `<ModuleSidebarNavigation account={account}
    modules={…} subModules={…} onNavigate={onClose} forceExpanded />`
    — single nav source (DRAWER-05) with leaf taps auto-closing the
    drawer (DRAWER-04).
  - Two justified `useEffect` hooks:
    1. Global `keydown` listener bound to `document` that closes on
       Escape when `open` is true (per CLAUDE.md exception for keyboard
       listeners, matching NavbarSearch.tsx pattern).
    2. Post-mount DOM focus via `requestAnimationFrame`: on open,
       focuses the first `a, button` under `firstNavRef`; on close,
       focuses `hamburgerRef.current` to return focus to the trigger.

## How It Satisfies the Requirements

- **NAVBAR-04** — `WorkspaceMobileHeader` is a 56px `md:hidden` compact
  bar with hamburger + logo + wordmark + avatar.
- **DRAWER-01** — Framer Motion drawer with `bg-black/30` backdrop and
  left-slide panel.
- **DRAWER-02** — `onOpenDrawer` callback wired on the hamburger button
  (`onClick={onOpenDrawer}`); Plan 09-04 supplies the state setter.
- **DRAWER-03** — Spring `{ type: 'spring', damping: 25, stiffness: 300 }`
  verbatim on the panel; backdrop fades with default tween.
- **DRAWER-04** — Backdrop `onClick={onClose}` + leaf `onNavigate={onClose}`
  wiring both present.
- **DRAWER-05** — Drawer body renders `<ModuleSidebarNavigation
  forceExpanded …>` so the navigation config is single-sourced; no
  duplicate nav markup.
- **a11y (D-27, D-28)** — `role="dialog"`, `aria-modal="true"`,
  `aria-label="Mobile navigation"`, backdrop `aria-hidden="true"`,
  hamburger `aria-label` + `aria-expanded`, Escape key closes, focus
  moves to first nav item on open, focus returns to hamburger on close.

## Commits

| Task | Name                                                 | Commit  |
| ---- | ---------------------------------------------------- | ------- |
| 1    | Install framer-motion ^12.0.0 at repo root           | be27f10 |
| 2    | Create WorkspaceMobileHeader component               | 48c4c25 |
| 3    | Create WorkspaceMobileDrawer (Framer Motion)         | 71fa0b8 |

## Deviations from Plan

**1. [Rule 3 - Import path correction] `cn` imported from `@aloha/ui/utils`**
- **Found during:** Task 2
- **Issue:** Plan snippet used `@aloha/ui/lib/utils`, but the project-
  wide convention (documented in Plan 09-02 SUMMARY and used in
  `workspace-navbar.tsx`, `aloha-logo-square.tsx`, `workspace-sidebar.tsx`,
  `app-logo.tsx`) imports `cn` from `@aloha/ui/utils`.
- **Fix:** Used `import { cn } from '@aloha/ui/utils'`.
- **File:** `app/components/workspace-shell/workspace-mobile-header.tsx`
- **Commit:** 48c4c25

**2. [Prettier tailwindcss plugin - class reorder] Tailwind class ordering**
- **Found during:** Tasks 2 and 3 pre-commit lint-staged.
- **Issue:** `prettier-plugin-tailwindcss` auto-sorts Tailwind class
  tokens on commit. Header class became `bg-card border-border flex h-14
  shrink-0 items-center gap-3 border-b px-4 md:hidden` (plan literal:
  `h-14 px-4 bg-card border-b border-border flex items-center gap-3
  shrink-0 md:hidden`). Drawer panel became `bg-card fixed inset-y-0
  left-0 z-50 flex w-[260px] flex-col shadow-xl md:hidden` (plan literal:
  `fixed inset-y-0 left-0 w-[260px] bg-card z-50 flex flex-col shadow-xl
  md:hidden`). Drawer backdrop became `fixed inset-0 z-40 bg-black/30
  md:hidden` (plan literal: `fixed inset-0 bg-black/30 z-40 md:hidden`).
- **Impact:** Every semantic class present; runtime identical. Some of
  the plan's multi-token contiguous `rg` assertions (e.g.
  `"h-14 px-4 bg-card border-b border-border"`, `"fixed inset-0
  bg-black/30 z-40"`, `"fixed inset-y-0 left-0 w-[260px] bg-card z-50"`)
  do not match as one string. Individual-token assertions (`h-14`,
  `md:hidden`, `bg-black/30`, `w-[260px]`, `shadow-xl`, `z-40`, `z-50`,
  `bg-card`) all still match.
- **Fix:** None — this is codebase-wide tooling (same behavior hit in
  Plans 09-01 and 09-02). Plan's strict multi-token grep criteria are
  known to diverge from the Prettier-sorted literals.
- **Files:** `workspace-mobile-header.tsx`, `workspace-mobile-drawer.tsx`

## Verification

- `pnpm typecheck` → exits 0 (framer-motion ships types).
- `pnpm lint` → 0 errors; 4 pre-existing warnings in
  `packages/ui/src/shadcn/data-table.tsx`
  (`react-hooks/incompatible-library` on TanStack Table), unchanged by
  this plan.
- `rg '"framer-motion"' package.json` → 1 match.
- `rg '"framer-motion"' packages/ui/package.json` → 0 matches.
- `test -f node_modules/framer-motion/package.json` → exits 0.
- Both new component files present under
  `app/components/workspace-shell/`.
- All a11y literals present in drawer: `role="dialog"`,
  `aria-modal="true"`, `aria-label="Mobile navigation"`,
  `aria-hidden="true"`; hamburger literals present in header:
  `aria-label="Open navigation menu"`, `aria-expanded={drawerOpen}`.
- Spring config present verbatim:
  `transition={{ type: 'spring', damping: 25, stiffness: 300 }}`.
- Drawer body wires `<ModuleSidebarNavigation forceExpanded
  onNavigate={onClose} …>`.
- Manual viewport smoke (375px) deferred to Plan 09-05 per plan.

## Known Stubs

None. No hardcoded empty data, no placeholder UI. The drawer consumes
live `navigation` props supplied by the workspace layout in Plan 09-04.

## Downstream Notes for Plan 09-04

- Mount `<WorkspaceMobileHeader user={…} onOpenDrawer={…}
  drawerOpen={…} hamburgerRef={…} />` above the workspace main content
  (it is already `md:hidden`, so it will not double with
  `WorkspaceNavbar` on desktop).
- Mount `<WorkspaceMobileDrawer open={…} onClose={…} account={…}
  navigation={workspace.navigation} hamburgerRef={…} />` as a sibling
  (not a child of the header) so the `fixed` backdrop/panel escape any
  stacking-context traps.
- The layout owns the `open` state and the `hamburgerRef`
  (`useRef<HTMLButtonElement | null>(null)`); pass the same ref to both
  components so focus return works on close.
- Do NOT render `<Sidebar>` below `md`; the existing Sheet-based mobile
  sidebar path in `packages/ui/src/shadcn/sidebar.tsx` should no longer
  be used — that replacement is part of Plan 09-04's scope.

## Self-Check: PASSED

- FOUND: package.json (framer-motion added)
- FOUND: pnpm-lock.yaml
- FOUND: app/components/workspace-shell/workspace-mobile-header.tsx
- FOUND: app/components/workspace-shell/workspace-mobile-drawer.tsx
- FOUND: commit be27f10
- FOUND: commit 48c4c25
- FOUND: commit 71fa0b8
