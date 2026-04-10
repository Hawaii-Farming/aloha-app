# Phase 9: App Shell — Navbar, Sidebar, Drawer — Research

**Researched:** 2026-04-10
**Domain:** React Router 7 SSR app shell (desktop navbar + sidebar + mobile drawer)
**Confidence:** HIGH

## Summary

Phase 9 is a pure chrome restyle — no loader, schema, RLS, or nav-config changes. The prototype files (`Header.tsx`, `Sidebar.tsx`, `MobileDrawer.tsx`, `AppLayout.tsx`) are the visual source of truth and nearly all class strings can be lifted verbatim. The heavy lifting is in three seams: (1) a width-constant bump inside `packages/ui/src/shadcn/sidebar.tsx` (2 lines), (2) a new optional `renderTrigger` slot prop on `NavbarSearch` so the navbar can supply the centered button while the Cmd+K + dialog machinery stays put, and (3) a Framer Motion drawer in a new `app/components/workspace-shell/` folder that reuses the existing `<ModuleSidebarNavigation>` component for body content (zero nav duplication — DRAWER-05).

The existing `<SidebarProvider>` + cookie persistence flow works unchanged — we tune CSS-var values, not the contract. `mobile-navigation.tsx` is dead code after this phase (only `09-CONTEXT.md` and the obsolete `08-RESEARCH.md` reference it; no route/component imports it).

**Primary recommendation:** Execute as 5 plans — (1) sidebar width bump + `WorkspaceSidebar`/`ModuleSidebarNavigation` restyle, (2) `NavbarSearch` `renderTrigger` seam + new `WorkspaceNavbar`, (3) framer-motion install + `WorkspaceMobileDrawer` + `WorkspaceMobileHeader`, (4) `layout.tsx` integration + `mobile-navigation.tsx` delete, (5) smoke + a11y verification.

## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01..D-35)

**Topology (D-01..D-05):**
- New files under `app/components/workspace-shell/`: `workspace-navbar.tsx`, `workspace-mobile-header.tsx`, `workspace-mobile-drawer.tsx`.
- Delete `app/components/sidebar/mobile-navigation.tsx`.
- `app/routes/workspace/layout.tsx` mounts desktop branch = navbar + sidebar + main; mobile branch = mobile header + main + drawer.

**Sidebar tokens (D-06..D-08):**
- Bump `SIDEBAR_WIDTH` `14rem → 13.75rem` (220px), `SIDEBAR_WIDTH_ICON` `4rem → 4.25rem` (68px) in `packages/ui/src/shadcn/sidebar.tsx`. Leave `SIDEBAR_WIDTH_MOBILE` as-is (now unused).
- Sidebar surface = `bg-card border-r border-border` — no hardcoded slate.
- Preserve `sidebarStateCookie` + `defaultOpen={layoutState.open}`.

**Active state recipe (D-09..D-12):**
- Active module pill: `bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 rounded-xl`.
- Inactive module: `bg-transparent text-foreground hover:bg-muted`.
- Active sub-item chip: `bg-green-50 text-green-700 font-medium rounded-lg`; inactive: `bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground`.
- Accordion rail under active module: `border-l-2 border-green-200 ml-5 pl-3`.
- Literal green-50/700/200 Tailwind classes intentional; dark-mode tuning deferred to Phase 10.
- Do NOT refactor the existing auto-expand `useState` in `module-sidebar-navigation.tsx` (lines 52–54).

**Desktop navbar (D-13..D-16):**
- Logo square: `w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 flex items-center justify-center text-white font-bold text-sm` letter "A".
- Wordmark: `font-semibold text-foreground text-lg` reading "Aloha".
- Centered search button: `flex-1 max-w-md mx-auto flex items-center gap-2 px-4 py-2.5 bg-muted rounded-2xl text-muted-foreground hover:bg-muted/80 transition-colors` — triggers existing `NavbarSearch` via `renderTrigger` slot.
- Right avatar: Phase 8 `<Avatar>` primitive, size `md`, initials from `user.email[0]`.
- Navbar: `h-[72px] px-6 bg-card border-b border-border flex items-center gap-4 shrink-0`.

**Mobile header + drawer (D-17..D-21):**
- Mobile header: `h-14 px-4 bg-card border-b border-border md:hidden`.
- Drawer: Framer Motion backdrop fade + panel `x: -100% → 0` spring `{ damping: 25, stiffness: 300 }`, wrapped in `AnimatePresence`.
- Drawer width `w-[260px]`, panel `fixed inset-y-0 left-0 bg-card shadow-xl z-50`, backdrop `fixed inset-0 bg-black/30 z-40`.
- Drawer body reuses `<ModuleSidebarNavigation>` with new optional `onNavigate?: () => void` prop (default no-op).
- Drawer open state in `layout.tsx` `useState`; auto-close on route change via `useEffect` on `useLocation().pathname`.

**Framer Motion (D-22..D-23):**
- Add `framer-motion` `^12.x` (latest stable) to **root** `package.json` — NOT `packages/ui/package.json`.
- No dynamic import / code-splitting this phase.

**Avatar (D-24):** Use existing Phase 8 primitive from `@aloha/ui/avatar` (CONTEXT.md calls it `shadcn-avatar` informally — the actual package export path is `/avatar`, see Integration Points below).

**Loader contract (D-25..D-26):**
- Zero loader shape changes; `style` field in loader may be removed if unused.
- `SidebarProvider` remains mounted on desktop (consumes `useSidebar()` for `SidebarEdgeToggle`).

**Accessibility (D-27..D-28):**
- Drawer panel: `role="dialog"`, `aria-modal="true"`, `aria-label="Mobile navigation"`.
- Backdrop: `aria-hidden="true"`.
- Hamburger: `aria-label="Open navigation menu"`, `aria-expanded={open}`.
- Focus moves to first nav item on open; returns to hamburger on close.
- Escape key closes drawer (drawer-level `useEffect` with `keydown`).

**Scope guards (D-29..D-32):**
- Do NOT restyle `sidebar-profile-menu.tsx` beyond token inheritance.
- Do NOT touch `org-selector.tsx` or `workspace-navigation.config.tsx`.
- No new i18n strings — hardcoded literals OK this phase.

