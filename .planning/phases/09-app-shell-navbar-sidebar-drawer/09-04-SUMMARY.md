---
phase: 09-app-shell-navbar-sidebar-drawer
plan: 04
subsystem: app-shell/layout
tags: [layout, integration, shell, drawer, wave-3]
wave: 3
requires:
  - 09-01 (sidebar restyle + onNavigate/forceExpanded props)
  - 09-02 (WorkspaceNavbar + AlohaLogoSquare)
  - 09-03 (WorkspaceMobileHeader + WorkspaceMobileDrawer + framer-motion)
provides:
  - workspace-shell-composition-in-layout
  - drawer-open-state-in-layout
  - auto-close-drawer-on-route-change
affects:
  - Plan 09-05 (manual + E2E verification at desktop and 375px)
tech-stack:
  added: []
  patterns:
    - Guarded setState-in-effect via lastPathRef to document route-change
      intent while satisfying the React Compiler
    - Single SidebarProvider mount shared across desktop (sidebar) and
      mobile (hidden wrapper) branches per D-26
    - Shared hamburgerRef owned by layout and forwarded to both the
      mobile header (button) and the drawer (focus return on close)
key-files:
  created:
    - .planning/phases/09-app-shell-navbar-sidebar-drawer/09-04-SUMMARY.md
  modified:
    - app/routes/workspace/layout.tsx
  deleted:
    - app/components/sidebar/mobile-navigation.tsx
decisions:
  - "Loader contract preserved byte-identical per D-25 — no style-field
    cleanup, no shape changes"
  - "SidebarProvider stays mounted on both branches per D-26 (useSidebar
    powers the desktop toggle)"
  - "Route-change auto-close implemented with a lastPathRef guard + an
    eslint-disable-next-line react-hooks/set-state-in-effect comment,
    matching the project-wide precedent (packages/ui/src/kit/multi-step-
    form.tsx:390, packages/ui/src/kit/image-upload-input.tsx:116)"
  - "userForShell = { email: user.email ?? null } adapter derived once in
    the component body so WorkspaceNavbar + WorkspaceMobileHeader see the
    narrow { email } prop shape while WorkspaceSidebar continues to
    receive the full JwtPayload"
metrics:
  duration: ~5min
  tasks: 2
  files: 2
  completed: 2026-04-10
requirements: [SIDEBAR-05, NAVBAR-04, DRAWER-02, DRAWER-04]
---

# Phase 9 Plan 04: Workspace Shell Integration Summary

Integrated the three wave-1/2 shell components (`WorkspaceNavbar`,
`WorkspaceMobileHeader`, `WorkspaceMobileDrawer`) into
`app/routes/workspace/layout.tsx`, deleted the obsolete
`app/components/sidebar/mobile-navigation.tsx`, and wired a controlled
drawer-open state in the layout with auto-close on route change. The
loader contract (`workspace`, `layoutState`, `accountSlug`) is
preserved byte-identical per D-25.

## What Shipped

### Task 1 — Delete mobile-navigation.tsx (commit `4359f89`)

- Verified zero importers in `app/` / `e2e/` / `packages/` via grep —
  only planning docs referenced the path.
- `git rm app/components/sidebar/mobile-navigation.tsx` (182 lines
  deleted).
- `pnpm typecheck` green post-delete — the component was already dead
  code, so removal had zero type impact.
- Single mobile nav surface (`WorkspaceMobileDrawer`) now remains per
  D-04.

### Task 2 — Restructure workspace/layout.tsx (commit `2b1778a`)

`app/routes/workspace/layout.tsx`:

- **Imports:** added `useEffect, useRef, useState` from React;
  `useLocation` from `react-router`; `WorkspaceNavbar`,
  `WorkspaceMobileHeader`, `WorkspaceMobileDrawer` from
  `~/components/workspace-shell/*`. Removed the `SidebarTrigger` import
  (no longer referenced anywhere in the file).
- **State (inside the component body):**
  - `const location = useLocation();`
  - `const [drawerOpen, setDrawerOpen] = useState(false);`
  - `const hamburgerRef = useRef<HTMLButtonElement | null>(null);`
  - `const lastPathRef = useRef(location.pathname);`
- **Auto-close effect:** justified `useEffect` watching
  `location.pathname`. Guarded with `lastPathRef` so `setDrawerOpen(false)`
  only fires on an actual pathname change. The remaining set-state call
  inside the effect is intentional and annotated with
  `// eslint-disable-next-line react-hooks/set-state-in-effect` — this
  matches the pattern already used in `packages/ui/src/kit/multi-step-
  form.tsx` and `packages/ui/src/kit/image-upload-input.tsx`.
