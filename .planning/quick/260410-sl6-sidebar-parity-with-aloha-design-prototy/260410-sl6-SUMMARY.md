---
quick_id: 260410-sl6
type: execute
wave: 1
status: complete
completed: 2026-04-10
requirements:
  - SL6-01
  - SL6-02
  - SL6-03
files_modified:
  - app/components/sidebar/module-sidebar-navigation.tsx
  - app/components/sidebar/workspace-sidebar.tsx
commits:
  - 18c3ef2
  - c43a781
tech-stack:
  added: []
  patterns:
    - Inline chevron inside Link (no absolute-positioned sibling button)
    - Controlled-only Collapsible with onClick-driven toggleModule on the Link
decisions:
  - Removed CollapsibleTrigger entirely; whole module row toggles sub-items via Link onClick
  - Kept controlled Collapsible (open={isOpen}, no onOpenChange) to avoid double-wiring
  - Preserved both NAVIGATION + MODULES section labels and the separator between them (Phase 10 e2e contract)
  - Preserved sidebar footer avatar row (Phase 10 PARITY-03 deviation)
  - Preserved md:top-[72px] md:h-[calc(100svh-72px)] offset (structural difference from prototype)
  - Collapsed-branch sub-items also de-iconed for consistency with expanded branch
---

# Quick 260410-sl6: Sidebar parity with aloha-design prototype — Summary

Restyled the workspace sidebar to match the aloha-design prototype
(`/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/layout/Sidebar.tsx`)
while preserving all Phase 10 locked decisions.

## What Changed

### Task 1 — `module-sidebar-navigation.tsx` (commit `18c3ef2`)

- Removed `SidebarSeparator` between module rows and at list end (prototype draws none).
- Removed `uppercase` class on module labels — now renders sentence case via `display_name`.
- Module row classes: `rounded-xl px-3 py-2.5 gap-3 text-[15px] font-medium` (was `px-3 py-2 pr-9 uppercase`).
- Module icon size bumped to `h-[18px] w-[18px]` (was `h-4 w-4`) in both expanded + collapsed branches.
- Chevron moved INSIDE the Link as a trailing flex child (replacing the absolute-positioned `CollapsibleTrigger` sibling button and the `pr-9` reserved gutter). Uses `ChevronDown` from lucide-react with `h-3.5 w-3.5 shrink-0 transition-transform duration-200` + `rotate-180` when open. Color: `text-white/70 dark:text-green-950/70` when active, `text-muted-foreground` otherwise.
- `Collapsible` is now controlled-only (`open={isOpen}`, no `onOpenChange` trigger child). Link `onClick` fires `onNavigate?.()` then `toggleModule(mod.module_slug)` when the module has children — matches prototype Sidebar.tsx lines 34-44.
- Sub-item rail wrapper gap tightened from `gap-1` → `gap-0.5`.
- Sub-item rows are now text-only — removed `getSubModuleIcon` import + `SubModuleIcon` usage in BOTH expanded and collapsed branches.
- Sub-item classes aligned with prototype: `rounded-lg px-2.5 py-1.5 text-sm` base; active `bg-green-50 font-medium text-green-700 dark:bg-green-900/40 dark:text-green-200`; inactive `bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground`.
- Removed `capitalize` class on sub-item label span — labels render as-provided.
- Imports cleanup: dropped `SidebarSeparator`, `CollapsibleTrigger`, `getSubModuleIcon`; added `ChevronDown`.
- Active-state gradient (`from-green-500 to-emerald-600` + dark variants) preserved — Phase 10 locked.
- Data source unchanged — still `modules` + `subModules` from workspace loader (`AppNavModule` / `AppNavSubModule`).

### Task 2 — `workspace-sidebar.tsx` (commit `c43a781`)

- Section labels (NAVIGATION + MODULES `SidebarGroupLabel`): `text-xs font-semibold` → `text-[11px] font-medium` to match prototype exactly. Kept `tracking-wider uppercase px-3` and `group-data-[collapsible=icon]:hidden`.
- Module list wrapped in `<div className="flex flex-col gap-0.5">` for the prototype's tight rhythm without breaking the existing SidebarGroup/SidebarMenu semantics inside `ModuleSidebarNavigation`. (Picked this wrapper location rather than adding `px-3` because the inner `SidebarGroup`s already provide horizontal padding — adding it here would double-pad.)
- Footer disabled "Focused" button: `gap-2 py-2 text-xs font-medium` → `gap-3 rounded-xl py-2.5 text-[15px] font-medium` matching prototype Sidebar.tsx lines 154-165. Kept `aria-disabled`, `tabIndex={-1}`, children.
- Footer avatar row spacing: `gap-2 py-2` → `gap-3 py-2.5` to align rhythm with the footer button. `data-test="workspace-sidebar-profile"` preserved.
- **Not changed** (Phase 10 locks): NAVIGATION label, separator between NAVIGATION and MODULES, MODULES label, avatar row presence, `SidebarEdgeToggle`, `md:top-[72px] md:h-[calc(100svh-72px)]` offset, `border-border border-r`.

## Verification

- `pnpm typecheck` — passed cleanly (both after Task 1 and after Task 2).
- lint + prettier ran via lint-staged pre-commit hooks on both commits — no complaints.
- Task 3 visual parity checkpoint: deferred to the user post-merge (constraints prohibit dev server / E2E in this executor; human will eyeball against prototype at http://localhost:5176/filtered-table per the plan's how-to-verify steps).

## Deviations from Plan

None — plan executed as written. Task 3 (human-verify checkpoint) is handed off to the user for visual approval since the executor constraints forbid running the dev server.

## Phase 10 Locked Decisions Preserved

- NAVIGATION + MODULES section labels + separator between them — both still rendered.
- `SidebarEdgeToggle` (navbar PanelLeft is the single source of truth for collapse) — unchanged.
- Sidebar footer avatar row (PARITY-03 e2e contract deviation) — still present.
- Active-state green→emerald gradient + dark-mode brightening variants — unchanged.
- Sticky-navbar offset `md:top-[72px] md:h-[calc(100svh-72px)]` — unchanged.
- Data source — sidebar continues to consume `AppNavModule` / `AppNavSubModule` from the existing workspace loader. No data-model changes, no new files, no new dependencies.

## Self-Check: PASSED

- `app/components/sidebar/module-sidebar-navigation.tsx` — modified (commit `18c3ef2` found in git log).
- `app/components/sidebar/workspace-sidebar.tsx` — modified (commit `c43a781` found in git log).
- `pnpm typecheck` — passed on both task completions.
- Must-have truths (from plan frontmatter) — all satisfied in code:
  - Sentence-case module labels ✓
  - rounded-xl pill + 18px icon + 15px font-medium label + green→emerald gradient active ✓
  - Text-only sub-items inside green-200 rail ✓
  - No separator between module rows ✓
  - Inline chevron at end of row, rotates 180deg when expanded ✓
  - Sidebar widths unchanged (expanded 13.75rem / collapsed 4.25rem handled by shadcn primitive) ✓
  - Workspace loader data source unchanged ✓
  - NAVIGATION + MODULES section labels still rendered ✓
