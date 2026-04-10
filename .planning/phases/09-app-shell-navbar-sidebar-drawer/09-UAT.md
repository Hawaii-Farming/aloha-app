---
status: complete
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
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Desktop navbar provides sidebar toggle, working search navigation, and a top-right avatar menu that replaces the legacy bottom-left user menu (without the org switcher)"
  status: failed
  reason: "User reported: side bar hide left nav / search bar does not work when clicking items / avatar should have functionality of bottom left one (bottom left one should be removed) without farm org"
  severity: major
  test: 2
  sub_issues:
    - "Sidebar collapse/hide toggle missing or non-functional in the new navbar"
    - "Command palette search items do not navigate when clicked (onSelect handler broken or missing routing)"
    - "Top-right navbar avatar needs to adopt bottom-left user menu functionality (theme toggle, sign out, account links); legacy bottom-left user menu must be removed; the new top-right menu must NOT include the org/farm switcher"
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Workspace navbar renders above/in-front of the sidebar — sidebar must not cover or hide the navbar at any viewport"
  status: failed
  reason: "User reported: navbar should not be hidden by sidebar"
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Mobile drawer has a discoverable way to close (explicit close button inside the drawer in addition to backdrop/Escape)"
  status: failed
  reason: "User reported: no way to close drawer"
  severity: major
  test: 8
  notes: "Test 6 passed (backdrop + Escape close paths work) but in focus-mode testing the user could not discover how to close the drawer — missing an explicit close (X) button inside the drawer panel."
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