- **User adapter:** `const userForShell = { email: user.email ?? null };`
  — narrows the full `JwtPayload` to the `{ email?: string | null }`
  shape expected by `WorkspaceNavbar` and `WorkspaceMobileHeader` while
  still passing the original `user` to `WorkspaceSidebar` (whose
  contract from Plan 09-01 requires the full `JwtPayload`).
- **JSX restructure:**
  ```tsx
  <SidebarProvider defaultOpen={layoutState.open}>
    <div className="flex h-svh w-full flex-col">
      <WorkspaceNavbar user={userForShell} className="hidden md:flex" />
      <WorkspaceMobileHeader
        user={userForShell}
        onOpenDrawer={() => setDrawerOpen(true)}
        drawerOpen={drawerOpen}
        hamburgerRef={hamburgerRef}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <WorkspaceSidebar
            account={accountSlug}
            navigation={workspace.navigation}
            user={user}
            accounts={accounts}
            accessLevelId={workspace.currentOrg.access_level_id}
          />
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-1 flex-col p-4">
            <Outlet />
          </div>
        </main>
      </div>
      <WorkspaceMobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        account={accountSlug}
        navigation={workspace.navigation}
        hamburgerRef={hamburgerRef}
      />
    </div>
  </SidebarProvider>
  ```
- **Deleted:** the old `<div className="bg-background flex h-12 ...
  md:hidden"><SidebarTrigger ... /></div>` mobile header fragment — no
  dual code path per Pitfall 5.
- **Preserved byte-identical:** loader function (lines 19–35),
  `getLayoutState` helper, `accounts` derivation, sidebar's prop
  contract (`account, navigation, user, accounts, accessLevelId`).

## How It Satisfies the Requirements

- **SIDEBAR-05** — Desktop sidebar wrapped in `<div className="hidden
  md:block">` so it disappears below the md breakpoint. SidebarProvider
  stays mounted (D-26) so `useSidebar()` powers the desktop toggle.
- **NAVBAR-04** — `WorkspaceMobileHeader` (already `md:hidden` from Plan
  09-03) is mounted as a sibling of `WorkspaceNavbar` (`hidden md:flex`);
  visibility is mutually exclusive.
- **DRAWER-02** — Hamburger in the mobile header fires
  `onOpenDrawer={() => setDrawerOpen(true)}` which flips the layout's
  `drawerOpen` state; the drawer reads it via its `open` prop.
- **DRAWER-04** — Drawer closes via (a) backdrop tap +
  `onNavigate={onClose}` leaf tap (both wired in Plan 09-03), (b)
  Escape key (Plan 09-03 effect), and (c) the new guarded `useEffect`
  in the layout that fires `setDrawerOpen(false)` whenever
  `location.pathname` changes.

## Commits

| Task | Name                                                    | Commit  |
| ---- | ------------------------------------------------------- | ------- |
| 1    | Delete obsolete mobile-navigation component             | 4359f89 |
| 2    | Integrate workspace shell components into layout        | 2b1778a |

## Deviations from Plan

**1. [Rule 1 - Bug] React Compiler rejected unconditional `setDrawerOpen(false)` inside `useEffect`**

- **Found during:** Task 2 `pnpm lint` after initial write.
- **Issue:** The project uses React Compiler's
  `react-hooks/set-state-in-effect` rule, which treats an unconditional
  `setState` in a `useEffect` as a cascading-render error (not a
  warning). The plan's literal snippet:
  ```ts
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);
  ```
  fails lint with:
  `error  Calling setState synchronously within an effect can trigger cascading renders`.
- **Fix:** Introduced a `lastPathRef = useRef(location.pathname)` guard
  so the setState only runs when the pathname actually changed, and
  annotated the remaining set-state call with
  `// eslint-disable-next-line react-hooks/set-state-in-effect` —
  matching the project-wide precedent in
  `packages/ui/src/kit/multi-step-form.tsx:390` and
  `packages/ui/src/kit/image-upload-input.tsx:116`. Behavior is
  identical to the plan's intent (drawer auto-closes on route change)
  and the disable comment documents the route-change rationale.
- **Files:** `app/routes/workspace/layout.tsx`
- **Commit:** `2b1778a`

**2. [Rule 2 - Type safety] `userForShell` adapter**

- **Found during:** Task 2 (during the initial write, anticipated from
  type signatures).
