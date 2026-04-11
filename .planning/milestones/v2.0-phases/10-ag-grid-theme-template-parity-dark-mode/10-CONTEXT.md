# Phase 10: AG Grid Theme, Template Parity & Dark Mode - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** `--auto` (recommended defaults selected by Claude)

<domain>
## Phase Boundary

Close the remaining visual/behavioral gaps between the shipped v2.0 shell and the reference prototype at `../aloha-design/prototype`, so the retheme lands without regressions. This is a **polish + parity + bugfix phase**, not new capability.

**In scope:**
- Rewrite `app/components/ag-grid/ag-grid-theme.ts` via `themeQuartz.withParams` to Aloha tokens for both light/dark (GRID-01).
- Make every existing HR grid fill its container — no shrink/collapse (GRID-02).
- Square the AG Grid toolbar search input (rounded-md, not rounded-full/pill) (GRID-03).
- Port prototype sidebar structure onto existing Shadcn sidebar: NAVIGATION/MODULES section headers, inline collapse affordance, separator line between sections, module chevron dropdown, sub-module vertical separation, "Focused" footer (PARITY-01, PARITY-04).
- Move the sidebar expand/collapse toggle to be the **leftmost** navbar control, before the Aloha logo square (PARITY-02). *(Note: navbar already renders `PanelLeft` at index 0 — verify placement matches prototype; may already be done.)*
- Replace navbar avatar static "A" fallback with org-derived initials (e.g., "HF" for Hawaii Farming) pulled from the loaded org context (PARITY-03).
- Theme scrollbars in sidebar and main content: thin, tokenized thumb, both light + dark (PARITY-05).
- Dark-mode nav surface: navbar + sidebar render on a distinct elevated dark surface (not the page background), centered search legible, no layout shift on theme toggle (DARK-02, DARK-03).
- Fix BUG-01: active-module gradient pill renders immediately on click and on initial route load, not only after a sub-module is selected.
- Fix BUG-02: selecting a module-level entry from the navbar command-palette search navigates reliably (no-op today).
- WCAG AA contrast audit of shell chrome, primitives, and AG Grid token pairs in both themes — documented in phase plan.
- Zero regression in CRUD flows, loaders, actions, i18n, CSRF.

**NOT in scope:**
- New AG Grid Enterprise features (Community tier only — carried from project constraints).
- Schema changes, RLS policy changes, or any DB work.
- New nav items, new modules, new routes.
- Refactoring `loadOrgWorkspace()` contract, navigation config, or CRUD registry.
- Rewriting `packages/ui/src/shadcn/sidebar.tsx` — restyle + compose only, no primitive rewrite.
- Adding a real command palette UX beyond the existing `NavbarSearch` CommandDialog.
- Relocating the profile menu from the sidebar footer into the navbar (Phase 9 scope guardrail still holds).
- Any mobile-specific work beyond dark-mode correctness on the mobile header + drawer.

</domain>

<decisions>
## Implementation Decisions

### AG Grid Theme (GRID-01)
- **D-01:** Rewrite `app/components/ag-grid/ag-grid-theme.ts` to source its param values from the Phase 7 Aloha tokens, not from hardcoded Supabase hexes. Use literal hex values that **match** the resolved CSS variable output (AG Grid theming params are plain hex strings, not CSS var refs — `var(--color-card)` is not supported inside `themeQuartz.withParams`). Keep the `light` / `dark` split; re-derive both palettes from Phase 7 DESIGN.md tokens (white card, slate-200 border, green-600 accent for light; elevated slate-900 surface, slate-700 border, emerald-500 accent for dark). Rationale: AG Grid theme is consumed once globally — centralized refresh propagates to every HR grid without per-view changes (GRID-01 success criterion).
- **D-02:** Keep `fontFamily: 'Geist Variable'` (unchanged from current file); the prototype uses Inter but the app has Geist wired through Phase 7 and swapping fonts is out of scope for this phase. Rationale: font migration is not in REQUIREMENTS.md for Phase 10; grid font matches the rest of the app.
- **D-03:** Preserve the existing `themeQuartz.withParams(light, 'light').withParams(dark, 'dark')` chain pattern and the existing export `getAgGridTheme()`. No API change — only the param values change. Rationale: minimize churn at the call sites (already working across 8 grids).
- **D-04:** Update `app/components/ag-grid/__tests__/ag-grid-theme.test.ts` assertions to the new expected hex values rather than deleting or rewriting the test. Rationale: the test is a regression guard; keep it working.

