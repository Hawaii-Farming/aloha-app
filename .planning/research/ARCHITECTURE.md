# Architecture Patterns

**Domain:** HR Module AG Grid Submodules — integrating AG Grid Community into an existing React Router 7 SSR CRUD registry app
**Researched:** 2026-04-07

## Recommended Architecture

AG Grid slots into the existing architecture via the `customViews` mechanism already built into `CrudModuleConfig`. Each HR submodule registers `viewType: { list: 'custom' }` and provides a lazy-loaded AG Grid view component. The server-side loader/action pattern stays unchanged. AG Grid is a client-only component rendered inside a `<Suspense>` boundary that the existing `sub-module.tsx` route already provides.

### Architecture Diagram

```
                        sub-module.tsx (route — unchanged)
                              |
                    loader (SSR, Supabase query)
                              |
                    resolveListView(config)
                              |
              viewType === 'custom' ?
              /                       \
    lazy(() => import(               TableListView
      AgGridListView))              (TanStack Table — other modules)
              |
        <Suspense> boundary (already exists)
              |
    AgGridListView (client-only component)
      ├── AgGridWrapper (shared AG Grid setup, theme, column defs)
      │     ├── isFullWidthRow callback → full-width detail renderer
      │     ├── onRowClicked → toggle expanded row
      │     └── AG Grid theme (ag-theme-quartz + CSS variable overrides)
      ├── CreatePanel (existing Sheet component — unchanged)
      └── Toolbar (search, filters, bulk actions)
```

### Component Boundaries

| Component | Responsibility | Location | Communicates With |
|-----------|---------------|----------|-------------------|
| `sub-module.tsx` (route) | SSR data loading via `loader`, mutations via `action` | `app/routes/workspace/` | Registry, Supabase, view components |
| `AgGridListView` | Orchestrates AG Grid + toolbar + create panel for a submodule | `app/components/hr/ag-grid-list-view.tsx` | Receives `ListViewProps`, renders AG Grid |
| `AgGridWrapper` | Shared AG Grid `<AgGridReact>` setup — theme class, default props, event wiring | `app/components/hr/ag-grid-wrapper.tsx` | Consumes column defs + row data + callbacks |
| `FullWidthDetailRenderer` | Renders expanded row content (card layout inside full-width row) | `app/components/hr/full-width-detail-renderer.tsx` | Receives `ICellRendererParams`, renders detail card |
| Submodule-specific configs | Column definitions, detail renderer, custom cell renderers per submodule | `app/lib/crud/hr-*.config.ts` | Consumed by AgGridListView via registry |
| `CreatePanel` | Side-panel Sheet for create/edit forms | `app/components/crud/create-panel.tsx` (existing) | Uses `useFetcher` to POST to route action |
| `ag-grid-theme.css` | CSS variable overrides mapping DESIGN.md tokens to AG Grid variables | `app/styles/ag-grid-theme.css` | Imported by AgGridWrapper |

### SSR Safety: Why This Works Without Hacks

AG Grid is a DOM-heavy library that cannot render on the server. The existing architecture already solves this:

1. `sub-module.tsx` calls `resolveListView(config)` which returns `lazy(loader)` for custom views
2. `lazy()` returns a component that only loads on the client
3. The `<Suspense fallback={...}>` already wraps the view component in `sub-module.tsx`
4. During SSR, React renders the fallback ("Loading view..."), not the AG Grid component
5. After hydration, the lazy import resolves and AG Grid renders client-side

**No `clientLoader`, no `HydrateFallback`, no `typeof window` checks needed.** The lazy import + Suspense pattern that exists today is the correct SSR-safe approach for React Router 7.

## Data Flow

### List View (Read)

```
1. Browser navigates to /home/:account/hr/:subModule
2. sub-module.tsx loader runs on server:
   - getModuleConfig(subModuleSlug) → CrudModuleConfig
   - loadTableData() → queries Supabase view (org-scoped via RLS)
   - loadFormOptions() → FK dropdown data
   - Returns { config, tableData, fkOptions, ... }
3. sub-module.tsx component renders:
   - resolveListView(config) → lazy(() => import('AgGridListView'))
   - <Suspense> renders fallback during SSR
   - Client hydrates → lazy import resolves → AgGridListView mounts
4. AgGridListView receives ListViewProps:
   - Maps config.columns → AG Grid ColDef[]
   - Passes tableData.data as rowData
   - Wires isFullWidthRow + fullWidthCellRenderer for detail expansion
```

