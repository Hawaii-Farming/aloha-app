---
phase: 09-app-shell-navbar-sidebar-drawer
verified: 2026-04-10
verifier: claude (gsd-verifier, goal-backward pass)
status: passed
score: 5/5 success criteria verified
re_verification:
  previous_status: passed
  previous_score: 14/14 REQ-ID grep assertions
  previous_report: 09-VERIFICATION.md
  note: |
    09-VERIFICATION.md is the plan-05 grep/a11y gate (REQ-ID level).
    This report is the goal-backward phase verification (success-criterion level)
    required by the Phase-9 exit gate. Both are retained.
code_review_carryover:
  blocker: 0
  warning: 2
  info: 6
  warnings:
    - id: WR-01
      file: app/components/sidebar/module-sidebar-navigation.tsx
      concern: "sub-item links use native <a href> — full page reload, DRAWER-04 close works only via unload side effect"
      status: acknowledged (advisory; Phase 9 success criteria still satisfied; logged for Phase 10 SPA-nav fix)
    - id: WR-02
      file: app/components/workspace-shell/workspace-mobile-drawer.tsx
      concern: "drawer focus-management effect returns focus to hidden hamburger on initial mount (no-op in practice)"
      status: acknowledged (latent; no observable effect; logged for Phase 10 polish)
manual_smoke:
  status: pending-user (headless executor, no browser)
  items: 7
  blocking: false
recommendation: APPROVE
---

# Phase 9 — Goal-Backward Phase Verification

**Phase goal:** Replace the workspace shell with the Aloha navbar, desktop sidebar, and mobile drawer so every logged-in route is framed by the new chrome WITHOUT loader or nav-config changes.

**Verifier stance:** Success-criterion-first. For each of the 5 ROADMAP success criteria, verify the shipped source delivers the behavior. The existing `09-VERIFICATION.md` is the plan-05 grep gate at REQ-ID granularity; this report is the phase gate at goal granularity.

---

## Success Criterion Verdicts

### SC#1 — Desktop navbar (72px + logo + search + avatar)

**Expected:** 72px tall header; gradient Aloha logo square + "Aloha" wordmark left; centered command-palette search button (Search icon + "Search..." + ⌘K hint); existing avatar on the right restyled to new tokens; search wires through unchanged.

**Evidence:**
- `app/components/workspace-shell/workspace-navbar.tsx:21` — `h-[72px]` on the `<header>` element.
- `app/components/workspace-shell/workspace-navbar.tsx:26-28` — `<AlohaLogoSquare size="md" />` + `<span className="text-foreground text-lg font-semibold">Aloha</span>` left cluster.
- `app/components/workspace-shell/aloha-logo-square.tsx:17` — `bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25` on the logo square.
- `app/components/workspace-shell/workspace-navbar.tsx:30-47` — `<NavbarSearch renderTrigger={...}>` centered button with `Search` icon, "Search..." literal, `Command` icon + `K` hint, and the render-prop hook reuses the existing `NavbarSearch` dialog logic unchanged.
- `app/components/workspace-shell/workspace-navbar.tsx:3,49-51` — `Avatar`/`AvatarFallback` imported from the Phase 8 `@aloha/ui/avatar` primitive (not the legacy shadcn path).
- `app/components/navbar-search.tsx` exposes `renderTrigger` as a seam (confirmed 4 matches in plan-05 grep gate); the dialog logic is not forked.

**Verdict:** PASS.

Minor note (advisory only): IN-02 from 09-REVIEW notes that `renderTrigger` is passed `isMac` but the navbar hardcodes `⌘K` on Windows/Linux too. SC#1 only requires the literal "⌘K" hint visible in the button — it is. Not a criterion failure.

---

### SC#2 — Desktop sidebar (220/68px + gradient pill + accordion + PanelLeft + cookie)

**Expected:** 220px expanded / 68px collapsed; slate-200 right border; gradient active pill; accordion sub-items with green-50 chip + green-200 left rail for active, slate for inactive; `PanelLeft` toggle; collapsed state persists across reload via existing cookie; loader contract unchanged.

