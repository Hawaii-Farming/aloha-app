---
phase: 09-app-shell-navbar-sidebar-drawer
plan: 07
subsystem: workspace-shell
tags: [navbar, sidebar, search, profile-menu, gap-closure, uat]
gap_closure: true
closes_gaps:
  - test: 2
    sub_gaps: [2a, 2b, 2c]
requires:
  - plan: 09-06
    reason: Sidebar/navbar layering (relative z-20, md:top-[72px]) must be in place before this plan reshapes navbar and strips sidebar footer
provides:
  - WorkspaceNavbarProfileMenu component (navbar-scoped dropdown)
  - NavbarSearchItem interface + onSelect-driven navigation
  - Navbar sidebar toggle (PanelLeft button)
affects:
  - app/components/workspace-shell/workspace-navbar.tsx
  - app/components/navbar-search.tsx
  - app/components/sidebar/workspace-sidebar.tsx
  - app/routes/workspace/layout.tsx
tech-stack:
  added:
    - none (reused existing @aloha/ui primitives + react-router useNavigate + @aloha/ui/shadcn-sidebar useSidebar)
  patterns:
    - Single command palette items-prop threading (modules + sub-modules bucketed by group)
    - Navbar-scoped profile dropdown replacing sidebar footer menu
    - useSidebar().toggleSidebar() driven from navbar component
key-files:
  created:
    - app/components/workspace-shell/workspace-navbar-profile-menu.tsx
  modified:
    - app/components/workspace-shell/workspace-navbar.tsx
    - app/components/navbar-search.tsx
    - app/components/sidebar/workspace-sidebar.tsx
    - app/routes/workspace/layout.tsx
  deleted:
    - app/components/sidebar/sidebar-profile-menu.tsx
decisions:
  - Excluded org/farm switcher from new navbar profile menu per UAT gap 2c (no Building2 sub-menu)
  - Deleted orphaned sidebar-profile-menu.tsx after verifying zero remaining callers
  - Kept SidebarEdgeToggle nub as secondary affordance; navbar PanelLeft is the primary
  - Search items built inline per render from loader-sourced navigation (O(n), stable per request, no memoization overhead needed)
metrics:
  duration_seconds: 155
  tasks_total: 6
  tasks_completed: 6
  files_created: 1
  files_modified: 4
  files_deleted: 1
  commits: 6
  completed: 2026-04-10
requirements:
  - NAVBAR-01
  - NAVBAR-02
  - NAVBAR-03
  - NAVBAR-04
  - SIDEBAR-03
---

# Phase 09 Plan 07: Navbar Toggle, Search, Avatar Menu (UAT Gap 2 Closure) Summary

Closes UAT gap 2 by delivering navbar sidebar toggle, wiring command palette search to real navigation, and porting the legacy sidebar profile menu (minus the org switcher) into a new top-right navbar dropdown.

## Gap Closure

- **Sub-gap 2a — Sidebar toggle in navbar:** CLOSED. `WorkspaceNavbar` now renders a `PanelLeft` button in its left cluster that calls `useSidebar().toggleSidebar()`. Safe because `<SidebarProvider>` wraps the layout in `app/routes/workspace/layout.tsx`.
- **Sub-gap 2b — Working search navigation:** CLOSED. `NavbarSearch` now accepts an `items: NavbarSearchItem[]` prop, imports `useNavigate` from `react-router`, and each `<CommandItem>` has an `onSelect` that navigates and closes the dialog. Items are bucketed by optional `group` into `<CommandGroup>`s. `WorkspaceNavbar` builds the item list from `navigation.modules` and `navigation.subModules` (buckets: `Modules`, `Pages`).
- **Sub-gap 2c — Top-right profile menu replaces legacy bottom-left:** CLOSED. New `WorkspaceNavbarProfileMenu` component provides exactly: `"Signed in as"` label + email, `SubMenuModeToggle`, `Sign out`. The org switcher (`Building2` + `DropdownMenuSub`) is intentionally omitted per UAT. `WorkspaceSidebar` no longer renders a `SidebarFooter`. The legacy `SidebarProfileMenu` file was deleted after verifying zero remaining callers.

## Files

### Created
- `app/components/workspace-shell/workspace-navbar-profile-menu.tsx` — self-contained dropdown (Avatar trigger → label + theme toggle + sign out). Uses `useSignOut` and `useUser` hooks. No `useSidebar`, no `useNavigate`, no org switching logic.

