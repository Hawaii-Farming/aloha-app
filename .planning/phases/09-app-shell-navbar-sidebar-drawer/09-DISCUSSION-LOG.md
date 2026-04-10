# Phase 9: App Shell — Navbar, Sidebar, Drawer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 09-app-shell-navbar-sidebar-drawer
**Mode:** `--auto` (Claude selected recommended defaults; no interactive Q&A)
**Areas discussed:** Component topology, Sidebar restyle, Desktop navbar, Mobile drawer, Framer Motion, Loader contract, A11y

---

## Component Topology

| Option | Description | Selected |
|--------|-------------|----------|
| New `app/components/workspace-shell/` folder | Co-locate navbar, mobile header, drawer; keep `sidebar/` for the existing sidebar pieces | ✓ |
| Extend existing `app/components/sidebar/` | Add `workspace-navbar.tsx` etc. inside the sidebar folder | |
| New top-level `app/components/shell/` | Generic shell folder | |

**Choice:** New `workspace-shell/` folder.
**Rationale:** Discoverability — phase 9 introduces 3 new shell components; grouping under `workspace-shell/` makes the boundary explicit without renaming the existing `sidebar/` folder.

---

## Sidebar Restyle Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Tune existing `@aloha/ui` `Sidebar` constants + restyle in-place | Bump `SIDEBAR_WIDTH` constants to 220/68, restyle module nav, keep `SidebarProvider` contract | ✓ |
| Replace shadcn-sidebar entirely with a custom workspace sidebar | Drop the primitive, build a fresh component | |
| Fork shadcn-sidebar into the app | Copy + diverge | |

**Choice:** Tune existing constants + restyle in place.
**Rationale:** Loader contract + cookie persistence + collapse logic already work — replacing them violates SIDEBAR-04 (cookie persistence) and success criterion #5 (no loader contract changes). Two-line constant bump for widths, then visual restyle of `module-sidebar-navigation.tsx`.

---

## Mobile Navigation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Framer Motion drawer (matches prototype) | Spring slide + fade backdrop, single nav source | ✓ |
| Continue using shadcn `Sheet` from the existing `Sidebar collapsible="icon"` | No new dep, but no spring + no fade match | |
| Vaul drawer library | Pull-to-close drawer, mobile-native feel | |

**Choice:** Framer Motion drawer.
**Rationale:** DRAWER-03 is explicit — "spring + fade matching the prototype timing". The prototype is built on Framer Motion (`MobileDrawer.tsx` lines 102–129); matching it requires the same library. Vaul would be over-spec.

---

## Drawer State Location

| Option | Description | Selected |
|--------|-------------|----------|
| `useState` in `routes/workspace/layout.tsx` | Layout-scoped boolean | ✓ |
| New React Context (`MobileDrawerContext`) | Cross-component access | |
| Inside the drawer component itself | Self-contained | |

**Choice:** Layout-level `useState`.
**Rationale:** Only two consumers — the mobile header (opens) and the drawer (closes). Context adds indirection for nothing. Auto-close on route change handled via `useLocation` in the layout.

---

## Search Button Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Add `renderTrigger` slot prop to `NavbarSearch` | Visuals in navbar, behavior in `NavbarSearch` | ✓ |
| Lift `setOpen` out of `NavbarSearch` into a context | Forces refactor of a working component | |
| Duplicate the trigger in the navbar with its own `useState` | Two open states diverge | |

**Choice:** `renderTrigger` slot.
**Rationale:** Smallest seam, satisfies "wires to existing navbar search behavior unchanged" (NAVBAR-02). The Cmd+K listener + dialog state stay in `NavbarSearch`; only the visual trigger lives in the navbar.

---

## Avatar Source

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse Phase 8 `<Avatar>` primitive | Already has gradient fallback + size variants | ✓ |
| Build a fresh `<NavbarAvatar>` | Duplicate work | |
| Lift the avatar out of `SidebarProfileMenu` | Couples profile menu refactor to navbar work | |

**Choice:** Reuse Phase 8 `<Avatar>`.
**Rationale:** Phase 8 D-06 + D-10 already shipped exactly what NAVBAR-03 needs. The SidebarProfileMenu keeps its avatar in the footer for now (D-29).

---

## Profile Menu Location

| Option | Description | Selected |
|--------|-------------|----------|
| Keep in sidebar footer (current) | No relocation | ✓ |
| Move to navbar header dropdown | Common SaaS pattern | |
| Both (duplicate) | Maintenance burden | |

**Choice:** Keep in sidebar footer.
**Rationale:** Scope guardrail — NAVBAR-03 only requires the avatar to be visible and restyled. Relocating the menu is a future phase and was added to deferred ideas.

---

## Sidebar Active State Tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Literal Tailwind classes (`bg-gradient-to-r from-green-500 to-emerald-600`, `bg-green-50`) | Matches prototype, no new tokens | ✓ |
| New semantic tokens (`--sidebar-active-bg`, `--sidebar-sub-active-bg`) | Token-driven, dark-mode-friendly | |
| Mixed (gradient literal, chip via token) | Inconsistent | |

**Choice:** Literal Tailwind classes.
**Rationale:** Phase 8 D-04/D-05 set the precedent — gradients are literal brand elements. Adding sidebar-active tokens would expand surface area without immediate reuse. Dark-mode tuning of `green-50` deferred to Phase 10's WCAG sweep.

---

## Framer Motion Hosting

| Option | Description | Selected |
|--------|-------------|----------|
| Add to root `package.json` | Drawer is the only consumer | ✓ |
| Add to `packages/ui` and re-export | Leaks animation lib through shared boundary | |
| Skip framer-motion, hand-roll CSS animation | Won't match prototype spring physics | |

**Choice:** Root `package.json`.
**Rationale:** Single consumer; no need to expose a new dep through `@aloha/ui`. Hoist later if other shell pieces adopt it.

---

## Verification Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Manual smoke check + typecheck/lint per commit | Lightweight, matches Phase 7+8 pattern | ✓ |
| Add Playwright snapshot tests for shell | Big lift; Phase 10 owns DARK-02 regression | |
| Add Storybook stories for navbar/sidebar/drawer | Out of scope, no Storybook in repo | |

**Choice:** Manual smoke + typecheck/lint.
**Rationale:** Phase 10's DARK-02 sweep covers automated regression. Phase 9 stays focused on landing the visual replacement.

---

## Claude's Discretion (deferred to planner/executor)

- Whether to extract `<AlohaLogoSquare>` as a tiny shared component or inline (decision: extract once 2+ usage sites confirmed).
- `renderTrigger` API shape (render prop vs slot) — pick whichever reads cleaner against `NavbarSearch` internals.
- Drawer auto-close `useEffect` location (layout vs drawer) — slight preference for layout.
- Memoization of nav data passed to drawer's `<ModuleSidebarNavigation>` — only if profiling shows need.
- Exact drawer width if 260px feels too wide on the smallest devices — keep prototype default unless visual smoke disagrees.

## Deferred Ideas (forwarded to CONTEXT.md `<deferred>`)

- Real command palette UI (cmdk + module/record search).
- Profile menu in navbar header dropdown.
- i18n locale extraction for hardcoded shell strings.
- Dark-mode tuning of the green-50 active sub-item chip (Phase 10).
- Framer Motion bundle splitting (revisit at Phase 10+).
- Removing the now-unused `SIDEBAR_WIDTH_MOBILE` constant from the shadcn-sidebar primitive (touches shared primitive surface).
