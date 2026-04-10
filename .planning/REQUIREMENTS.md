# Requirements — Milestone v2.0 Aloha Design System Retheme

**Scope:** Replace the Supabase-inspired theme with the polished Aloha design system across the app shell (sidebar, top navbar, mobile drawer, design tokens, shared primitives). Shell chrome and design tokens ONLY — no feature changes, no new pages, no role/device switching.

**Source of truth (prototype):** `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/` (`aloha-redesign-strategy.md` + `prototype/src/`).

**Quality criteria:** WCAG AA contrast in both light and dark themes. No breaking changes to component props, route loaders, or CRUD flows. Light mode is canonical; dark mode is derived.

---

## v2.0 Requirements

### Design Tokens (DESIGN)

- [x] **DESIGN-01**: `DESIGN.md` is rewritten as the Aloha theme source of truth — Inter 16px base, slate neutrals, green-500→emerald-600 gradient primary, rounded-2xl radius scale, shadow tokens, light-first.
- [x] **DESIGN-02**: Tailwind 4 `@theme` block in the app CSS is updated with the Aloha palette, font family, radius, and shadow tokens (replacing Supabase tokens), matching `DESIGN.md`.
- [x] **DESIGN-03**: Inter variable font is loaded via `@fontsource-variable/inter`, replacing Geist as the body font across the app.
- [x] **DESIGN-04**: Light mode is canonical and dark mode is derived, with WCAG AA contrast verified on every token pair used in shell chrome and primitives.

### Top Navbar (NAVBAR)

- [x] **NAVBAR-01**: The desktop workspace header is 72px tall with a gradient Aloha logo square (green-500→emerald-600) and "Aloha" wordmark on the left.
- [x] **NAVBAR-02**: A centered command-palette-style search button (Search icon + "Search..." placeholder + ⌘K hint) is displayed in the header and wires to the existing navbar search behavior without changing its logic.
- [x] **NAVBAR-03**: The right side of the header shows the existing user avatar component restyled to the new design tokens.
- [x] **NAVBAR-04**: On mobile, a compact header variant shows a hamburger button, the Aloha logo, and the avatar; tapping the hamburger opens the mobile drawer.

### Sidebar — Desktop (SIDEBAR)

- [x] **SIDEBAR-01**: The workspace sidebar is 220px wide when expanded and 68px when collapsed, with a white background and a slate-200 right border.
- [x] **SIDEBAR-02**: The active module renders a gradient pill (green-500→emerald-600 with `shadow-green-500/25`) on the nav button.
- [x] **SIDEBAR-03**: Sub-items expand in an accordion under the active module with a green-50 active chip and a green-200 left rail; inactive sub-items use slate tones.
- [x] **SIDEBAR-04**: A `PanelLeft` toggle button collapses/expands the sidebar, and the collapsed state is persisted using the existing cookie mechanism — no changes to loader contracts.
- [x] **SIDEBAR-05**: Below the mobile breakpoint, the desktop sidebar is hidden and the mobile drawer takes over.

### Mobile Drawer (DRAWER)

- [x] **DRAWER-01**: On mobile, the navigation renders as a full-screen drawer sliding in from the left over a black/30 backdrop.
- [x] **DRAWER-02**: A hamburger button in the mobile header opens the drawer.
- [x] **DRAWER-03**: The drawer open/close animation uses Framer Motion spring + fade, matching the prototype timing.
- [x] **DRAWER-04**: Tapping the backdrop or a leaf navigation item closes the drawer automatically.
- [x] **DRAWER-05**: The drawer reuses the same navigation data source as the desktop sidebar (no duplicated nav config).

### Shared Primitives (PRIM)

- [ ] **PRIM-01**: `Button` is restyled — primary variant uses the green gradient with shadow, secondary uses slate, all variants use rounded-2xl and generous py-3 padding, matching `DESIGN.md`.
- [ ] **PRIM-02**: `Card` is restyled — white background, rounded-2xl, slate-200 border, soft shadow — matching the prototype `Card` component.
- [ ] **PRIM-03**: Form input primitives (`Input`, `Textarea`, `Select`) are restyled with 16px text, rounded-2xl, slate border, green-500 focus ring, and py-3 padding.
- [ ] **PRIM-04**: `Badge` is restyled as a pill with semantic color variants on the new palette (success, warning, danger, info, neutral).
- [ ] **PRIM-05**: `Avatar` is restyled with initials on a gradient fallback and size variants (sm / md / lg).
- [ ] **PRIM-06**: The side-panel sheet (used by CRUD create/edit) is restyled — rounded-2xl leading corners, slate border, matching form field spacing.

### AG Grid Theme (GRID)

- [x] **GRID-01**: The shared AG Grid theme (`ag-grid-theme.ts`) is updated via `themeQuartz.withParams` to the Aloha tokens (header background, row background, active row, borders, font) for both light and dark modes, so all existing HR grids inherit the new look without per-grid code changes.
- [x] **GRID-02**: AG Grid wrappers fill the full available width/height of their parent — no horizontal shrink, no collapsed rows — across every HR module list view.
- [x] **GRID-03**: The grid toolbar search input renders as a squared/rounded-md control (not fully pill/rounded-full) matching the prototype toolbar styling.

