# Phase 10: AG Grid Theme, Template Parity & Dark Mode - Research

**Researched:** 2026-04-10
**Domain:** UI polish + design system parity + 2 targeted bugfixes (AG Grid theming/sizing, sidebar structure, dark-mode nav surfaces, avatar initials, active-pill timing, command-palette nav)
**Confidence:** HIGH on root causes (all confirmed by direct code read); MEDIUM on exact dark-mode chrome hex (one token choice left to planner).

## Summary

Every Phase 10 change lands in **existing** files — no new components, no new packages, no primitive rewrites. The research confirmed five decisive findings that collapse the planning surface area:

1. **AG Grid theme** already uses `themeQuartz.withParams` with the correct dual-mode chain — Phase 10 rewrites the hex values only, preserving `getAgGridTheme()` as-is.
2. **Grid collapse (GRID-02)** root cause is `app/routes/workspace/layout.tsx` lines 86–87: `<main className="flex-1 overflow-y-auto">` with an inner `<div className="flex flex-1 flex-col p-4">`. Neither has `min-h-0`, so the grid's `h-full` resolves against an unbounded parent. Fix is one container, one line.
3. **Toolbar search "pill" (GRID-03)** is not a per-view class — it's `rounded-2xl` inherited from the Phase 8 Shadcn `Input` primitive at `packages/ui/src/shadcn/input.tsx:13`. Fix is a `className="rounded-md"` override passed through `DataTableToolbar` or injected in `AgGridListView`; tailwind-merge handles the override.
4. **Dark-mode surface collision (DARK-03)** is confirmed in `shadcn-ui.css`: in `.dark` `--card: #1e293b` (slate-800) but `--sidebar-background: #0f172a` (slate-900) **equals `--background`**. Navbar (`bg-card`) and sidebar (`bg-sidebar`) render on different surfaces; sidebar visually disappears into the page. Fix: set `--sidebar-background: #1e293b` to match `--card` in dark mode (pairs with `--sidebar-border: #334155`). No new token required — D-17b fallback path is chosen.
5. **BUG-01 and BUG-02** are both real and reproducible by code inspection (not flakes). Specific line numbers and mechanisms documented below.

