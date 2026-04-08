# Phase 1: AG Grid Foundation - Context

**Gathered:** 2026-04-08 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Build all shared AG Grid infrastructure so submodule phases (2-6) can compose grids without reinventing plumbing. This includes: AG Grid Community installation, themed wrapper component with SSR safety, full-width detail rows, side-panel CRUD forms, shared cell renderers (status badge, date/currency formatters, employee avatar), column features (sort, filter, resize, reorder, pagination, CSV export, column state persistence), and conditional row/cell styling. Convert the existing register submodule from TanStack Table to AG Grid as the proof-of-concept integration.

</domain>

<decisions>
## Implementation Decisions

### AG Grid Theming
- **D-01:** Use AG Grid v35 Theming API (`themeQuartz.withParams()`) to define theme parameters in JS — no separate AG Grid CSS override file
- **D-02:** Bridge DESIGN.md color tokens to AG Grid params — map Supabase-inspired dark/light palette (near-black backgrounds, emerald green accents, neutral gray scale) to AG Grid's `backgroundColor`, `headerBackgroundColor`, `borderColor`, `accentColor`, etc.
- **D-03:** Auto-switch dark/light via `next-themes` — detect `data-theme` class on document and apply corresponding AG Grid theme params. Single theme object with light/dark variants.
- **D-04:** Use Geist font (existing `@fontsource-variable/geist`) as AG Grid's `fontFamily` param to match app typography

### Wrapper Component Architecture
- **D-05:** Create `AgGridWrapper` component in `app/components/ag-grid/` with ClientOnly SSR safety wrapping — renders a loading skeleton until client hydration
- **D-06:** Wrapper provides shared defaults: pagination (25 rows), column resize, row selection, quick-filter search integration, loading overlay, empty state overlay
- **D-07:** Wrapper accepts `colDefs`, `rowData`, `detailCellRenderer`, and grid event callbacks as props — submodules compose by passing config, not rebuilding grid boilerplate
- **D-08:** Create a `mapColumnsToColDefs()` utility that converts existing `ColumnConfig[]` from `CrudModuleConfig` to AG Grid `ColDef[]` — preserves the registry pattern while enabling AG Grid features

### Detail Row Expansion
- **D-09:** Use AG Grid Community full-width detail rows (`fullWidthCellRenderer`) for row-click-to-expand across all submodules
- **D-10:** Accordion behavior — only one row expanded at a time. Clicking a new row collapses the previously expanded row.
- **D-11:** Each submodule provides its own detail row React component rendered inside the fullWidthCellRenderer — the wrapper handles expand/collapse mechanics

### Cell Renderers
- **D-12:** Status badge cell renderer — reuse Shadcn Badge component styled per status value (pending=amber, approved=green, denied=red, etc.) using DESIGN.md tokens
- **D-13:** Date formatting via AG Grid `valueFormatter` — locale-aware using `date-fns` (already in dependencies)
- **D-14:** Currency formatting via AG Grid `valueFormatter` — USD with 2 decimal places
- **D-15:** Employee avatar cell renderer — display `profile_photo_url` thumbnail with fallback initials, alongside employee name

### Register Conversion
- **D-16:** Replace `TableListView` (TanStack Table + `@aloha/ui/enhanced-data-table`) with AG Grid in the register (employees) submodule as proof-of-concept
- **D-17:** Keep existing side-panel create form (`CreatePanel` using Shadcn Sheet), toolbar search bar, and column visibility toggle — only replace the table rendering engine
- **D-18:** Extend `CrudModuleConfig` type with optional AG Grid-specific overrides (`agGridColDefs`, `agGridOptions`) so submodules can customize beyond the auto-mapped defaults
- **D-19:** Keep existing `loadTableData()` server loader and `crudBulkDeleteAction`/`crudBulkTransitionAction` actions — AG Grid consumes the same data shape

### Column Features
- **D-20:** Multi-column sorting enabled by default via AG Grid built-in
- **D-21:** Column filters: text filter for strings, number filter for numerics, date filter for date columns — using AG Grid built-in filter components
- **D-22:** Column resize and reorder enabled by default
- **D-23:** Column state persistence to localStorage — save column widths, order, visibility, and sort state per submodule slug
- **D-24:** CSV export via AG Grid Community `api.exportDataAsCsv()` — toolbar button