- **Issue:** `WorkspaceNavbar` and `WorkspaceMobileHeader` expect
  `user: { email?: string | null }`, but `workspace.user` is a
  `JwtPayload` from `@supabase/supabase-js` where `email?: string` (not
  nullable). Passing it directly would compile but pollute the shell
  prop contract; passing a minimal adapter keeps the shell components
  decoupled from the JWT shape.
- **Fix:** Derived
  `const userForShell = { email: user.email ?? null };` once in the
  component body and passed it to both shell components. The original
  `user` is still passed unchanged to `WorkspaceSidebar` (whose
  contract expects the full JwtPayload).
- **Files:** `app/routes/workspace/layout.tsx`
- **Commit:** `2b1778a`

**3. [Prettier tailwindcss plugin - class reorder]**

- **Found during:** Task 2 pre-commit lint-staged.
- **Issue:** `prettier-plugin-tailwindcss` auto-sorts the `<main
  className="flex-1 overflow-y-auto">` and wrapper `className` tokens.
  Semantic classes are unchanged, only token order differs — same
  codebase-wide behavior observed in Plans 09-01, 09-02, 09-03.
- **Fix:** None — accepted the auto-formatting.

## Verification

- `pnpm typecheck` → exits 0.
- `pnpm lint` → 0 errors; 4 pre-existing warnings in
  `packages/ui/src/shadcn/data-table.tsx` and
  `packages/ui/src/kit/data-table.tsx` (unchanged, out-of-scope
  `react-hooks/incompatible-library` on TanStack Table).
- `rg "WorkspaceNavbar" app/routes/workspace/layout.tsx` → 2 matches
  (import + JSX).
- `rg "WorkspaceMobileHeader" app/routes/workspace/layout.tsx` → 2
  matches.
- `rg "WorkspaceMobileDrawer" app/routes/workspace/layout.tsx` → 2
  matches.
- `rg "useLocation" app/routes/workspace/layout.tsx` → 2 matches
  (import + call).
- `rg "drawerOpen" app/routes/workspace/layout.tsx` → ≥4 matches
  (useState, props, onClose).
- `rg "useRef<HTMLButtonElement" app/routes/workspace/layout.tsx` → 1
  match.
- `rg "\[location\.pathname\]" app/routes/workspace/layout.tsx` → 1
  match.
- `rg "hidden md:block" app/routes/workspace/layout.tsx` → 1 match
  (sidebar wrapper).
- `rg "hidden md:flex" app/routes/workspace/layout.tsx` → 1 match
  (navbar className).
- `rg "SidebarProvider" app/routes/workspace/layout.tsx` → 2 matches
  (import + JSX — still mounted per D-26).
- `rg "SidebarTrigger" app/routes/workspace/layout.tsx` → 0 matches.
- `rg "mobile-navigation" app/routes/workspace/layout.tsx` → 0 matches.
- Loader return shape verified via multi-line grep on `return {
  workspace, layoutState, accountSlug }` — present.
- `test -f app/components/sidebar/mobile-navigation.tsx` → exits
  non-zero (file deleted).
- `rg "sidebar/mobile-navigation" app/` → 0 matches.
- Manual smoke (desktop + 375px, drawer open/close, org switch, CRUD
  Outlet) deferred to Plan 09-05 per plan.

## Known Stubs

None. No hardcoded empty data, no placeholder UI introduced. The layout
continues to render the same live `workspace` data from the existing
`loadOrgWorkspace()` loader.

## Downstream Notes for Plan 09-05

- Desktop smoke: navbar 72px, sidebar 220px expanded / 68px collapsed
  with cookie persistence across reloads, gradient active pill, green-50
  sub-item chip.
- Mobile smoke (Chrome devtools 375px): desktop sidebar + navbar hidden,
  `WorkspaceMobileHeader` visible, hamburger opens drawer (spring
  slide), backdrop tap closes, leaf nav tap navigates + closes, Escape
  closes, internal route change auto-closes the drawer.
- Pitfall 1 check: verify the closed shadcn `Sheet` mounted by
  `SidebarProvider` is not intercepting clicks on mobile. If it is, the
  fix is to conditionally mount `SidebarProvider` only on the desktop
  branch — out of scope for this plan, tracked as threat T-09-04-04.
- Org switch via `SidebarProfileMenu` (sidebar footer) must still work.
- CRUD Outlet content unchanged (AG Grid routes, register sub-module).

## Self-Check: PASSED

- FOUND: app/routes/workspace/layout.tsx (modified)
- MISSING-AS-EXPECTED: app/components/sidebar/mobile-navigation.tsx
  (deleted — `test -f` exits non-zero)
- FOUND: commit 4359f89 (Task 1 delete)
- FOUND: commit 2b1778a (Task 2 integrate)
