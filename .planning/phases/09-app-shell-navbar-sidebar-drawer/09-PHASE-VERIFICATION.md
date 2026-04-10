---
phase: 09-app-shell-navbar-sidebar-drawer
verified: 2026-04-10
status: passed
verified_by: claude (gsd-verifier, goal-backward re-verification)
re_verification:
  previous_status: gaps_found (via 09-UAT.md — 4 major issues)
  previous_score: 5/9 UAT tests passed
  gaps_closed:
    - "Test 1 — active module gradient only on HR"
    - "Test 2 — navbar missing sidebar toggle / broken search / wrong avatar menu"
    - "Test 5 — navbar hidden by sidebar"
    - "Test 8 — mobile drawer has no discoverable close button"
  gaps_remaining: []
  regressions: []
gap_plans_verified:
  - 09-06 (sidebar layer: gradient + z-stacking)
  - 09-07 (navbar: toggle, search, profile menu)
  - 09-08 (mobile drawer: close button)
---

# Phase 9 — Gap-Closure Verification Report

Goal-backward re-verification of Phase 9 after gap-closure plans 09-06, 09-07, 09-08 landed on `dev-jean`. The prior 09-VERIFICATION.md marked the phase PASS on static grep coverage, but the subsequent user UAT (09-UAT.md) surfaced 4 major functional gaps. This report verifies those 4 gaps are now closed in the actual source — not just that the plans' tasks were marked done.

## Automated Gate

| Command | Exit | Notes |
|---------|------|-------|
| `pnpm typecheck` | 0 | Clean: `react-router typegen && tsc` both succeed. |
| `pnpm lint` | 0 errors, 4 warnings | All 4 warnings pre-existing and unrelated to Phase 9: 2 `react-hooks/exhaustive-deps` in `app/components/crud/table-list-view.tsx` and 2 `react-hooks/incompatible-library` in `packages/ui/src/{kit,shadcn}/data-table.tsx` (TanStack Table). No new errors or warnings introduced by 09-06/07/08. |

## Per-UAT-Gap Verdict

### Test 1 — Desktop sidebar active module gradient (Gap from 09-06)

**Truth:** All active modules in the desktop sidebar render with the green→emerald gradient pill (not just Human Resources). Root cause: module header was a `CollapsibleTrigger`-only with no navigation, so clicking non-HR modules never changed `currentPath`, so `isModuleActive` never became true for them.

**Verdict: PASS**

Evidence (`app/components/sidebar/module-sidebar-navigation.tsx`):
- Lines 114–125: Collapsed branch now wraps a `<Link to={modulePath}>` inside `<SidebarMenuButton asChild>`. `onClick` both navigates and opens the accordion if closed, and calls `onNavigate?.()` so the mobile drawer still auto-closes.
- Lines 188–205: Expanded branch now has a split `<SidebarGroupLabel>` containing two siblings: a `<Link to={modulePath}>` wrapping icon+label (flex-1) and a dedicated `<CollapsibleTrigger asChild><button aria-label="Toggle ... sub-items">` wrapping the chevron svg (lines 206–233). Keyboard-accessible accordion toggle preserved via a distinct tab stop.
- Lines 110 & 184: The gradient recipe `rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25` is symmetric across both branches and conditionally applied solely on `isModuleActive` (no HR-specific code anywhere). With `<Link>` in place, clicking any module header now moves `currentPath`, flipping `isModuleActive` for that module and painting the gradient. Closes Gap 1.
- `grep to={modulePath}` → 2 matches (lines 115, 189). Each branch has exactly one navigable header.

### Test 2 — Desktop navbar toggle / search / avatar menu (Gap from 09-07)

**Truth:** Desktop navbar provides sidebar toggle, working search navigation, and a top-right avatar menu that replaces the legacy bottom-left user menu (without the org switcher).

**Verdict: PASS** (all 3 sub-gaps closed)