### Conditional Styling
- **D-25:** Use AG Grid `rowClassRules` and `cellClassRules` for conditional styling — OT warnings, variance highlighting, status-based row coloring
- **D-26:** Style classes use Tailwind CSS utility classes mapped to DESIGN.md tokens (amber for warnings, red for errors, green for success)

### Claude's Discretion
- Loading skeleton design and animation for ClientOnly wrapper
- Empty state overlay content and styling
- Exact AG Grid theme param values (will be derived from DESIGN.md during implementation)
- Column state persistence key format
- Detail row expand/collapse animation timing
- Quick-filter debounce timing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `DESIGN.md` — Complete Supabase-inspired color palette, typography, spacing tokens for dark and light themes. AG Grid theming must match these tokens.

### Existing CRUD Pattern
- `app/routes/workspace/sub-module.tsx` — Current sub-module list view route with loader, action, and component. This is the register pattern being converted.
- `app/components/crud/table-list-view.tsx` — Current TanStack Table implementation being replaced by AG Grid
- `app/components/crud/create-panel.tsx` — Side-panel create form (Shadcn Sheet) — kept as-is
- `app/lib/crud/types.ts` — `CrudModuleConfig`, `ColumnConfig`, `ListViewProps` type definitions
- `app/lib/crud/registry.ts` — Module config registry (`getModuleConfig()`)
- `app/lib/crud/hr-employee.config.ts` — Register submodule config — proof-of-concept target

### Requirements
- `.planning/REQUIREMENTS.md` §AG Grid Foundation — GRID-01 through GRID-15 requirements

### Project Context
- `.planning/PROJECT.md` — Constraints: AG Grid Community only, DESIGN.md compliance, replicate register pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CreatePanel` component (`app/components/crud/create-panel.tsx`): Side-panel form using Shadcn Sheet — reused as-is for AG Grid submodules
- `CrudModuleConfig` registry (`app/lib/crud/registry.ts`): Maps submodule slugs to table metadata, columns, form fields — AG Grid adapter builds on this
- `loadTableData()` (`app/lib/crud/crud-helpers.server.ts`): Server-side data loader with pagination, search, sort — returns data shape AG Grid consumes
- `loadFormOptions()` (`app/lib/crud/load-form-options.server.ts`): FK dropdown options loader — used by create/edit forms
- Shadcn `Sheet` component (`packages/ui/src/shadcn/sheet.tsx`): Base for side-panel CRUD forms
- Shadcn `Badge` component: Base for status badge cell renderer
- `date-fns` (v4.1.0): Already installed — use for date formatting in valueFormatters
- `next-themes`: Already installed — use for dark/light theme detection

### Established Patterns
- SSR-first with server loaders: Routes export `loader` + `default` component. AG Grid must work within this pattern (ClientOnly for the grid, server data via loader).
- `viewType` system in `CrudModuleConfig`: Already supports `'table' | 'kanban' | 'calendar' | 'dashboard' | 'custom'` — AG Grid could be a new view type or use custom view loader
- Sub-module route (`sub-module.tsx`): Uses `resolveListView()` to lazy-load custom views per config — AG Grid view can plug into this mechanism
- Column priority system: `ColumnConfig.priority` (`'high' | 'low'`) controls responsive visibility — map to AG Grid column `hide` property

### Integration Points
- `sub-module.tsx` route: Replace `TableListView` with AG Grid component, keeping same loader data flow
- `CrudModuleConfig.columns` → AG Grid `ColDef[]`: Adapter function maps existing column configs to AG Grid column definitions
- Toolbar area: Quick-filter search, column visibility toggle, CSV export button, create button all integrate above the AG Grid
- Theme provider: `next-themes` `data-theme` attribute on `<html>` element — AG Grid theme reads this to switch palettes

</code_context>

<specifics>
## Specific Ideas

- AG Grid HR example (https://www.ag-grid.com/example-hr/) serves as visual reference, adapted to our Supabase-inspired design system
- Full-width detail rows are the Community alternative to Enterprise Master/Detail — same click-to-expand UX without license cost
- TanStack Table remains for non-HR modules — AG Grid is added alongside, not replacing globally

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope

</deferred>

---

*Phase: 01-ag-grid-foundation*
*Context gathered: 2026-04-08*
