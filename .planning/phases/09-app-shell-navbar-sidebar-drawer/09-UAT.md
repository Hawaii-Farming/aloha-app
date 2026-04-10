---
status: diagnosed
phase: 09-app-shell-navbar-sidebar-drawer
source:
  - 09-01-SUMMARY.md
  - 09-02-SUMMARY.md
  - 09-03-SUMMARY.md
  - 09-04-SUMMARY.md
  - 09-05-SUMMARY.md
started: 2026-04-10
updated: 2026-04-10
---

## Current Test

[testing complete]

## Tests

### 1. Desktop Sidebar Restyle
expected: Sidebar 220px (68px collapsed), active module shows green→emerald gradient pill, active sub-item shows pale green chip with green-700 text, PanelLeft toggle icon
result: issue
reported: "active module is green→emerald gradient only for Human resources. all others are grey"
severity: major

### 2. Workspace Navbar (Desktop)
expected: 72px header at top with bg-card + bottom border. Left: gradient Aloha logo square + "Aloha" wordmark. Center: rounded search button showing Search icon + "Search..." + Cmd/Ctrl+K hint. Right: user avatar with email initial fallback.
result: issue
reported: "side bar hide left nav / search bar does not work when clicking items / avatar should have functionality of bottom left one (bottom left one should be removed) without farm org"
severity: major
sub_issues:
  - "Sidebar does not hide the left nav (missing sidebar toggle / collapse behavior in navbar)"
  - "Search command palette items do not navigate when clicked"
  - "Top-right avatar must adopt the bottom-left avatar menu's functionality (theme / sign-out / etc.), bottom-left avatar must be removed, and the org switcher ('farm org') must NOT be included in the new top-right menu"

### 3. Cmd/Ctrl+K Search Dialog
expected: Press Cmd+K (Mac) or Ctrl+K (Win/Linux) or click the center search button. Command palette dialog opens. Closes with Escape.
result: pass

### 4. Sidebar Sub-Item Navigation (SPA)
expected: Click a sub-item under an active module. Page transitions without full browser reload (no flash). URL updates, loader runs, active chip moves to new sub-item.
result: pass

### 5. Mobile Header (≤768px)
expected: Resize to 375px or use mobile device emulation. Top bar is 56px with hamburger button (left), gradient Aloha logo (center), avatar (right). Desktop sidebar and 72px navbar are hidden.
result: issue
reported: "navbar should not be hidden by sidebar"
severity: major

### 6. Mobile Drawer Open/Close
expected: Tap hamburger. Drawer slides in from the left with spring animation, backdrop fades in behind it. Drawer shows full module navigation. Tap backdrop OR press Escape — drawer slides out, backdrop fades, focus returns to hamburger button.
result: pass

### 7. Drawer Auto-Close on Navigation
expected: Open mobile drawer, tap any nav link. Route changes AND drawer closes automatically (no manual close needed).
result: pass

### 8. Drawer A11y Focus Behavior
expected: Open drawer — focus lands on first nav link inside drawer (not outside). Close drawer — focus returns to the hamburger button that opened it.
result: issue
reported: "no way to close drawer"
severity: major

### 9. Dark Mode Theme
expected: Toggle to dark theme. Sidebar, navbar, drawer all render with dark surfaces. Gradient active pill still visible. No white flashes or broken contrast.
result: pass

## Summary

total: 9
passed: 5
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "All active modules in the desktop sidebar render with the green→emerald gradient pill (not just Human Resources)"
  status: failed
  reason: "User reported: active module is green→emerald gradient only for Human resources. all others are grey"
  severity: major
  test: 1
  root_cause: "The module header in ModuleSidebarNavigation is a CollapsibleTrigger only — it toggles the accordion but never navigates. Only sub-items are wrapped in <Link>. isModuleActive is derived from currentPath.startsWith(modulePath) with no HR hardcoding, so the gradient is symmetric — but since clicking a module header doesn't change the URL, currentPath stays on the initial landing module (HR), and only HR ever receives the gradient. Compounded by the auto-expand Set only opening the initially-active module, so users see collapsed headers that appear 'grey' because they never become active."
  artifacts:
    - path: "app/components/sidebar/module-sidebar-navigation.tsx"
      issue: "Collapsed branch (lines 104–118) and expanded branch (lines 172–205) wrap the module header in CollapsibleTrigger only — no navigation affordance. Sub-items (lines 141–148, 231–241) are the only <Link> elements."
  missing:
    - "Make module header navigate to modulePath on click (existing /home/:account/:module route redirects to first sub-module — no new route work)"
    - "Apply fix to BOTH collapsed SidebarMenuButton branch and expanded SidebarGroupLabel branch"
    - "Preserve keyboard accordion toggling (move trigger onto chevron affordance, OR keep trigger and add parallel navigate() onClick)"
  debug_session: ".planning/debug/sidebar-gradient-only-hr.md"