### Grid Sizing (GRID-02)
- **D-05:** Root cause investigation happens in research step — the wrapper already has `className="h-full w-full"` (ag-grid-wrapper.tsx:160), so the collapse must come from an ancestor that lacks `h-full` or a parent flex container missing `min-h-0`. Researcher must trace from `AgGridWrapper` up through each list-view and its containing page layout to find the missing dimension. Rationale: AG Grid shrink/collapse is almost always a parent-sizing issue, not a grid config issue; fixing it in one place (the common ancestor) is cheaper than editing each list-view.
- **D-06:** Acceptable fix locations, in order of preference: (1) the workspace main/content area in `app/routes/workspace/layout.tsx`; (2) a shared page shell wrapper used by all module pages; (3) per-list-view as a last resort. The planner picks based on research findings.

### Toolbar Search Squaring (GRID-03)
- **D-07:** The AG Grid toolbar search input is rendered inside `ag-grid-list-view.tsx` (and per-view custom list-views that compose it). Investigation needed to find the single rounding class. Replace `rounded-full` (or `rounded-2xl` if present) with `rounded-md` in the shared `ag-grid-list-view.tsx` toolbar and in any per-view overrides (scheduler, payroll-comparison, etc., which already appear to use `rounded-md` per grep — Register + a few others may still be pill). Rationale: the shared component is the single owner; per-view custom list-views inherit.
- **D-08:** Pill/rounded-full remains valid on **non-grid** surfaces (tabs, badges, buttons) — this decision is scoped to the grid toolbar search only. Don't cascade the rounding change outside the grid toolbars.

