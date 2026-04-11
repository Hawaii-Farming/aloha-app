# Phase 9: App Shell — Navbar, Sidebar, Drawer - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** `--auto` (recommended defaults selected by Claude)

<domain>
## Phase Boundary

Replace the workspace shell chrome — desktop navbar, desktop sidebar, mobile drawer + mobile header — with the Aloha prototype design so every logged-in route is framed by the new look. Phase 7 tokens and Phase 8 primitives stay untouched and are consumed via existing classes.

**In scope:**
- New 72px desktop navbar (logo square + wordmark left, command-palette search button center, restyled avatar right) — wires to existing `NavbarSearch` behavior unchanged (NAVBAR-01..03).
- Mobile compact header (hamburger + logo + avatar) shown below the `md` breakpoint, replacing the current `SidebarTrigger`-only header (NAVBAR-04, SIDEBAR-05).
- Restyle the desktop sidebar (`packages/ui/src/shadcn/sidebar.tsx` + `app/components/sidebar/workspace-sidebar.tsx` + `module-sidebar-navigation.tsx`) to 220/68px widths, slate-200 right border, gradient active pill, accordion sub-items with green-50 chip + green-200 left rail, `PanelLeft` toggle persisted via existing cookie (SIDEBAR-01..04).
- Replace the current shadcn `Sheet`-based mobile sidebar with a Framer Motion left-slide drawer over a `bg-black/30` backdrop; spring + fade animation; backdrop tap and leaf nav tap close the drawer; reuses the same `navigation` data passed by the workspace loader (DRAWER-01..05).