- truth: "Desktop navbar provides sidebar toggle, working search navigation, and a top-right avatar menu that replaces the legacy bottom-left user menu (without the org switcher)"
  status: failed
  reason: "User reported: side bar hide left nav / search bar does not work when clicking items / avatar should have functionality of bottom left one (bottom left one should be removed) without farm org"
  severity: major
  test: 2
  sub_issues:
    - "Sidebar collapse/hide toggle missing or non-functional in the new navbar"
    - "Command palette search items do not navigate when clicked (onSelect handler broken or missing routing)"
    - "Top-right navbar avatar needs to adopt bottom-left user menu functionality (theme toggle, sign out, account links); legacy bottom-left user menu must be removed; the new top-right menu must NOT include the org/farm switcher"
  root_cause: |
    Three distinct never-implemented gaps in WorkspaceNavbar and NavbarSearch:
    (2a) workspace-navbar.tsx never imports useSidebar and never renders a toggle button — only the floating SidebarEdgeToggle nub on the sidebar's right edge exists. Provider scope already allows a navbar-mounted toggle (both mount inside the same SidebarProvider in workspace/layout.tsx).
    (2b) navbar-search.tsx renders static <CommandItem>Dashboard</CommandItem>-style placeholders with zero props — no onSelect, no value, no href, no useNavigate import. Selecting an item is a no-op and doesn't even close the dialog.
    (2c) workspace-navbar.tsx renders a bare <Avatar> with no DropdownMenu. Legacy SidebarProfileMenu still mounts in WorkspaceSidebar's <SidebarFooter> (bottom-left) and contains: label 'Signed in as' + email, org switcher DropdownMenuSub (EXCLUDE per UAT), <SubMenuModeToggle /> theme toggle, and 'Sign out' via useSignOut. Scope to port = label + theme toggle + sign out.
  artifacts:
    - path: "app/components/workspace-shell/workspace-navbar.tsx"
      issue: "No sidebar toggle button; bare <Avatar> with no DropdownMenu (lines 15–54)"
    - path: "app/components/navbar-search.tsx"
      issue: "Static <CommandItem> placeholders (lines 59–63) with no onSelect/useNavigate; workspace.navigation never threaded down"
    - path: "app/components/sidebar/workspace-sidebar.tsx"
      issue: "Still mounts legacy <SidebarProfileMenu> in <SidebarFooter> (lines 68–75); must remove footer + accounts/accessLevelId props"
    - path: "app/components/sidebar/sidebar-profile-menu.tsx"
      issue: "Template for items to port (label + theme toggle + sign out). Org switcher DropdownMenuSub (lines 103–135) must NOT be ported."
    - path: "app/routes/workspace/layout.tsx"
      issue: "Must thread workspace.navigation into WorkspaceNavbar for search; drop accounts/accessLevelId from WorkspaceSidebar call site"
  missing:
    - "Add PanelLeft toggle button to WorkspaceNavbar left cluster calling useSidebar().toggleSidebar()"
    - "Import useNavigate in NavbarSearch; accept an items prop (label, path) threaded from workspace.navigation via WorkspaceNavbar; wire onSelect={() => { navigate(item.path); setOpen(false); }}"
    - "Wrap Avatar in DropdownMenu (new workspace-navbar-profile-menu.tsx) with: label 'Signed in as' + email, <SubMenuModeToggle />, Sign out via useSignOut — EXCLUDE the org switcher"
    - "Remove <SidebarFooter> + <SidebarProfileMenu> from WorkspaceSidebar; delete unused accounts/accessLevelId props through the layout call chain"
    - "Optionally delete the legacy SidebarEdgeToggle nub"
  debug_session: ".planning/debug/09-navbar-toggle-search-avatar.md"

