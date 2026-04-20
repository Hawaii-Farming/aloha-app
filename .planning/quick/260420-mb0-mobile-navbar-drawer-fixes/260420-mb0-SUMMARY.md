---
phase: quick-260420-mb0
plan: 01
subsystem: workspace-shell
status: complete
tags:
  - mobile
  - navbar
  - sheet
  - performance
requirements:
  - MB0-01
  - MB0-02
  - MB0-03
  - MB0-04
dependency-graph:
  requires:
    - WorkspaceNavbarProfileMenu (app/components/workspace-shell/workspace-navbar-profile-menu.tsx)
    - NavbarSearch (app/components/navbar-search.tsx)
    - getOrgInitials (app/lib/workspace/get-org-initials.ts)
  provides:
    - Mobile workspace header with search trigger + profile menu (parity with desktop navbar)
    - Consistent overlay scrim recipe across Sheet, Dialog, AlertDialog (no backdrop-blur)
  affects:
    - Every route rendered under app/routes/workspace/layout.tsx on <md viewports
    - Every Sheet / Dialog / AlertDialog overlay, all viewports
tech-stack:
  added: []
  patterns:
    - Reuse WorkspaceNavbarProfileMenu verbatim on mobile (no duplicated avatar/initial logic)
    - Icon-button-opens-cmdk-popover for mobile search (same NavbarSearch component as desktop)
key-files:
  created: []
  modified:
    - app/components/workspace-shell/workspace-mobile-header.tsx
    - app/routes/workspace/layout.tsx
    - packages/ui/src/shadcn/sheet.tsx
    - packages/ui/src/shadcn/dialog.tsx
    - packages/ui/src/shadcn/alert-dialog.tsx
decisions:
  - Remove brand icon + "Aloha" wordmark from mobile header (additional requirement): redundant with the sidebar drawer, and it was eating space that the search + avatar needed on 390px viewports.
  - Keep desktop WorkspaceNavbar byte-identical — scope is mobile only.
  - Drop backdrop-blur-sm from all three overlays (Sheet/Dialog/AlertDialog) for consistency — a single flaky recipe would have caused future "why only one feels janky" debugging.
metrics:
  duration: 2m17s
  completed: 2026-04-20T20:20:03Z
  commits: 2
  tasks: 3
  files_modified: 5
---

# Quick 260420-mb0: Mobile Navbar + Drawer Fixes Summary

One-liner: Restored search + fixed the avatar dropdown on the mobile workspace header, dropped `backdrop-blur-sm` from Sheet/Dialog/AlertDialog overlays to smooth mobile Sheet animations, and removed the redundant brand lockup from the mobile header.

## Issues Fixed

| # | Issue | Fix |
|---|-------|-----|
| 1 | No search affordance on mobile (<md) | Added `NavbarSearch` with a Search icon-button `renderTrigger` on the mobile header — same cmdk popover desktop uses (Cmd/Ctrl+K remains wired globally). |
| 2 | Mobile avatar showed user-email first letter (literal "A" for `ar2@icloud.com`) instead of the current org's initials | Replaced raw `<Avatar>` with `<WorkspaceNavbarProfileMenu>`, which calls `getOrgInitials(orgName, email)` — renders "HF" for "Hawaii Farming" with the green gradient fallback. |
| 3 | Mobile avatar was non-interactive | `WorkspaceNavbarProfileMenu` wraps the avatar in a `DropdownMenuTrigger` with the same menu desktop uses (signed-in-as label, theme toggle, sign-out). |
| 4 | Create-panel Sheet stuttered on mobile open | Removed `backdrop-blur-sm` from `SheetOverlay`, `DialogOverlay`, `AlertDialogOverlay`. Kept `bg-black/60` scrim. |

## Additional Requirement (added after planning)

