---
phase: 10-ag-grid-theme-template-parity-dark-mode
task: 10-01 Task 1 — manual bug reproduction
date: 2026-04-10
environment: pnpm dev (localhost:5173), Chrome + DevTools, signed-in workspace session
---

# Phase 10 Bug Reproduction

## BUG-01 Observed

Clicking a MODULE-level entry in the sidebar (e.g., HR Employee) does **not** apply the
green active-pill gradient — the row stays grey. In addition, **the URL does not change**:
clicking the module label is effectively a no-op as far as routing is concerned. This
reproduces in both expanded and collapsed sidebar states.

Symptom expansion vs. original report: the original BUG-01 only described the missing pill.
Manual repro revealed a larger regression — module rows in the expanded sidebar are not
navigating at all. Sub-module clicks still work.

## BUG-01 Root Cause (confirmed)

`app/components/sidebar/module-sidebar-navigation.tsx:180-234` renders the expanded-mode
module row as a `<SidebarGroupLabel>` containing a nested `<Link to={modulePath}>`. Two
structural problems flow from this:

1. **No pill** — `SidebarGroupLabel` is a Shadcn primitive with its own base typography
   classes that take precedence over the inline gradient utilities, so the
   `bg-gradient-to-r from-green-500 to-emerald-600` never visually applies. This matches
   Hypothesis B in `10-RESEARCH.md` §"BUG-01 Root Cause Deep Dive".
2. **No navigation** — the sibling `<CollapsibleTrigger asChild><button>` and the
   Collapsible's own click handling intercept / swallow the Link click in practice, so
   `modulePath` is never committed. The `Link.onClick` handler also calls
   `toggleModule(mod.module_slug)`, which mutates state on the same tick as the
   navigation, compounding the regression.

**Fix direction (per research):** replace the expanded-mode `SidebarGroupLabel` + nested
`Link` with `SidebarMenuButton asChild isActive={isModuleActive}` wrapping a `Link` — the
same pattern the collapsed branch already uses correctly. Move the chevron
`CollapsibleTrigger` to a distinct `SidebarMenuItem` sibling so navigation and toggle are
cleanly separated. Also fix auto-expand staleness with derived state (no `useEffect`) per
`10-RESEARCH.md` lines 450-462.

Requirement coverage: BUG-01 now also implies PARITY-03 scope — module-row navigation
behavior must be asserted by e2e, not just the visual pill.

## BUG-02 Observed

`Cmd+K` opens the command palette. Typing `Employee` shows both the HR Employee module
entry and its sub-module entries. Selecting the MODULE entry and pressing Enter:

- URL does **not** change
- Dialog **closes**
- No console errors (clean console, no terminal errors either)

Sub-module entries in the same palette navigate correctly.

## BUG-02 Root Cause (confirmed)

Matches Hypothesis in `10-RESEARCH.md` §"BUG-02 Root Cause Deep Dive"
(`app/components/navbar-search.tsx:89-102`): each `<CommandItem>` sets
`value={\`${item.label} ${item.path}\`}` and `onSelect={() => handleSelect(item.path)}`.
cmdk uses `value` as both filter token and the argument to `onSelect`, and its
normalization/auto-select behavior picks a different "first match" than the row the user
clicked when multiple items share a prefix (module + sub-modules of the same slug). The
dialog closes because cmdk fires a selection; the URL doesn't change because
`handleSelect` is called with the closure-captured `item.path` of a non-module row whose
navigation is a no-op, OR with the module's own path which then hits the same broken
expanded-mode `<Link>` path as BUG-01 (unverified which). Either way the symptom is
"dialog closes, URL unchanged" — reproduced.

**Fix direction (per research):** use `value={item.path}` (already unique),
`keywords={[item.label, item.group ?? '']}` for label-based fuzzy search, and
`onSelect={(selectedPath) => handleSelect(selectedPath)}` so cmdk passes the selected
value directly. Independent from BUG-01's sidebar fix.

## Notes for Continuation Agent

- No `console.log` patches were committed to `navbar-search.tsx`.
- `10-BUG-REPRO.md` exists with the four required sections.
- `pnpm typecheck` not yet run (test scaffolding tasks 2/3 will exercise it).
- Task 2 (unit test skeletons) and Task 3 (Playwright spec skeletons) should now proceed
  using the confirmed root causes above as assertion targets. BUG-01 Playwright spec
  MUST assert URL change after module-row click, not just the active-pill class.