**Evidence:**
- `packages/ui/src/shadcn/sidebar.tsx:34-36` — `SIDEBAR_WIDTH = '13.75rem'` (220px) and `SIDEBAR_WIDTH_ICON = '4.25rem'` (68px). Constants are consumed at lines 141-145 and 154 via CSS vars.
- `app/components/sidebar/workspace-sidebar.tsx:57` — `<Sidebar collapsible={'icon'} className="bg-card border-border border-r">` — right border via tokenized `border-border` (slate-200 in Aloha light palette per DESIGN.md).
- `app/components/sidebar/module-sidebar-navigation.tsx:110, 177` — `rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25` applied to active module pill in BOTH the collapsed-icon branch and the expanded branch.
- `app/components/sidebar/module-sidebar-navigation.tsx:137, 227` — active sub-item chip `rounded-lg bg-green-50 font-medium text-green-700` in both branches.
- `app/components/sidebar/module-sidebar-navigation.tsx:208` — `<div className="ml-5 border-l-2 border-green-200 pl-3">` accordion rail wrapping expanded-branch sub-items.
- `app/components/sidebar/module-sidebar-navigation.tsx:138, 228` — inactive sub-items use `text-muted-foreground hover:bg-muted hover:text-foreground` (slate tokens).
- `app/components/sidebar/workspace-sidebar.tsx:3, 23-42` — `SidebarEdgeToggle` component uses the `PanelLeft` icon and calls `useSidebar().toggleSidebar` with an active/rotated visual state.
- `app/routes/workspace/layout.tsx:19-36, 109-124` — loader still returns `{ workspace, layoutState, accountSlug }` (byte-identical shape); `getLayoutState()` still parses `sidebarStateCookie` and passes `layoutState.open` into `<SidebarProvider defaultOpen={layoutState.open}>` at line 69. Cookie mechanism is untouched — `toggleSidebar` in the shadcn sidebar primitive writes the cookie via its existing mechanism.

**Verdict:** PASS.

---

### SC#3 — Mobile shell (sidebar hidden + compact header + spring drawer over black/30)

**Expected:** Below `md` breakpoint, desktop sidebar hidden; compact mobile header shows hamburger + logo + avatar; tapping hamburger opens full-screen drawer sliding from the left over `bg-black/30` backdrop using Framer Motion spring + fade.

**Evidence:**
- `app/routes/workspace/layout.tsx:80-88` — desktop sidebar wrapped in `<div className="hidden md:block">`.
- `app/routes/workspace/layout.tsx:71` — desktop navbar also gated with `className="hidden md:flex"`.
- `app/components/workspace-shell/workspace-mobile-header.tsx:28` — mobile header `md:hidden` at the header level.
- `app/components/workspace-shell/workspace-mobile-header.tsx:32-51` — hamburger button (`<Menu>` icon, 36×36 target), `AlohaLogoSquare` + "Aloha" wordmark, right-side `Avatar`.
- `app/routes/workspace/layout.tsx:72-77, 97-103` — hamburger is wired: `onOpenDrawer={() => setDrawerOpen(true)}`, drawer mounted with `open={drawerOpen}`.
- `app/components/workspace-shell/workspace-mobile-drawer.tsx:56` — backdrop `motion.div` with `bg-black/30 md:hidden` + `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}` (fade).
- `app/components/workspace-shell/workspace-mobile-drawer.tsx:61-66` — panel `motion.nav` with `initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}` — verbatim prototype spring values.
- `package.json:134` — `"framer-motion": "^12.38.0"` in root only (no duplicate in `packages/ui/package.json`, per plan-05 grep gate).

**Verdict:** PASS.

---

### SC#4 — Drawer dismiss semantics + single nav source

**Expected:** Tapping backdrop OR any leaf nav item closes the drawer; drawer reuses the same nav data source as the desktop sidebar (no duplication).

