---
phase: quick
plan: 260403-a9j
subsystem: ui/navigation
tags: [cleanup, theme, dropdown, profile]
dependency_graph:
  requires: []
  provides: [profile-dropdown-without-theme-toggle]
  affects: [app/components/user-profile-dropdown.tsx]
tech_stack:
  added: []
  patterns: []
key_files:
  modified:
    - app/components/user-profile-dropdown.tsx
decisions:
  - Removed featuresFlagConfig import entirely since it was only used for the theme toggle block
metrics:
  duration: "~3 minutes"
  completed_date: "2026-04-03"
  tasks_completed: 1
  files_modified: 1
---

# Quick Task 260403-a9j: Remove Theme Toggle from Avatar Profile Dropdown Summary

**One-liner:** Removed redundant theme toggle from profile dropdown since ModeToggle button was added to the top navbar.

## What Was Done

Cleaned up `UserProfileDropdown` by removing all theme-toggle-related code: the `Palette` lucide icon import, the `useTheme` hook from `next-themes`, the `featuresFlagConfig` feature flag import, the `useTheme` destructuring call inside the component, and the entire conditional `DropdownMenuItem` block that rendered the theme switcher. The standalone `ModeToggle` in the navbar now handles theme switching exclusively.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Remove theme toggle from UserProfileDropdown | d5baade |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- `app/components/user-profile-dropdown.tsx` — FOUND, modified
- Commit `d5baade` — FOUND
- No `useTheme`, `Palette`, or `setTheme` remain in the file