### Row Expansion (Full-Width Detail Row)

```
1. User clicks a row in AG Grid
2. onRowClicked handler toggles an "expanded" flag on the row data
3. Grid re-evaluates isFullWidthRow(params) → returns true for expanded rows
4. AG Grid renders fullWidthCellRenderer for that row
5. FullWidthDetailRenderer shows detail card (employee info, schedule, etc.)
6. Click again → collapse (remove expanded flag, refresh row)
```

**Key decision:** Full-width detail rows replace the existing `sub-module-detail.tsx` navigation pattern for HR submodules. Instead of navigating to `/home/:account/hr/:subModule/:recordId`, the detail expands inline. This is a UX departure from the card-detail-view pattern used by other modules but is explicitly required by the AG Grid HR reference design.

### Create/Edit (Write)

```
1. User clicks "Create" button → opens CreatePanel (existing Sheet)
2. CreatePanel renders form using config.formFields
3. Form submits via useFetcher POST to sub-module-create.tsx action
4. Action validates with Zod, calls crudCreateAction()
5. On success → revalidator.revalidate() → loader re-runs → AG Grid gets fresh data
```

The create/edit flow is completely unchanged from the existing pattern. The `CreatePanel` component works identically whether the list view is TanStack Table or AG Grid.

### Inline Status Toggle (Time Off, etc.)

```
1. User clicks status badge in AG Grid cell (custom cell renderer)
2. Cell renderer calls useFetcher.submit({ intent: 'bulk_transition', ids: [rowId], ... })
3. sub-module.tsx action handles bulk_transition
4. Revalidation refreshes the grid data
```

## AG Grid Column Definition Strategy

The existing `ColumnConfig` type maps cleanly to AG Grid `ColDef`. Build a shared mapper:

```typescript
// app/components/hr/map-column-defs.ts
import type { ColDef } from 'ag-grid-community';
import type { ColumnConfig } from '~/lib/crud/types';

function mapColumnConfigToColDef(col: ColumnConfig): ColDef {
  const def: ColDef = {
    field: col.key,
    headerName: col.label,
    sortable: col.sortable ?? false,
    hide: col.priority === 'low',
  };

  // Map existing render hints to AG Grid valueFormatters/cellRenderers
  if (col.render === 'full_name') {
    def.valueGetter = (params) => {
      const first = params.data?.first_name ?? '';
      const last = params.data?.last_name ?? '';
      return `${last}, ${first}`.replace(/(^, |, $)/, '');
    };
  }

  if (col.type === 'date' || col.type === 'datetime') {
    def.valueFormatter = (params) => {
      if (!params.value) return '';
      const d = new Date(params.value);
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    };
  }

  return def;
}
```

This reuses the same `ColumnConfig` objects already defined in each `*.config.ts` file. No duplication of column metadata.

## Theming Strategy

AG Grid Quartz theme + CSS variable overrides to match DESIGN.md tokens:

```css
/* app/styles/ag-grid-theme.css */
.ag-theme-quartz,
.ag-theme-quartz-dark {
  /* Map Shadcn/Tailwind CSS variables to AG Grid variables */
  --ag-background-color: hsl(var(--background));
  --ag-foreground-color: hsl(var(--foreground));
  --ag-border-color: hsl(var(--border));
  --ag-header-background-color: hsl(var(--muted));
  --ag-header-foreground-color: hsl(var(--muted-foreground));
  --ag-row-hover-color: hsl(var(--accent));
  --ag-selected-row-background-color: hsl(var(--accent));
  --ag-font-family: var(--font-sans); /* Geist */
  --ag-font-size: 13px;
  --ag-grid-size: 4px;
}
```

Use `ag-theme-quartz` for light mode and `ag-theme-quartz-dark` for dark mode. Toggle based on `next-themes` theme value (already available via `useTheme()`). AG Grid v35 has native dark mode support with `--ag-browser-color-scheme: dark`.

## Coexistence with TanStack Table

AG Grid replaces TanStack Table **only for HR submodules**. All other modules (inventory, food safety, grow, ops) continue using `TableListView` (TanStack Table). The mechanism is the existing `viewType` field in `CrudModuleConfig`:

| Module | `viewType.list` | View Component |
|--------|-----------------|----------------|
| HR Register | `'custom'` | `AgGridListView` (lazy) |
| HR Time Off | `'custom'` | `AgGridListView` (lazy) |
| HR Scheduler | `'custom'` | `SchedulerGridView` (lazy, specialized) |
| Inventory Products | `'table'` (default) | `TableListView` (TanStack) |
| Food Safety | `'table'` (default) | `TableListView` (TanStack) |

The `resolveListView()` function in `sub-module.tsx` already handles this branching. No changes needed to the route file.

## Patterns to Follow

### Pattern 1: Registry-Driven AG Grid Config

**What:** Each HR submodule config adds AG Grid-specific metadata to its existing `CrudModuleConfig`, plus a `customViews.list` lazy import.

**When:** Every HR submodule that uses AG Grid.

**Example:**
```typescript
// app/lib/crud/hr-time-off.config.ts (additions)
export const hrTimeOffConfig: CrudModuleConfig = {
  // ... existing fields unchanged ...

  viewType: { list: 'custom' },
  customViews: {
    list: () => import('~/components/hr/views/time-off-list-view'),
  },

  // AG Grid-specific (new optional field on CrudModuleConfig)
  agGrid?: {
    fullWidthDetailRenderer: () => import('~/components/hr/details/time-off-detail'),
    statusCellRenderer: () => import('~/components/hr/cells/status-toggle-cell'),
  },
};
```

### Pattern 2: Shared AgGridWrapper with Submodule-Specific Renderers

**What:** One shared wrapper component handles AG Grid instantiation, theming, and common behaviors. Submodule-specific renderers (full-width detail, custom cells) are injected via config.

**When:** Always. Avoid creating per-submodule grid components that duplicate setup.

**Example:**
```typescript
// app/components/hr/ag-grid-wrapper.tsx
interface AgGridWrapperProps {
  rowData: Record<string, unknown>[];
  columnDefs: ColDef[];
  fullWidthCellRenderer?: ComponentType;
  onRowClicked?: (event: RowClickedEvent) => void;
}

export function AgGridWrapper({
  rowData,
  columnDefs,
  fullWidthCellRenderer,
  onRowClicked,
}: AgGridWrapperProps) {
  const { theme } = useTheme();
  const themeClass = theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz';

  return (
    <div className={`${themeClass} flex-1`}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        isFullWidthRow={fullWidthCellRenderer ? (params) => params.rowNode.data?.__expanded : undefined}
        fullWidthCellRenderer={fullWidthCellRenderer}
        onRowClicked={onRowClicked}
        domLayout="autoHeight"
        suppressMovableColumns
        suppressCellFocus
      />
    </div>
  );
}
```

### Pattern 3: Expand-in-Place via Row Data Flag

**What:** Track expanded state by mutating the row data object with an `__expanded` boolean, then refresh the row node. AG Grid re-evaluates `isFullWidthRow` on refresh.

**When:** Any submodule with row-click-to-expand detail.

**Example:**
```typescript
const handleRowClicked = useCallback((event: RowClickedEvent) => {
  const rowNode = event.node;
  const data = rowNode.data;
  data.__expanded = !data.__expanded;
  // Refresh this single row so isFullWidthRow re-evaluates
  event.api.refreshCells({ rowNodes: [rowNode], force: true });
  // Alternatively, use redrawRows for full-width row toggle:
  event.api.redrawRows({ rowNodes: [rowNode] });
}, []);
```

**Important:** `refreshCells` may not trigger `isFullWidthRow` re-evaluation. Use `api.redrawRows({ rowNodes: [rowNode] })` which forces the row to be recreated, picking up the full-width change.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Per-Submodule Route Files

**What:** Creating separate route files for each HR submodule (e.g., `hr-time-off.tsx`, `hr-scheduler.tsx`).

**Why bad:** The generic `sub-module.tsx` + registry pattern exists precisely to avoid this. Adding route files defeats the purpose of the CRUD factory.

**Instead:** Use the existing generic route + `viewType: 'custom'` + `customViews.list` lazy import pattern.

### Anti-Pattern 2: AG Grid Server-Side Row Model