**Evidence:**
- `app/components/workspace-shell/workspace-mobile-drawer.tsx:57` — backdrop `onClick={onClose}`.
- `app/components/workspace-shell/workspace-mobile-drawer.tsx:76-82` — drawer JSX renders `<ModuleSidebarNavigation …onNavigate={onClose} forceExpanded />`. The `onNavigate={onClose}` prop wires leaf taps to drawer close.
- `app/components/sidebar/module-sidebar-navigation.tsx:143, 233` — `onClick={() => onNavigate?.()}` on every sub-item anchor in both branches.
- `app/components/workspace-shell/workspace-mobile-drawer.tsx:5, 76` — drawer IMPORTS and RENDERS the same `ModuleSidebarNavigation` component that the desktop sidebar uses. No duplicate nav config exists. The shared prop contract (`onNavigate?: () => void`, `forceExpanded?: boolean`) is defined once at `module-sidebar-navigation.tsx:28-29`.
- `app/routes/workspace/layout.tsx:97-103` — both desktop sidebar (line 81) and mobile drawer (line 97) are fed from the same `workspace.navigation` object, which originates from the single `loadOrgWorkspace()` call at line 25.
- `app/components/sidebar/mobile-navigation.tsx` — **confirmed deleted** (glob returns no file). The legacy duplicate is gone.

**Caveat (WR-01 from 09-REVIEW):** Sub-item anchors use raw `<a href>` rather than React Router `<Link>`. This means "tap leaf → close" currently works as a side effect of the full-page navigation (the whole SPA re-boots, drawer state is wiped by the unload). Functionally, SC#4's observable outcome is still satisfied: tapping a leaf closes the drawer. But the implementation is structurally brittle — if WR-01 is fixed to use `<Link>` without also relying on `onNavigate?.()` firing synchronously before the nav, close behavior must be re-verified. This is advisory only and does not downgrade SC#4's PASS status at the goal level. Logged for Phase 10 (see also `auto-close-on-route-change` useEffect at `layout.tsx:60` which is currently a dead path for the same reason).

**Verdict:** PASS (with WR-01 advisory noted).

---

### SC#5 — Loader contract + org switching + permissions unchanged

**Expected:** All existing workspace routes still load correctly; org switching, navigation permissions, and `loadOrgWorkspace()` contract unchanged.

**Evidence:**
- `app/routes/workspace/layout.tsx:19-36` — loader shape: `{ workspace, layoutState, accountSlug }`. `loadOrgWorkspace({ orgSlug: accountSlug, client, request })` called unchanged; no new queries, no new derived fields.
- `app/routes/workspace/layout.tsx:39-45` — consumer destructures `{ layoutState, workspace, accountSlug }` — identical to pre-Phase-9 contract. `workspace.userOrgs`, `workspace.navigation`, `workspace.user`, `workspace.currentOrg.access_level_id` all still accessed via the same paths.
- `app/components/sidebar/workspace-sidebar.tsx:68-74` — `SidebarProfileMenu` (org-switcher) is still mounted in the sidebar footer with `accounts`, `accountSlug`, `accessLevelId` props — unchanged contract.
- No `.server.ts` file was edited in Phase 9 (spot-checked via the 09-REVIEW `files_reviewed_list` — zero server files).
- `pnpm typecheck` and `pnpm lint` reported clean in 09-VERIFICATION.md (0 errors, 0 new warnings).
- `<Outlet />` at `layout.tsx:92` still renders children inside `<main className="flex-1 overflow-y-auto">` — existing CRUD routes, HR modules, and detail pages inherit the new chrome without any per-route change.

**Verdict:** PASS.

Manual regression of a CRUD list route (e.g. `/home/:account/hr/employees`) is listed in the pending manual smoke checklist but is NOT a verification blocker given typecheck + lint are clean and no route file was modified.

---

## Overall Verdict

| # | Success Criterion | Verdict |
|---|-------------------|---------|
| 1 | Desktop navbar (72px + logo + search + avatar) | PASS |
| 2 | Desktop sidebar (220/68 + gradient pill + accordion + PanelLeft + cookie) | PASS |
| 3 | Mobile shell (sidebar hidden + compact header + spring drawer) | PASS |
| 4 | Drawer dismiss + single nav source | PASS (WR-01 advisory) |
| 5 | Loader contract + permissions unchanged | PASS |

**Score: 5/5 success criteria verified.**

**Phase 9 status: PASSED.**

---

## Code Review Findings Carried Forward (from 09-REVIEW.md)

None are verification blockers. Listed here so Phase 10 planning picks them up:

- **WR-01** — Sub-item `<a href>` causes full page reload. Phase 9 behavior is correct by observation but the implementation is structurally brittle. Fix: swap to `<Link to={subModulePath} onClick={() => onNavigate?.()}>` in both branches of `module-sidebar-navigation.tsx`. Likely 5-minute patch.
- **WR-02** — Drawer focus-return effect fires `hamburgerRef.current?.focus()` on initial mount. Hidden element, no-op in practice, but should be gated on `wasOpenRef` transition.
- **IN-01** — `AlohaLogoSquare` has `= {}` default-parameter pattern; React always passes props.
- **IN-02** — `NavbarSearch` exposes `isMac` but navbar hardcodes `⌘K`.
- **IN-03** — `navigator.platform` deprecated for Mac detection (pre-existing).
- **IN-04** — Initial-derivation duplicated across navbar + mobile header; extract helper when a third consumer appears.
- **IN-05** — `WorkspaceMobileDrawer`'s `account` prop should be `accountSlug` for naming consistency.
- **IN-06** — Drawer focus query may target a hidden focusable inside a collapsed Radix `Collapsible`; defensive selector upgrade.

---

## Manual Smoke Pending (from 09-VERIFICATION.md §Manual Smoke Checklist)

All 7 items are browser-only and remain **pending-user** — not a Phase 9 blocker. Every code path has been statically verified above. Recommended 10-minute smoke pass covers:

1. Desktop light mode at `/home/:account` — 72px navbar, centered search button, gradient sidebar pill, `PanelLeft` toggle + reload persistence round-trip.
2. Desktop dark mode — token contrast check; known Phase-10 follow-up: `green-50` active chip harshness on dark slate.
3. Mobile 375×812 (Chrome devtools iPhone) — desktop chrome hidden, hamburger opens drawer, backdrop/leaf/Escape all close.
4. Pitfall 1 live DOM check at 375px — confirm no hidden shadcn Sheet overlay intercepts clicks (static analysis already PASS).
5. Org switch via sidebar profile menu (desktop).
6. CRUD list route regression (e.g. HR employees) under new shell.
7. Hamburger keyboard a11y — Tab → Enter → focus lands in drawer → Escape → focus returns to hamburger.

---

## Deferred Items (explicitly addressed in Phase 10)

Per `09-CONTEXT.md` D-11 and RESEARCH §9, Phase 10 (AG Grid Theme & Dark Mode Verification) covers:

- **Dark-mode regression sweep** (DARK-02) — will address `green-50` active-chip harshness on dark slate and any other dark-mode contrast issues surfaced by Phase 9 chrome.
- **Full WCAG AA audit** across all shell surfaces — covered by Phase 10 SC#3.
- **AG Grid token adaptation** inside the new shell — Phase 10 SC#1 / GRID-01.
- **Tab-cycle focus trap on mobile drawer** — Phase 10 a11y sweep.

These are not Phase 9 gaps; they are Phase 10 scope.

---

## Recommendation

**APPROVE — Phase 9 is complete and ready to close.**

- All 5 ROADMAP success criteria are statically verified against the shipped source.
- All 14 REQ-IDs (NAVBAR-01..04, SIDEBAR-01..05, DRAWER-01..05) were marked complete by the plan-05 grep gate and are still marked complete in `.planning/REQUIREMENTS.md`.
- `pnpm typecheck` and `pnpm lint` pass with zero new warnings (per 09-VERIFICATION.md).
- Loader contract (`{ workspace, layoutState, accountSlug }`) is byte-identical — no `.server.ts` file was touched in the phase.
- 0 BLOCKER, 2 WARNING (both advisory, neither blocks a success criterion), 6 INFO from code review.
- Manual browser smoke is pending user but does not block the verification verdict given the completeness of static evidence.
- ROADMAP.md already marks Phase 9 "Complete 2026-04-10" (5/5 plans).

**Next action:** `/gsd-plan-phase 10` — AG Grid Theme & Dark Mode Verification (inherits the new shell chrome from Phase 9).

---

## VERIFICATION COMPLETE

**Verdict: APPROVE — Phase 9 passed goal-backward verification with 5/5 success criteria satisfied.**