### Modified
- `app/components/navbar-search.tsx` — exports `NavbarSearchItem`, adds `items` prop (default `[]`), buckets by `group`, wires `onSelect={() => handleSelect(path)}` closing the dialog on navigation. Retained existing Cmd+K `useEffect` (justified global keyboard listener).
- `app/components/workspace-shell/workspace-navbar.tsx` — new props `account`, `user: JwtPayload`, `navigation`. Adds `PanelLeft` toggle button → `useSidebar().toggleSidebar()`. Builds `searchItems` inline and passes to `NavbarSearch`. Replaces bare `<Avatar>` with `<WorkspaceNavbarProfileMenu user={user} />`. **Preserved `relative z-20` layering from plan 09-06.**
- `app/components/sidebar/workspace-sidebar.tsx` — removed `SidebarFooter`, `SidebarProfileMenu`, `OrgAccount` interface, and the `accounts`, `accessLevelId`, `user` props. Retained `SidebarEdgeToggle` as secondary affordance. **Preserved `md:top-[72px] md:h-[calc(100svh-72px)]` layering from plan 09-06.**
- `app/routes/workspace/layout.tsx` — `<WorkspaceNavbar>` now receives `account`, full `user` JwtPayload, and `workspace.navigation`. `<WorkspaceSidebar>` receives only `account` and `navigation`. Deleted unused `accounts` local mapping. `userForShell` retained for `<WorkspaceMobileHeader>`.

### Deleted
- `app/components/sidebar/sidebar-profile-menu.tsx` — orphaned after Task 4. Grep confirmed no remaining callers in `app/` before deletion.

## Commits

| Task | Hash      | Message                                                                   |
| ---- | --------- | ------------------------------------------------------------------------- |
| 1    | `bc62265` | feat(09-07): add WorkspaceNavbarProfileMenu component                     |
| 2    | `30bf216` | feat(09-07): wire NavbarSearch to real navigation items                   |
| 3    | `c8eef78` | feat(09-07): add sidebar toggle, search items, profile menu to navbar    |
| 4    | `86f8029` | refactor(09-07): remove SidebarProfileMenu from WorkspaceSidebar          |
| 5    | `8cca058` | refactor(09-07): thread navigation into WorkspaceNavbar, drop sidebar accounts |
| 6    | `b992e91` | chore(09-07): delete orphaned SidebarProfileMenu after navbar port        |

## Verification

- `pnpm typecheck` — PASS (after Task 5 reconciled `WorkspaceNavbar` prop shape with layout.tsx call site)
- `pnpm lint` — 0 errors (4 pre-existing warnings in `packages/ui/src/shadcn/data-table.tsx` — unrelated TanStack Table / React Compiler interaction, out of scope)
- Grep assertions per task `done` blocks — all pass:
  - `useSidebar` in workspace-navbar.tsx: 1 match
  - `PanelLeft` in workspace-navbar.tsx: 1 import match
  - `WorkspaceNavbarProfileMenu` in workspace-navbar.tsx: 2 matches (import + usage)
  - `items={searchItems}` in workspace-navbar.tsx: 1 match
  - `relative z-20` still present in navbar header className
  - `SidebarProfileMenu` / `SidebarFooter` / `accounts` / `accessLevelId` in workspace-sidebar.tsx: 0 matches
  - `md:top-[72px]` still present in sidebar className
  - `useNavigate` / `onSelect={` / `export interface NavbarSearchItem` in navbar-search.tsx: 1 match each
  - No static `<CommandItem>Dashboard</CommandItem>` strings remain
  - `Building2` / `DropdownMenuSub` in workspace-navbar-profile-menu.tsx: 0 matches
  - `SubMenuModeToggle` in workspace-navbar-profile-menu.tsx: 1 match
  - `accounts={` / `accessLevelId` in layout.tsx: 0 matches
  - `navigation={workspace.navigation}` in layout.tsx: 2 matches (navbar + sidebar)

## Deviations from Plan

None — plan executed exactly as written. The plan's Task 4 CORRECTED note (remove `user` prop and `JwtPayload` import from sidebar) was followed as specified.

## Browser Verification (deferred to phase UAT)

The plan specifies manual browser checks (sidebar toggle click, search palette navigation, avatar dropdown contents, sidebar footer absence). These are left to the orchestrator's phase-level verification pass per executor instructions.

## Self-Check: PASSED

- File `app/components/workspace-shell/workspace-navbar-profile-menu.tsx`: FOUND
- File `app/components/sidebar/sidebar-profile-menu.tsx`: DELETED (verified via `git status`)
- Commit `bc62265`: FOUND
- Commit `30bf216`: FOUND
- Commit `c8eef78`: FOUND
- Commit `86f8029`: FOUND
- Commit `8cca058`: FOUND
- Commit `b992e91`: FOUND
- All task `done` grep assertions verified
- `pnpm typecheck` clean, `pnpm lint` 0 errors
