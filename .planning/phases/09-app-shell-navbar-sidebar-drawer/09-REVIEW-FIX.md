---
phase: 09-app-shell-navbar-sidebar-drawer
fixed_at: 2026-04-10
review_path: .planning/phases/09-app-shell-navbar-sidebar-drawer/09-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 9: Code Review Fix Report

**Fixed at:** 2026-04-10
**Source review:** .planning/phases/09-app-shell-navbar-sidebar-drawer/09-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (WR-01, WR-02)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-01: Sub-item links use native `<a href>` — full page reload, breaks SPA navigation

**Files modified:** `app/components/sidebar/module-sidebar-navigation.tsx`
**Commit:** 444127a
**Applied fix:** Imported `Link` from `react-router` and replaced both the collapsed-mode and expanded-mode sub-item `<a href={subModulePath}>` elements with `<Link to={subModulePath}>`. SPA navigation now occurs without full document reload, preserving layout loader state, pathname-change effects in `layout.tsx`, and focus management. `onNavigate?.()` (drawer close) remains wired on the click handler.

### WR-02: Drawer focus-management effect returns focus to hamburger on initial mount

**Files modified:** `app/components/workspace-shell/workspace-mobile-drawer.tsx`
**Commit:** 297a971
**Applied fix:** Added a `wasOpenRef` ref initialized to `false`. The focus-return branch (`hamburgerRef.current.focus()`) now only runs when `wasOpenRef.current === true`, meaning a prior open→closed transition occurred. On initial mount with `open=false`, the effect is a no-op for the hidden hamburger, eliminating the latent focus-target bug at `md+` viewports.

---

_Fixed: 2026-04-10_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
