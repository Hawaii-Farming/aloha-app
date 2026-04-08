# Phase 1: AG Grid Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 01-ag-grid-foundation
**Mode:** auto
**Areas discussed:** AG Grid Theming, Wrapper Component Architecture, Detail Row Expansion, Register Conversion

---

## AG Grid Theming

| Option | Description | Selected |
|--------|-------------|----------|
| themeQuartz.withParams() in JS | AG Grid v35 Theming API — define theme params in JavaScript, bridged to DESIGN.md tokens, auto-switch via next-themes | ✓ |
| Separate CSS override file | Traditional approach with ag-theme-quartz CSS class and custom stylesheet overrides | |
| CSS custom properties only | Map AG Grid CSS variables to existing Tailwind/DESIGN.md custom properties | |

**User's choice:** [auto] themeQuartz.withParams() — recommended for v35, keeps theming co-located with component code
**Notes:** Geist font from existing @fontsource-variable/geist used as fontFamily param

---

## Wrapper Component Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| ClientOnly wrapper in app/components/ag-grid/ | Centralized AG Grid wrapper with shared defaults, SSR safety, loading skeleton | ✓ |
| Inline AG Grid per submodule | Each submodule imports AG Grid directly with its own setup | |
| Package-level wrapper in @aloha/ui | Add AG Grid wrapper to the shared UI package | |

**User's choice:** [auto] ClientOnly wrapper in app/components/ag-grid/ — keeps AG Grid app-level (not package-level), centralized defaults reduce duplication
**Notes:** mapColumnsToColDefs() adapter preserves existing CrudModuleConfig registry pattern

---

## Detail Row Expansion

| Option | Description | Selected |
|--------|-------------|----------|
| Accordion (single expand) | Only one row expanded at a time — clicking a new row collapses the previous | ✓ |
| Multi-expand | Multiple rows can be expanded simultaneously | |
| Modal/side-panel detail | Click navigates or opens a panel instead of inline expansion | |

**User's choice:** [auto] Accordion — simpler UX, matches typical data grid patterns, avoids scroll confusion
**Notes:** Each submodule provides its own detail React component via fullWidthCellRenderer

---

## Register Conversion

| Option | Description | Selected |
|--------|-------------|----------|
| Replace table only, keep surrounding UI | Swap DataTable for AG Grid; keep CreatePanel, toolbar, search, column toggle | ✓ |
| Full rewrite of sub-module route | Rebuild the entire sub-module page around AG Grid patterns | |
| New route alongside existing | Add AG Grid version as separate route, keep TanStack Table version | |

**User's choice:** [auto] Replace table only — minimal change surface, validates AG Grid integration without breaking existing patterns
**Notes:** Existing loadTableData(), crudBulkDeleteAction, and crudBulkTransitionAction actions unchanged

---

## Claude's Discretion

- Loading skeleton design and animation
- Empty state overlay content
- Exact AG Grid theme param values (derived from DESIGN.md)
- Column state persistence key format
- Detail row animation timing
- Quick-filter debounce timing

## Deferred Ideas

None — analysis stayed within phase scope