**Removed the Aloha brand icon + "Aloha" wordmark from the mobile header.** On `<md` viewports the hamburger-triggered sidebar drawer already shows the full brand lockup, so duplicating it in the top bar on mobile only reduced the space available for the search trigger + avatar (the affordances this plan was adding). Desktop navbar brand unchanged per DESIGN.md §6.

Final mobile header layout, left → right:

```
[hamburger]   [flex-grow spacer]   [search icon button]   [profile avatar → menu]
```

This is a visual change that exceeds the original plan's "visually unchanged except for new affordances" line — logged here as a deviation.

## Commits

| Task | Commit | Subject |
|------|--------|---------|
| T1 + brand-removal addendum | `1b1dc88` | `fix(quick-260420-mb0): restore search + fix avatar menu on mobile navbar` |
| T2 | `fbf529b` | `perf(quick-260420-mb0): drop backdrop-blur from overlays to smooth mobile sheet animation` |
| T3 | (no commit — format:fix and lint reported clean; no file changes to record) | — |

Two commits instead of the plan's anticipated 2–3. The brand-removal addendum was folded into T1's commit because the edit lives in the same file (`workspace-mobile-header.tsx`) and the single commit message documents it.

## Deviations from Plan

### Additional requirement (brand lockup removal)

**Issue:** The plan kept the brand lockup on the mobile header per its Step B ("Hamburger button … Brand lockup — keep `<AlohaLogoSquare size='sm' />` + 'Aloha' wordmark …").

**Resolution:** Request added by the human after planning. On mobile, the sidebar drawer already shows the brand, so the wordmark on the top bar was redundant and competed with the new search + avatar for horizontal room. Replaced the brand block with a `<div className="flex-1" />` spacer so the right-side cluster still pins right.

**Files modified:** `app/components/workspace-shell/workspace-mobile-header.tsx`
**Commit:** `1b1dc88`

### Auto-fixed issues

None — the plan executed as written other than the additional requirement above. No bugs found, no missing critical functionality beyond the brand-removal ask, no blockers.

## Manual Smoke Observations

Not executed in this run (no local dev server was started). The dev smoke steps from the plan's `<verification>` section are logged here for the human:

- [ ] Resize Chrome devtools to 390×844 (iPhone 14) on any workspace route. Confirm header shows `hamburger | (flex spacer) | magnifier icon | initials avatar` (NOT `hamburger | brand | …`).
- [ ] Click magnifier: cmdk popover opens; typing filters Modules/Pages.
- [ ] Click avatar: dropdown opens with signed-in-as, theme toggle, sign out.
- [ ] Tap floating "+" on a CRUD list: Sheet slides in from right without stutter.
- [ ] Delete a row (any list): AlertDialog shows a clean scrim, no blur.
- [ ] Resize to ≥768px: desktop navbar renders as before; mobile header hidden.

## Verification

- `pnpm typecheck`: passes (ran after Task 1 and after Task 2).
- `pnpm format:fix`: all files Prettier-clean (no changes).
- `pnpm lint`: 0 errors, 4 pre-existing warnings in unrelated files (`table-list-view.tsx`, `packages/ui/src/kit/data-table.tsx`, `packages/ui/src/shadcn/data-table.tsx`) — none introduced by this plan.
- No new runtime dependencies added. `pnpm-lock.yaml` unchanged.

## Self-Check: PASSED

- `app/components/workspace-shell/workspace-mobile-header.tsx`: FOUND (modified)
- `app/routes/workspace/layout.tsx`: FOUND (modified)
- `packages/ui/src/shadcn/sheet.tsx`: FOUND (modified; `backdrop-blur-sm` removed; `bg-black/60` preserved)
- `packages/ui/src/shadcn/dialog.tsx`: FOUND (modified; `backdrop-blur-sm` removed; `bg-black/60` preserved)
- `packages/ui/src/shadcn/alert-dialog.tsx`: FOUND (modified; `backdrop-blur-sm` removed; `bg-black/60` preserved)
- Commit `1b1dc88`: FOUND
- Commit `fbf529b`: FOUND