**NOT in scope:**
- Any change to `loadOrgWorkspace()` contract, `loader` shape, route file params, RLS, CRUD, or org-switching logic (success criterion #5).
- AG Grid theme, dark-mode regression sweep, WCAG audit (Phase 10).
- New nav items, new modules, or any change to `workspace-navigation.config.tsx` / `module-icons.config.ts`.
- Restyle of any non-shell component (Phase 8 already shipped primitives).
- Adding a real command palette UI — the centered search button keeps invoking the existing `NavbarSearch` trigger only (per NAVBAR-02 "wires to existing navbar search behavior unchanged").
- Profile menu / org switcher restyle beyond minimal token alignment — they live in the sidebar footer today and remain there (no new home in the navbar this phase).

</domain>

<decisions>
## Implementation Decisions

### File & Component Topology
- **D-01:** New file `app/components/workspace-shell/workspace-navbar.tsx` holds the desktop 72px header. Imports `NavbarSearch` (existing) for the center button trigger and renders the gradient logo square + "Aloha" wordmark + avatar. Rationale: navbar is workspace-shell-only — co-locating with the sidebar wrapper under a `workspace-shell/` folder keeps the shell pieces discoverable.
- **D-02:** New file `app/components/workspace-shell/workspace-mobile-header.tsx` renders the compact mobile bar (hamburger + logo + avatar). Receives an `onOpenDrawer` callback. Rationale: keeps the mobile header decoupled from the desktop navbar (different layout, different visibility breakpoints).
- **D-03:** New file `app/components/workspace-shell/workspace-mobile-drawer.tsx` renders the Framer Motion drawer; receives `open`, `onClose`, `navigation`, `account` props and reuses the same `<ModuleSidebarNavigation>` body so nav config is single-sourced (DRAWER-05). Rationale: zero nav-data duplication is an explicit success criterion.
- **D-04:** Existing `app/components/sidebar/mobile-navigation.tsx` is removed once the new drawer + mobile header are in place. Rationale: it duplicated nav rendering and is replaced by D-03; phase 9 should leave the shell with one mobile nav surface, not two.
- **D-05:** `app/routes/workspace/layout.tsx` is restructured: desktop branch renders `<WorkspaceNavbar>` above a flex row of `<WorkspaceSidebar>` + `<main>`; mobile branch renders `<WorkspaceMobileHeader>` above `<main>` and mounts `<WorkspaceMobileDrawer>` (controlled state via `useState`). Rationale: the prototype `AppLayout.tsx` uses this exact split; matches NAVBAR-01 (desktop) + NAVBAR-04 / SIDEBAR-05 (mobile).

### Sidebar Width & Tokens
- **D-06:** Bump `SIDEBAR_WIDTH` in `packages/ui/src/shadcn/sidebar.tsx` from `14rem` (224px) → `13.75rem` (220px) and `SIDEBAR_WIDTH_ICON` from `4rem` (64px) → `4.25rem` (68px). `SIDEBAR_WIDTH_MOBILE` (18rem / 288px) stays — but is no longer used because the mobile branch uses the new framer-motion drawer (D-03), not the shadcn sidebar Sheet. Rationale: SIDEBAR-01 is exact about 220/68.
- **D-07:** Sidebar surface = `bg-card` (white in light, slate-900 in dark via Phase 7 tokens), right border = `border-r border-border`. No hardcoded `slate-200` — Phase 7 tokens already resolve to slate-200 in light. Rationale: D-11 carryover from Phase 8 ("don't hardcode slate when token exists").
- **D-08:** Sidebar collapse cookie persistence is preserved as-is — `sidebarStateCookie` in `app/lib/cookies.ts` and `defaultOpen={layoutState.open}` on `<SidebarProvider>` continue to work without contract changes (SIDEBAR-04).

### Active State Recipe (Modules + Sub-items)
- **D-09:** Active module pill in `module-sidebar-navigation.tsx` applies `bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 rounded-xl` directly (mirrors Phase 8 button D-04). Inactive module = `bg-transparent text-foreground hover:bg-muted`. Rationale: gradient is a literal brand element, button-style precedent already set in Phase 8.
- **D-10:** Active sub-item chip = `bg-green-50 text-green-700 font-medium rounded-lg`. Inactive sub-item = `bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground`. The accordion column under the active module gets `border-l-2 border-green-200 ml-5 pl-3` — green-200 left rail (SIDEBAR-03). Rationale: matches prototype `Sidebar.tsx` lines 78–96.
- **D-11:** Active sub-item literal `green-50` / `green-700` / `green-200` Tailwind classes are intentional (not via tokens) because there is no semantic token in Phase 7 for "active sub-item chip bg/fg". Adding one would expand surface unnecessarily. Light mode is canonical here; dark-mode tuning is Phase 10's job (a `dark:` override may be added there, not now). Rationale: keep token surface minimal, defer dark-mode chip tuning to Phase 10's regression sweep.
- **D-12:** Module accordion expansion logic stays in `module-sidebar-navigation.tsx` (already exists, lines 47–53 auto-expand the active module). No new state management — we restyle, we don't refactor.

### Desktop Navbar
- **D-13:** Logo square = `w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 flex items-center justify-center text-white font-bold text-sm` rendering the literal letter "A". Wordmark = `font-semibold text-foreground text-lg` reading "Aloha". Rationale: matches prototype `Header.tsx` lines 11–14 verbatim.
- **D-14:** Centered search button is a `<button type="button">` styled `flex-1 max-w-md mx-auto flex items-center gap-2 px-4 py-2.5 bg-muted rounded-2xl text-muted-foreground hover:bg-muted/80 transition-colors` with `<Search size={16} />` + "Search..." span + right-aligned `⌘K` hint. **It triggers the existing `NavbarSearch` component's open behavior** — implementation: render `<NavbarSearch />` and style its internal trigger to match the prototype, OR (preferred) lift the `setOpen` from `NavbarSearch` and call it from the new button. Picked: keep `NavbarSearch` as the controller and pass an optional `renderTrigger` prop so the button visuals live in the navbar but the open/close + Cmd+K listener stay in `NavbarSearch`. Rationale: NAVBAR-02 says "wires to existing navbar search behavior unchanged" — minimal seam, no behavior fork.
- **D-15:** Right side of navbar = the existing avatar component used in `SidebarProfileMenu` extracted into a small `<NavbarAvatar>` view that consumes `user.email` initials and the Phase 8 `Avatar` primitive's gradient fallback. The full profile menu + org switcher remains in the **sidebar footer** for this phase (NAVBAR-03 only requires the avatar to be displayed and restyled, not the menu to be relocated). Rationale: scope guardrail — relocating the profile menu is a future phase if we want a header dropdown.
- **D-16:** Navbar height = exactly `h-[72px]`, padding `px-6`, surface `bg-card border-b border-border` with `flex items-center gap-4 shrink-0`. Rationale: NAVBAR-01.

### Mobile Header & Drawer
- **D-17:** Mobile header height = `h-14` (56px) — slightly taller than the current `h-12` to fit the logo square + avatar comfortably; padding `px-4`, surface `bg-card border-b border-border`, layout = hamburger left, logo+wordmark center-left, avatar right. Visible only `md:hidden`. Rationale: prototype mobile header pattern; current 48px is too tight for a 36px logo square.
- **D-18:** Drawer animation = Framer Motion. Backdrop `motion.div` fades `opacity 0→1`. Panel `motion.nav` slides `x: '-100%' → 0` with `transition={{ type: 'spring', damping: 25, stiffness: 300 }}`. `AnimatePresence` wraps both with matching `exit` transitions. Rationale: matches prototype `MobileDrawer.tsx` lines 102–129 verbatim — DRAWER-03 "spring + fade matching the prototype timing".
- **D-19:** Drawer width = `w-[260px]` (matches prototype). Panel surface `bg-card shadow-xl`. Backdrop `bg-black/30 z-40`, panel `z-50`. Backdrop is `fixed inset-0`, panel is `fixed inset-y-0 left-0` (NOT `absolute` — the drawer must overlay the entire viewport, not just its parent). Rationale: prototype uses `absolute` only because it lives inside a `PhoneFrame`; in the real app it must be `fixed`.
- **D-20:** Drawer body reuses `<ModuleSidebarNavigation>` (the same component the desktop sidebar uses) wrapped in a flex column. Tapping a leaf nav item calls `onClose()` after navigation; tapping the backdrop calls `onClose()`. Both handled at the drawer level, not inside `ModuleSidebarNavigation` — pass an `onNavigate?: () => void` callback prop, default no-op for desktop usage. Rationale: DRAWER-04, DRAWER-05 (single nav source).
- **D-21:** Drawer open state lives in `app/routes/workspace/layout.tsx` as a `useState` boolean. Hamburger sets `true`, drawer `onClose` sets `false`. Auto-close on route change is handled by `useEffect` listening on `useLocation().pathname`. Rationale: drawer state is layout-scoped, doesn't belong in a context.

### Framer Motion Dependency
- **D-22:** Add `framer-motion` (latest stable, ^11.x) to the **root** `package.json` dependencies (the workspace app, not `packages/ui`). Drawer is the only consumer this phase; no need to expose framer-motion through `@aloha/ui`. Rationale: prevents leaking an animation lib through the shared UI package boundary; if other shell pieces ever need it, we can hoist later.
- **D-23:** No code-splitting / dynamic import for framer-motion this phase. Bundle impact (~30kb gzip) is acceptable; deferring with `lazy()` adds complexity for minimal gain. Phase 10 can revisit if bundle size becomes a concern.

### Avatar Sourcing
- **D-24:** Use the Phase 8 `<Avatar>` primitive (`packages/ui/src/shadcn/avatar.tsx`) with the gradient fallback. Initials derive from `user.email` first character (existing convention in `SidebarProfileMenu`). Size: `md` in the desktop navbar (D-15), `md` in the mobile header (D-17). Rationale: Phase 8 already shipped the gradient fallback + size variants — reuse, don't recreate.

### Routing & Loader Contract
- **D-25:** Zero changes to `loader` in `app/routes/workspace/layout.tsx` other than deleting the now-unused `style` field if no consumer needs it. The `workspace`, `layoutState`, `accountSlug` shape is unchanged. Rationale: success criterion #5.
- **D-26:** `SidebarProvider` from `@aloha/ui/shadcn-sidebar` continues to wrap the workspace tree on desktop. `SidebarTrigger` is replaced by the new mobile header's hamburger + drawer, but `SidebarProvider` is still mounted because `WorkspaceSidebar` consumes its context (`useSidebar()` for the toggle button). Rationale: don't rip out a working primitive when only the visual chrome changes.

### Accessibility
- **D-27:** Drawer panel has `role="dialog"`, `aria-modal="true"`, and an `aria-label="Mobile navigation"`. Backdrop has `aria-hidden="true"`. Hamburger button has `aria-label="Open navigation menu"` + `aria-expanded={open}`. Focus is moved to the first nav item on open and returned to the hamburger on close (use a `ref` + `useEffect`). Rationale: standard a11y for modal-style drawers; the prototype skips this but production must include it.
- **D-28:** Escape key closes the drawer (drawer-level `useEffect` with `keydown` listener). Rationale: standard keyboard escape, costs nothing.

### What We're NOT Touching
- **D-29:** `app/components/sidebar/sidebar-profile-menu.tsx` is **not** restyled this phase beyond inheriting Phase 7/8 tokens automatically. The profile dropdown lives in the sidebar footer; relocating it to the navbar is deferred.
- **D-30:** `app/components/sidebar/org-selector.tsx` is **not** touched. Org switching continues to work via the existing surface.
- **D-31:** `app/config/workspace-navigation.config.tsx` is **not** modified. Same nav data feeds desktop sidebar + mobile drawer (DRAWER-05 satisfied by passing the same `navigation` prop both places).
- **D-32:** No new i18n strings beyond "Search...", "Aloha", and aria-labels — those are in-component string literals for now (the prototype hardcodes them too). Adding them to locale files is a future cleanup phase.

### Verification
- **D-33:** `pnpm typecheck` + `pnpm lint` must pass after every commit. Rationale: shell touches many files; type drift is the main risk.
- **D-34:** Manual smoke checklist (in PLAN.md):
  1. Desktop `/home/:account` — navbar 72px, logo gradient, search button opens existing `NavbarSearch`, avatar renders, sidebar 220px, active module gradient pill, sub-item green-50 chip, `PanelLeft` collapse → 68px → reload persists.
  2. Desktop dark mode — toggle `next-themes`, verify navbar/sidebar borders + surfaces still readable. Note: green-50 chip in dark may look harsh (D-11) — log as a Phase 10 follow-up if so, do not fix here.
  3. Mobile (Chrome devtools 375px) — desktop sidebar hidden, compact header visible, hamburger opens drawer with spring slide, backdrop tap closes, leaf nav tap navigates + closes, escape key closes.
  4. Org switch via sidebar profile menu — still works.
  5. CRUD list route — `Outlet` content unchanged, AG Grid untouched.
- **D-35:** No automated visual regression / Playwright snapshot this phase — Phase 10's DARK-02 sweep covers it.

### Claude's Discretion
- Whether to extract the gradient logo square into a tiny `<AlohaLogoSquare size="sm|md">` component or inline it (used in 2–3 places: desktop navbar, mobile header, possibly sidebar collapsed state). Recommended: extract once it appears in 2+ places.
- Exact ChevronDown rotation animation timing (prototype uses 0.2s) — match prototype defaults unless they look off.
- Whether `<NavbarSearch>` `renderTrigger` prop is a render prop (`(open: () => void) => ReactNode`) or a slot (`children: ReactNode` + `onTrigger`) — pick whichever reads cleaner against the existing `NavbarSearch` internals.
- Whether `useEffect` for "auto-close drawer on route change" lives in the layout or inside the drawer component itself (slight preference: layout, since drawer state lives there).
- Whether to memoize the nav item list passed to `<ModuleSidebarNavigation>` for the drawer — only if React DevTools shows a re-render storm.

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Aloha Design Source of Truth (prototype)
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/layout/Header.tsx` — Desktop navbar exact recipe (72px, gradient logo, centered search button, avatar right).
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/layout/Sidebar.tsx` — Desktop sidebar 220/68 widths, gradient active pill, accordion sub-items, green-50/green-200 chips, `PanelLeft` toggle.
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/layout/MobileDrawer.tsx` — Framer Motion drawer recipe (spring + fade, backdrop, slide-from-left, single nav source).
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/layout/AppLayout.tsx` — How Header / Sidebar / MobileDrawer compose at the root.

### Current App Targets (files to modify)
- `app/routes/workspace/layout.tsx` — Restructure to mount navbar + sidebar (desktop) and mobile header + drawer (mobile). Loader contract unchanged.
- `app/components/sidebar/workspace-sidebar.tsx` — Restyle wrapper (border, surface tokens). Keep `<Sidebar collapsible="icon">` contract.
- `app/components/sidebar/module-sidebar-navigation.tsx` — Apply gradient active pill, accordion green-50 chip + green-200 left rail. Possibly add `onNavigate?: () => void` callback for drawer auto-close.
- `app/components/navbar-search.tsx` — Add `renderTrigger?: (open: () => void) => ReactNode` prop so the new navbar can supply its own button visuals while keeping the Cmd+K + open/close logic intact.
- `packages/ui/src/shadcn/sidebar.tsx` — Bump `SIDEBAR_WIDTH` to `13.75rem`, `SIDEBAR_WIDTH_ICON` to `4.25rem`. No other changes.
- `app/components/sidebar/mobile-navigation.tsx` — DELETE (replaced by drawer + mobile header).

### New Files
- `app/components/workspace-shell/workspace-navbar.tsx` — Desktop 72px header.
- `app/components/workspace-shell/workspace-mobile-header.tsx` — Compact mobile header.
- `app/components/workspace-shell/workspace-mobile-drawer.tsx` — Framer Motion drawer.
- (Optional) `app/components/workspace-shell/aloha-logo-square.tsx` — Extracted gradient logo if used 2+ places.

### Loader / Workspace Contract (read-only — must not change)
- `app/lib/workspace/org-workspace-loader.server.ts` — `loadOrgWorkspace()` shape.
- `app/lib/workspace/types.ts` — `AppNavModule`, `AppNavSubModule`.
- `app/lib/cookies.ts` — `sidebarStateCookie` (collapse persistence).

### Upstream (Phase 7 + 8)
- `.planning/phases/07-design-foundations/07-CONTEXT.md` — token names + dark palette rules (especially D-01, D-04, D-13).
- `.planning/phases/08-shared-primitives/08-CONTEXT.md` — gradient button recipe (D-04, D-05), Avatar gradient fallback (D-06), token consumption rule (D-11).
- `app/styles/theme.css` and `app/styles/shadcn-ui.css` — Phase 7 token values (read only).

### Project Constraints
- `CLAUDE.md` §Design System — "no breaking changes to component props or usage patterns", "WCAG AA in both themes".
- `.planning/REQUIREMENTS.md` NAVBAR-01..04, SIDEBAR-01..05, DRAWER-01..05 — all 14 acceptance criteria for this phase.
- `.planning/ROADMAP.md` Phase 9 success criteria #1–5.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `<Sidebar>` from `@aloha/ui/shadcn-sidebar` — already supports `collapsible="icon"`, cookie persistence via `SidebarProvider defaultOpen`, and CSS-var-driven widths. We tune the constants, not the contract.
- `<ModuleSidebarNavigation>` — already auto-expands the active module (lines 47–53). Restyle the buttons; don't refactor the state.
- `<NavbarSearch>` — already mounts a Cmd+K listener and opens a search dialog. Add a `renderTrigger` slot prop, don't fork.
- `<Avatar>` from `@aloha/ui/shadcn-avatar` — Phase 8 shipped gradient fallback + size variants. Reuse directly in navbar + mobile header.
- `<SidebarProvider>` + `useSidebar()` — desktop collapse logic untouched.
- `sidebarStateCookie` in `app/lib/cookies.ts` — collapse persistence.

### Established Patterns
- Server/client split: layout `loader` runs server-side; component reads `props.loaderData`. Keep this — drawer open state is client-only `useState`.
- Token-driven surfaces: every Phase 8 primitive consumes Phase 7 tokens (`bg-card`, `border-border`, `text-foreground`). Shell follows the same rule with two intentional exceptions: the gradient pill (literal green/emerald classes — same as Phase 8 button) and the active sub-item chip (literal green-50/700/200 — D-11).
- Mobile breakpoint = `md` (768px) per Tailwind defaults; current layout already uses `md:hidden` for the mobile header.
- Cookie-backed UI state is the established pattern for sidebar collapse — preserved.

### Integration Points
- `app/routes/workspace/layout.tsx` is the single mount point — only this file changes in `routes/`.
- `<SidebarProvider>` stays at the root of the desktop branch.
- `NavbarSearch` is the only existing client-side search surface — the new navbar's center button must defer to it.
- `SidebarProfileMenu` (sidebar footer) continues to handle org switching + sign-out — no relocation this phase.

### Creative Options Enabled
- Because Phase 7 unlocked shadows and Phase 8 shipped the gradient button, the navbar logo + sidebar active pill can use the same `shadow-lg shadow-green-500/25` recipe with zero new utilities.
- Because the existing sidebar already uses CSS vars for widths, the 220/68 bump is a 2-line constant change — no per-call-site refactor.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly references the prototype as the visual source of truth (Phase 7/8 carryover). Header.tsx, Sidebar.tsx, MobileDrawer.tsx are the literal references — match them visually unless a token-driven approach is cleaner.
- "Single nav config, no duplication" (DRAWER-05) is an explicit success criterion — drawer reusing `<ModuleSidebarNavigation>` is the load-bearing decision (D-03, D-20).
- "Wires to existing navbar search behavior unchanged" (NAVBAR-02) is the load-bearing constraint for the search button — D-14's `renderTrigger` slot is the minimal seam.
- The user's pattern across Phases 7 + 8: prefer token-driven where it works, allow literal Tailwind classes for explicit brand elements (gradient pill, green chip) — same approach here.

</specifics>

<deferred>
## Deferred Ideas

- **Real command palette UI** (Cmd+K opens a fuzzy-search modal listing modules + records). The current `NavbarSearch` only opens a search input — a true cmdk-style palette is a future capability, not a Phase 9 restyle. Note for v2.x backlog.
- **Profile menu in navbar header dropdown** (relocate `SidebarProfileMenu` from sidebar footer to a header avatar dropdown). Worth considering once mobile shell stabilizes — would unify org switching + sign-out across desktop and mobile. Backlog.
- **i18n strings for "Search...", "Aloha", aria-labels** — currently hardcoded; locale-extract pass is a future cleanup.
- **Dark-mode tuning of the green-50 active sub-item chip** — green-50 may look harsh on dark slate; defer to Phase 10's regression sweep where DARK-02 already covers it.
- **Bundle splitting for framer-motion** — only relevant if bundle budget tightens; defer to Phase 10 or later.
- **Removing `SIDEBAR_WIDTH_MOBILE` from `packages/ui/src/shadcn/sidebar.tsx`** since the mobile branch no longer uses the Sheet path — out of scope for Phase 9 (would touch the shared primitive's API surface), but worth noting for a future cleanup pass.

</deferred>

---

*Phase: 09-app-shell-navbar-sidebar-drawer*
*Context gathered: 2026-04-10*