**Sub-gap 2a — Sidebar toggle in navbar.** Evidence (`app/components/workspace-shell/workspace-navbar.tsx`):
- Line 5: imports `useSidebar` from `@aloha/ui/shadcn-sidebar`.
- Line 33: `const { toggleSidebar } = useSidebar();` — safe because `<SidebarProvider>` wraps the layout.
- Lines 56–64: `PanelLeft` button in the left cluster with `onClick={toggleSidebar}`, `data-test="workspace-navbar-sidebar-toggle"`, `aria-label="Toggle sidebar"`. Discoverable and keyboard accessible.

**Sub-gap 2b — Command palette navigates on select.** Evidence (`app/components/navbar-search.tsx`):
- Line 3: `import { useNavigate } from 'react-router';`
- Line 17: `export interface NavbarSearchItem { path, label, group? }`
- Line 28: `items?: NavbarSearchItem[]` prop
- Line 36: `const navigate = useNavigate();`
- Line 95: `<CommandItem … onSelect={() => handleSelect(item.path)} … />` — `handleSelect` calls `navigate(path)` and `setOpen(false)`.
- `WorkspaceNavbar` lines 35–46 build `searchItems` from `navigation.modules` (grouped "Modules") and `navigation.subModules` (grouped "Pages") and pass them via `items={searchItems}` on line 72. The search dialog now renders real, navigable items bucketed by group. Static placeholder `<CommandItem>Dashboard</CommandItem>` strings are gone. Closes 2b.

**Sub-gap 2c — Top-right avatar menu replaces legacy bottom-left menu, org switcher excluded.** Evidence:
- New file `app/components/workspace-shell/workspace-navbar-profile-menu.tsx` (81 lines). Contains:
  - Line 26: `export function WorkspaceNavbarProfileMenu`.
  - Lines 57–62: `DropdownMenuLabel` with `<Trans i18nKey="common:signedInAs" />` + `{displayName}` span.
  - Line 66: `<SubMenuModeToggle />` (theme toggle).
  - Lines 70–76: Sign out `DropdownMenuItem` wired to `signOut.mutateAsync()` from `useSignOut()`.
  - Grep for `DropdownMenuSub`, `Building2`, `handleOrgSwitch`, `setLastOrg`, `pathsConfig` in this file → 0 matches. **Org switcher explicitly NOT ported.**
- `WorkspaceNavbar` line 91: `<WorkspaceNavbarProfileMenu user={user} />` replaces the old bare `<Avatar>`.
- `WorkspaceSidebar` (`app/components/sidebar/workspace-sidebar.tsx`) now only contains `SidebarContent` + `SidebarEdgeToggle` (lines 39–53). Grep for `SidebarProfileMenu`, `SidebarFooter`, `accounts`, `accessLevelId` → 0 matches in this file. Legacy bottom-left menu removed.
- `app/routes/workspace/layout.tsx` lines 65–69 pass `account={accountSlug}`, `user={user}`, `navigation={workspace.navigation}` to `<WorkspaceNavbar>`. The `<WorkspaceSidebar>` call receives only `account` + `navigation` (no `accounts`, no `accessLevelId`). Prop-shape change propagated through the call chain. Closes 2c.

### Test 5 — Navbar hidden by sidebar (Gap from 09-06)

**Truth:** Workspace navbar renders above/in front of the sidebar at every viewport — the sidebar panel must not cover the navbar's logo + wordmark area. Root cause: shadcn `<Sidebar>` panel is rendered as `fixed inset-y-0 z-10 h-svh`, and the navbar had no z-index, so the panel's `z-10` painted over the top 72px.

**Verdict: PASS**