**What:** Using AG Grid's SSRM (`rowModelType: 'serverSide'`) to fetch data from Supabase.

**Why bad:** SSRM bypasses the loader pattern entirely. Data would flow AG Grid -> custom datasource -> Supabase, skipping RLS context, org-scoping, and the existing `loadTableData()` helper. Also, SSRM is an Enterprise-only feature.

**Instead:** Load all page data in the route loader (existing pattern). Pass as `rowData` prop. For pagination, continue using URL search params + loader re-runs. AG Grid Community's client-side row model with the data pre-loaded from the loader is the correct approach.

### Anti-Pattern 3: Inline Editing via AG Grid's Cell Editor

**What:** Using AG Grid's built-in cell editing to modify records directly in the grid.

**Why bad:** Bypasses Zod validation, form structure, and the action/fetcher mutation pattern. Makes it hard to handle errors, optimistic updates, and auth checks consistently.

**Instead:** Use the existing CreatePanel (Sheet) for edit operations, or build an EditPanel that opens on row double-click with the form pre-filled.

### Anti-Pattern 4: Direct DOM Theme Manipulation

**What:** Using AG Grid's JavaScript Theming API (`createTheme()`) to set colors imperatively.

**Why bad:** Fights against Tailwind CSS 4's CSS-variable-first approach and `next-themes` dark mode toggle.

**Instead:** Use CSS variable overrides in a stylesheet that maps Shadcn CSS variables to AG Grid CSS variables. Theme switches automatically when `next-themes` toggles the `dark` class.

## Scalability Considerations

| Concern | Current (< 500 rows) | At 5K rows | At 50K+ rows |
|---------|----------------------|------------|--------------|
| Data loading | Loader fetches all rows, passes as rowData | Add server-side pagination via URL params (already supported) | Must paginate; AG Grid client-side model handles virtual scrolling for rendered rows |
| Sort/Filter | Can be client-side in AG Grid | Mix: initial sort server-side, filter client-side | Must be server-side; wire AG Grid sort/filter events to URL param updates |
| Full-width rows | No performance concern | Moderate — expanded rows add DOM nodes | Limit to one expanded row at a time to control DOM size |
| Bundle size | ag-grid-community ~300KB gzipped | Same | Same — no additional cost per row |

## Suggested Build Order

Based on component dependencies:

1. **Foundation (build first)**
   - Install `ag-grid-community` + `ag-grid-react` (v35.x)
   - Create `ag-grid-theme.css` with CSS variable mappings
   - Create `AgGridWrapper` shared component
   - Create `mapColumnConfigToColDef()` utility
   - Create `AgGridListView` base component (implements `ListViewProps`)
   - Wire one existing config (register/hr-employee) to use `viewType: 'custom'` as proof-of-concept

2. **Full-width detail rows**
   - Create `FullWidthDetailRenderer` base component
   - Implement expand/collapse via `__expanded` flag + `redrawRows`
   - Build employee detail renderer as first implementation

3. **Standard submodules (parallel)**
   - Time Off (adds status filter tabs, workflow cell renderer)
   - Housing (adds computed fields — available beds)
   - Payroll Data (read-only table, straightforward)

4. **Complex submodules (after standard)**
   - Scheduler (weekly grid view — custom layout, not just a table)
   - Hours Comparison (computed view, two data sources)
   - Payroll Comparison (two table views in one submodule)
   - Employee Review (new migration + form + quarterly filters)

5. **Payroll Comp Manager (last — needs schema investigation)**

## Sources

- [AG Grid Full-Width Rows Documentation](https://www.ag-grid.com/react-data-grid/full-width-rows/)
- [AG Grid React Quick Start](https://www.ag-grid.com/react-data-grid/getting-started/)
- [AG Grid Theming with CSS](https://www.ag-grid.com/react-data-grid/theming-css/)
- [AG Grid Community vs Enterprise](https://www.ag-grid.com/react-data-grid/community-vs-enterprise/)
- [React Router Client Data (clientLoader)](https://reactrouter.com/how-to/client-data)
- [AG Grid with Remix (React Router predecessor)](https://dev.to/ag-grid/using-ag-grid-react-ui-with-remixrun-4g3n)
- [AG Grid npm package](https://www.npmjs.com/package/ag-grid-react) — v35.1.0 current, React 19 support since v34.3.0
