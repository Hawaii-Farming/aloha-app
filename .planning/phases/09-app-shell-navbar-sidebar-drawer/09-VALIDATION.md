---
phase: 9
slug: app-shell-navbar-sidebar-drawer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: §8 of `09-RESEARCH.md`. This phase has **no DB / API logic** to unit-test — validation is predominantly typecheck + lint + grep-able assertions + manual smoke.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.3 (unit, unused this phase), Playwright 1.57.x (E2E, optional smoke), `pnpm typecheck`, `pnpm lint`, `rg` for class-string assertions |
| **Config file** | `vitest.config.ts`, `e2e/playwright.config.ts` (existing) |
| **Quick run command** | `pnpm typecheck && pnpm lint` |
| **Full suite command** | `pnpm typecheck && pnpm lint` then manual smoke checklist (D-34 in CONTEXT.md) |
| **Estimated runtime** | ~20s incremental typecheck + lint; manual smoke ~5min |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck && pnpm lint`
- **After every plan wave:** Run `pnpm typecheck && pnpm lint` + targeted grep assertions for that wave's requirements
- **Before `/gsd-verify-work`:** Full manual smoke checklist (D-34 items 1–5) in light + dark + mobile 375px viewport
- **Max feedback latency:** ~20s (typecheck + lint)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 1 | SIDEBAR-01 | — | N/A | grep | `rg "13.75rem" packages/ui/src/shadcn/sidebar.tsx && rg "4.25rem" packages/ui/src/shadcn/sidebar.tsx` | ✅ | ⬜ pending |
| 9-01-02 | 01 | 1 | SIDEBAR-02 | — | N/A | grep | `rg "from-green-500 to-emerald-600" app/components/sidebar/module-sidebar-navigation.tsx` | ✅ | ⬜ pending |
| 9-01-03 | 01 | 1 | SIDEBAR-03 | — | N/A | grep | `rg "bg-green-50" app/components/sidebar/module-sidebar-navigation.tsx && rg "border-green-200" app/components/sidebar/module-sidebar-navigation.tsx` | ✅ | ⬜ pending |
| 9-01-04 | 01 | 1 | SIDEBAR-04 | — | N/A | grep + manual | `rg "PanelLeft" app/components/sidebar/workspace-sidebar.tsx` + reload smoke | ✅ | ⬜ pending |
| 9-01-05 | 01 | 1 | DRAWER-05 | — | N/A | grep | `rg "onNavigate" app/components/sidebar/module-sidebar-navigation.tsx` (drawer-reuse contract) | ✅ | ⬜ pending |
| 9-02-01 | 02 | 2 | NAVBAR-02 | — | N/A | grep | `rg "renderTrigger" app/components/navbar-search.tsx` | ✅ | ⬜ pending |
| 9-02-02 | 02 | 2 | NAVBAR-01 | — | N/A | grep | `rg "h-\[72px\]" app/components/workspace-shell/workspace-navbar.tsx` | ❌ W0 | ⬜ pending |
| 9-02-03 | 02 | 2 | NAVBAR-01 | — | N/A | grep | `rg "from-green-500 to-emerald-600" app/components/workspace-shell/workspace-navbar.tsx` (logo gradient) | ❌ W0 | ⬜ pending |
| 9-02-04 | 02 | 2 | NAVBAR-03 | — | N/A | grep | `rg "from '@aloha/ui/avatar'" app/components/workspace-shell/workspace-navbar.tsx` | ❌ W0 | ⬜ pending |
| 9-03-01 | 03 | 2 | DRAWER-03 | — | N/A | grep | `rg '"framer-motion"' package.json` | ✅ after install | ⬜ pending |
| 9-03-02 | 03 | 3 | NAVBAR-04 | — | N/A | grep | `rg "md:hidden" app/components/workspace-shell/workspace-mobile-header.tsx` | ❌ W0 | ⬜ pending |
| 9-03-03 | 03 | 3 | DRAWER-01 | — | N/A | grep | `rg "bg-black/30" app/components/workspace-shell/workspace-mobile-drawer.tsx` | ❌ W0 | ⬜ pending |
| 9-03-04 | 03 | 3 | DRAWER-03 | — | N/A | grep | `rg "type: 'spring'" app/components/workspace-shell/workspace-mobile-drawer.tsx` | ❌ W0 | ⬜ pending |
| 9-03-05 | 03 | 3 | DRAWER-05 | — | N/A | grep | `rg "ModuleSidebarNavigation" app/components/workspace-shell/workspace-mobile-drawer.tsx` | ❌ W0 | ⬜ pending |
| 9-03-06 | 03 | 3 | DRAWER-04 | — | N/A | grep + manual | `rg "onClose" app/components/workspace-shell/workspace-mobile-drawer.tsx` + tap-close smoke | ❌ W0 | ⬜ pending |
| 9-03-07 | 03 | 3 | a11y (D-27/28) | — | N/A | grep | `rg "role=\"dialog\"" app/components/workspace-shell/workspace-mobile-drawer.tsx && rg "aria-modal" $_` | ❌ W0 | ⬜ pending |
| 9-04-01 | 04 | 4 | SIDEBAR-05 | — | N/A | grep | `rg "hidden md:" app/routes/workspace/layout.tsx` (desktop-only sidebar branch) | ✅ | ⬜ pending |
| 9-04-02 | 04 | 4 | NAVBAR-04 | — | N/A | grep | `rg "WorkspaceMobileHeader" app/routes/workspace/layout.tsx` | ✅ | ⬜ pending |
| 9-04-03 | 04 | 4 | DRAWER-02 | — | N/A | grep | `rg "WorkspaceMobileDrawer" app/routes/workspace/layout.tsx` | ✅ | ⬜ pending |
| 9-04-04 | 04 | 4 | success criterion #5 | — | N/A | typecheck | `pnpm typecheck` (loader contract preserved) | ✅ | ⬜ pending |
| 9-04-05 | 04 | 4 | cleanup | — | N/A | grep | `! test -f app/components/sidebar/mobile-navigation.tsx` (must be deleted) | ✅ | ⬜ pending |
| 9-05-01 | 05 | 5 | all NAVBAR/SIDEBAR/DRAWER | — | N/A | manual | D-34 smoke checklist items 1–5, light + dark + 375px | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Create directory `app/components/workspace-shell/` and stub files (`workspace-navbar.tsx`, `workspace-mobile-header.tsx`, `workspace-mobile-drawer.tsx`) so subsequent grep assertions resolve.
- [ ] Install `framer-motion@^12.0.0` at repo root via `pnpm add framer-motion -w` (Plan 03 blocker).
- [ ] (Optional) `e2e/workspace-shell.spec.ts` smoke: login → 375px viewport → hamburger → drawer visible → backdrop tap → drawer hidden. Defer unless time permits — manual smoke is the gate.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual: 72px navbar height, gradient logo, search button, avatar layout | NAVBAR-01..03 | Visual correctness can't be asserted by grep alone | Load `/home/:account` desktop, verify header matches prototype `Header.tsx` |
| Search button opens existing NavbarSearch | NAVBAR-02 | Behavioral wiring | Click search button → NavbarSearch dialog opens. Press Cmd+K → same dialog opens. |
| Sidebar collapse persistence | SIDEBAR-04 | Cookie persistence requires reload | Click `PanelLeft` → 68px → reload → still 68px. Click again → 220px → reload → still 220px. |
| Active gradient pill on current module | SIDEBAR-02 | Visual rendering | Navigate to a module, verify active button has green-500→emerald-600 gradient + shadow |
| Active sub-item green-50 chip + green-200 left rail | SIDEBAR-03 | Visual rendering | Expand a module with sub-items, verify active sub-item bg-green-50, left rail border-green-200 |
| Mobile header replaces desktop chrome below md | NAVBAR-04, SIDEBAR-05 | Viewport-dependent | Resize to 375px, verify desktop sidebar hidden, mobile header visible with hamburger + logo + avatar |
| Drawer slide animation matches prototype | DRAWER-01, DRAWER-03 | Animation timing/feel | Tap hamburger, verify drawer slides from left with spring physics + backdrop fade in |
| Backdrop tap closes drawer | DRAWER-04 | Touch interaction | Open drawer, tap backdrop, drawer closes |
| Leaf nav tap closes drawer + navigates | DRAWER-04 | Touch interaction + routing | Open drawer, tap a leaf sub-item, drawer closes AND navigation occurs |
| Drawer escape key closes (a11y) | D-28 | Keyboard interaction | Open drawer, press Escape, drawer closes |
| Focus moves to first nav item on open | D-27 | Focus management | Open drawer, verify first nav button has focus |
| Focus returns to hamburger on close | D-27 | Focus management | Open drawer, close, verify focus returns to hamburger button |
| Dark mode token correctness | D-34 #2 | Visual verification | Toggle next-themes dark, verify navbar/sidebar/drawer surfaces, borders, text remain readable. Note: green-50 chip may look harsh in dark — log as Phase 10 follow-up only, do not fix here. |
| Org switch via sidebar profile menu still works | success criterion #5 | Behavioral regression | Open sidebar profile menu, switch org, verify navigation reloads correctly |
| Existing CRUD list route Outlet content unchanged | success criterion #5 | Regression sanity | Navigate to any HR module list, verify AG Grid + content render unchanged |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (typecheck + lint runs every commit, satisfies)
- [ ] Wave 0 covers all MISSING references (`workspace-shell/` stubs + framer-motion install)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter (after planner sign-off)

**Approval:** pending
