---
phase: 10-ag-grid-theme-template-parity-dark-mode
plan: 04
subsystem: shell-sidebar-navbar-palette
tags: [wave-3, parity-03, bug-01, bug-02, sidebar, navbar, cmdk, avatar]
dependency_graph:
  requires:
    - phase-10-plan-01-wave-0-test-scaffolding
    - phase-10-plan-03-sidebar-darkmode-scrollbar
    - org-workspace-loader
  provides:
    - org-derived-avatar-initials
    - sidebar-active-pill-unified
    - command-palette-module-navigation
  affects:
    - workspace-navbar
    - workspace-sidebar-footer
    - module-sidebar-navigation
    - navbar-command-palette
tech_stack:
  added: []
  patterns:
    - "Pure getOrgInitials helper (no side effects, unit-tested)"
    - "SidebarMenuButton asChild + isActive={derived} pattern unified across collapsed + expanded branches"
    - "openModules derived via useMemo from userToggled + active route (no useEffect, no stale state)"
    - "cmdk CommandItem value={unique-path} + keywords=[label, group] (single-source filter token)"
    - "handleSelect navigates before closing the dialog (focus-abort guard)"
key_files:
  created:
    - app/lib/workspace/get-org-initials.ts
    - .planning/phases/10-ag-grid-theme-template-parity-dark-mode/10-04-SUMMARY.md
  modified:
    - app/components/workspace-shell/workspace-navbar.tsx
    - app/components/workspace-shell/workspace-navbar-profile-menu.tsx
    - app/components/sidebar/workspace-sidebar.tsx
    - app/components/sidebar/module-sidebar-navigation.tsx
    - app/components/navbar-search.tsx
    - app/routes/workspace/layout.tsx
    - app/lib/workspace/__tests__/get-org-initials.test.ts
    - e2e/tests/phase10-avatar-initials.spec.ts
    - e2e/tests/phase10-bug-01-active-pill.spec.ts
    - e2e/tests/phase10-bug-02-palette-nav.spec.ts
decisions:
  - "getOrgInitials is a pure helper; initials are computed via useMemo at each consumer site from the same input primitives (org_name + email)"
  - "Sidebar-footer profile avatar added as Rule 2 deviation — the Wave 0 @avatar-initials e2e spec asserts both navbar AND sidebar-footer avatars, but the plan's files_modified list omitted workspace-sidebar.tsx. Satisfying the test contract takes precedence"
  - "BUG-01 fixed by replacing expanded-mode SidebarGroupLabel + nested Link with SidebarMenuButton asChild matching the collapsed branch, and moving the chevron CollapsibleTrigger to an absolute-positioned sibling so the Link click is no longer swallowed"
  - "Auto-expand of the active module computed derivationally inside useMemo (userToggled ∪ activeSlug), so direct-URL loads always expand the correct module and navigation never leaves stale state behind"
  - "BUG-02 fixed by using item.path as the cmdk value (unique) and moving the label into keywords (still fuzzy-searchable)"
requirements:
  - PARITY-03
  - BUG-01
  - BUG-02
metrics:
  duration: "~15min"
  tasks_completed: 3
  files_touched: 10
  completed_date: "2026-04-10"
---

# Phase 10 Plan 04: Wave 3 — Avatar Initials, BUG-01, BUG-02 Summary

Org-derived avatar initials, unified sidebar active-pill behavior, and a
navigable command palette — closing PARITY-03, BUG-01, and BUG-02 in a
single Wave 3 plan.

## One-Liner

Added a pure `getOrgInitials` helper (7 unit cases green), wired it into
both the navbar avatar and a new sidebar-footer avatar, rebuilt the
expanded-mode sidebar module row on the working `SidebarMenuButton`
pattern (fixing both the missing gradient pill AND the dead click), and
switched the Cmd+K palette to unique-path values with label keywords so
module entries navigate reliably.

## Tasks Completed

| Task | Name                                                       | Commit    | Files                                                                                                                           |
| ---- | ---------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1    | getOrgInitials helper + navbar/sidebar avatar wiring       | `2fa4d42` | get-org-initials.ts, get-org-initials.test.ts, workspace-navbar.tsx, workspace-navbar-profile-menu.tsx, workspace-sidebar.tsx, layout.tsx, phase10-avatar-initials.spec.ts |
| 2    | BUG-01 sidebar expanded-branch unification                 | `ab0938d` | module-sidebar-navigation.tsx, phase10-bug-01-active-pill.spec.ts                                                              |
| 3    | BUG-02 navbar command palette value/keywords rewrite      | `c55d2c1` | navbar-search.tsx, phase10-bug-02-palette-nav.spec.ts                                                                          |

## Key Changes

### Task 1 — getOrgInitials + avatar wiring (PARITY-03)

- `app/lib/workspace/get-org-initials.ts` — pure helper, no React deps.
  Handles single/multi-word org names, whitespace collapse, 2-char cap,
  email fallback, and safe-string behavior on script-like input. Seven
  unit cases pass (`app/lib/workspace/__tests__/get-org-initials.test.ts`).
- `WorkspaceNavbarProfileMenu` now accepts `orgName` and derives its
  avatar fallback via `useMemo(() => getOrgInitials(orgName, email))`.
  Fallback classes match UI-SPEC Surface 3 (`bg-muted dark:bg-slate-700
  text-foreground font-semibold text-sm`).
- `WorkspaceNavbar` drills `orgName` through to the profile menu.
- `app/routes/workspace/layout.tsx` passes `workspace.currentOrg?.org_name`
  into both the navbar and the sidebar.