**Verification (D-33..D-35):**
- `pnpm typecheck` + `pnpm lint` after every commit.
- Manual smoke checklist (desktop light + dark, mobile 375px, org switch, CRUD Outlet).
- No Playwright snapshot this phase (Phase 10's DARK-02 sweep covers).

### Claude's Discretion

- Whether to extract `<AlohaLogoSquare size="sm|md">` if used in 2+ places (recommended yes — desktop navbar + mobile header).
- ChevronDown rotation timing (match prototype `0.2s`).
- `NavbarSearch` `renderTrigger` as render prop vs slot — pick cleaner (research recommends render prop, see §2).
- Drawer auto-close `useEffect` location (layout vs drawer) — research recommends layout for single source of truth on open state.
- Memoize nav data for drawer only if DevTools shows re-render storm.

### Deferred Ideas (OUT OF SCOPE)

- Real command palette UI (fuzzy search across modules + records).
- Profile menu relocation to navbar header dropdown.
- i18n extraction of "Search...", "Aloha", aria-labels.
- Dark-mode tuning of the green-50 sub-item chip (Phase 10).
- Framer-motion code splitting.
- Removing `SIDEBAR_WIDTH_MOBILE` constant (touches `packages/ui` API surface).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAVBAR-01 | 72px header, gradient logo square + "Aloha" wordmark | §1 layout.tsx, §Code Examples prototype Header.tsx lines 9–15 |
| NAVBAR-02 | Centered search button wires to existing NavbarSearch | §2 `renderTrigger` slot design |
| NAVBAR-03 | Avatar on right restyled to new tokens | §Integration Points — Phase 8 Avatar primitive |
| NAVBAR-04 | Mobile compact header with hamburger + logo + avatar | §1 mobile branch in layout.tsx |
| SIDEBAR-01 | 220px expanded / 68px collapsed | §3 sidebar.tsx constant bump |
| SIDEBAR-02 | Gradient active module pill | §Code Examples prototype Sidebar.tsx lines 46–52 |
| SIDEBAR-03 | Green-50 chip + green-200 left rail sub-items | §Code Examples prototype Sidebar.tsx lines 78–96 |
| SIDEBAR-04 | PanelLeft toggle with cookie persistence | §3 SidebarProvider flow — unchanged |
| SIDEBAR-05 | Desktop sidebar hidden below md | §1 layout.tsx desktop vs mobile branching |
| DRAWER-01 | Full-height left-slide drawer with black/30 backdrop | §Code Examples MobileDrawer.tsx lines 102–129 |
| DRAWER-02 | Hamburger opens drawer | §6 state lifting |
| DRAWER-03 | Framer Motion spring + fade | §4 framer-motion SSR verified |
| DRAWER-04 | Backdrop tap + leaf tap close | §5 `onNavigate` callback pattern |
| DRAWER-05 | Single nav config — reuse `ModuleSidebarNavigation` | §5 `onNavigate` optional prop |

## Project Constraints (from CLAUDE.md)

- React Router 7 SSR/Framework mode — routes export `loader` (server) + `default` component (client).
- **`useEffect` is a code smell — must be justified.** For this phase, three `useEffect` usages are justified:
  1. Drawer escape-key listener (`keydown`) — no alternative for global key binding.
  2. Drawer auto-close on route change (`useLocation().pathname` changes) — no event fires when React Router navigates internally; observing location is the canonical pattern.
  3. Focus management on drawer open/close — focusing/returning focus must happen after DOM update, which is exactly `useEffect`'s contract.
- Never use `watch()`; use `useWatch` — N/A this phase (no forms).
- Single `useState` object for related state preferred (drawer `open` is a lone bool → single `useState` fine).
- `data-test` attributes for E2E selectors on hamburger, search trigger, drawer container.
- Functional components only, `interface` for props.
- Hosted Supabase — no DB work this phase.
- WCAG AA dark + light (but dark-mode green chip tuning is deferred to Phase 10 per D-11).
- No new UI libraries — framer-motion is an animation lib, not a UI lib, and is added to root `package.json` (not `packages/ui`) so the `@aloha/ui` boundary stays clean.

## 1. Current Shell Anatomy

### `app/routes/workspace/layout.tsx` (84 lines)

| Lines | Content | Phase 9 action |
|-------|---------|----------------|
| 1–13 | Imports + `Route` type | Add imports: `useState`, `useEffect`, `useLocation`, new shell components |
| 14–31 | `loader` — returns `{ workspace, layoutState, accountSlug }` | UNCHANGED (D-25). Optionally drop `style` field if unused |
| 33–42 | Component top: destructure + build `accounts` | Keep |
| **45** | `<SidebarProvider defaultOpen={layoutState.open}>` | KEEP (D-26) — desktop tree still needs it |
| 46–52 | `<WorkspaceSidebar …/>` | Keep; desktop-only now — conditionally hide below `md` via existing `group-data` or wrap in `<div className="hidden md:block">` |
| **54–58** | `<main>` with `<div … md:hidden>` containing `<SidebarTrigger/>` (current mobile header) | **REPLACE** with `<WorkspaceMobileHeader>` above the `<main>`, and mount `<WorkspaceMobileDrawer>` controlled by new `useState` |
| 60–62 | `<Outlet />` wrapper | Keep; possibly move padding to `<main>` |
| 68–83 | `getLayoutState` — cookie parse | UNCHANGED |

**New desktop structure** (matches prototype `AppLayout.tsx` lines 56–70):
```tsx
<SidebarProvider defaultOpen={layoutState.open}>
  <div className="flex h-svh w-full flex-col">
    <WorkspaceNavbar user={user} className="hidden md:flex" />
    <WorkspaceMobileHeader onOpenDrawer={() => setDrawerOpen(true)} user={user} className="md:hidden" />
    <div className="flex flex-1 overflow-hidden">
      <div className="hidden md:block">
        <WorkspaceSidebar … />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-1 flex-col p-4"><Outlet /></div>
      </main>
    </div>
    <WorkspaceMobileDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      navigation={workspace.navigation}
      account={accountSlug}
    />
  </div>
</SidebarProvider>
```

Note the `SidebarProvider` tree needs to wrap a single element; using a flex column wrapper is fine (`SidebarProvider` forwards `...props` to a div).

### `app/components/sidebar/workspace-sidebar.tsx` (77 lines)

| Lines | Content | Phase 9 action |
|-------|---------|----------------|
| 1–15 | Imports | Add nothing |
| 23–41 | `SidebarEdgeToggle` — `ChevronsLeft` circular button at right edge | **Replace with `PanelLeft` icon per SIDEBAR-04**; keep the `useSidebar().toggleSidebar` wiring. Optionally move inside `SidebarContent` header to match prototype position |
| 43–77 | `WorkspaceSidebar` shell with `<Sidebar collapsible="icon">`, `SidebarContent`, `SidebarFooter` | Add `className="border-r border-border bg-card"` to inner content if needed; keep `<ModuleSidebarNavigation>` and `<SidebarProfileMenu>` wiring unchanged |

### `app/components/sidebar/module-sidebar-navigation.tsx` (229 lines)

| Lines | Content | Phase 9 action |
|-------|---------|----------------|
| 1–28 | Imports + props interface | Add `onNavigate?: () => void` optional prop |
| 30–54 | Component setup + auto-expand `useState` (lines 52–54) | **UNCHANGED (D-12)** |
| 56–68 | `toggleModule` helper | Keep |
| 70–81 | Module map loop | Keep |
| 83 | `SidebarSeparator` between modules | Keep |
| 86–142 | **Collapsed-mode branch** (icon with popover sub-menu) | Retune button classes to gradient active pill; no structural changes |
| 144–222 | **Expanded-mode branch** (accordion sub-items) | Apply: active module = gradient pill (line ~97 `SidebarMenuButton`); active sub-item = `bg-green-50 text-green-700 font-medium rounded-lg`; accordion `<CollapsibleContent>` inner wrapper adds `border-l-2 border-green-200 ml-5 pl-3` |
| 186–215 | Sub-item `<a href={subModulePath}>` | Wrap click in `onClick={() => props.onNavigate?.()}` so drawer closes on leaf tap. Navigation itself continues via `href`+browser/react-router |

**Important:** because the sub-items use `<a href>`, onNavigate must be called synchronously in the click handler; the actual navigation fires after. Alternative: use `<Link>` from react-router — but that's a refactor. Keep `<a>` and add onClick.

**What stays untouched:** `sidebar-profile-menu.tsx` (D-29), `org-selector.tsx` (D-30), `workspace-navigation.config.tsx` (D-31), loader shape (D-25), `module-icons.config.ts`, `SidebarProvider` contract (D-26).

## 2. NavbarSearch Internals + `renderTrigger` Slot Design

### Current internals (60 lines)
- **State:** `const [open, setOpen] = useState(false)` — `setOpen` is the open/close controller.
- **Cmd+K listener:** `useEffect` (lines 18–28) attaches `document.addEventListener('keydown', …)` — justified (global key binding).
- **Default trigger:** `<button data-test="navbar-search-trigger" onClick={() => setOpen(true)} className="…" aria-label="Open search">` (lines 36–45).
- **Dialog:** `<CommandDialog open={open} onOpenChange={setOpen}>` — fully controlled.
- **isMac detection:** reads `navigator.platform` — safe in SSR because it runs client-side only (no render branching; only in rendered text).

### Minimal `renderTrigger` slot API (recommended)

**Signature:** `renderTrigger?: (props: { open: () => void; isMac: boolean }) => React.ReactNode`

**Why a render prop (not children slot):** the trigger needs both `open` (to call on click) and `isMac` (to label the keyboard hint). A function gives both without magical context. Default behavior: when `renderTrigger` is omitted, render the existing `<button>` verbatim — zero breakage.

**Integration sketch:**
```tsx
// packages/components change in navbar-search.tsx
interface NavbarSearchProps {
  renderTrigger?: (props: { open: () => void; isMac: boolean }) => React.ReactNode;
}

export function NavbarSearch({ renderTrigger }: NavbarSearchProps = {}) {
  const [open, setOpen] = useState(false);
  useEffect(/* Cmd+K unchanged */, []);
  const isMac = /* unchanged */;

  const trigger = renderTrigger
    ? renderTrigger({ open: () => setOpen(true), isMac })
    : (<button data-test="navbar-search-trigger" /* existing button */>…</button>);

  return (
    <>
      {trigger}
      <CommandDialog open={open} onOpenChange={setOpen}>…</CommandDialog>
    </>
  );
}
```

**In `workspace-navbar.tsx`:**
```tsx
<NavbarSearch
  renderTrigger={({ open, isMac }) => (
    <button
      type="button"
      onClick={open}
      data-test="workspace-navbar-search-trigger"
      className="flex-1 max-w-md mx-auto flex items-center gap-2 px-4 py-2.5 bg-muted rounded-2xl text-muted-foreground hover:bg-muted/80 transition-colors"
      aria-label="Open search"
    >
      <Search size={16} />
      <span className="text-sm">Search...</span>
      <span className="ml-auto flex items-center gap-1 text-xs">
        <Command size={12} /> <span>K</span>
      </span>
    </button>
  )}
/>
```

**Risks / mitigations:**
1. **Duplicate `data-test`:** existing `navbar-search-trigger` only appears when `renderTrigger` is undefined. Any existing E2E assertions referencing `data-test="navbar-search-trigger"` will break because the workspace navbar now uses `workspace-navbar-search-trigger`. MITIGATION: grep for the old selector before merging (verified — no current E2E matches in repo beyond the file itself).
2. **Cmd+K listener still mounts once** because `NavbarSearch` renders once in the navbar tree — fine.
3. **Dialog state still owned by `NavbarSearch`** — the new trigger only requests open; close handled inside dialog.
4. **No behavior fork** — the only reason to use `renderTrigger` is visual; logic stays in one place.

## 3. `packages/ui/src/shadcn/sidebar.tsx` Width Bump

**Lines to change:**
```tsx
// Current (lines 34–36):
const SIDEBAR_WIDTH = '14rem';        // 224px
const SIDEBAR_WIDTH_MOBILE = '18rem'; // 288px — now unused
const SIDEBAR_WIDTH_ICON = '4rem';    // 64px

// New:
const SIDEBAR_WIDTH = '13.75rem';      // 220px
const SIDEBAR_WIDTH_MOBILE = '18rem';  // unchanged (still exported, unused at call site)
const SIDEBAR_WIDTH_ICON = '4.25rem';  // 68px
```

**Is it non-breaking?**
- These constants are emitted as CSS custom properties `--sidebar-width` and `--sidebar-width-icon` on `SidebarProvider`'s root div (line 80-ish via `style={{ '--sidebar-width': SIDEBAR_WIDTH, … }}`).
- All downstream Sidebar CSS classes (`w-[--sidebar-width]`, `group-data-[state=collapsed]:w-[--sidebar-width-icon]`) consume the var — changing the constant only changes the rendered pixel width. No component API or prop surface changes.
- **Verification:** `pnpm typecheck` + `pnpm lint` will pass; rendered width changes by 4px each (nearly imperceptible but matches the spec).

**Cookie persistence flow (unchanged):**
1. User clicks `SidebarEdgeToggle` → calls `useSidebar().toggleSidebar()`.
2. `SidebarProvider`'s `setOpen` handler writes to `document.cookie` with key `sidebar:state` and max-age 7 days (lines 33).
3. On next page load, `workspace/layout.tsx` `loader` calls `getLayoutState(request)` which reads the `sidebar:state` cookie via `sidebarStateCookie.parse()` and returns `{ open }`.
4. `<SidebarProvider defaultOpen={layoutState.open}>` seeds the correct initial state, avoiding SSR flash.

This entire flow is untouched by the width bump.

## 4. Framer Motion Install + SSR Compatibility

### Version
- **Latest stable as of 2026-04-10:** `framer-motion@12.38.0` [VERIFIED: `npm view framer-motion version`].
- CONTEXT.md D-22 says "^11.x" but that was written before the 12.x line stabilized. **Recommendation:** use `^12.0.0` — the motion API (`motion.div`, `AnimatePresence`, spring transitions) is identical between 11 and 12. If the planner wants to be conservative they can pin `^11.18.0`.
- Either works; no breaking changes in the `motion` + `AnimatePresence` APIs used here.

### Install command
```bash
# From repo root — adds to root package.json only
pnpm add framer-motion@^12.0.0 -w
# Or without catalog: pnpm add framer-motion -F aloha-app
```
The workspace app is the root `package.json` (name: `aloha-app`). Adding with `-w` (or no filter) adds to the root.

### SSR compatibility under React Router 7

**Key facts:**
- React Router 7 Framework Mode uses streaming SSR via `renderToPipeableStream` (see `app/entry.server.tsx`). It is **not** RSC — there are no `"use client"` directives.
- Framer Motion 11+ is SSR-safe out of the box: `motion.div` renders as a plain `<div>` on the server with initial styles applied (via `initial` prop), then hydrates and begins animation on the client. No hydration mismatches for the patterns used here.
- `AnimatePresence` only animates on client mount/unmount; on server it renders children if present, nothing if absent. Our drawer initial state is `open={false}`, so server renders nothing inside `AnimatePresence` — zero hydration risk.
- Some framer-motion guides mention a "mini" `m.div` import (`import { m } from 'framer-motion'`) + `LazyMotion` for bundle savings. **Not needed this phase** (D-23). Use plain `motion.div` / `motion.nav`.
- No `"use client"` needed anywhere in the project — React Router 7 Framework Mode treats all component code as universal.

**Confirmed by:** React Router 7 docs on Framework Mode, framer-motion 11/12 docs, prototype `MobileDrawer.tsx` uses `motion.div` / `motion.nav` without any SSR-specific wrapping and the prototype itself is SPA-only but the same imports work under SSR.

**SSR hydration mismatch risk (drawer):** `useState(false)` for drawer open → server renders `<AnimatePresence>` empty → client hydrates empty → no mismatch. Opening is a client interaction after hydration. CONFIRMED SAFE.

## 5. `<ModuleSidebarNavigation>` Reuse for Drawer

### Current props (lines 24–28)
```tsx
interface ModuleSidebarNavigationProps {
  account: string;
  modules: AppNavModule[];
  subModules: AppNavSubModule[];
}
```

### New prop
Add single optional callback:
```tsx
interface ModuleSidebarNavigationProps {
  account: string;
  modules: AppNavModule[];
  subModules: AppNavSubModule[];
  onNavigate?: () => void; // called when a leaf sub-item is clicked
}
```

**Wiring:** each `<SidebarMenuButton asChild …>` wrapping an `<a>` gets `onClick={() => props.onNavigate?.()}`. Desktop callers pass nothing (default no-op); drawer passes `() => onClose()`.

### Active-module auto-expand state reset when used inside drawer?

The current auto-expand logic (lines 47–54) seeds `useState<Set<string>>` from the active module on **mount**. Inside the drawer:
- Drawer panel mounts when `open` transitions `false → true` (because `AnimatePresence` unmounts children on exit).
- Each mount re-runs the seeding, so the active module is always expanded when the drawer opens. No manual reset needed.
- Caveat: if the user navigates inside the drawer (which immediately closes it via `onNavigate`), the next open will re-seed with the new active module. Correct behavior.

**No state reset logic required.** The remount-on-open semantics of `AnimatePresence` give us free correctness.

**Collapsed vs expanded:** the drawer renders at fixed width (260px), so the `group-data-[collapsible=icon]` hidden/visible branches inside `ModuleSidebarNavigation` automatically show the expanded version (since the drawer's `<Sidebar>` parent isn't present). Actually — the component uses `group-data-[collapsible=icon]:block` / `:hidden` classes that reference the Sidebar wrapper's `data-collapsible` attribute. When rendered outside a `<Sidebar>`, neither branch's group-data matches, so **both branches render**. 

**THIS IS A BUG RISK.** Mitigations (pick one during planning):
1. Wrap drawer body in a dummy `<div data-collapsible="">` so only the expanded branch shows.
2. Refactor `module-sidebar-navigation.tsx` to receive a `variant: 'sidebar' | 'drawer'` prop and pick the right branch.
3. Drawer passes a `forceExpanded?: boolean` prop that short-circuits to the expanded branch only.

**Recommended:** option 3 (additive, minimal). The drawer always wants expanded style.

## 6. Mobile Auto-Close on Route Change

**Pattern (in `layout.tsx`):**
```tsx
import { useLocation } from 'react-router';

const location = useLocation();
const [drawerOpen, setDrawerOpen] = useState(false);

useEffect(() => {
  setDrawerOpen(false);
}, [location.pathname]);
```

**Why this works:** React Router 7 re-renders the layout component on navigation; `useLocation()` returns a new object with the new pathname; the effect sees a different `pathname` and closes the drawer.

**Why this is justified under CLAUDE.md:** there is no `onNavigate` event bus in React Router. Observing `useLocation()` is the canonical documented pattern for "do X on route change." Alternatives (fetcher state, global state) are worse and more fragile.

**Redundancy note:** the `onNavigate` callback in §5 also closes the drawer when a leaf is tapped. Both exist because:
- `onNavigate` handles the taps inside the drawer (fast, synchronous).
- The `useLocation` effect handles external navigations (e.g., programmatic navigation from the profile menu, back/forward, deep link).

Keep both. They are complementary, not duplicative.

## 7. Focus Management + A11y

### Pattern (inside `workspace-mobile-drawer.tsx`)
```tsx
const firstNavRef = useRef<HTMLButtonElement | null>(null);
const hamburgerRef: React.MutableRefObject<HTMLButtonElement | null>; // passed in from mobile header

useEffect(() => {
  if (open) {
    // After AnimatePresence mounts, focus first interactive element
    const id = requestAnimationFrame(() => firstNavRef.current?.focus());
    return () => cancelAnimationFrame(id);
  } else {
    hamburgerRef?.current?.focus();
  }
}, [open]);
```

**Justifications:**
- `useEffect` is justified because focus management requires post-mount DOM access.
- `requestAnimationFrame` ensures the focus happens after framer-motion has started the enter transition; without it, focus may hit a not-yet-mounted element on the first frame.

### Escape key listener (single useEffect)
```tsx
useEffect(() => {
  if (!open) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}, [open, onClose]);
```

**Justified:** global key binding.

### Focus trap
Full focus trap (tabbing cycles inside drawer) is **not strictly required** by WCAG AA for a navigation drawer, but is a best practice. Options:
- **Minimal (recommended for this phase):** rely on Radix's focus-trap primitives OR Shadcn's `Dialog` — but we're intentionally not using `Dialog` (custom framer-motion). Skip explicit focus trap, rely on backdrop + escape.
- **Nice-to-have:** install a small helper like `focus-trap-react` (~2kb) OR implement a 20-line tab-key handler. CONTEXT.md does not require it. **Recommendation:** defer focus trap to Phase 10's a11y pass; ship with Escape + backdrop + focus-on-open + focus-return-on-close for Phase 9.

### Full a11y markup
```tsx
<motion.nav
  role="dialog"
  aria-modal="true"
  aria-label="Mobile navigation"
  className="fixed inset-y-0 left-0 w-[260px] bg-card shadow-xl z-50 …"
>…</motion.nav>

<motion.div aria-hidden="true" className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

// In WorkspaceMobileHeader:
<button
  ref={hamburgerRef}
  onClick={onOpenDrawer}
  aria-label="Open navigation menu"
  aria-expanded={drawerOpen}
  data-test="workspace-mobile-header-hamburger"
>…</button>
```

## 8. Validation Architecture

> `workflow.nyquist_validation: true` — validation section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 (unit), Playwright 1.57.x (E2E). This phase has **no DB / API logic** to unit-test — validation is predominantly manual smoke + typecheck + lint + grep-able assertions. |
| Config file | `vitest.config.ts`, `e2e/playwright.config.ts` |
| Quick run command | `pnpm typecheck && pnpm lint` |
| Full suite command | `pnpm typecheck && pnpm lint && pnpm dev` (visual smoke) |

### Phase Requirements → Test Map

All requirements below are strictly shell-restyle; most cannot be meaningfully unit-tested. The strategy is:
- **Typecheck/lint** for contract preservation.
- **Grep assertions** for class strings / file presence (cheap, fast).
- **Manual smoke** for visual correctness and interaction (desktop light/dark + mobile 375px).
- **Optional Playwright smoke** (reuse existing auth.po.ts login flow) for hamburger → drawer → backdrop close — only if time permits.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| NAVBAR-01 | 72px header with gradient logo + wordmark | grep | `rg 'h-\[72px\]' app/components/workspace-shell/workspace-navbar.tsx` | Wave 0 creates |
| NAVBAR-02 | Search button triggers NavbarSearch | unit (optional) + manual | `pnpm typecheck` + manual Cmd+K toggle | N/A — manual |
| NAVBAR-03 | Avatar renders from Phase 8 primitive | grep | `rg "from '@aloha/ui/avatar'" app/components/workspace-shell/` | Wave 0 creates |
| NAVBAR-04 | Mobile header visible below md | grep | `rg 'md:hidden' app/components/workspace-shell/workspace-mobile-header.tsx` | Wave 0 creates |
| SIDEBAR-01 | 220/68px widths | grep | `rg "13.75rem\|4.25rem" packages/ui/src/shadcn/sidebar.tsx` | exists |
| SIDEBAR-02 | Gradient active pill | grep | `rg 'from-green-500 to-emerald-600' app/components/sidebar/module-sidebar-navigation.tsx` | exists |
| SIDEBAR-03 | Green-50 chip + green-200 rail | grep | `rg 'bg-green-50\|border-green-200' app/components/sidebar/module-sidebar-navigation.tsx` | exists |
| SIDEBAR-04 | PanelLeft toggle persists via cookie | manual + grep | `rg 'PanelLeft' app/components/sidebar/workspace-sidebar.tsx` + reload smoke | exists |
| SIDEBAR-05 | Desktop sidebar hidden on mobile | grep | `rg 'hidden md:' app/routes/workspace/layout.tsx` | exists |
| DRAWER-01 | Slide-left drawer with black/30 backdrop | grep | `rg "bg-black/30\|motion.nav" app/components/workspace-shell/workspace-mobile-drawer.tsx` | Wave 0 creates |
| DRAWER-02 | Hamburger opens drawer | manual (Playwright optional) | manual tap 375px | N/A |
| DRAWER-03 | Framer Motion spring + fade | grep | `rg "type: 'spring'" app/components/workspace-shell/workspace-mobile-drawer.tsx` | Wave 0 creates |
| DRAWER-04 | Backdrop + leaf tap close | manual | tap-close smoke | N/A |
| DRAWER-05 | Single nav config — reuses ModuleSidebarNavigation | grep | `rg 'ModuleSidebarNavigation' app/components/workspace-shell/workspace-mobile-drawer.tsx` | Wave 0 creates |

### Sampling Rate
- **Per task commit:** `pnpm typecheck && pnpm lint` (< 20s incremental)
- **Per wave merge:** `pnpm typecheck && pnpm lint` + `pnpm dev` visual smoke of the phase's manual checklist
- **Phase gate:** full manual smoke checklist (D-34 items 1–5) in both light and dark theme + 375px mobile viewport

### Wave 0 Gaps
- [ ] Create `app/components/workspace-shell/` directory + empty `workspace-navbar.tsx`, `workspace-mobile-header.tsx`, `workspace-mobile-drawer.tsx` stubs so grep assertions can run against the correct paths.
- [ ] Install `framer-motion@^12.0.0` at repo root (blocker for Plan 3).
- [ ] (Optional) Add `e2e/workspace-shell.spec.ts` with 1 smoke test: login → mobile viewport → hamburger → drawer visible → backdrop tap → drawer hidden. Defer unless there's appetite.

*(Nothing else — all other test infrastructure already exists.)*

## 9. Risks & Pitfalls

### Pitfall 1: `<SidebarProvider>` Sheet still mounted under `md:hidden`
**What goes wrong:** `shadcn-sidebar.tsx` internally mounts a `<Sheet>` for mobile at width `SIDEBAR_WIDTH_MOBILE` when `useIsMobile()` returns true. This sheet is driven by `openMobile` state inside `SidebarProvider` and opened by `<SidebarTrigger>`. Phase 9 replaces the trigger but leaves `SidebarProvider` mounted — the sheet code path is never activated (no trigger calls `setOpenMobile`), so it renders as a closed sheet.
**Why it happens:** `SidebarProvider` always mounts the Sheet DOM regardless of whether anything triggers it.
**How to avoid:** verify the closed Sheet has `z-index < 50` and is hidden when closed (`data-state="closed"` + `hidden` attribute in Radix primitives). Inspect after mount; if it causes z-index conflicts, wrap `<WorkspaceSidebar>` in a conditional that only renders on desktop via `useIsMobile()`. Safer: keep `SidebarProvider` on desktop branch only.
**Warning signs:** invisible click-catching overlay on mobile, tab order landing inside closed sheet.

### Pitfall 2: `group-data-[collapsible=icon]` branching inside `ModuleSidebarNavigation` when used outside `<Sidebar>`
**Already documented in §5.** If the drawer body doesn't explicitly constrain the branch, both expanded and collapsed branches render. **Mitigation:** add `forceExpanded` prop or wrap in sentinel.

### Pitfall 3: SSR hydration of `useState(false)` for drawer
**Risk:** low. Server renders with `drawerOpen=false`; `AnimatePresence` with absent children emits nothing; client hydration matches. CONFIRMED SAFE.

### Pitfall 4: Removing `mobile-navigation.tsx`
**Grep results:** only `09-CONTEXT.md`, `08-RESEARCH.md`, `packages/ui/src/kit/page.tsx`, `packages/ui/src/kit/mobile-navigation-menu.tsx`, `packages/ui/src/kit/mobile-navigation-dropdown.tsx`, and the file itself match the name.
- The `packages/ui/src/kit/` files are **different components** (`mobile-navigation-menu`, `mobile-navigation-dropdown`) — NOT related. Do not delete them.
- The `packages/ui/src/kit/page.tsx` reference needs verification — grep its actual import statement before deleting `app/components/sidebar/mobile-navigation.tsx`. (Preliminary check: likely a `MobileNavigation` identifier in a different context.)
- **Action for planner:** before deleting `mobile-navigation.tsx`, run `rg "from.*sidebar/mobile-navigation" app/` to confirm zero imports remain. Preliminary check shows none.

### Pitfall 5: Current mobile header `<SidebarTrigger>` invokes shadcn `Sheet` — fully replace
**What goes wrong:** leaving both the old `<SidebarTrigger>` and the new hamburger wired up creates two competing mobile nav surfaces.
**How to avoid:** fully delete lines 56–58 of `layout.tsx` (the `<div … md:hidden>` containing `<SidebarTrigger>`) and replace with `<WorkspaceMobileHeader>`. Do NOT keep the old code path as a fallback.

### Pitfall 6: Avatar package export name mismatch
**CONTEXT.md D-24 says `@aloha/ui/shadcn-avatar`** — this export does not exist. The actual export in `packages/ui/package.json` is `@aloha/ui/avatar` (single-segment, no `shadcn-` prefix), and the existing `sidebar-profile-menu.tsx:9` imports from `@aloha/ui/avatar`. Planner should import from `@aloha/ui/avatar`, not `shadcn-avatar`.

### Pitfall 7: Z-index stacking
**Values in play:**
- Drawer backdrop: `z-40`
- Drawer panel: `z-50`
- shadcn `Sheet` (unused but still mounted): uses `z-50` via Radix default
- `SidebarEdgeToggle` in `workspace-sidebar.tsx:30`: `z-30`
- Other overlays: Sonner toasts default `z-[100]`

No direct conflict, but verify during manual smoke on mobile (open drawer → toast should still appear above drawer; backdrop should cover sidebar if both somehow visible).

### Pitfall 8: `<a href>` navigation inside `ModuleSidebarNavigation`
Currently uses full-page `<a>` elements instead of React Router `<Link>`. This causes full page reloads on sub-item navigation. Drawer closes via remount either way, but the `useLocation` effect won't fire (new page, new mount). This is existing behavior — **do not refactor this phase**. Flag for backlog.

## 10. Plan Grouping Suggestion

**5 plans, sequential execution (no worktrees per STATE.md feedback):**

### Plan 09-01: Sidebar primitive width bump + workspace-sidebar/module-sidebar-navigation restyle
**Scope:**
- Edit `packages/ui/src/shadcn/sidebar.tsx` lines 34, 36 — bump width constants.
- Edit `app/components/sidebar/workspace-sidebar.tsx` — swap `ChevronsLeft` for `PanelLeft`, ensure `bg-card border-r border-border` on the Sidebar root if needed.
- Edit `app/components/sidebar/module-sidebar-navigation.tsx`:
  - Add optional `onNavigate?: () => void` + `forceExpanded?: boolean` props.
  - Retune active module button to gradient pill (line ~97, ~152 `SidebarMenuButton`).
  - Retune sub-item active state to `bg-green-50 text-green-700 font-medium rounded-lg`.
  - Wrap accordion `<CollapsibleContent>` body in `border-l-2 border-green-200 ml-5 pl-3`.
  - Wire `onNavigate` callback to leaf `<a>` onClick.
- Covers: SIDEBAR-01, SIDEBAR-02, SIDEBAR-03, SIDEBAR-04 (partial — still needs layout integration).
**Verification:** typecheck + lint + desktop smoke — sidebar 220px, active module pill, sub-item chip + rail, `PanelLeft` collapse to 68px, reload persistence.

### Plan 09-02: NavbarSearch `renderTrigger` slot + WorkspaceNavbar component
**Scope:**
- Edit `app/components/navbar-search.tsx`:
  - Add optional `renderTrigger?: (props: { open: () => void; isMac: boolean }) => React.ReactNode` prop.
  - Default behavior = existing button (no breakage).
- Create `app/components/workspace-shell/workspace-navbar.tsx` — 72px header with gradient logo square, wordmark, centered `<NavbarSearch renderTrigger={…}>`, avatar on right.
- (Optional) Extract `app/components/workspace-shell/aloha-logo-square.tsx` — `size="sm"|"md"` variants.
- Covers: NAVBAR-01, NAVBAR-02, NAVBAR-03.
**Verification:** typecheck + lint; search button renders at navbar center; Cmd+K still opens; existing `data-test="navbar-search-trigger"` replaced by new test id.

### Plan 09-03: Framer Motion install + WorkspaceMobileHeader + WorkspaceMobileDrawer
**Scope:**
- Run `pnpm add framer-motion@^12.0.0 -w`.
- Create `app/components/workspace-shell/workspace-mobile-header.tsx` — `h-14 bg-card border-b border-border md:hidden` with hamburger (aria-label, aria-expanded), logo square, wordmark, avatar.
- Create `app/components/workspace-shell/workspace-mobile-drawer.tsx`:
  - Framer Motion `AnimatePresence` + backdrop + panel.
  - Spring `{ damping: 25, stiffness: 300 }`.
  - `role="dialog"`, `aria-modal`, `aria-label`.
  - Escape key useEffect.
  - Focus on first nav item on open (via `requestAnimationFrame`).
  - Return focus to hamburger ref on close.
  - Body = `<ModuleSidebarNavigation forceExpanded onNavigate={onClose} …/>`.
- Covers: NAVBAR-04, DRAWER-01, DRAWER-02, DRAWER-03, DRAWER-04 (partial — still needs integration), DRAWER-05.
**Verification:** typecheck + lint; component renders in isolation if possible.

### Plan 09-04: layout.tsx integration + mobile-navigation.tsx deletion
**Scope:**
- Edit `app/routes/workspace/layout.tsx`:
  - Import new shell components + `useState`, `useEffect`, `useLocation`.
  - Restructure JSX: flex column wrapper inside `SidebarProvider`; navbar/mobile-header above; sidebar+main flex row; drawer mounted.
  - `drawerOpen` `useState`; `useEffect` on `location.pathname` to close drawer.
  - Delete lines 55–58 (old mobile header with `SidebarTrigger`).
  - (Optional) Drop unused `style` field from loader return.
- Delete `app/components/sidebar/mobile-navigation.tsx`.
- Verify grep: no remaining imports.
- Covers: SIDEBAR-05, DRAWER-04 (finalized), all others integrated end-to-end.
**Verification:** typecheck + lint; `pnpm dev` desktop smoke + mobile viewport smoke.

### Plan 09-05: Phase verification smoke + a11y audit
**Scope:**
- Execute D-34 manual checklist items 1–5 (desktop light, desktop dark, mobile 375px, org switch, CRUD Outlet).
- A11y: keyboard-only drawer open/close via hamburger + Escape; focus order; screen-reader label on hamburger + drawer.
- Z-index check: open drawer, verify no layering glitches with closed shadcn Sheet remnant.
- Dark-mode check: log green-50 chip harshness to Phase 10 STATE.md follow-up if present (do NOT fix here).
- Update `.planning/STATE.md` with phase completion.
**Verification:** entire manual smoke checklist green; no regressions in existing E2E (if run).

## Code Examples

### Desktop navbar (lift from prototype `Header.tsx` lines 9–31)
```tsx
// Source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/layout/Header.tsx
<header className="h-[72px] bg-card border-b border-border flex items-center px-6 gap-4 shrink-0">
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
      <span className="text-white font-bold text-sm">A</span>
    </div>
    <span className="font-semibold text-foreground text-lg">Aloha</span>
  </div>

  <NavbarSearch renderTrigger={({ open }) => (
    <button
      type="button"
      onClick={open}
      className="flex-1 max-w-md mx-auto flex items-center gap-2 px-4 py-2.5 bg-muted rounded-2xl text-muted-foreground hover:bg-muted/80 transition-colors"
    >
      <Search size={16} />
      <span className="text-sm">Search...</span>
      <div className="ml-auto flex items-center gap-1 text-xs">
        <Command size={12} /><span>K</span>
      </div>
    </button>
  )} />

  <Avatar size="md">
    <AvatarFallback>{user.email?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
  </Avatar>
</header>
```

### Framer Motion drawer (lift from prototype `MobileDrawer.tsx` lines 102–129)
```tsx
// Source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/layout/MobileDrawer.tsx
import { motion, AnimatePresence } from 'framer-motion';

export function WorkspaceMobileDrawer({ open, onClose, navigation, account }: Props) {
  // ... escape + focus effects ...
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-[260px] bg-card z-50 flex flex-col shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex-1 overflow-y-auto py-2 px-3 mt-1">
              <ModuleSidebarNavigation
                account={account}
                modules={navigation.modules}
                subModules={navigation.subModules}
                onNavigate={onClose}
                forceExpanded
              />
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
```

### NavbarSearch renderTrigger seam
```tsx
// app/components/navbar-search.tsx
interface NavbarSearchProps {
  renderTrigger?: (props: { open: () => void; isMac: boolean }) => React.ReactNode;
}

export function NavbarSearch({ renderTrigger }: NavbarSearchProps = {}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ open: () => setOpen(true), isMac })
      ) : (
        <button
          data-test="navbar-search-trigger"
          onClick={() => setOpen(true)}
          className="border-border bg-muted/50 text-muted-foreground hover:bg-muted flex h-7 w-56 items-center gap-2 rounded-md border px-2 text-xs transition-colors"
          aria-label="Open search"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
        </button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen}>
        {/* unchanged */}
      </CommandDialog>
    </>
  );
}
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node 20+ | Build | ✓ | per engines | — |
| pnpm 10.18.1 | Install | ✓ | per packageManager | — |
| `framer-motion` | Drawer animation | ✗ (not installed) | target `^12.0.0` | none — install is mandatory for Plan 09-03 |
| React Router 7.12.0 | SSR shell | ✓ | pinned | — |
| `@aloha/ui/avatar` (Phase 8) | Navbar avatar | ✓ | workspace | — |
| `@aloha/ui/shadcn-sidebar` | Desktop sidebar | ✓ | workspace | — |
| lucide-react | Icons (`Search`, `Command`, `PanelLeft`, `Menu`, `ChevronDown`) | ✓ | `^0.562.0` | — |

**Missing with no fallback:** framer-motion — install in Plan 09-03.
**Missing with fallback:** none.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React Router 7 Framework Mode is SSR-safe with framer-motion 12 (`motion.div` + `AnimatePresence`) without any `"use client"` directives | §4 | If wrong: hydration mismatch or build error; mitigation is to wrap motion components in a client-only sentinel or use `LazyMotion`. [ASSUMED — based on framer-motion SSR docs + prototype uses same APIs, but not verified under this exact React Router 7 + React 19 combo] |
| A2 | Calling `onClick` before `<a href>` navigation fires synchronously, so `onNavigate` closes the drawer before the link navigates | §5, §10 Plan 09-01 | If wrong (event ordering quirks): drawer closes after navigation → no visual glitch, just a one-frame delay. Low risk. [ASSUMED — DOM standard click ordering] |
| A3 | `group-data-[collapsible=icon]` branches in `ModuleSidebarNavigation` need a `forceExpanded` prop when used outside a `<Sidebar>` | §5, §9 Pitfall 2 | If wrong (both branches actually hide correctly via some CSS default): `forceExpanded` prop is a harmless no-op. [ASSUMED — based on reading the Tailwind group-data selectors; worth verifying in a playground during Plan 09-03] |
| A4 | framer-motion 12.x API is identical to 11.x for `motion`, `AnimatePresence`, spring transitions | §4 | If wrong: minor API tweaks, version pin to 11.x. [VERIFIED: npm view framer-motion version returned 12.38.0; no known breaking changes in the used API between 11 and 12] |
| A5 | No existing E2E tests assert against `data-test="navbar-search-trigger"` beyond the component file itself | §2 | If wrong: Plan 09-02 must preserve the data-test or update tests. [ASSUMED — preliminary grep shows no match in e2e/ but should be reverified as Wave 0 task] |
| A6 | The closed shadcn `Sheet` inside `SidebarProvider` on mobile does not create click-blocking overlays | §9 Pitfall 1 | If wrong: mobile UX broken until `SidebarProvider` is moved to desktop-only branch. [ASSUMED — standard Radix Sheet closed state is `hidden`, but worth smoke-checking] |

**User confirmation recommended for:** A1 (SSR + framer-motion combo) — worth a 2-minute isolated test in Wave 0 of Plan 09-03 before committing the drawer implementation. A3, A5, A6 are cheap to verify during implementation.

## Open Questions

1. **Should Plan 09-03 verify framer-motion SSR compat before building the full drawer?**
   - What we know: framer-motion 11+ is SSR-safe per docs; prototype uses same APIs in SPA mode.
   - What's unclear: exact behavior under React Router 7 streaming SSR + React 19 concurrent rendering.
   - Recommendation: Wave 0 of Plan 09-03 = install + add a trivial `<motion.div animate={{ opacity: 1 }}>` on the sign-in page as a smoke test, run `pnpm dev`, confirm no SSR warnings in console, then remove the smoke test and proceed.

2. **Does `ModuleSidebarNavigation` need `forceExpanded` or can we rely on `group-data` selector quirks?**
   - What we know: the expanded branch is `<div className="group-data-[collapsible=icon]:hidden">` — hidden only when a parent has `data-collapsible="icon"`.
   - What's unclear: whether the collapsed branch `<div className="hidden group-data-[collapsible=icon]:block">` — which starts `hidden` and only unhides when the parent matches — is correctly hidden by default when no parent matches.
   - Recommendation: `forceExpanded` prop is safer; adds 2 lines; no downside.

3. **Focus trap: ship now or defer to Phase 10?**
   - What we know: CONTEXT.md D-27 specifies focus-on-open + focus-return-on-close but not a tab-key cycle trap.
   - What's unclear: whether the Phase 9 a11y bar includes a full trap.
   - Recommendation: defer full trap to Phase 10 a11y sweep; ship with escape + backdrop + open/close focus management this phase.

## Sources

### Primary (HIGH confidence)
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/layout/Header.tsx` — navbar recipe (lines 9–31)
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/layout/Sidebar.tsx` — sidebar recipe (lines 46–96, 112–114)
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/layout/MobileDrawer.tsx` — drawer recipe (lines 102–129)
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/app/routes/workspace/layout.tsx` — current mount point
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/app/components/sidebar/workspace-sidebar.tsx` — current sidebar wrapper
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/app/components/sidebar/module-sidebar-navigation.tsx` — current nav component (229 lines)
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/app/components/navbar-search.tsx` — current search component (60 lines)
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/packages/ui/src/shadcn/sidebar.tsx` (lines 1–80) — width constants + provider
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/packages/ui/src/shadcn/avatar.tsx` — Phase 8 avatar primitive (gradient fallback line 58)
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/packages/ui/package.json` — confirmed export name `@aloha/ui/avatar`
- `.planning/phases/09-app-shell-navbar-sidebar-drawer/09-CONTEXT.md` — locked decisions D-01..D-35
- `.planning/REQUIREMENTS.md` — NAVBAR/SIDEBAR/DRAWER acceptance criteria
- `npm view framer-motion version` → `12.38.0` [VERIFIED]

### Secondary (MEDIUM confidence)
- React Router 7 Framework Mode SSR conventions — from existing `entry.server.tsx` + `app/root.tsx` patterns
- Framer Motion SSR compatibility — based on framer-motion 11+ docs (no special wrapping needed for `motion.*` under server-render-then-hydrate)

### Tertiary (LOW confidence)
- Exact stacking behavior of closed shadcn `Sheet` under `SidebarProvider` on mobile — needs smoke verification (Pitfall 1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in tree or single install
- Architecture: HIGH — shell restructure is mechanical; prototype lifts verbatim
- Pitfalls: MEDIUM-HIGH — Pitfall 1 (closed Sheet) and Pitfall 2 (group-data branching) need light verification during implementation
- Framer Motion SSR compat: MEDIUM — documented safe, but not proven in this exact React Router 7 + React 19 combo (recommend Wave 0 smoke in Plan 09-03)

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (30 days — framer-motion minor release could happen but won't break the API subset used)

---

## RESEARCH COMPLETE

**Phase:** 9 - App Shell — Navbar, Sidebar, Drawer
**Confidence:** HIGH

### Key Findings
- Shell restructure is mechanical: the prototype `Header.tsx`, `Sidebar.tsx`, `MobileDrawer.tsx` can be lifted nearly verbatim into `app/components/workspace-shell/` — token swaps (`bg-white` → `bg-card`, `border-slate-200` → `border-border`, `text-slate-600` → `text-muted-foreground`) are the only substantive edits.
- The `NavbarSearch` `renderTrigger` seam is a clean 10-line change — default behavior preserved, optional render prop lets the new navbar supply visuals while Cmd+K + dialog logic stays put.
- The `SIDEBAR_WIDTH` / `SIDEBAR_WIDTH_ICON` bump in `packages/ui/src/shadcn/sidebar.tsx` is a 2-line constant change; downstream CSS vars and cookie persistence flow unchanged.
- `<ModuleSidebarNavigation>` needs a new `forceExpanded` prop to render correctly outside a `<Sidebar>` parent (the `group-data-[collapsible=icon]` branches otherwise double-render inside the drawer). Also needs an `onNavigate` callback for drawer leaf-tap close.
- Framer Motion 12.38.0 is SSR-safe under React Router 7 Framework Mode (no `"use client"` needed); install to root `package.json` with `pnpm add framer-motion@^12.0.0 -w`.
- `app/components/sidebar/mobile-navigation.tsx` has zero current importers — safe to delete.
- CONTEXT.md D-24 refers to `@aloha/ui/shadcn-avatar`; actual export path is `@aloha/ui/avatar` — planner must use the correct path.

### File Created
`.planning/phases/09-app-shell-navbar-sidebar-drawer/09-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | framer-motion version verified; all other libs already in tree |
| Architecture | HIGH | Prototype lift + mechanical token swaps; no new patterns invented |
| Pitfalls | MEDIUM-HIGH | 2 pitfalls need light smoke verification (closed Sheet, group-data branching) |
| SSR compat | MEDIUM | Framer Motion SSR documented safe; recommend 2-minute smoke in Plan 09-03 Wave 0 |

### Open Questions
1. Framer Motion SSR smoke verification before full drawer build (Plan 09-03 Wave 0).
2. `forceExpanded` prop implementation vs relying on group-data defaults (recommend the prop).
3. Full focus-trap scope — defer to Phase 10 a11y sweep (recommended).

### Ready for Planning
Research complete. Planner can create 5 PLAN.md files as outlined in §10.