### Sidebar Structural Parity (PARITY-01, PARITY-04)
- **D-09:** Port onto the **existing** `app/components/sidebar/module-sidebar-navigation.tsx` — do not create a new component. Add: (a) a "NAVIGATION" section label above the module list; (b) a "MODULES" section label (if the role supports a secondary section; otherwise single section is acceptable); (c) inline collapse affordance — the `PanelLeft`/`PanelLeftClose` toggle lives in the navbar per D-02 on Phase 9, so the "inline collapse affordance" in Phase 10 refers to the small chevron collapse icon at the top-right of the sidebar matching the prototype (or explicitly omitted if the navbar toggle is the single source of truth — see D-10). Rationale: PARITY-01 names structural elements, not a new file.
- **D-10:** Because the navbar already owns the `PanelLeft` toggle (Phase 9 D-02 equivalent), the sidebar's inline collapse affordance is **omitted** as a structural feature — the prototype has it because it has no navbar-level toggle. Document this deviation in the phase plan. Rationale: two toggles for the same action is worse UX than the parity gap it closes.
- **D-11:** Add `SidebarSeparator` (or a plain `border-t`) between section header groups. Rationale: matches prototype "separator line" requirement.
- **D-12:** Module rows get an explicit chevron dropdown icon (`ChevronDown` with rotation on `isOpen`) matching the prototype. The existing code already auto-expands the active module — augment, don't replace, the auto-expand logic. Rationale: PARITY-01 chevron dropdown.
- **D-13:** Sub-module rows get additional vertical margin (PARITY-04): apply `mt-1 mb-1` + the existing `border-l-2 border-green-200 ml-5 pl-3` accordion rail. Add a subtle `gap-1` between the parent module row and the accordion container. Rationale: prototype spacing — clearly visible separation.
- **D-14:** Add the "Focused" footer control at the bottom of the sidebar. For the Aloha app it collapses to a no-op "Focused" label initially (the prototype's "All Apps" toggle has no semantic equivalent yet in Aloha). Acceptable implementation: render the prototype's footer button with the `LayoutGrid`/`ChevronLeft` icons but disabled/`aria-disabled` and no click handler, OR omit it and document the omission. **Default pick: render disabled** to match the visual parity goal. Rationale: visual parity > functional parity for this footer; cheapest way to satisfy PARITY-01 exact wording.

### Scrollbar Theming (PARITY-05)
- **D-15:** Add global `::-webkit-scrollbar` rules in `app/styles/app.css` (or the existing global CSS entry point) keyed off the Phase 7 tokens: `width/height: 6px`, `thumb: var(--border)` (slate-200 light / slate-700 dark), `thumb hover: var(--muted-foreground)`. No per-component scrollbar overrides. Rationale: scrollbar styling is a cross-cutting concern; prototype does it globally.
- **D-16:** Firefox scrollbar fallback via `scrollbar-width: thin; scrollbar-color: var(--border) transparent` applied to `html` or `body`. Rationale: non-webkit browsers need the CSS standard properties.

### Dark-Mode Nav Surfaces (DARK-02, DARK-03)
- **D-17:** Introduce a new Phase 7 token (or reuse an existing one) for "elevated chrome surface": `--color-chrome` that resolves to `card` in light mode and a distinct elevated slate (e.g., `slate-900` raised, between `background` and `card`) in dark mode. Navbar + sidebar consume `bg-chrome` instead of `bg-card`. Rationale: light-mode convention (white nav/sidebar over slate-50 page) has no tonal dark-mode equivalent using `card` alone — `card` in the Phase 7 dark palette equals the page surface, which is exactly the DARK-03 failure mode. **If adding a token expands surface unacceptably, fallback D-17b: use a Tailwind `dark:` literal override on the navbar/sidebar containers (e.g., `bg-card dark:bg-slate-900/95`) and document the literal as a deliberate exception to the "tokens only" rule.** Planner picks based on Phase 7 token surface review.
- **D-18:** Centered navbar search trigger in dark mode: verify `bg-muted` contrast ≥ 4.5:1 against the new chrome surface; if not, bump to `bg-muted/80` + explicit `dark:bg-slate-800` override. Part of the WCAG audit in D-24.
- **D-19:** Theme toggle must not produce layout shifts — confirmed by snapshotting DOM dimensions before/after `setTheme()` in the Playwright regression check. Rationale: DARK-02 zero regressions.

### Avatar Initials (PARITY-03)
- **D-20:** Compute initials from `workspace.currentOrg.display_name` (or the equivalent org name field loaded by `loadOrgWorkspace()`) using a simple splitter: split on whitespace, take the first letter of up to 2 words, uppercase. Fallback chain: `display_name` → `name` → `slug` → first letter of user email → "A". Implementation lives in a small `getOrgInitials(org)` helper in `app/lib/workspace/` so it's testable. Rationale: centralized pure function, easy to unit test, matches the "HF for Hawaii Farming" example in PARITY-03.
- **D-21:** Pass the org through the navbar prop chain: `WorkspaceNavbar` already receives `navigation`, needs `currentOrg` (or the computed `initials` string) added. Update `app/routes/workspace/layout.tsx` to pass it from `loaderData.workspace.currentOrg`. Rationale: smallest change; layout already has the org in scope.
- **D-22:** The navbar avatar and the **profile menu avatar** (in the sidebar footer) both use the same initials — update `workspace-navbar-profile-menu.tsx` to consume the same helper. Rationale: consistency; avoid one avatar showing "HF" and another showing "U".

### Navbar Toggle Placement (PARITY-02)
- **D-23:** Current `workspace-navbar.tsx` already renders the `PanelLeft` toggle at index 0 (before the logo square) — verify this matches the prototype layout exactly and is the leftmost visible control in both desktop dark and light modes. If the prototype's toggle sits inside the sidebar header, that is the prototype pattern but PARITY-02 explicitly overrides it ("before the Aloha logo square"). No structural change expected unless the verification finds a regression. Rationale: Phase 9 already shipped this; Phase 10 verifies and documents, doesn't re-implement.

### WCAG AA Audit (Success Criterion #8)
- **D-24:** Audit scope: (a) every shell chrome token pair (navbar bg vs fg, sidebar bg vs fg, active pill gradient vs white text, sub-item chip vs text); (b) every Phase 8 primitive in its default states (button, badge, input, card, avatar); (c) AG Grid header/row/selected/hover/border/text token pairs. Both light and dark.
- **D-25:** Methodology: use a simple JS contrast calculator embedded in a dev-only script that reads the resolved computed styles via Puppeteer/Playwright on the running app, OR (simpler) a static checklist using the **exact hex values** declared in Phase 7 tokens + the AG Grid theme file. Prefer the static checklist: faster, reproducible, no tooling deps. Rationale: we control all the hexes; we don't need runtime sampling.
- **D-26:** Document results in a table inside `10-PHASE-VERIFICATION.md` (or a dedicated `10-WCAG-AUDIT.md`). Each row = `{surface, fg, bg, ratio, pass/fail, remediation}`. Any `fail` becomes a remediation task in the phase plan before verification closes. Rationale: visible audit trail, matches roadmap success criterion #8 "documented in the phase plan".

### Bug Fixes
- **D-27:** BUG-01 root cause hypothesis: in the **expanded** (non-icon) mode of `module-sidebar-navigation.tsx`, the active gradient class may be conditioned on a different flag than `currentPath.startsWith(modulePath)`. Collapsed mode (line 107–111) already uses `isModuleActive` correctly — the bug is probably in the expanded block. Researcher traces expanded branch and fixes the condition to match collapsed-mode logic. Rationale: symmetry between collapsed and expanded branches.
- **D-28:** BUG-02 root cause hypothesis: `cmdk`'s `CommandItem` onSelect fires `handleSelect(path)` in `navbar-search.tsx` but the value passed to `CommandItem` is `${item.label} ${item.path}` — cmdk uses that as the filter token AND as the return value of onSelect. Check whether the onSelect callback receives the composite string instead of the intended `path`. If so, the current code `onSelect={() => handleSelect(item.path)}` should work (closure over `item.path`). Re-run the bug manually to capture the exact failure mode, then fix. Candidate fixes: (a) collapse submodule-path-prefix-matching interfering, (b) React Router nav vs anchor fallback, (c) `setOpen(false)` happening before navigate commits. Planner assigns investigation.
- **D-29:** Both bug fixes get a targeted Playwright regression added under `e2e/` — BUG-01 covers "click module, gradient pill appears instantly"; BUG-02 covers "navbar search → module entry → URL matches expected path". Rationale: prevent regression; phase adds tests for phase fixes per project convention.

### Regression Safety
- **D-30:** Before closing the phase, run the existing E2E suite in full (`pnpm test:e2e` or equivalent). If any E2E doesn't yet exist for the CRUD flows, run targeted manual regression on 2-3 representative sub-modules (Register, Scheduler, Time Off) in both themes and document the result. Rationale: roadmap success criterion #9.
- **D-31:** Run `pnpm typecheck`, `pnpm lint:fix`, `pnpm format:fix` on every commit during execution. Rationale: CLAUDE.md baseline hygiene.

### Claude's Discretion
- Exact hex values in the new AG Grid theme params (derive from Phase 7 DESIGN.md resolved tokens).
- Whether to introduce a new `--color-chrome` Phase 7 token or use `dark:bg-slate-900` literals (D-17 vs D-17b) — planner picks after reviewing the Phase 7 token surface.
- Exact shade of the dark elevated chrome surface — pick anything WCAG-passing between `slate-900` and `slate-950`.
- Whether to render or omit the "Focused" footer in the sidebar (D-14 default is render-disabled).
- Whether the scrollbar thumb uses `--border` or `--muted` tokens — whichever looks better in both themes.
- Exact copy for the section labels ("NAVIGATION" vs "Navigation" vs "MENU").

### Folded Todos
None — no pending todos matched Phase 10 scope at time of discussion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-Level
- `DESIGN.md` — Aloha design system source of truth (colors, typography, spacing, tokens). Read the AG Grid section and the dark-mode section in particular.
- `CLAUDE.md` — Core stack, coding preferences, data table rules (AG Grid Community only; `AgGridListView` drop-in; `ag-grid-theme.ts` via `withParams`; cell renderers; column state persistence).
- `.planning/PROJECT.md` — Milestone v2.0 goal, scope, and explicit "not touching feature behavior" constraint.
- `.planning/REQUIREMENTS.md` §GRID-01..03, §DARK-02..03, §PARITY-01..05, §BUG-01..02 — Full acceptance criteria.
- `.planning/ROADMAP.md` §"Phase 10: AG Grid Theme, Template Parity & Dark Mode" — 9 success criteria.

### Prototype (Visual Source of Truth)
- `../aloha-design/prototype/src/components/layout/Sidebar.tsx` — canonical sidebar structure: section headers, chevron dropdown, accordion sub-items, green-200 left rail, "Focused/All Apps" footer.
- `../aloha-design/prototype/src/components/layout/Header.tsx` — canonical navbar: 72px, logo square, `flex-1 max-w-md` centered search, avatar right.
- `../aloha-design/prototype/src/components/layout/MobileDrawer.tsx` — already ported in Phase 9; reference for dark-mode consistency check.
- `../aloha-design/prototype/src/index.css` — canonical scrollbar rules (`::-webkit-scrollbar` 6px, `#cbd5e1` thumb, `#94a3b8` hover) and the raw color palette used by the prototype.
- `../aloha-design/prototype/package.json` — deps reference: prototype uses Tailwind 4, `framer-motion`, plain Shadcn-less custom components. Note: Aloha uses Shadcn sidebar primitive; prototype does not — port behavior, not files.

### Phase 7–9 Carryover (Do Not Re-Decide)
- `.planning/phases/07-design-foundations/07-CONTEXT.md` — Phase 7 token decisions; Phase 10 must not break `--color-card`, `--color-border`, `--color-muted`, semantic tokens.
- `.planning/phases/08-shared-primitives/08-CONTEXT.md` — Phase 8 primitive restyles; Phase 10 WCAG audit consumes these without modification.
- `.planning/phases/09-app-shell-navbar-sidebar-drawer/09-CONTEXT.md` — Phase 9 shell topology (D-01 to D-21); Phase 10 modifies but does not rewrite `workspace-navbar.tsx`, `module-sidebar-navigation.tsx`, `workspace-sidebar.tsx`, `workspace-mobile-drawer.tsx`, `workspace-mobile-header.tsx`, `workspace-navbar-profile-menu.tsx`.
- `.planning/phases/09-app-shell-navbar-sidebar-drawer/09-UI-SPEC.md` — prior UI contract; re-read before editing any shell file.
- `.planning/phases/09-app-shell-navbar-sidebar-drawer/09-PHASE-VERIFICATION.md` — documents Phase 9 closure state and any deferred items rolled into Phase 10.

### AG Grid v35 Theming API
- Use the `ag-mcp` MCP server for AG Grid API reference during planning and execution (CLAUDE.md project skill).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/components/ag-grid/ag-grid-theme.ts` — already uses `themeQuartz.withParams` with the correct dual-mode chain. Phase 10 **overwrites the param values only**, keeps the API and exports.
- `app/components/ag-grid/ag-grid-list-view.tsx` — single owner of the shared toolbar search input. D-07 edit lands here.
- `app/components/ag-grid/ag-grid-wrapper.tsx` — already `className="h-full w-full"` (line 160); grid sizing fix is in the **parent chain**, not the wrapper.
- `app/components/sidebar/module-sidebar-navigation.tsx` — already wires active module via `currentPath.startsWith(modulePath)` (line 85). Collapsed branch (lines 103–126) applies the gradient correctly. Expanded branch is the BUG-01 fix target.
- `app/components/workspace-shell/workspace-navbar.tsx` — already places `PanelLeft` toggle at index 0 (PARITY-02 likely already satisfied; verify only).
- `app/components/workspace-shell/workspace-navbar-profile-menu.tsx` — uses `AvatarFallback` with `{initial}` (line 47); D-20/D-22 update both this and the main navbar avatar.
- `app/components/navbar-search.tsx` — `handleSelect(path)` already calls `navigate(path)` with a closure over `item.path` (lines 63–66). BUG-02 root cause needs manual repro; existing code *looks* correct.
- `app/lib/workspace/org-workspace-loader.server.ts` — already returns `currentOrg`; navbar can consume it via layout prop-drilling.
- Phase 7 CSS tokens in `app/styles/` — scrollbar global rules and the new `--color-chrome` token (if chosen) land there.

### Established Patterns
- Token consumption via Tailwind semantic classes (`bg-card`, `border-border`, `text-muted-foreground`) — Phase 10 continues this; `dark:` literal overrides are the documented exception (D-17b).
- AG Grid theme is global and consumed once at the `AgGridWrapper` level — one edit reaches all 9 HR grids.
- Shadcn sidebar primitive (`packages/ui/src/shadcn/sidebar.tsx`) is **not** rewritten — Phase 10 composes and restyles, same as Phase 9.
- Active-state classes in `module-sidebar-navigation.tsx` are inline Tailwind literals for the green gradient, not tokenized — this is intentional from Phase 9 D-09/D-11 (the gradient is a brand element). Phase 10 preserves this.
- E2E convention: add a targeted Playwright regression for every behavioral bug fix (project pattern from prior phases).

### Integration Points
- `app/routes/workspace/layout.tsx` — orchestrator; the grid-sizing fix probably lands here (ensuring the main content area has `h-full min-h-0 flex flex-col`), and the org initials prop-drilling starts here.
- `app/styles/*.css` (or equivalent global entry) — scrollbar rules and any new chrome token land here.
- `packages/ui/src/shadcn/sidebar.tsx` — **read-only this phase**; if a style fix requires a primitive change, flag it as a deviation instead of silently editing the primitive.
- `app/components/ag-grid/__tests__/ag-grid-theme.test.ts` — regression guard; update assertions to the new hexes.

</code_context>

<specifics>
## Specific Ideas

- Prototype scrollbar rule is the reference: `6px`, `#cbd5e1` thumb, `#94a3b8` hover. Translate into Phase 7 tokens so dark mode also works.
- Prototype navbar search is `bg-slate-100 rounded-2xl` in light. Aloha already uses `bg-muted rounded-2xl` (matches via token). Verify dark-mode resolution of `bg-muted` is still legible.
- Prototype active pill exact recipe: `bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25` — already in the code verbatim (Phase 9 D-09). Do not alter.
- Prototype sub-item chip exact recipe: `bg-green-50 text-green-700 font-medium rounded-lg` — also already in the code. Phase 10 may need a `dark:` override for the chip (Phase 9 D-11 explicitly deferred dark-mode chip tuning to Phase 10).
- The "Focused" footer button in the prototype toggles between `showAll` (All Apps view with sections) and focused (flat nav list). Aloha has no equivalent "All Apps" mode — the sectioned view decision is out of scope; render disabled for visual parity only.
- Org example in PARITY-03: "HF for Hawaii Farming" — the demo org's display_name is literally "Hawaii Farming"; verify against `SELECT display_name FROM org WHERE slug = <current>` or the loaded `currentOrg` object.

</specifics>

<deferred>
## Deferred Ideas

- **Font migration Geist → Inter** — the prototype uses Inter, Aloha uses Geist. Swapping is a cross-cutting change touching every primitive and the AG Grid theme; defer to a post-v2.0 "typography refresh" phase if desired.
- **Real command palette with fuzzy search + recent items** — current `NavbarSearch` is a CommandDialog wrapper over a flat list. A true palette with recent history, grouped actions, and keyboard hints is a future UX phase.
- **Profile menu relocation** from sidebar footer → navbar avatar dropdown. Phase 9 deferred; Phase 10 scope guardrail re-defers.
- **"Focused" / "All Apps" dual-mode sidebar nav** — prototype has it; Aloha has no semantic equivalent yet. Revisit when a second nav section (e.g., "Admin" apps vs "Operations" apps) is introduced.
- **AG Grid Enterprise features** — project-level out-of-scope, not Phase 10-specific.
- **Mobile-specific AG Grid responsive layout** — out of scope per project constraints.

### Reviewed Todos (not folded)
None — no pending todos were surfaced by `todo match-phase 10`.

</deferred>

---

*Phase: 10-ag-grid-theme-template-parity-dark-mode*
*Context gathered: 2026-04-10*
