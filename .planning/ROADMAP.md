# Roadmap: Aloha App

## Milestones

- ✅ **v1.0 HR Module Submodules** — Phases 1-6 (shipped 2026-04-09)
- 🚧 **v2.0 Aloha Design System Retheme** — Phases 7-10 (started 2026-04-10)

## Phases

<details>
<summary>✅ v1.0 HR Module Submodules (Phases 1-6) — SHIPPED 2026-04-09</summary>

- [x] Phase 1: AG Grid Foundation (4/4 plans) — completed 2026-04-08
- [x] Phase 2: Scheduler (3/3 plans) — completed 2026-04-08
- [x] Phase 3: Time Off (3/3 plans) — completed 2026-04-08
- [x] Phase 4: Payroll Views (4/4 plans) — completed 2026-04-08
- [x] Phase 5: Hours Comparison (3/3 plans) — completed 2026-04-09
- [x] Phase 6: Housing & Employee Review (4/4 plans) — completed 2026-04-09

</details>

### v2.0 Aloha Design System Retheme (Phases 7-10)

- [x] **Phase 7: Design Foundations** — DESIGN.md rewrite, Tailwind tokens, Inter font, derived dark palette (completed 2026-04-10)
- [x] **Phase 8: Shared Primitives** — Button, Card, Input/Textarea/Select, Badge, Avatar, Sheet restyle (completed 2026-04-10)
- [ ] **Phase 9: App Shell — Navbar, Sidebar, Drawer** — 72px navbar, 220/68px sidebar, mobile drawer + header
- [ ] **Phase 10: AG Grid Theme & Dark Mode Verification** — AG Grid token adaptation, next-themes smoke pass, WCAG AA audit

## Phase Details

### Phase 7: Design Foundations
**Goal**: Establish the Aloha design system as the single source of truth so every downstream restyle inherits correct tokens, typography, and derived dark palette.
**Depends on**: Nothing (first v2.0 phase)
**Requirements**: DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DARK-01
**Success Criteria** (what must be TRUE):
  1. `DESIGN.md` reads as the Aloha theme spec (Inter 16px base, slate neutrals, green-500→emerald-600 gradient primary, rounded-2xl scale, shadow tokens, light-first) with no Supabase-era tokens remaining.
  2. The app boots with Inter variable font loaded globally and the Tailwind 4 `@theme` block reflecting Aloha palette, radius, font-family, and shadow tokens end-to-end.
  3. Toggling `next-themes` between light and dark swaps to a derived dark palette whose token pairs pass WCAG AA contrast on shell chrome and primitive text/background combinations (verified via contrast audit).
  4. Existing routes still render (no token-name regressions) and layout/spacing remain intact at the shell level even before primitives are restyled.
**Plans**: 3 plans
- [x] 07-01-PLAN.md — Rewrite DESIGN.md + swap shadcn-ui.css to Aloha palette (light + hand-authored dark)
- [x] 07-02-PLAN.md — Tailwind @theme Inter fonts + shadow scale + global.css font import + shadow unlock + package.json dep swap
- [x] 07-03-PLAN.md — scripts/verify-wcag.mjs (24 assertions) + DESIGN.md WCAG table + manual smoke checkpoint
**UI hint**: yes

### Phase 8: Shared Primitives
**Goal**: Restyle every shared primitive to match the Aloha prototype so shell chrome, forms, and CRUD sheets inherit the new look automatically.
**Depends on**: Phase 7
**Requirements**: PRIM-01, PRIM-02, PRIM-03, PRIM-04, PRIM-05, PRIM-06
**Success Criteria** (what must be TRUE):
  1. The primary `Button` variant renders with the green-500→emerald-600 gradient, `shadow-green-500/25`, rounded-2xl, and generous py-3 padding in both light and dark themes; secondary uses slate tones; no caller prop changes required.
  2. `Card` renders white (light) / dark-slate (dark) surface with rounded-2xl, slate-200 border, and soft shadow — matching the prototype `Card` visually across existing list views.
  3. `Input`, `Textarea`, and `Select` render at 16px with rounded-2xl, slate border, green-500 focus ring, and py-3 padding; all existing forms (including CRUD create/edit sheets) render without layout breakage.
  4. `Badge` supports success/warning/danger/info/neutral pill variants on the Aloha palette and `Avatar` renders initials on a gradient fallback with sm/md/lg size variants.
  5. The side-panel `Sheet` (CRUD create/edit) renders with rounded-2xl leading corners, slate border, and form-field spacing that matches the prototype — no prop contract changes to existing callers.
**Plans**: 6 plans
- [ ] 08-01-PLAN.md — Card Aloha restyle (PRIM-02) [Wave 1]
- [ ] 08-02-PLAN.md — Badge Aloha restyle (PRIM-04) [Wave 1]
- [ ] 08-03-PLAN.md — Button Aloha restyle (PRIM-01) [Wave 2]
- [ ] 08-04-PLAN.md — Avatar Aloha restyle (PRIM-05) [Wave 2]
- [ ] 08-05-PLAN.md — Input/Textarea/Select Aloha restyle (PRIM-03) [Wave 3]
- [ ] 08-06-PLAN.md — Sheet Aloha restyle (PRIM-06) [Wave 3]
**UI hint**: yes