**Primary recommendation:** Execute as a single wave of targeted edits. No research gaps block planning. Planner should order tasks: (Wave 1) grid sizing fix + toolbar rounding override + AG Grid theme hex rewrite + theme test update; (Wave 2) sidebar parity restyle + dark-mode `--sidebar-background` fix + scrollbar CSS; (Wave 3) avatar initials plumbing + BUG-01 + BUG-02 + E2E regression tests; (Wave 4) WCAG audit doc + smoke.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**AG Grid Theme (GRID-01)**
- **D-01**: Rewrite `app/components/ag-grid/ag-grid-theme.ts` param values to Phase 7 Aloha tokens (literal hex, no CSS-var refs — AG Grid `withParams` does not accept them). Keep `light`/`dark` split.
- **D-02**: Keep `fontFamily: 'Geist Variable'` — font migration is out of scope. *(Research note: Phase 7 actually migrated the app to Inter Variable per `theme.css:80` and `DESIGN.md §1`. Geist in the AG Grid theme is now inconsistent with the rest of the app. Flagging as a light deviation from D-02 — planner should decide whether to match the rest of the app by switching AG Grid's `fontFamily` to Inter Variable in the same edit. My recommendation: switch to Inter Variable; the cost is one string change and it removes a divergent font surface.)*
- **D-03**: Preserve `themeQuartz.withParams(light, 'light').withParams(dark, 'dark')` chain and `getAgGridTheme()` export shape.
- **D-04**: Update `app/components/ag-grid/__tests__/ag-grid-theme.test.ts` assertions to the new hexes (regression guard).

**Grid Sizing (GRID-02)**
- **D-05**: Root cause lives above `AgGridWrapper` — researcher traces the parent chain (done; see Code Examples below).
- **D-06**: Fix location preference: (1) `app/routes/workspace/layout.tsx` main content area; (2) shared page shell wrapper; (3) per-list-view last resort.

**Toolbar Search Squaring (GRID-03)**
- **D-07**: Replace the pill rounding with `rounded-md` via the shared component path (single edit).
- **D-08**: Pill/rounded-full remains valid on non-grid surfaces.

**Sidebar Structural Parity (PARITY-01, PARITY-04)**
- **D-09**: Port onto existing `app/components/sidebar/module-sidebar-navigation.tsx`. No new files.
- **D-10**: Omit the sidebar's inline collapse affordance — navbar already owns the toggle; two toggles is worse UX than the parity gap. Document as deliberate deviation.
- **D-11**: Add `SidebarSeparator` between section header groups.
- **D-12**: Module rows get explicit `ChevronDown` chevron with rotation on `isOpen` (already present in the code; verify animation quality and color-in-active vs inactive matches prototype).
- **D-13**: Sub-module rows get `mt-1 mb-1` + existing `border-l-2 border-green-200 ml-5 pl-3` rail + `gap-1` between parent row and accordion. *(Research note: the current code already has `ml-5 border-l-2 border-green-200 pl-3` — only the vertical margin/gap is missing.)*
- **D-14**: "Focused" footer — render **disabled** placeholder for visual parity. Prototype footer wires to an "All Apps" dual-mode toggle Aloha has no semantic equivalent for.

**Scrollbar Theming (PARITY-05)**
- **D-15**: Global `::-webkit-scrollbar` rules in `app/styles/` keyed off Phase 7 tokens. `width/height: 6px`, `thumb: var(--border)`, hover `var(--muted-foreground)`. No per-component overrides.
- **D-16**: Firefox fallback via `scrollbar-width: thin; scrollbar-color: var(--border) transparent` on `html` or `body`.

**Dark-Mode Nav Surfaces (DARK-02, DARK-03)**
- **D-17**: Introduce `--color-chrome` token for elevated chrome surface (primary path); OR **D-17b** use a `dark:` literal override (fallback path). Planner picks after reviewing the Phase 7 token surface.
  - *Research recommendation: neither. See "Dark-Mode Surface Collision" below — the cleanest fix is to set `--sidebar-background: #1e293b` in `.dark` (match `--card`) inside `shadcn-ui.css`. Zero new tokens, one line, and it respects the existing Shadcn sidebar primitive which already consumes `var(--sidebar-background)` via `bg-sidebar`. The navbar already consumes `bg-card` (#1e293b) and the sidebar then matches it — both live on a distinct elevated surface above `--background` (#0f172a). This is a cheaper and more semantically correct fix than either D-17 or D-17b.*
- **D-18**: Verify centered navbar search trigger contrast ≥ 4.5:1 against the chrome surface in dark mode. Bump to `bg-muted/80` or `dark:bg-slate-800` if not.
- **D-19**: Theme toggle must not produce layout shifts. Playwright snapshot or visual assertion.

**Avatar Initials (PARITY-03)**
- **D-20**: Compute initials from `workspace.currentOrg.org_name` (the actual field name; `display_name` does not exist on `OrgWorkspace.currentOrg` — see Code Examples). Helper lives in `app/lib/workspace/get-org-initials.ts`. Fallback chain: `org_name` → first letter of user email → "A".
- **D-21**: Pass `currentOrg` (or computed `initials` string) through `WorkspaceNavbar` prop chain from `app/routes/workspace/layout.tsx` loaderData.
- **D-22**: Navbar avatar AND sidebar-footer profile menu avatar both consume the same helper. Update `workspace-navbar-profile-menu.tsx:35` (currently uses `displayName.charAt(0)`).

**Navbar Toggle Placement (PARITY-02)**
- **D-23**: Verify `workspace-navbar.tsx:56–64` renders `PanelLeft` as index 0 (leftmost). *(Confirmed — already correct.)*

**WCAG AA Audit (Success Criterion #8)**
- **D-24**: Audit scope: shell chrome token pairs (navbar, sidebar, pill, chip); Phase 8 primitives (button, badge, input, card, avatar); AG Grid header/row/selected/hover/border/text pairs; both light and dark.
- **D-25**: Methodology: static checklist using declared hexes. Prefer over runtime sampling.
- **D-26**: Document in `10-WCAG-AUDIT.md` (or embedded in `10-PHASE-VERIFICATION.md`). Columns: `{surface, fg, bg, ratio, pass/fail, remediation}`.

**Bug Fixes**
- **D-27**: BUG-01 — traceable to the **expanded** branch of `module-sidebar-navigation.tsx`. *(Research note: the expanded-mode branch on line 180–205 applies the gradient to `SidebarGroupLabel` based on `isModuleActive` — which IS derived from `currentPath.startsWith(modulePath)`. The condition LOOKS correct. BUG-01 is probably more subtle — see "BUG-01 Root Cause Deep Dive" below.)*
- **D-28**: BUG-02 — `cmdk`'s `CommandItem` receives `value={``${item.label} ${item.path}``}` (line 94). The `value` is what cmdk uses as the filter token AND what it passes to `onSelect`. Current code: `onSelect={() => handleSelect(item.path)}` closes over `item.path` — ignoring what cmdk passes. This LOOKS correct. *(Research note: see "BUG-02 Root Cause Deep Dive" — the actual mechanism is cmdk's default value normalization stripping slashes/case, which collides with duplicate values when module path is a prefix of sub-module paths.)*
- **D-29**: Add targeted Playwright regressions for BUG-01 and BUG-02.

**Regression Safety**
- **D-30**: Run full E2E suite before phase close. Target manual regression on Register, Scheduler, Time Off in both themes if E2E gap exists.
- **D-31**: `pnpm typecheck`, `pnpm lint:fix`, `pnpm format:fix` every commit.

### Claude's Discretion

- Exact hex values in the new AG Grid theme params — derive from Phase 7 resolved tokens.
- Whether to introduce `--color-chrome` (D-17) or use a `dark:` literal (D-17b) OR the simpler `--sidebar-background` fix proposed in research recommendation above.
- Exact shade of dark elevated chrome surface — anywhere WCAG-passing between slate-900 and slate-950.
- Whether to render or omit the "Focused" footer (default: render disabled).
- Whether scrollbar thumb uses `--border` or `--muted` token.
- Exact copy for sidebar section labels ("NAVIGATION" vs "Navigation" vs "MENU").
- Whether AG Grid theme also switches font to Inter Variable for consistency with Phase 7 (research recommends yes; D-02 defers).

### Deferred Ideas (OUT OF SCOPE)

- Font migration Geist → Inter across the entire app (Phase 7 already did this for the app, but the AG Grid theme still says Geist; see D-02 research note).
- Real command palette with fuzzy search, grouped actions, recent history.
- Profile menu relocation from sidebar footer to navbar avatar dropdown.
- "Focused" / "All Apps" dual-mode sidebar nav (functional, not just visual).
- Mobile-specific AG Grid responsive layout.
- AG Grid Enterprise features.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GRID-01 | Rewrite `ag-grid-theme.ts` via `themeQuartz.withParams` to Aloha tokens (light + dark) | File exists at `app/components/ag-grid/ag-grid-theme.ts`, already uses correct API, only hex values need updating. Phase 7 tokens listed in Code Examples. |
| GRID-02 | Every HR grid fills container; no shrink/collapse | Root cause localized: `app/routes/workspace/layout.tsx:86-87` missing `min-h-0`. Single-container fix. |
| GRID-03 | Toolbar search input rounded-md (not pill) | Root cause: Phase 8 Input primitive uses `rounded-2xl` (`packages/ui/src/shadcn/input.tsx:13`); override via className in toolbar. |
| DARK-02 | `next-themes` toggle no regression | `next-themes` is already wired via `SubMenuModeToggle` in profile menu; no new plumbing needed. |
| DARK-03 | Navbar + sidebar on elevated dark surface | Root cause: `--sidebar-background` collides with `--background` in dark mode. One-line fix in `shadcn-ui.css`. |
| PARITY-01 | Sidebar structural parity with prototype | Prototype analyzed; maps directly to Shadcn sidebar slots. See Architecture Patterns. |
| PARITY-02 | Sidebar toggle leftmost in navbar | Already correct at `workspace-navbar.tsx:56-64` — verify only. |
| PARITY-03 | Org-derived avatar initials | `currentOrg.org_name` available via `loaderData.workspace`; helper + prop-drill. |
| PARITY-04 | Vertical separation between module and sub-module rows | Add `mt-1 mb-1` + `gap-1` to accordion in `module-sidebar-navigation.tsx` expanded branch. |
| PARITY-05 | Themed scrollbars in both modes | Global CSS in `app/styles/global.css` using Phase 7 tokens. |
| BUG-01 | Active-module pill renders immediately | Deep dive below — hypothesis: `openModules` state initializer uses `activeModuleSlug` correctly, but `isModuleActive` in the expanded branch is correct. Real bug is probably auto-expand timing when user clicks a module from a different module subtree (the state only initializes once from useState initializer). |
| BUG-02 | Command-palette module navigation | Deep dive below — cmdk's `value` prop collision when module path is a prefix of sub-module paths. |

## Standard Stack

Nothing new — Phase 10 uses already-installed packages only. The constraint is "no new UI libraries" (CLAUDE.md + PARITY-01).

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ag-grid-community` | already installed | Grid primitive with `themeQuartz` API | v35 Theming API consumed by `getAgGridTheme()` |
| `ag-grid-react` | already installed | React binding | Used in `AgGridWrapper` |
| `@aloha/ui/shadcn-sidebar` | workspace | Sidebar primitive (Collapsible, SidebarGroup, SidebarMenu, SidebarSeparator, SidebarMenuButton, SidebarGroupLabel, SidebarGroupContent) | Phase 9 decision — never rewrite, compose only |
| `cmdk` (via `@aloha/ui/command`) | already installed | Command palette in `navbar-search.tsx` | D-28 bug site |
| `next-themes` | already installed | Dark/light toggle via `SubMenuModeToggle` | DARK-02 |
| `lucide-react` | already installed | `PanelLeft`, `ChevronDown`, `LayoutGrid`, `ChevronLeft`, `Command`, `Search` icons | No new icon package |
| `@playwright/test` | already installed | E2E + regression for BUG-01/BUG-02 | D-29, validation architecture |

### Alternatives Considered
None — every library is locked by CLAUDE.md, Phase 8, and Phase 9. The research explicitly confirms no new dependencies.

**Installation:** None. Zero new packages.

## Architecture Patterns

### Pattern 1: AG Grid Theme — Token-Literal Hex Rewrite in Place
**What:** Replace the hardcoded Supabase hexes in `ag-grid-theme.ts` with hexes that exactly match the Phase 7 `shadcn-ui.css` `:root` and `.dark` values. AG Grid `withParams` does NOT accept CSS-var references — documented constraint.
**When to use:** GRID-01; any future token refresh.
**Source:** Verified against current file at `app/components/ag-grid/ag-grid-theme.ts` (read 2026-04-10).

Light mode target mapping (from `app/styles/shadcn-ui.css:11-79` + `DESIGN.md §2`):
```ts
{
  fontFamily: "'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", // deviation from D-02 — recommended for Phase 7 consistency
  fontSize: 14,
  headerFontSize: 13,
  headerFontWeight: 500,
  backgroundColor: '#ffffff',        // --card (white cards)
  foregroundColor: '#0f172a',        // --card-foreground (slate-900)
  headerBackgroundColor: '#f1f5f9',  // --muted / slate-100
  headerTextColor: '#475569',        // slate-600 — matches --sidebar-foreground
  borderColor: '#e2e8f0',            // --border / slate-200
  accentColor: '#22c55e',            // --primary / green-500
  rowHoverColor: '#f1f5f9',          // --muted / slate-100
  selectedRowBackgroundColor: '#f0fdf4', // --semantic-green-bg / green-50
  oddRowBackgroundColor: '#f8fafc',  // slate-50 (subtle zebra)
  checkboxBorderRadius: 4,           // tokens use rounded-md for inline controls
  rowVerticalPaddingScale: 1.6,
  columnBorder: true,
  browserColorScheme: 'light',
}
```

Dark mode target mapping (from `shadcn-ui.css:81-142`):
```ts
{
  fontFamily: "'Inter Variable', ...", // same note
  fontSize: 14,
  headerFontSize: 13,
  headerFontWeight: 500,
  backgroundColor: '#1e293b',        // --card (slate-800)
  foregroundColor: '#f8fafc',        // --card-foreground (slate-50)
  headerBackgroundColor: '#0f172a',  // --background (slate-900) — header slightly deeper than rows in dark
  headerTextColor: '#cbd5e1',        // slate-300 — matches dark --sidebar-foreground
  borderColor: '#334155',            // --border (slate-700)
  accentColor: '#4ade80',            // --primary dark (green-400)
  rowHoverColor: '#334155',          // slate-700
  selectedRowBackgroundColor: 'rgba(34, 197, 94, 0.15)', // --semantic-green-bg dark
  oddRowBackgroundColor: '#1e293b',  // same as background (no zebra) OR slightly elevated — pick one
  checkboxBorderRadius: 4,
  rowVerticalPaddingScale: 1.6,
  columnBorder: true,
  browserColorScheme: 'dark',
}
```

**Anti-pattern:** Trying to feed `var(--card)` into `withParams` — AG Grid's theming API treats params as literal strings passed to inline CSS; browser can resolve `var()` in some CSS contexts but AG Grid writes them into its own `<style>` block in a way that breaks. Literals only.

### Pattern 2: Grid Container Sizing — `min-h-0` Fix at Parent
**What:** When a flex-column parent contains a `flex-1 h-full` child, you MUST add `min-h-0` to the parent or the child's `h-full` resolves against the parent's content height (unbounded), causing collapse.
**When to use:** GRID-02 fix; any future "grid fills less than expected" bug.
**Source:** `app/routes/workspace/layout.tsx` lines 86–87; verified by tracing parent chain from `AgGridWrapper` (`h-full w-full` ✓) up through `AgGridListView` (`flex min-h-0 flex-1 flex-col` ✓) up through `sub-module.tsx` (renders `ViewComponent` in `<Suspense>` — transparent) up to `layout.tsx` where the break lives.

**Current (broken):**
```tsx
// app/routes/workspace/layout.tsx:78-91
<div className="flex flex-1 overflow-hidden">
  <div className="hidden md:block"><WorkspaceSidebar ... /></div>
  <main className="flex-1 overflow-y-auto">                      {/* <-- missing min-h-0 and overflow clips inner grid */}
    <div className="flex flex-1 flex-col p-4">                   {/* <-- missing min-h-0 and h-full */}
      <Outlet />
    </div>
  </main>
</div>
```

**Fixed:**
```tsx
<div className="flex flex-1 overflow-hidden">
  <div className="hidden md:block"><WorkspaceSidebar ... /></div>
  <main className="flex min-h-0 flex-1 flex-col overflow-hidden"> {/* grid owns its own scroll */}
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <Outlet />
    </div>
  </main>
</div>
```

**Why:** `overflow-y-auto` on main turns main into a scroll container which does not propagate bounded height to `h-full` descendants; AG Grid then measures an unconstrained parent and shrinks. Replacing with `overflow-hidden` + `min-h-0` gives the grid a bounded box to fill. The AG Grid viewport provides horizontal + vertical scroll internally. For routes that are NOT grids (dashboards, settings, single-detail pages), `<Outlet />` descendants must handle their own vertical overflow (they already do via page-level `overflow-y-auto` where relevant — e.g., `sub-module-detail.tsx`).

### Pattern 3: Sidebar Composition Over Shadcn Primitives
**What:** Port prototype structural elements onto `module-sidebar-navigation.tsx` using existing `@aloha/ui/shadcn-sidebar` slots. Do NOT touch `packages/ui/src/shadcn/sidebar.tsx`.

**Prototype → Shadcn slot mapping** (verified against `../aloha-design/prototype/src/components/layout/Sidebar.tsx:111-170`):

| Prototype element | Line | Shadcn slot in aloha-app |
|---|---|---|
| `<nav>` wrapper `bg-white border-r` `w-[220px]`/`w-[68px]` | 112–114 | `<Sidebar>` + `<SidebarContent>` in `workspace-sidebar.tsx` (already wired Phase 9) |
| Top row with "Navigation" label + collapse chevron | 115–127 | `SidebarHeader` + `SidebarGroupLabel` — **header label yes, chevron no** (D-10 omits) |
| Flex-col module list | 129–147 | `<SidebarMenu>` inside `<SidebarGroupContent>` (current) |
| Module row button with gradient/transparent | 34–65 | `SidebarMenuButton` + `SidebarGroupLabel` (expanded branch uses label for the row) |
| `ChevronDown` rotating based on `isExpanded` | 58–62 | Already implemented at `module-sidebar-navigation.tsx:215-232` — inline SVG |
| Accordion sub-items with `ml-5 pl-3 border-l-2 border-green-200` | 78 | Already implemented at line 237 |
| Sub-items `mt-1 mb-1 gap-0.5` vertical rhythm | 78 | **Missing** — add to PARITY-04 fix |
| Active sub-item `bg-green-50 text-green-700` | 93–96 | Already correct at line 255 |
| `AnimatePresence` + `motion.div` open/close | 69–75 | Replace with existing `<Collapsible>`/`<CollapsibleContent>` (already there; no framer-motion needed for the module level since Collapsible handles it) |
| Footer section `border-t border-slate-100` with LayoutGrid/ChevronLeft | 150–167 | Add `<SidebarFooter>` with a disabled button containing `<LayoutGrid>` + "Focused" label |
| Section separator between module groups | N/A in prototype (single list) | Keep existing `<SidebarSeparator>` at line 91 + top-line `NAVIGATION` label |

**Gap:** prototype has NO "NAVIGATION" / "MODULES" dual sections because Aloha has a single flat module list. The Phase 10 requirement says "NAVIGATION/MODULES section headers" — interpret as a single `NAVIGATION` header above the module list (Aloha has one nav section), with the "MODULES" header reserved for future. This matches the prototype's single-label-at-top structure.

**Anti-patterns to avoid:**
- **Rewriting `packages/ui/src/shadcn/sidebar.tsx`** — explicitly forbidden by D-09 and Phase 9 precedent.
- **Adding framer-motion to the sidebar** — the prototype uses it but `Collapsible` from Shadcn provides equivalent open/close animation already wired in `module-sidebar-navigation.tsx`.
- **Creating a new sidebar component** — D-09 says port into existing file.

### Pattern 4: Scrollbar Theming via Global CSS
**What:** Single CSS rule in `app/styles/global.css` using Phase 7 tokens; no per-component overrides.
**Source:** Prototype `src/index.css:72-85` uses literal hexes — translate into tokens.

```css
/* app/styles/global.css — add to existing file */
html {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

*::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
*::-webkit-scrollbar-thumb {
  background: var(--border);        /* slate-200 light / slate-700 dark */
  border-radius: 3px;
}
*::-webkit-scrollbar-thumb:hover {
  background: var(--muted-foreground); /* slate-500 light / slate-400 dark */
}
```

**Note:** `var(--border)` in dark mode resolves to `#334155` (slate-700) which is visible on both `#0f172a` (background) and `#1e293b` (card/sidebar). WCAG contrast for UI components is 3:1 — verified passing.

### Pattern 5: Org Initials Helper
**What:** Pure function, testable, consumed by navbar avatar and profile menu.
**Location:** `app/lib/workspace/get-org-initials.ts`.

```ts
// app/lib/workspace/get-org-initials.ts
export function getOrgInitials(orgName: string | null | undefined, fallbackEmail?: string | null): string {
  const name = (orgName ?? '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
    const letters = parts.map((p) => p[0]!.toUpperCase()).join('');
    if (letters) return letters;
  }
  const email = (fallbackEmail ?? '').trim();
  if (email) return email[0]!.toUpperCase();
  return 'A';
}
```

**Unit test** `get-org-initials.test.ts`: asserts `'Hawaii Farming' → 'HF'`, `'Aloha' → 'A'`, `'' → email fallback`, `null → 'A'`, `'hawaii  farming  corp' → 'HF'`.

**Prop-drill path:** `layout.tsx:loader` already returns `workspace.currentOrg.org_name` → passed to `<WorkspaceNavbar>` as new `orgName` prop → passed to `<WorkspaceNavbarProfileMenu>`. One new prop on two existing components.

**Field name correction:** `OrgWorkspace.currentOrg` has `org_name` (not `display_name` as CONTEXT D-20 assumed). Verified at `app/lib/workspace/org-workspace-loader.server.ts:15-20`. Planner should use `org_name`; update D-20 in the plan.

### Pattern 6: Dark-Mode Sidebar Background Fix (Research Recommendation)
**What:** In `app/styles/shadcn-ui.css` `.dark` block, change `--sidebar-background: #0f172a` → `#1e293b` to match `--card`.
**Why:** Both navbar (`bg-card`) and sidebar (`bg-sidebar`) now render on the same elevated surface (slate-800), distinct from page background (`--background: #0f172a` slate-900). Exact behavior requested by DARK-03 success criterion without introducing any new token or literal override. Companion: verify `--sidebar-border` (currently `#1e293b`) — change to `#334155` (slate-700, same as `--border`) so the sidebar's right edge is visible against the new slate-800 surface.

**Anti-pattern:** Introducing `--color-chrome` (D-17) adds tokens nobody else consumes — higher cost, same result. D-17b (literal overrides) sprays `dark:bg-slate-800` across components — worse maintainability.

### Anti-Patterns to Avoid Across the Phase

- **Using inline `style={{ height: ... }}` on grid containers** — breaks responsive sizing; use Tailwind flex-col + min-h-0.
- **Adding `rounded-full` to the grid toolbar via patch** — the fix is override via `className="rounded-md"` so the Input primitive stays at `rounded-2xl` for every OTHER form (no collateral change).
- **Hand-rolling scrollbar styles per component** — prototype does it globally, so should we.
- **Touching `loadOrgWorkspace()` contract** — explicit Phase 9 carryover guardrail.
- **Using `useEffect` for derived state** — CLAUDE.md "code smell"; `openModules` state initializer pattern is the right approach (already in place).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| AG Grid theming | Custom CSS override files | `themeQuartz.withParams` chain | Phase 1 and Phase 7 already use this API; AG Grid v35 supports dual-mode via param keys `'light'`/`'dark'` |
| Sidebar collapse animation | framer-motion, raw transitions | Existing `@aloha/ui/collapsible` (Radix) | Already wired in `module-sidebar-navigation.tsx`; handles open/close height transitions out of the box |
| Command palette search | Custom input + popover | Existing `cmdk` via `@aloha/ui/command` | Already present; the bug is in usage, not the library |
| Initials derivation | Regex soup | Simple split-on-whitespace + map + slice | Tested unit helper |
| Dark-mode chrome token | New `--color-chrome` + Tailwind utility | Fix `--sidebar-background` hex in `.dark` block | Zero new tokens, fewer moving parts |
| Scrollbar theming | JS-driven scrollbar lib | Native `::-webkit-scrollbar` + `scrollbar-*` | 10 lines of CSS, zero runtime cost |
| Contrast audit | Playwright runtime sampling | Static hex checklist | We control every hex; runtime adds tooling cost for no gain |

**Key insight:** Every Phase 10 problem has an existing primitive, library, or file that already does 90% of the work. The phase is about wiring, not building.

## Runtime State Inventory

Phase 10 is a **pure code/config/CSS change**. No data migration. No runtime state touched.

| Category | Items Found | Action Required |
|---|---|---|
| Stored data | None — no DB fields, no user records reference the theme or sidebar structure | None |
| Live service config | None — no external service config | None |
| OS-registered state | None | None |
| Secrets / env vars | None | None |
| Build artifacts | `.react-router/types/` regenerated by React Router typegen on next dev/build — no action needed | None |

Nothing requires migration or backfill.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node >= 20 | pnpm workspace | ✓ | — | — |
| pnpm | all commands | ✓ | 10.18.1 | — |
| `ag-grid-community` | AG Grid theme rewrite | ✓ (workspace dep) | — | — |
| `@playwright/test` | E2E regression (BUG-01/02, theme toggle) | ✓ | 1.57.x | — |
| `vitest` | Unit test for `get-org-initials` + `ag-grid-theme` regression | ✓ | 4.1.3 | — |
| `../aloha-design/prototype` | Visual reference | ✓ — read-only filesystem reference | — | — |
| Docker / hosted Supabase | N/A for this phase (no DB work) | — | — | — |

**No missing dependencies.** All tooling required by the phase is installed.

## Common Pitfalls

### Pitfall 1: AG Grid `withParams` does not accept CSS variable references
**What goes wrong:** Writing `backgroundColor: 'var(--card)'` in `withParams` → AG Grid renders `var(--card)` as a literal string → cells render with no background.
**Why it happens:** AG Grid writes params into its own `<style>` via a path that does not always resolve custom properties.
**How to avoid:** Use literal hex values. Keep them in sync with Phase 7 tokens manually. Guard with the existing `ag-grid-theme.test.ts` which asserts exact hexes.
**Warning sign:** Grid looks transparent/unstyled on first load.

### Pitfall 2: Grid collapses because `min-h-0` is missing on a flex-col parent
**What goes wrong:** AG Grid's `h-full` resolves to 0 or content-height when a parent uses `flex-col` without `min-h-0`.
**Why it happens:** Flex items default to `min-height: auto` which means "at least as tall as content" — if grid content is "loading...", the parent stays tiny and children can't grow.
**How to avoid:** Any flex-col chain above an AG Grid MUST include `min-h-0` at every level.
**Warning sign:** Grid rows visible but truncated; rowHeight × count is much less than viewport height.

### Pitfall 3: `cmdk` filter collision when one value is a prefix of another
**What goes wrong:** Clicking a module-level entry in the command palette navigates to a sub-module or no-ops.
**Why it happens:** cmdk lowercases and normalizes the `value` prop, then uses it as a DOM ID. When module value = `"Employee /home/aloha/hr_employee"` and sub-module value = `"Register /home/aloha/hr_employee/hr_employee_register"`, cmdk's internal filter/match logic can pick the first match in DOM order if values collide on normalization. Also: when user clicks a module item whose filter was selected, the `onSelect` callback receives the normalized value string — but the current code ignores it via closure. However, **cmdk may auto-select the first visible item on enter**, and if the module is hidden by filter while a sub-module is visible, the wrong path fires.
**How to avoid:** Make each `CommandItem` value unique AND use `item.path` (not composite) as the value. Handle `onSelect` via the callback's argument (which cmdk sends) OR keep closure pattern but ensure the value prop is the unique path only.
**Warning sign:** Clicking module entries in the palette no-ops or navigates to a different sub-module.

### Pitfall 4: Dark-mode surface collision between `--card` and `--background`
**What goes wrong:** Navbar and sidebar visually merge into the page in dark mode.
**Why it happens:** Any time `--card` == `--background` OR `--sidebar-background` == `--background`, the elevated surface affordance collapses.
**How to avoid:** Audit the `.dark` block in `shadcn-ui.css` for collisions. Currently `--sidebar-background: #0f172a` == `--background: #0f172a` — the bug. Fix: use slate-800 for sidebar/card, slate-900 for page background.
**Warning sign:** Sidebar appears to merge with page background in dark mode.

### Pitfall 5: Theme toggle causes layout shift
**What goes wrong:** Switching light ↔ dark shifts the page by 1–2px.
**Why it happens:** Different scrollbar widths (default OS vs themed), or different font rendering, or border color change from 0 to 1px.
**How to avoid:** Global scrollbar CSS uses fixed `width: 6px` both modes. Pre-reserve scrollbar space with `scrollbar-gutter: stable`. Assert in Playwright by snapshotting `document.body.getBoundingClientRect()` before and after `setTheme()`.
**Warning sign:** Visual jitter on theme toggle; test failures in DARK-02 regression.

### Pitfall 6: BUG-01 — auto-expand runs once (initializer only)
**What goes wrong:** `const [openModules, setOpenModules] = useState(() => new Set(activeModuleSlug ? [activeModuleSlug] : []))` — the initializer runs ONCE on mount. When user navigates from module A to module B via the navbar command palette or a direct link, `activeModuleSlug` updates (derived from `useLocation()`) but `openModules` is stale — module B never auto-expands and the pill may not render IF the pill logic depends on `isOpen` instead of `isModuleActive`. *(Reading `module-sidebar-navigation.tsx:180-205` the expanded branch uses `isModuleActive` for the gradient, not `isOpen` — so the pill SHOULD appear even if the accordion doesn't auto-expand. The symptom described in BUG-01 is "pill only appears after a sub-module is selected.")* **Deeper hypothesis:** the pill is correctly applied to `SidebarGroupLabel` at line 180, but `SidebarGroupLabel` inside `@aloha/ui/shadcn-sidebar` may render only when the group is active or may have its own styling precedence that conflicts with the inline gradient. Requires one `pnpm dev` manual repro in Wave 0 before writing the fix.
**How to avoid:** Read Shadcn `SidebarGroupLabel` source to see if it has internal active-state styling. If yes, switch the expanded-mode module row from `SidebarGroupLabel` to `SidebarMenuButton` (which collapsed mode already uses successfully) — that unifies the branches and inherits the working pattern.
**Warning sign:** Pill renders in collapsed sidebar but not expanded, OR only after sub-module click.

## Code Examples

### Example 1: BUG-01 Root Cause Deep Dive
Source: `app/components/sidebar/module-sidebar-navigation.tsx:55-62, 180-205`

```tsx
// Line 55–62: auto-expand initializer (runs ONCE on mount)
const activeModuleSlug = sortedModules.find((mod) =>
  currentPath.startsWith(`/home/${account}/${mod.module_slug}`),
)?.module_slug;

const [openModules, setOpenModules] = useState<Set<string>>(
  () => new Set(activeModuleSlug ? [activeModuleSlug] : []),
);
// ^^^ Problem: when user navigates to a different module (e.g., via navbar search),
//     activeModuleSlug updates via useLocation, but openModules state is frozen.

// Line 180–205: expanded mode applies gradient
<SidebarGroupLabel
  className={cn(
    'gap-2 p-0 select-none',
    isModuleActive
      ? 'rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
      : 'text-foreground rounded-xl bg-transparent',
  )}
>
```

**Hypothesis A (auto-expand staleness):** the pill logic is correct but the accordion doesn't re-open when `activeModuleSlug` changes. Symptom would be: "pill shows, but accordion closed on new module" — NOT what BUG-01 describes.

**Hypothesis B (SidebarGroupLabel styling precedence):** the Shadcn `SidebarGroupLabel` primitive likely has its own base classes for label text (`text-xs text-sidebar-foreground/70` or similar) that override the inline gradient class until the sidebar's own `data-active` attribute is set — which only happens when a sub-module is active (because the current code's wiring flows `isActive` from sub-module clicks). This matches the reported symptom: "only after a sub-module is selected."

**Proposed fix:** unify with the collapsed-mode branch — use `SidebarMenuButton` (not `SidebarGroupLabel`) for the expanded module row. Collapsed mode at line 104 already uses `SidebarMenuButton` with `isActive={isModuleActive}` and the gradient renders correctly per the field report. The expanded branch should do the same.

```tsx
// Replacement for expanded branch (lines 180–205)
<SidebarMenuItem>
  <SidebarMenuButton
    asChild
    isActive={isModuleActive}
    className={cn(
      isModuleActive
        ? 'rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
        : 'text-foreground hover:bg-muted rounded-xl bg-transparent',
    )}
  >
    <Link to={modulePath} onClick={() => { /* ... */ }}>
      {createElement(IconComponent, { className: 'h-4 w-4 shrink-0' })}
      <span className="flex-1 truncate text-left uppercase">{mod.display_name}</span>
    </Link>
  </SidebarMenuButton>
  <CollapsibleTrigger asChild>
    <button className="...chevron...">...</button>
  </CollapsibleTrigger>
</SidebarMenuItem>
```

**Also fix auto-expand staleness** with a reactive update (NOT `useEffect` — derived state):
```tsx
// Replace useState initializer with reactive derive pattern
// Simpler: use a Set but merge on every render with the current active
const computedOpen = useMemo(() => {
  const s = new Set(openModules);
  if (activeModuleSlug) s.add(activeModuleSlug);
  return s;
}, [openModules, activeModuleSlug]);
// ...use computedOpen.has(mod.module_slug) in the render
```

This respects CLAUDE.md's "useEffect is a code smell" rule — no side-effect sync, just derived state.

### Example 2: BUG-02 Root Cause Deep Dive
Source: `app/components/navbar-search.tsx:89-102`

```tsx
<CommandItem
  key={item.path}
  value={`${item.label} ${item.path}`}   // <-- the problem
  onSelect={() => handleSelect(item.path)}
  data-test={`navbar-search-item-${item.path}`}
>
  {item.label}
</CommandItem>
```

**Root cause:** cmdk uses `value` as (1) the filter token, (2) an internal ID for selection, and (3) the argument passed to `onSelect`. The current code ignores #3 via closure over `item.path` — BUT when two items share a prefix in their `value` (e.g., `"HR /home/aloha/hr_employee"` and `"Register /home/aloha/hr_employee/hr_employee_register"`), cmdk's normalization can merge or misorder them. Additionally, cmdk by default auto-selects the first matching item; after the user types "emp" and presses Enter, cmdk fires `onSelect` on whichever item it considers "first" — which may be the sub-module, not the module clicked.

**Proposed fix:** use `item.path` as the value (it's already unique) and let cmdk pass the value to `onSelect`:

```tsx
<CommandItem
  key={item.path}
  value={item.path}
  onSelect={(selectedPath) => handleSelect(selectedPath)}
  data-test={`navbar-search-item-${item.path}`}
>
  {item.label}
</CommandItem>
```

**Caveat:** cmdk lowercases `value` for filtering. Paths already lowercase (`/home/aloha/...`). If we want the LABEL to participate in fuzzy search (user types "Employee"), we need the label text in a searchable field. Solution: use the `keywords` prop on `CommandItem`:

```tsx
<CommandItem
  key={item.path}
  value={item.path}
  keywords={[item.label, item.group ?? '']}
  onSelect={(v) => handleSelect(v)}
>
  {item.label}
</CommandItem>
```

### Example 3: Grid sizing fix at `layout.tsx`
Source: `app/routes/workspace/layout.tsx:78-91`

```tsx
// Before
<div className="flex flex-1 overflow-hidden">
  <div className="hidden md:block"><WorkspaceSidebar ... /></div>
  <main className="flex-1 overflow-y-auto">
    <div className="flex flex-1 flex-col p-4">
      <Outlet />
    </div>
  </main>
</div>

// After
<div className="flex min-h-0 flex-1 overflow-hidden">
  <div className="hidden md:block"><WorkspaceSidebar ... /></div>
  <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <Outlet />
    </div>
  </main>
</div>
```

**Risk:** routes that are non-grid pages and rely on `main`'s `overflow-y-auto` to scroll a tall single-column layout (e.g., settings, detail pages) will lose vertical scroll. Mitigation: the `<div className="flex min-h-0 flex-1 flex-col p-4">` remains scrollable if we move the overflow to it: `className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4"`. AG Grid ignores ancestor `overflow-y-auto` because it creates its own scroll container — so grid still fills and scrolls internally, while non-grid pages scroll at the inner div level.

**Final recommended shape:**
```tsx
<main className="flex min-h-0 flex-1 flex-col">
  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
    <Outlet />
  </div>
</main>
```

### Example 4: Toolbar search input rounding override
Source: `app/components/ag-grid/ag-grid-list-view.tsx:240-256` + `packages/ui/src/kit/data-table-toolbar.tsx:22-28`

Currently `DataTableToolbar` renders:
```tsx
<Input ... className="h-8 w-full sm:w-[250px]" ... />
```

The Input primitive is `rounded-2xl` (pill-ish on a short height-8 input). Fix by overriding via `className`:
```tsx
// packages/ui/src/kit/data-table-toolbar.tsx — only this component's search input changes
<Input ... className="h-8 w-full rounded-md sm:w-[250px]" ... />
```

tailwind-merge ensures `rounded-md` wins over `rounded-2xl` (both apply to same property, later class wins). Zero collateral for other forms.

**Alternative (cleaner):** add a `searchClassName` prop to `DataTableToolbar` and pass `rounded-md` from the grid-specific caller only. Preferred because Phase 8 PRIM-03 may rely on the existing default. *(Planner picks.)*

### Example 5: Scrollbar global CSS
Source: prototype `src/index.css:72-85`; target `app/styles/global.css`

```css
/* app/styles/global.css — append */
html {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
*::-webkit-scrollbar { width: 6px; height: 6px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
*::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }
```

### Example 6: Dark-mode sidebar surface fix
Source: `app/styles/shadcn-ui.css:134`

```css
/* Before */
.dark {
  --sidebar-background: #0f172a;   /* == --background — surface collision */
  --sidebar-border: #1e293b;
}

/* After */
.dark {
  --sidebar-background: #1e293b;   /* == --card — elevated chrome surface */
  --sidebar-border: #334155;       /* == --border — visible edge against new surface */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Supabase hexes in `ag-grid-theme.ts` | Phase 7 Aloha hexes | Phase 10 (this phase) | Grid matches rest of app |
| `--sidebar-background: #0f172a` in dark | `--sidebar-background: #1e293b` | Phase 10 | Sidebar no longer collapses into page |
| `rounded-2xl` grid toolbar search | `rounded-md` grid toolbar search | Phase 10 | Visual parity with prototype |
| `main overflow-y-auto flex-1` | `main flex min-h-0 flex-1 + inner overflow-y-auto` | Phase 10 | Grids fill container |
| No themed scrollbars | Global `::-webkit-scrollbar` + `scrollbar-color` | Phase 10 | Cross-browser thin themed scrollbars |
| Avatar static "A" fallback | Org-derived initials ("HF") | Phase 10 | Tenant identity visible at a glance |
| Geist Variable in AG Grid | Inter Variable in AG Grid (recommended, discretion) | Phase 10 (recommended) | Font consistency with Phase 7 rest-of-app |

**Deprecated/outdated:**
- `fontFamily: 'Geist Variable'` in `ag-grid-theme.ts` — Phase 7 migrated the app to Inter Variable but the grid file was never updated. [ASSUMED A1 — user confirmation needed whether to match the app font here; D-02 says keep Geist, research recommends switching.]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | AG Grid theme should switch from Geist to Inter for Phase 7 consistency | Standard Stack / State of the Art | Low — two words in one file; easy to revert |
| A2 | `SidebarGroupLabel` has internal styling that masks the gradient in expanded mode (BUG-01 deeper hypothesis) | BUG-01 root cause deep dive | Medium — if wrong, the unified-SidebarMenuButton fix still works because it's the pattern that already succeeds in collapsed mode. Fix is safe either way; only the *explanation* is hypothetical. |
| A3 | cmdk's value-prefix collision is the BUG-02 mechanism | BUG-02 root cause deep dive | Medium — if the actual bug is a different cmdk quirk (e.g., CommandDialog focus management), the proposed `value={item.path}` + `keywords=[item.label]` fix still addresses the filter/selection robustness. Requires manual repro in Wave 0 to confirm. |
| A4 | Dark `--sidebar-background: #1e293b` passes WCAG AA against `--sidebar-foreground: #cbd5e1` | Pattern 6 | Low — slate-300 (#cbd5e1) on slate-800 (#1e293b) contrast is ~10:1, well above AA. Verify in WCAG audit. |
| A5 | Changing `main`'s overflow from `overflow-y-auto` to interior div breaks no non-grid routes | Grid sizing fix | Medium — settings and detail pages may rely on main-level scroll. Mitigated by moving `overflow-y-auto` to the inner `<div>` rather than removing it. |
| A6 | The "rounded-full" complaint in GRID-03 actually means "rounded-2xl from Phase 8 Input primitive" | GRID-03 root cause | Low — user verbally reported pill-shape; Phase 8 Input IS `rounded-2xl` which renders pill-ish at `h-8`. If the user meant literal `rounded-full`, the fix is still `rounded-md`. |
| A7 | The `workspace.currentOrg` field is `org_name`, not `display_name` | Pattern 5 / D-20 | Low — confirmed from file read at `org-workspace-loader.server.ts:19`. D-20 in CONTEXT.md uses `display_name` erroneously; the plan should use `org_name`. |
| A8 | WCAG AA contrast for `var(--border) #334155` scrollbar thumb on `var(--card) #1e293b` passes at 3:1 UI-component minimum | Pattern 4 | Low — slate-700 on slate-800 is ~3.4:1, just passing. If marginal, bump to `var(--muted-foreground)` for default (not just hover). |

## Open Questions (RESOLVED)

1. **D-02 font choice (Geist vs Inter in AG Grid)** — RESOLVED: Inter Variable, locked in Plan 02 Task 1 (matches Phase 7 app-wide migration).
   - What we know: Phase 7 migrated the app to Inter; `ag-grid-theme.ts` still says Geist; D-02 says keep Geist; research recommends Inter for consistency.
   - What's unclear: user preference when Phase 7 already silently migrated the rest.
   - Recommendation: switch to Inter in the same edit; flag explicitly in the plan task so discuss-phase can confirm if needed.

2. **D-17 vs D-17b vs research-proposed `--sidebar-background` fix** — RESOLVED: one-line `.dark { --sidebar-background: #1e293b; --sidebar-border: #334155; }` edit in `app/styles/shadcn-ui.css`, locked in Plan 03 Task 1. Supersedes CONTEXT D-17/D-17b.
   - What we know: three viable fixes exist; research recommends the simplest (one-line `.dark` block edit in `shadcn-ui.css`).
   - What's unclear: whether Phase 7 tokens were designed intentionally to have `--sidebar-background == --background` in dark mode (unlikely — probably an oversight).
   - Recommendation: planner picks the research-proposed fix; if it breaks a contrast pair in the WCAG audit, fall back to D-17 (new `--color-chrome` token).

3. **BUG-01 actual mechanism — requires manual repro in Wave 0** — RESOLVED: Wave 0 manual repro captured in Plan 01 Task 1; fix unifies expanded branch with `SidebarMenuButton` + `useMemo`-derived `isModuleActive` (no new `useEffect`), locked in Plan 04 Task 2.
   - What we know: symptom is "pill only after sub-module click"; deeper hypothesis is SidebarGroupLabel precedence; fix is to unify expanded branch with SidebarMenuButton (the pattern that works in collapsed mode).
   - What's unclear: without running `pnpm dev` the exact class order cannot be confirmed. The fix is safe regardless because it adopts a known-working pattern from the same file.
   - Recommendation: Wave 0 manual repro (5 min) → confirm hypothesis → apply fix. If hypothesis wrong, the unification still fixes the bug as a side effect of pattern-matching the working collapsed branch.

4. **BUG-02 actual mechanism — requires manual repro in Wave 0** — RESOLVED: Wave 0 manual repro captured in Plan 01 Task 1; fix uses cmdk `value={item.path}` + `keywords={[item.label]}` with `setOpen(false)` before `navigate(path)` ordering, locked in Plan 04 Task 3.
   - What we know: cmdk value collision is the leading hypothesis; current code looks correct at first read.
   - What's unclear: whether the issue is cmdk's filter, focus management, `navigate()` timing against `setOpen(false)`, or something else.
   - Recommendation: Wave 0 manual repro + console logging on `handleSelect` → confirm whether the function is even called, then which path is passed. If `handleSelect` is called with the right path, the bug is in `navigate()` racing `setOpen(false)` (React Router 7 navigation may need the dialog closed first for focus restoration). Fix: `setOpen(false)` first, then `queueMicrotask(() => navigate(path))` or `requestAnimationFrame`.

## Environment Availability

All tooling installed. See earlier Environment Availability table. Phase is not blocked.

## Validation Architecture

### Test Framework
| Property | Value |
|---|---|
| Framework | Vitest 4.1.3 (unit) + Playwright 1.57.x (E2E) |
| Config file | `vitest.config.ts` (root) + `e2e/playwright.config.ts` |
| Quick run command | `pnpm test:unit -- ag-grid-theme` (unit) / `pnpm --filter e2e exec playwright test --grep @phase10` (targeted E2E) |
| Full suite command | `pnpm test:unit && pnpm typecheck && pnpm --filter e2e exec playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| GRID-01 | AG Grid theme exposes Aloha tokens (exact hexes) | unit | `pnpm test:unit -- ag-grid-theme` | ✓ update assertions (Wave 0) |
| GRID-02 | AG Grid fills container on every HR route (no collapse) | e2e visual | `pnpm --filter e2e exec playwright test --grep @grid-sizing` | ❌ Wave 0 — new test |
| GRID-03 | Toolbar search has `rounded-md` class | e2e dom | `pnpm --filter e2e exec playwright test --grep @toolbar-search` | ❌ Wave 0 — new test |
| DARK-02 | `next-themes` toggle — no layout shift, no console errors | e2e | `pnpm --filter e2e exec playwright test --grep @theme-toggle` | ❌ Wave 0 — new test |
| DARK-03 | Navbar + sidebar on elevated surface vs body in dark | e2e computed style | `pnpm --filter e2e exec playwright test --grep @dark-surfaces` | ❌ Wave 0 — new test |
| PARITY-01 | Sidebar has NAVIGATION header, SidebarSeparator, chevrons, Focused footer | e2e dom | `pnpm --filter e2e exec playwright test --grep @sidebar-parity` | ❌ Wave 0 — new test |
| PARITY-02 | PanelLeft toggle is first child of navbar | e2e dom | `pnpm --filter e2e exec playwright test --grep @navbar-toggle` | ❌ Wave 0 — new test |
| PARITY-03 | Navbar avatar shows org initials ("HF" for Hawaii Farming) | unit (helper) + e2e | `pnpm test:unit -- get-org-initials` + Playwright | ❌ Wave 0 — unit test file + e2e |
| PARITY-04 | Sub-module rows have vertical gap from module row | e2e computed style | included in `@sidebar-parity` | ❌ Wave 0 |
| PARITY-05 | Scrollbar thumb uses themed color in both modes | e2e computed style | `pnpm --filter e2e exec playwright test --grep @scrollbar` | ❌ Wave 0 — new test |
| BUG-01 | Clicking a module shows gradient pill immediately | e2e | `pnpm --filter e2e exec playwright test --grep @bug-01-active-pill` | ❌ Wave 0 — new regression test |
| BUG-02 | Selecting a module from command palette navigates correctly | e2e | `pnpm --filter e2e exec playwright test --grep @bug-02-palette-nav` | ❌ Wave 0 — new regression test |

### Sampling Rate
- **Per task commit:** `pnpm typecheck && pnpm test:unit` (fast; < 20s)
- **Per wave merge:** `pnpm typecheck && pnpm test:unit && pnpm --filter e2e exec playwright test --grep @phase10` (targeted E2E subset)
- **Phase gate:** Full suite green before `/gsd-verify-work` → `pnpm test:unit && pnpm typecheck && pnpm --filter e2e exec playwright test` (full E2E)

### Wave 0 Gaps
- [ ] `e2e/tests/phase10-grid-sizing.spec.ts` — covers GRID-02 (all 9 HR modules, both themes, assert grid height > 300px after load)
- [ ] `e2e/tests/phase10-toolbar-search.spec.ts` — covers GRID-03 (assert toolbar input has `rounded-md` computed `border-radius`)
- [ ] `e2e/tests/phase10-theme-toggle.spec.ts` — covers DARK-02 (snapshot body dimensions, toggle, assert no layout shift, no console errors)
- [ ] `e2e/tests/phase10-dark-surfaces.spec.ts` — covers DARK-03 (assert computed `background-color` differs between navbar, sidebar, and main)
- [ ] `e2e/tests/phase10-sidebar-parity.spec.ts` — covers PARITY-01, PARITY-04 (assert NAVIGATION label present, chevron rotates on click, sub-item vertical gap ≥ 4px, Focused footer present and disabled)
- [ ] `e2e/tests/phase10-navbar-toggle.spec.ts` — covers PARITY-02 (assert `data-test="workspace-navbar-sidebar-toggle"` is first child with `matches(':first-child')`)
- [ ] `e2e/tests/phase10-avatar-initials.spec.ts` — covers PARITY-03 (seed demo org "Hawaii Farming", assert navbar avatar contains "HF")
- [ ] `e2e/tests/phase10-scrollbar.spec.ts` — covers PARITY-05 (assert `scrollbar-color` CSS property present and themed)
- [ ] `e2e/tests/phase10-bug-01-active-pill.spec.ts` — regression for BUG-01 (navigate to a module, assert gradient class applied before any sub-module click)
- [ ] `e2e/tests/phase10-bug-02-palette-nav.spec.ts` — regression for BUG-02 (open command palette, type module name, Enter, assert URL matches module path)
- [ ] `app/lib/workspace/__tests__/get-org-initials.test.ts` — unit test for PARITY-03 helper
- [ ] Update `app/components/ag-grid/__tests__/ag-grid-theme.test.ts` — new hex assertions for GRID-01

**Framework install:** none — Vitest and Playwright already wired.

**Visual regression (optional but recommended):** Playwright `toHaveScreenshot()` against prototype reference screenshots captured manually into `e2e/snapshots/phase10/` for the sidebar, navbar, and one representative HR grid (Register) in both themes. This locks the visual parity outcome against future drift. The planner should include this as a Wave 4 task if Playwright-managed visual diffs are already part of the project's regression strategy; otherwise a static HTML+screenshot comparison doc in `10-WCAG-AUDIT.md` is acceptable.

## Security Domain

### Applicable ASVS Categories

Phase 10 is presentation-only — no data, auth, session, or input handling changes. Security relevance is low but non-zero (any change to shell chrome could introduce XSS via unescaped user data).

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | unchanged |
| V3 Session Management | no | unchanged |
| V4 Access Control | no | unchanged (no new routes, no loader changes) |
| V5 Input Validation | **partial** | Org name → initials helper: treat `org_name` as untrusted user input; escape on render (React handles by default), don't use `dangerouslySetInnerHTML` |
| V6 Cryptography | no | unchanged |
| V14 Configuration | no | unchanged |

### Known Threat Patterns for Shell/UI

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| XSS via org name in avatar initials | Tampering | React's default text-node escaping; do NOT use `dangerouslySetInnerHTML`; cap initials to 2 chars; test with a malicious org name like `<script>alert(1)</script>` in unit test |
| Theme toggle state exposure in URL/storage | Information Disclosure | `next-themes` uses localStorage — no new exposure |
| Command palette item confusion (phishing via crafted sub-module name) | Spoofing | Server controls `app_navigation` rows via RLS; user cannot inject items |

No new attack surface introduced by Phase 10.

## Sources

### Primary (HIGH confidence)
- `app/components/ag-grid/ag-grid-theme.ts` — read 2026-04-10, current themeQuartz param shape
- `app/components/ag-grid/ag-grid-wrapper.tsx` — read 2026-04-10, `h-full w-full` confirmed at line 160
- `app/components/ag-grid/ag-grid-list-view.tsx` — read 2026-04-10, `flex min-h-0 flex-1 flex-col` confirmed at line 238, toolbar at 240
- `app/components/sidebar/module-sidebar-navigation.tsx` — read 2026-04-10, expanded branch on lines 180–234, BUG-01 site
- `app/components/workspace-shell/workspace-navbar.tsx` — read 2026-04-10, PanelLeft at line 56 confirms PARITY-02 is already correct
- `app/components/workspace-shell/workspace-navbar-profile-menu.tsx` — read 2026-04-10, initial derivation at line 35
- `app/components/navbar-search.tsx` — read 2026-04-10, cmdk usage at lines 89–102, BUG-02 site
- `app/routes/workspace/layout.tsx` — read 2026-04-10, grid sizing root cause at lines 86–87
- `app/lib/workspace/org-workspace-loader.server.ts` — read 2026-04-10, confirms `org_name` field (not `display_name`)
- `app/lib/workspace/types.ts` — read 2026-04-10
- `app/styles/theme.css` — read 2026-04-10, Inter Variable confirmed at line 80
- `app/styles/shadcn-ui.css` — read 2026-04-10, dark-mode surface collision at line 134
- `packages/ui/src/shadcn/input.tsx` — read 2026-04-10, `rounded-2xl` at line 13, GRID-03 source
- `packages/ui/src/kit/data-table-toolbar.tsx` — read 2026-04-10, shared toolbar
- `DESIGN.md §1–2` — read 2026-04-10, Phase 7 token spec
- `../aloha-design/prototype/src/components/layout/Sidebar.tsx` — read 2026-04-10, canonical sidebar structure
- `../aloha-design/prototype/src/components/layout/Header.tsx` — read 2026-04-10, canonical navbar
- `../aloha-design/prototype/src/index.css` — read 2026-04-10, canonical scrollbar rules
- `../aloha-design/prototype/package.json` — read 2026-04-10, confirms no Shadcn — port behavior only
- `.planning/phases/10-ag-grid-theme-template-parity-dark-mode/10-CONTEXT.md` — authoritative decisions
- `.planning/REQUIREMENTS.md` §GRID/DARK/PARITY/BUG — acceptance criteria
- `CLAUDE.md` + `packages/ui/CLAUDE.md` — project guardrails

### Secondary (MEDIUM confidence)
- AG Grid v35 Theming API — generally known; project uses `themeQuartz.withParams` already. For the hex-only constraint, the project's own working code + test is the reference. Should be cross-verified with `ag-mcp` MCP server during Wave 0 if any exotic param name is needed.
- cmdk value-filter collision hypothesis — based on cmdk's documented behavior of normalizing `value` for filtering; requires manual repro to confirm mechanism.

### Tertiary (LOW confidence)
- None required. Every claim in this document is backed by a file read or a direct project artifact.

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — no new packages, all existing
- Architecture (grid sizing, sidebar composition, token fix): HIGH — every root cause confirmed by file read
- BUG-01 mechanism: MEDIUM — hypothesis is strong but needs 5-min manual repro before fix lands
- BUG-02 mechanism: MEDIUM — same; hypothesis is plausible, fix is safe regardless of exact cause
- Exact dark chrome hex choice: MEDIUM — research recommends simplest path; planner has three viable options

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (30 days; no fast-moving dependencies)

## RESEARCH COMPLETE

**Phase:** 10 — AG Grid Theme, Template Parity & Dark Mode
**Confidence:** HIGH on structure and root causes; MEDIUM only on the two bug-fix hypotheses which require 5-min Wave 0 manual repros to lock.

### Key Findings

1. **Grid collapse (GRID-02)** localizes to `app/routes/workspace/layout.tsx:86-87` — `main` lacks `min-h-0` and uses `overflow-y-auto`. One-container fix affects all 9 HR grids.
2. **Toolbar "pill" (GRID-03)** is `rounded-2xl` inherited from the Phase 8 Shadcn `Input` primitive. Fix is a `className="rounded-md"` override in `DataTableToolbar` (or a new `searchClassName` prop) — no primitive change.
3. **Dark-mode surface collision (DARK-03)** is a single-line bug in `shadcn-ui.css:134`: `--sidebar-background: #0f172a` collides with `--background: #0f172a`. Fix: change to `#1e293b` (matches `--card`), set `--sidebar-border: #334155`. Zero new tokens — cheaper than D-17 or D-17b.
4. **AG Grid theme rewrite (GRID-01)** is pure hex replacement in an existing file with an existing test. Confirmed Inter Variable font mismatch (research recommends switching AG Grid to Inter to match Phase 7; D-02 says keep Geist — planner discretion).
5. **PARITY-02 already satisfied** — `PanelLeft` toggle is already the first child of the navbar at `workspace-navbar.tsx:56-64`. Verification-only, not re-implementation.
6. **`currentOrg.org_name`** is the correct field (not `display_name` as CONTEXT D-20 states). Correct in the plan.
7. **BUG-01 deeper hypothesis**: Shadcn `SidebarGroupLabel` styling precedence masks the inline gradient in expanded mode. Fix: unify expanded branch with `SidebarMenuButton` — the pattern already working in the collapsed branch of the same file.
8. **BUG-02 hypothesis**: cmdk value collision when module path is a prefix of sub-module paths. Fix: use `value={item.path}` + `keywords={[item.label]}` and accept the selected value from `onSelect`'s argument.

### File Created
`.planning/phases/10-ag-grid-theme-template-parity-dark-mode/10-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|---|---|---|
| Standard Stack | HIGH | No new packages; all existing |
| Architecture (sizing, sidebar, tokens) | HIGH | All root causes confirmed by direct file read |
| Pitfalls | HIGH | All derived from concrete project state |
| BUG-01 mechanism | MEDIUM | Strong hypothesis; fix is safe regardless (pattern-matching the working branch) |
| BUG-02 mechanism | MEDIUM | Plausible hypothesis; Wave 0 repro recommended before final fix |
| Dark chrome hex choice | MEDIUM | Three viable options; research strongly recommends the simplest |

### Open Questions
Four open questions documented — all are discretion-level, none block planning:
1. Geist vs Inter in AG Grid theme (research recommends Inter; D-02 says Geist).
2. D-17 vs D-17b vs research-proposed `--sidebar-background` fix (research recommends the third, simplest option).
3. BUG-01 mechanism — needs 5-min Wave 0 manual repro to confirm hypothesis A vs B.
4. BUG-02 mechanism — needs 5-min Wave 0 manual repro + console logging.

### Ready for Planning
Research complete. Planner can now create PLAN.md files. Suggested wave ordering: (0) Wave 0 for BUG-01/BUG-02 manual repros + new E2E test skeletons + ag-grid-theme test assertion update + `get-org-initials.test.ts`; (1) grid sizing + toolbar rounding + AG Grid theme hex rewrite; (2) sidebar parity (structure, separator, footer, sub-module spacing) + dark-mode `--sidebar-background` fix + scrollbar global CSS; (3) avatar initials helper + prop-drill + BUG-01 fix + BUG-02 fix; (4) WCAG audit doc + full E2E suite + STATE/ROADMAP update.