Evidence:
- `app/components/sidebar/workspace-sidebar.tsx` line 42: `<Sidebar collapsible={'icon'} className="bg-card border-border border-r md:top-[72px] md:h-[calc(100svh-72px)]">`. The `className` prop lands on the inner fixed panel (confirmed against `packages/ui/src/shadcn/sidebar.tsx` lines 259–272). `md:top-[72px]` overrides the `inset-y-0` top at the md breakpoint; `md:h-[calc(100svh-72px)]` shrinks the height so it stops at the viewport bottom. The panel now starts at y=72 on desktop.
- `app/components/workspace-shell/workspace-navbar.tsx` line 52: `'bg-card border-border relative z-20 flex h-[72px] shrink-0 items-center gap-4 border-b px-6'`. `relative z-20` establishes a stacking context that beats the sidebar panel's `z-10`, guaranteeing the navbar paints above even during the collapse/expand transition.
- `app/components/workspace-shell/workspace-mobile-header.tsx` line 28: same `relative z-20` added for symmetry.
- `packages/ui/src/shadcn/sidebar.tsx` was NOT modified (fix routed entirely via `className` override). Closes Gap 5.

### Test 8 — Mobile drawer has no discoverable close button (Gap from 09-08)

**Truth:** Mobile drawer has a discoverable way to close in addition to backdrop/Escape (explicit X button inside the drawer panel). Focus-on-open must still land on the first nav link, and focus-return-on-close must still target the hamburger.

**Verdict: PASS**

Evidence (`app/components/workspace-shell/workspace-mobile-drawer.tsx`):
- Line 4: `import { X } from 'lucide-react';`
- Line 6: `import { Button } from '@aloha/ui/button';`
- Line 11: `import { AlohaLogoSquare } from './aloha-logo-square';`
- Lines 84–100: Header row is the FIRST direct child of `<motion.nav>`. It contains `<AlohaLogoSquare size="sm" />` + "Aloha" wordmark on the left and a ghost `<Button size="icon" onClick={onClose} aria-label="Close navigation menu" data-test="workspace-mobile-drawer-close">` with `<X className="size-5" />` on the right. Visible, keyboard accessible, discoverable.
- Lines 102–113: The scrollable `<div ref={firstNavRef}>` remains a SIBLING of the header row (not wrapping it). The focus-on-open effect (lines 44–58) still runs `firstNavRef.current?.querySelector<HTMLElement>('a, button')?.focus()` — because the close button lives in the sibling header, not inside `firstNavRef`, the query still targets the first nav link inside the scrollable area. Focus-on-open contract preserved.
- Lines 54–57: The `wasOpenRef` transition guard still fires `hamburgerRef?.current?.focus()` on the open→closed transition. Focus-return-on-close contract preserved.
- Line 35: Escape key listener still wired; Line 69: backdrop `onClick={onClose}` still wired. Two original close paths (Test 6) NOT regressed.
- Closes Gap 4/8.

## Prior-Behavior Regression Check

| Behavior | Source | Status |
|---|---|---|
| Sidebar widths 220/68 (13.75rem/4.25rem) | `packages/ui/src/shadcn/sidebar.tsx` lines 34, 36 | PASS — unchanged, file not modified |
| Active-module green→emerald gradient pill | `module-sidebar-navigation.tsx` lines 110, 184 (both branches) | PASS — now reaches every active module (was the Test 1 fix) |
| Active sub-item pale green chip `bg-green-50 text-green-700` + `border-green-200` left rail | `module-sidebar-navigation.tsx` lines 145, 237, 256 | PASS — untouched by 09-06/07/08 |
| Mobile drawer Escape close | `workspace-mobile-drawer.tsx` lines 32–39 | PASS — preserved |
| Mobile drawer backdrop close | `workspace-mobile-drawer.tsx` lines 64–72 | PASS — preserved |
| Focus-on-open → first nav link | `workspace-mobile-drawer.tsx` lines 44–52 + sibling header row | PASS — close button is sibling of `firstNavRef`, not inside it |
| Focus-return-on-close → hamburger | `workspace-mobile-drawer.tsx` lines 54–57 with `wasOpenRef` open→closed guard | PASS — preserved |
| Drawer auto-close on leaf navigation | `workspace-mobile-drawer.tsx` line 110: `onNavigate={onClose}` | PASS — preserved |
| Navbar 72px height + gradient logo | `workspace-navbar.tsx` line 52 (`h-[72px]`), `aloha-logo-square.tsx` | PASS — unchanged |
| Loader contract `{ workspace, layoutState, accountSlug }` | `app/routes/workspace/layout.tsx` | PASS — loader not modified by gap plans |
| shadcn `sidebar.tsx` guardrail (no direct edits) | `packages/ui/src/shadcn/sidebar.tsx` | PASS — fix routed entirely via `className` override |