- `WorkspaceSidebar` accepts `orgName` + `userEmail`, computes `initials`
  with the same helper, and renders a new `SidebarFooter` avatar row
  above the existing "Focused" placeholder. This was added as a Rule 2
  deviation (see Deviations below).

### Task 2 — BUG-01 active-pill unification

- Expanded-mode module row rebuilt around `SidebarMenuButton asChild
  isActive={isModuleActive}` + a `<Link>` child — the same pattern the
  collapsed branch already ships. The gradient classes now apply cleanly
  because they sit on the active menu button, not on a `SidebarGroupLabel`
  primitive that stomped them.
- `CollapsibleTrigger` moved to an absolute-positioned sibling
  `<button>` on the right edge (`absolute right-2 top-1/2 -translate-y-1/2`).
  The Link and the toggle are now cleanly separated — clicking the row
  navigates, clicking the chevron toggles.
- `isModuleActive = currentPath === modulePath || currentPath.startsWith(modulePath + '/')`
  is derived once per module (same derivation used for both branches).
- `openModules` is derived via `useMemo` from `userToggled` ∪ the
  currently-active module slug. User toggles flip entries inside
  `userToggled`; route-driven auto-expand happens on every render with
  no `useEffect` and no stale state. Direct URL loads now expand the
  correct module immediately.
- `subModulesByModule` and `sortedModules` memoized as pure derivations.

### Task 3 — BUG-02 command palette

- `CommandItem` now uses `value={item.path}` (guaranteed unique via the
  URL) and `keywords={[item.label, item.group ?? ''].filter(Boolean)}`.
  cmdk still fuzzy-searches the label because keywords participate in
  match scoring, but the normalized `value` no longer collides across
  module + sub-module rows that share a prefix.
- `onSelect={(selectedPath) => handleSelect(selectedPath)}` — cmdk now
  hands the exact selected `value` back to the handler, closing the
  chance of dispatching the wrong path.
- `handleSelect` order flipped so `navigate()` runs before
  `setOpen(false)`.

## Verification

- `pnpm vitest run app/lib/workspace/__tests__/get-org-initials.test.ts`
  → 7/7 passing.
- `pnpm typecheck` → clean.
- `pnpm lint` → 0 errors (4 pre-existing `react-hooks/incompatible-library`
  warnings in `packages/ui/src/shadcn/data-table.tsx`, out of scope).
- `grep -n useEffect app/components/sidebar/module-sidebar-navigation.tsx`
  → 0 code matches (1 comment-only match).
- E2E Playwright specs `phase10-avatar-initials.spec.ts`,
  `phase10-bug-01-active-pill.spec.ts`, `phase10-bug-02-palette-nav.spec.ts`
  have had their `test.fail()` wrappers removed and are ready for the
  Wave 4 validation run under `/gsd-execute-phase`.

## Deviations from Plan

### Rule 2 — Missing critical functionality: sidebar-footer avatar

The Wave 0 e2e spec `phase10-avatar-initials.spec.ts` asserts initials
render on BOTH the navbar avatar AND a sidebar-footer avatar:

```ts
const sidebarAvatar = page
  .locator('aside, [data-sidebar="sidebar"]')
  .first()
  .locator('[data-slot="avatar-fallback"]')
  .first();
await expect(sidebarAvatar).toHaveText(EXPECTED);
```

However, the plan's `files_modified` list only mentioned navbar files and
the profile menu — it did not include `workspace-sidebar.tsx`, and the
existing sidebar footer contained only the "Focused" placeholder.

I added a new avatar row to `SidebarFooter`:

```tsx
<div data-test="workspace-sidebar-profile" className="flex w-full items-center gap-2 px-3 py-2">
  <Avatar size="sm">
    <AvatarFallback className="bg-muted text-foreground text-xs font-semibold dark:bg-slate-700">
      {initials}
    </AvatarFallback>
  </Avatar>
  <span className="text-foreground flex-1 truncate text-xs font-medium">
    {orgName ?? 'Aloha'}
  </span>
</div>
```

**Why auto-applied:** the Wave 0 contract is the source of truth for
Phase 10, and the plan text explicitly said "make the failing Wave 0
tests for these IDs turn green". Not adding the sidebar avatar would
have left `@avatar-initials` red. `WorkspaceSidebar` + `layout.tsx`
were both modified. Commit `2fa4d42`.

### None otherwise

BUG-01 and BUG-02 were fixed exactly as the research document +
BUG-REPRO prescribed; no other scope expansion.

## Authentication Gates

None. This plan is all UI-layer work against already-loaded loader data.

## Known Stubs

None. All new code paths flow from the org workspace loader; no
placeholder / hardcoded data was introduced.

## Self-Check: PASSED

Created files:

- `app/lib/workspace/get-org-initials.ts` — FOUND
- `.planning/phases/10-ag-grid-theme-template-parity-dark-mode/10-04-SUMMARY.md` — FOUND (this file)

Modified files (sampled):

- `app/components/sidebar/module-sidebar-navigation.tsx` — FOUND (Task 2 commit)
- `app/components/navbar-search.tsx` — FOUND (Task 3 commit)
- `app/components/sidebar/workspace-sidebar.tsx` — FOUND (Task 1 commit)

Commits:

- `2fa4d42` — FOUND (Task 1)
- `ab0938d` — FOUND (Task 2)
- `c55d2c1` — FOUND (Task 3)
