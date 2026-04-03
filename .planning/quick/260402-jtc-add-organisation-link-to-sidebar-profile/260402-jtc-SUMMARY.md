---
phase: 260402-jtc
plan: 01
subsystem: sidebar/profile-dropdown
tags: [ui, access-control, navigation, sidebar]
dependency_graph:
  requires: []
  provides: [organisation-link-in-profile-dropdown]
  affects: [workspace-sidebar, user-profile-dropdown, workspace-layout]
tech_stack:
  added: []
  patterns: [conditional-rendering-by-access-level, prop-threading]
key_files:
  created: []
  modified:
    - app/components/user-profile-dropdown.tsx
    - app/components/sidebar/workspace-sidebar.tsx
    - app/routes/workspace/layout.tsx
decisions:
  - Used accountSlug as prop name to avoid collision with existing account object prop
  - Used Trans children fallback for common:organisation since no public/locales/en/common.json exists
metrics:
  duration: "~5 minutes"
  completed: "2026-04-02"
  tasks: 1
  files: 3
---

# Phase 260402-jtc Plan 01: Add Organisation Link to Sidebar Profile Summary

**One-liner:** Conditional "Organisation" link in profile dropdown routes admin/owner users to /home/:account/settings using access_level_id from server-loaded OrgWorkspace.

## What Was Built

The sidebar bottom-left profile dropdown now shows an "Organisation" navigation item for users whose `access_level_id` is `'admin'` or `'owner'`. The link navigates to `/home/:account/settings`. Users with lower access levels (employee, team_lead, manager) see no change.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Thread access level and account into UserProfileDropdown | 83f4c0b | user-profile-dropdown.tsx, workspace-sidebar.tsx, layout.tsx |

## Deviations from Plan

None - plan executed exactly as written.

The only minor adaptation: the plan specified using `account` as the slug prop name but the component already had an `account` prop for a different shape (`{ id, name, picture_url }`), so `accountSlug` was used as the new prop name to avoid collision. This matches the intent without any behavioral change.

## Known Stubs

None.

## Threat Flags

None - no new network endpoints, auth paths, or trust boundary changes introduced. The Organisation link visibility is a UX convenience; the settings route enforces its own auth via requireUserLoader as documented in the threat model.

## Self-Check: PASSED

- `app/components/user-profile-dropdown.tsx` — modified, committed at 83f4c0b
- `app/components/sidebar/workspace-sidebar.tsx` — modified, committed at 83f4c0b
- `app/routes/workspace/layout.tsx` — modified, committed at 83f4c0b
- TypeScript: no errors
- Lint: no new errors introduced (pre-existing errors in mcp-server and turbo/generators out of scope)