- truth: "Workspace navbar renders above/in-front of the sidebar — sidebar must not cover or hide the navbar at any viewport"
  status: failed
  reason: "User reported: navbar should not be hidden by sidebar"
  severity: major
  test: 5
  root_cause: |
    CSS stacking mismatch between the shadcn <Sidebar> primitive and the workspace layout's flex column. Three compounding problems:
    (1) Sidebar panel in packages/ui/src/shadcn/sidebar.tsx (lines 259–272) uses `fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) md:flex left-0` — position:fixed removes the panel from flex flow entirely.
    (2) inset-y-0 + h-svh anchors top:0 / h:100vh to the viewport, so the panel literally starts at pixel 0 of the window, covering the top 72px where WorkspaceNavbar paints.
    (3) Sidebar panel has z-10 but WorkspaceNavbar (workspace-navbar.tsx line 18) and WorkspaceMobileHeader (line 25) have no z-index — sidebar wins the stacking context and paints over the navbar's left 220px (logo + wordmark area).
    The sibling gap/spacer div reserves horizontal width in the flex row but does NOT push the fixed panel's top edge down. NOTE: the bug affects >=768px (desktop); <768px uses a separate Radix Dialog drawer that mounts only when opened.
  artifacts:
    - path: "packages/ui/src/shadcn/sidebar.tsx"
      issue: "Visible sidebar panel lines 259–272 uses `fixed inset-y-0 z-10 ... h-svh` — viewport-anchored, covers top 72px"
    - path: "app/components/workspace-shell/workspace-navbar.tsx"
      issue: "Line 18 <header> has `flex h-[72px] shrink-0 ...` — no position, no z-index, no relative; cannot defend against the z-10 sidebar"
    - path: "app/components/workspace-shell/workspace-mobile-header.tsx"
      issue: "Line 25 <header> same pattern — no z-index"
    - path: "app/components/sidebar/workspace-sidebar.tsx"
      issue: "Line 57 passes only `bg-card border-border border-r` to <Sidebar> — no positional className override"
    - path: "app/routes/workspace/layout.tsx"
      issue: "Lines 69–95 build a flex column assuming siblings stack normally, which the fixed shadcn sidebar violates"
  missing:
    - "Override <Sidebar> className in WorkspaceSidebar to push fixed panel below header: `md:top-[72px] md:h-[calc(100svh-72px)]`"
    - "Add `relative z-20` to WorkspaceNavbar <header> so it stacks above the sidebar's z-10 during any transition"
    - "Add `relative z-20` to WorkspaceMobileHeader <header> for symmetry (even though the <768px sidebar path is a separate component)"
    - "DO NOT attempt to fix by moving SidebarProvider inside a below-navbar wrapper — inset-y-0 is viewport-relative, not parent-relative"
  debug_session: ".planning/debug/navbar-hidden-by-sidebar.md"

- truth: "Mobile drawer has a discoverable way to close (explicit close button inside the drawer in addition to backdrop/Escape)"
  status: failed
  reason: "User reported: no way to close drawer"
  severity: major
  test: 8
  notes: "Test 6 passed (backdrop + Escape close paths work) but in focus-mode testing the user could not discover how to close the drawer — missing an explicit close (X) button inside the drawer panel."
  root_cause: "workspace-mobile-drawer.tsx motion.nav panel (lines 68–91) has exactly one direct child — the scrollable nav div containing <ModuleSidebarNavigation forceExpanded>. There is no header row, no close button, no X icon, no Button import, no lucide-react icons. The onClose callback is wired to backdrop click and the Escape listener, but nothing inside the drawer exposes it visually. Plan 09-03 intentionally shipped only focus-on-open + focus-return-on-close — the missing close button is a plan scope gap, not a regression."
  artifacts:
    - path: "app/components/workspace-shell/workspace-mobile-drawer.tsx"
      issue: "motion.nav panel has no header row or close button — only the nav list"
  missing:
    - "Insert a header row as the FIRST direct child of <motion.nav>, BEFORE the existing <div ref={firstNavRef}>, so it remains a sibling (preserves focus-on-open targeting)"
    - "Header shape: `<div className='flex h-14 shrink-0 items-center justify-between border-b border-border px-3'>` with optional AlohaLogoSquare+wordmark on the left"
    - "Close button: `<Button variant='ghost' size='icon' onClick={onClose} aria-label='Close navigation menu' data-test='workspace-mobile-drawer-close'><X className='size-5' /></Button>`"
    - "New imports: X from lucide-react, Button from @aloha/ui/button"
    - "No prop changes, no state changes — hamburgerRef focus return still works"
  debug_session: ".planning/debug/drawer-missing-close-button.md"