### Dark Mode (DARK)

- [x] **DARK-01**: The dark palette is derived from the light palette with WCAG AA contrast verified on shell chrome, primitives, and AG Grid.
- [x] **DARK-02**: The existing `next-themes` toggle continues to work across every existing route with no regressions in layout, focus states, or contrast.
- [x] **DARK-03**: In dark mode, the navbar and sidebar render on a distinct elevated dark surface (not the page background); the centered navbar search trigger remains legible, and the light-mode convention (white nav/sidebar over slate-50 page) has a tonally equivalent dark-mode pairing.

### Template Parity (PARITY)

Parity with the reference prototype at `../aloha-design/prototype`.

- [x] **PARITY-01**: The desktop sidebar structurally matches the prototype — NAVIGATION/MODULES section headers, inline collapse affordance, separator line between sections, chevron dropdown buttons on module rows, and the "Focused" footer control — ported onto the existing Shadcn sidebar primitive (no new UI libraries).
- [ ] **PARITY-02**: The sidebar expand/collapse toggle lives on the navbar **before** the Aloha logo square (leftmost control), replacing the current detached edge toggle.
- [x] **PARITY-03**: The navbar avatar fallback renders the current org's initials (e.g., "HF" for Hawaii Farming) instead of a static "A", derived from the loaded org context.
- [x] **PARITY-04**: Sub-module list items have visible vertical separation from the parent module row in the sidebar (matches prototype spacing).
- [x] **PARITY-05**: Scrollbars on the sidebar and main content areas match the prototype styling in both light and dark modes (thin, themed thumb, no OS default).

### App Shell Bugs (BUG)

- [x] **BUG-01**: The active-module gradient pill in the sidebar renders immediately when a module is clicked (and on initial load for the current route), not only after a sub-module has been selected.
- [x] **BUG-02**: Selecting a module entry from the navbar command-palette search navigates to that module's page reliably (currently no-op when the target is a module-level link).

---

## Future Requirements

Deferred to later milestones (not this scope):

- Role-specific app shells (Doer, Doer+Recorder, Manager, Executive) from the prototype.
- Device toggle / phone frame / bottom tab bar prototype features.
- Command palette implementation (this milestone only restyles the search button UI).
- Page-level redesigns (dashboards, task lists, forms) beyond inheriting new tokens.
- Framer Motion page transitions.
- Chat and sandbox surfaces.

## Out of Scope

- **Role switcher / device toggle / phone frame** — prototype-only conveniences; not shipping.
- **4 user role shells** — single unified shell; role-shaped apps are a future bet.
- **New feature pages** — no dashboards, chat, sandbox, or new CRUD modules.
- **Breaking component prop changes** — restyle only; callers unchanged.
- **New UI library** — no Radix-outside-of-Shadcn, no component library swap.
- **AG Grid Enterprise** — Community only, same as v1.0.

## Traceability

| REQ-ID    | Phase    | Plan |
|-----------|----------|------|
| DESIGN-01 | Phase 7  | TBD  |
| DESIGN-02 | Phase 7  | TBD  |
| DESIGN-03 | Phase 7  | TBD  |
| DESIGN-04 | Phase 7  | TBD  |
| DARK-01   | Phase 7  | TBD  |
| PRIM-01   | Phase 8  | TBD  |
| PRIM-02   | Phase 8  | TBD  |
| PRIM-03   | Phase 8  | TBD  |
| PRIM-04   | Phase 8  | TBD  |
| PRIM-05   | Phase 8  | TBD  |
| PRIM-06   | Phase 8  | TBD  |
| NAVBAR-01 | Phase 9  | TBD  |
| NAVBAR-02 | Phase 9  | TBD  |
| NAVBAR-03 | Phase 9  | TBD  |
| NAVBAR-04 | Phase 9  | TBD  |
| SIDEBAR-01| Phase 9  | TBD  |
| SIDEBAR-02| Phase 9  | TBD  |
| SIDEBAR-03| Phase 9  | TBD  |
| SIDEBAR-04| Phase 9  | TBD  |
| SIDEBAR-05| Phase 9  | TBD  |
| DRAWER-01 | Phase 9  | TBD  |
| DRAWER-02 | Phase 9  | TBD  |
| DRAWER-03 | Phase 9  | TBD  |
| DRAWER-04 | Phase 9  | TBD  |
| DRAWER-05 | Phase 9  | TBD  |
| GRID-01   | Phase 10 | TBD  |
| GRID-02   | Phase 10 | TBD  |
| GRID-03   | Phase 10 | TBD  |
| DARK-02   | Phase 10 | TBD  |
| DARK-03   | Phase 10 | TBD  |
| PARITY-01 | Phase 10 | TBD  |
| PARITY-02 | Phase 10 | TBD  |
| PARITY-03 | Phase 10 | TBD  |
| PARITY-04 | Phase 10 | TBD  |
| PARITY-05 | Phase 10 | TBD  |
| BUG-01    | Phase 10 | TBD  |
| BUG-02    | Phase 10 | TBD  |