No regressions detected.

## Requirements Coverage (Phase 09)

| REQ-ID | Status | Notes |
|---|---|---|
| NAVBAR-01 | PASS | 72px height + `relative z-20` stacking fix intact |
| NAVBAR-02 | PASS | Command palette now navigates via `useNavigate` + `onSelect`; `items` prop wired from layout |
| NAVBAR-03 | PASS | Avatar now triggers `WorkspaceNavbarProfileMenu` dropdown (label + theme toggle + sign out); org switcher excluded as required |
| NAVBAR-04 | PASS | Mobile header still `md:hidden`-gated, with `relative z-20` symmetry |
| SIDEBAR-01 | PASS | 13.75rem / 4.25rem widths unchanged in `packages/ui/src/shadcn/sidebar.tsx` |
| SIDEBAR-02 | PASS | Gradient pill now reaches every active module (was the core Test 1 bug) |
| SIDEBAR-03 | PASS | Sub-item `bg-green-50 text-green-700` + `border-green-200` untouched |
| SIDEBAR-04 | PASS | `SidebarEdgeToggle` + new navbar `PanelLeft` toggle both present |
| SIDEBAR-05 | PASS | `hidden md:block` wrapper in layout preserved |
| DRAWER-01 | PASS | `bg-black/30` backdrop preserved (line 68) |
| DRAWER-02 | PASS | Drawer mounted from layout |
| DRAWER-03 | PASS | framer-motion spring transition preserved (line 77) |
| DRAWER-04 | PASS | `onNavigate={onClose}` leaf-tap close preserved + explicit X button added |
| DRAWER-05 | PASS | `ModuleSidebarNavigation forceExpanded` still single nav source |

All 14 REQ-IDs satisfied.

## Remaining Gaps

None. All 4 originally-failing UAT tests (1, 2, 5, 8) now PASS in static source verification. Previously-passing UAT tests (3, 4, 6, 7, 9) show no regression signals in the modified files.

## Recommended Manual Smoke (non-blocking)

Static verification cannot observe browser paint, keyboard focus ring, or live navigation timing. A single ~3-minute smoke at `/home/:account/...` would close the last loop visually:

1. Click a non-HR module header in the expanded desktop sidebar → URL changes, gradient pill moves.
2. Click the navbar `PanelLeft` toggle → sidebar collapses to 68px icon rail; click again → expands to 220px.
3. Press ⌘K → type a module name → press Enter → route changes + dialog closes.
4. Click the top-right avatar → verify dropdown shows "Signed in as" + email + theme toggle + sign out, and NO org switcher / Building2 icon.
5. Verify the desktop navbar's Aloha logo + wordmark are fully visible (not covered by the sidebar's left edge).
6. Resize to 375px → tap hamburger → drawer opens → verify X button visible in the header row → tap X → drawer closes → focus returns to hamburger.

These are sanity confirmations, not verification blockers.

## Overall Phase Verdict

**PASS**

- `pnpm typecheck` clean.
- `pnpm lint` 0 errors (4 pre-existing warnings in unrelated files).
- All 4 previously-failing UAT gaps (Tests 1, 2, 5, 8) have concrete, in-source evidence of closure.
- No regressions to prior-phase behaviors (sidebar widths, gradient recipes, drawer focus contracts, loader contract, shadcn source guardrail).
- All 14 Phase 9 REQ-IDs still satisfied.
- `packages/ui/src/shadcn/sidebar.tsx` untouched — fix routed entirely through `className` override per plan guardrail.

Phase 9 gap closure is complete and ready for human smoke confirmation.

---

_Verified: 2026-04-10_
_Verifier: Claude (gsd-verifier, goal-backward re-verification)_
