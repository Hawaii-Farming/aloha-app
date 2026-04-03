---
phase: quick
plan: 260402-kaa
subsystem: workspace-chrome
tags: [navbar, sidebar, org-selector, breadcrumbs, supabase-theme]
dependency_graph:
  requires: []
  provides: [workspace-navbar]
  affects: [workspace-sidebar, workspace-layout]
tech_stack:
  added: []
  patterns: [full-width-sticky-navbar, flex-col-layout-wrapper]
key_files:
  created:
    - app/components/workspace-navbar.tsx
  modified:
    - app/components/sidebar/workspace-sidebar.tsx
    - app/routes/workspace/layout.tsx
decisions:
  - OrgSelector stays standalone in navbar; UserProfileDropdown receives no accounts/userId so its embedded OrgSelector section is conditionally suppressed
  - SidebarProvider wraps a flex-col div (navbar above flex-1 sidebar+page) rather than restructuring the Page component
  - Pre-existing lint errors in unrelated files (user-profile-dropdown isAdmin, mcp-server, data-table) are out of scope
metrics:
  duration: ~15 minutes
  completed: "2026-04-03T00:46:52Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase quick Plan 260402-kaa: Supabase-Style Top Navbar Summary

**One-liner:** Supabase-style h-12 top navbar with SidebarTrigger + OrgSelector left, AppBreadcrumbs center, Bell + UserProfileDropdown right, replacing the sidebar footer.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create WorkspaceNavbar component | ea6c59b | app/components/workspace-navbar.tsx (created) |
| 2 | Remove sidebar footer and wire navbar into layout | a623004 | app/components/sidebar/workspace-sidebar.tsx, app/routes/workspace/layout.tsx |

## What Was Built

### WorkspaceNavbar (`app/components/workspace-navbar.tsx`)

A full-width `h-12` sticky header rendered inside `SidebarProvider` (so `SidebarTrigger` gets sidebar context):

- **Left:** `SidebarTrigger` + vertical `Separator` + `OrgSelector` (standalone, always expanded)
- **Center:** `AppBreadcrumbs maxDepth={4}` (auto-derives clickable crumbs from URL)
- **Right:** Bell icon `Button` (ghost, no badge) + `UserProfileDropdown` (avatar trigger; no `accounts`/`userId` props so embedded OrgSelector section is suppressed by the existing conditional)

### WorkspaceSidebar cleanup

- `SidebarFooter` block removed entirely (no more `UserProfileDropdown` in sidebar)
- Props reduced from 6 to 2: `account` + `navigation`
- Removed imports: `SidebarFooter`, `UserProfileDropdown`, `JwtPayload`, `AccountModel` type
- `SidebarContent` className changed from `mt-5 h-[calc(100%-80px)] overflow-y-auto` to `mt-2 flex-1 overflow-y-auto`

### Layout wiring (`app/routes/workspace/layout.tsx`)

`SidebarProvider` now wraps a `flex h-screen w-full flex-col` div:
- `WorkspaceNavbar` at top (receives all props from workspace loader)
- `div.flex.flex-1.min-h-0` below containing `Page` with the sidebar

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files Created/Modified

- [x] `app/components/workspace-navbar.tsx` — exists
- [x] `app/components/sidebar/workspace-sidebar.tsx` — modified
- [x] `app/routes/workspace/layout.tsx` — modified

### Commits

- [x] ea6c59b — Task 1 commit
- [x] a623004 — Task 2 commit

## Self-Check: PASSED
