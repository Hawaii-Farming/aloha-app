---
phase: quick
plan: 260402-wds
subsystem: navbar
tags: [search, command-palette, navbar, ui]
dependency_graph:
  requires: []
  provides: [navbar-search]
  affects: [workspace-navbar]
tech_stack:
  added: [cmdk via @aloha/ui/command]
  patterns: [CommandDialog, useEffect for global keyboard shortcut]
key_files:
  created:
    - app/components/navbar-search.tsx
  modified:
    - app/components/workspace-navbar.tsx
decisions:
  - Used useEffect for keydown listener (justified: global keyboard shortcut binding)
  - Detect Mac vs other platform via navigator.platform to show correct shortcut hint
metrics:
  duration: 5m
  completed: "2026-04-02"
  tasks_completed: 2
  files_changed: 2
---

# Quick Task 260402-wds: Add Supabase-style Search Bar to Navbar — Summary

**One-liner:** Pill-shaped Cmd+K search trigger in navbar right section opening a cmdk CommandDialog with placeholder suggestions.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create NavbarSearch component | 4c9c815 | app/components/navbar-search.tsx |
| 2 | Integrate NavbarSearch into workspace navbar | 74904d9 | app/components/workspace-navbar.tsx |

## What Was Built

`NavbarSearch` is a client component with two parts:

1. **Trigger button** — pill-shaped (`border border-border bg-muted/50 hover:bg-muted rounded-md h-7 w-56`) containing a Search icon, "Search..." placeholder in muted-foreground, and a `Kbd` showing the platform shortcut (`⌘K` on Mac, `Ctrl K` elsewhere). Has `data-test="navbar-search-trigger"`.

2. **Command dialog** — uses `CommandDialog` from `@aloha/ui/command` (wraps cmdk). Opens on trigger click or global Cmd+K / Ctrl+K keyboard shortcut (useEffect with keydown listener). Contains `CommandInput`, `CommandList`, `CommandEmpty`, and a "Suggestions" `CommandGroup` with three placeholder items (Dashboard, Settings, Modules).

Integrated into `WorkspaceNavbar` before `<AiChatButton />` in the right-side flex section.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| Placeholder CommandItems (Dashboard, Settings, Modules) | app/components/navbar-search.tsx | Real search integration deferred to a future plan |

## Self-Check: PASSED

- app/components/navbar-search.tsx: FOUND
- app/components/workspace-navbar.tsx: FOUND (modified)
- Commit 4c9c815: FOUND
- Commit 74904d9: FOUND
- pnpm typecheck: PASSED
