---
id: 260417-wd1
type: quick
status: complete
---

# Quick Task 260417-wd1 — Summary

## What Changed

- Added new portal target `#workspace-navbar-action-slot` in `workspace-navbar.tsx`, positioned between the search bar and the profile menu (right side of the navbar).
- Rewrote `PayrollViewToggle` to portal into the new action slot and render as an icon-only pill segmented control:
  - `Users` icon → By Department (`?view=by_task`)
  - `User` icon → By Employee (`?view=by_employee`)
  - Square `h-8 w-8` icon buttons inside an `h-9 rounded-full border` pill — same outer chrome as the Filters button next to it on the left.
- All data-test selectors preserved (`payroll-view-toggle`, `view-toggle-by-task`, `view-toggle-by-employee`).

## Why

The text toggle was visually heavy; when the Filters button expanded with active-filter summary chips, it pushed the search bar off-center. Moving the toggle to a dedicated right-side slot and shrinking it to icons fixes both the alignment and the visual noise.

## Files Touched

- `app/components/workspace-shell/workspace-navbar.tsx` — new `#workspace-navbar-action-slot` between search and profile menu.
- `app/components/ag-grid/payroll-view-toggle.tsx` — icons replace text labels; portal target moved.

## Verification

- `pnpm typecheck` — clean.
- No new lint warnings.