### Phase 9: App Shell — Navbar, Sidebar, Drawer
**Goal**: Replace the workspace shell with the Aloha navbar, desktop sidebar, and mobile drawer so every logged-in route is framed by the new chrome without loader or nav-config changes.
**Depends on**: Phase 7, Phase 8
**Requirements**: NAVBAR-01, NAVBAR-02, NAVBAR-03, NAVBAR-04, SIDEBAR-01, SIDEBAR-02, SIDEBAR-03, SIDEBAR-04, SIDEBAR-05, DRAWER-01, DRAWER-02, DRAWER-03, DRAWER-04, DRAWER-05
**Success Criteria** (what must be TRUE):
  1. Desktop workspace header is 72px tall with gradient Aloha logo square + "Aloha" wordmark on the left, centered command-palette-style search button (Search icon, "Search..." placeholder, ⌘K hint), and the existing avatar restyled to new tokens on the right — search wires to the existing navbar search behavior unchanged.
  2. Desktop sidebar renders 220px expanded / 68px collapsed with slate-200 right border, gradient active pill on the current module, accordion sub-items (green-50 chip + green-200 left rail for active, slate for inactive), and a `PanelLeft` toggle whose collapsed state persists across reload via the existing cookie (no loader contract changes).
  3. Below the mobile breakpoint, the desktop sidebar is hidden; the compact mobile header shows hamburger + logo + avatar, and tapping the hamburger opens a full-screen drawer sliding from the left over a `black/30` backdrop using Framer Motion spring + fade.
  4. Tapping the backdrop or any leaf navigation item closes the drawer; the drawer reuses the same nav data source as the desktop sidebar (single nav config, no duplication).
  5. All existing workspace routes still load correctly under the new shell with org switching, navigation permissions, and `loadOrgWorkspace()` contract unchanged.
**Plans**: 5 plans
- [x] 09-01-PLAN.md — Sidebar width bump + workspace-sidebar/module-sidebar-navigation Aloha restyle [Wave 1]
- [x] 09-02-PLAN.md — NavbarSearch renderTrigger seam + WorkspaceNavbar + AlohaLogoSquare [Wave 2]
- [x] 09-03-PLAN.md — framer-motion install + WorkspaceMobileHeader + WorkspaceMobileDrawer [Wave 2]
- [ ] 09-04-PLAN.md — layout.tsx shell integration + mobile-navigation.tsx delete [Wave 3]
- [ ] 09-05-PLAN.md — Phase verification smoke + a11y audit + STATE/ROADMAP update [Wave 4]
**UI hint**: yes

### Phase 10: AG Grid Theme & Dark Mode Verification
**Goal**: Adapt the shared AG Grid theme to Aloha tokens and verify dark-mode parity plus WCAG AA across every existing route so the retheme ships with zero visual regressions.
**Depends on**: Phase 7, Phase 8, Phase 9
**Requirements**: GRID-01, DARK-02
**Success Criteria** (what must be TRUE):
  1. `ag-grid-theme.ts` is updated via `themeQuartz.withParams` to the Aloha tokens (header background, row background, active row, borders, font) for both light and dark modes, and every existing HR grid (Register, Scheduler, Time Off, Payroll ×3, Hours Comparison, Housing, Employee Review) inherits the new look with no per-grid code changes.
  2. Toggling `next-themes` light↔dark across every existing route produces no layout shifts, missing focus states, or broken contrast — verified via a documented smoke pass.
  3. A WCAG AA contrast audit of shell chrome, primitives, and AG Grid token pairs passes in both themes (documented in the phase plan).
  4. No CRUD flow, loader, action, i18n, or CSRF behavior regresses — existing E2E suite (or targeted manual regression) passes.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. AG Grid Foundation | v1.0 | 4/4 | Complete | 2026-04-08 |
| 2. Scheduler | v1.0 | 3/3 | Complete | 2026-04-08 |
| 3. Time Off | v1.0 | 3/3 | Complete | 2026-04-08 |
| 4. Payroll Views | v1.0 | 4/4 | Complete | 2026-04-08 |
| 5. Hours Comparison | v1.0 | 3/3 | Complete | 2026-04-09 |
| 6. Housing & Employee Review | v1.0 | 4/4 | Complete | 2026-04-09 |
| 7. Design Foundations | v2.0 | 3/3 | Complete   | 2026-04-10 |
| 8. Shared Primitives | v2.0 | 0/0 | Not started | - |
| 9. App Shell — Navbar, Sidebar, Drawer | v2.0 | 0/0 | Not started | - |
| 10. AG Grid Theme & Dark Mode Verification | v2.0 | 0/0 | Not started | - |
