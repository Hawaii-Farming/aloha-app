# Phase 01: AG Grid Foundation - Research

**Researched:** 2026-04-08
**Domain:** AG Grid Community v35, React SSR integration, theme bridging, CRUD registry adaptation
**Confidence:** HIGH

## Summary

AG Grid Community v35.2.1 provides all features required for this phase: the Theming API (`themeQuartz.withParams()`), full-width rows, CSV export, column state management, built-in sorting/filtering/pagination, and column resize/reorder. No Enterprise features are needed.

The primary technical challenge is bridging AG Grid's theming system with the existing `next-themes` dark/light mode infrastructure and DESIGN.md color tokens. AG Grid v35 supports `data-ag-theme-mode` on parent elements for automatic dark/light switching, but `next-themes` uses `class="dark"` on `<html>` (via `attribute="class"`). The solution is to set `data-ag-theme-mode` on the AG Grid wrapper div, reading the current theme from `next-themes` `useTheme()` hook. The existing `ClientOnly` component from `@aloha/ui/client-only` handles SSR safety.

The register submodule conversion is well-scoped: the existing `CrudModuleConfig` registry, `loadTableData()` server loader, `CreatePanel` side-panel form, and `BulkActions` component all remain unchanged. Only the `TableListView` rendering engine (currently TanStack Table via `@aloha/ui/enhanced-data-table`) gets replaced with AG Grid. The `resolveListView()` mechanism in `sub-module.tsx` already supports custom view types, providing a clean integration point.

**Primary recommendation:** Install `ag-grid-react` (which pulls `ag-grid-community` automatically), create a shared `AgGridWrapper` in `app/components/ag-grid/`, bridge theme tokens via `themeQuartz.withParams()` with light/dark modes, build cell renderers as standalone React components, and convert the register submodule as the proof-of-concept.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use AG Grid v35 Theming API (`themeQuartz.withParams()`) to define theme parameters in JS -- no separate AG Grid CSS override file
- **D-02:** Bridge DESIGN.md color tokens to AG Grid params -- map Supabase-inspired dark/light palette to AG Grid's backgroundColor, headerBackgroundColor, borderColor, accentColor, etc.
- **D-03:** Auto-switch dark/light via `next-themes` -- detect data-theme class on document and apply corresponding AG Grid theme params. Single theme object with light/dark variants.
- **D-04:** Use Geist font as AG Grid's fontFamily param
- **D-05:** Create `AgGridWrapper` component in `app/components/ag-grid/` with ClientOnly SSR safety wrapping
- **D-06:** Wrapper provides shared defaults: pagination (25 rows), column resize, row selection, quick-filter search integration, loading overlay, empty state overlay
- **D-07:** Wrapper accepts `colDefs`, `rowData`, `detailCellRenderer`, and grid event callbacks as props
- **D-08:** Create a `mapColumnsToColDefs()` utility that converts existing `ColumnConfig[]` from `CrudModuleConfig` to AG Grid `ColDef[]`
- **D-09:** Use AG Grid Community full-width detail rows (`fullWidthCellRenderer`) for row-click-to-expand
- **D-10:** Accordion behavior -- only one row expanded at a time
- **D-11:** Each submodule provides its own detail row React component
- **D-12:** Status badge cell renderer -- reuse Shadcn Badge component
- **D-13:** Date formatting via AG Grid `valueFormatter` -- locale-aware using `date-fns`
- **D-14:** Currency formatting via AG Grid `valueFormatter` -- USD with 2 decimal places
- **D-15:** Employee avatar cell renderer -- display `profile_photo_url` thumbnail with fallback initials
- **D-16:** Replace `TableListView` with AG Grid in register submodule as proof-of-concept
- **D-17:** Keep existing side-panel create form, toolbar search bar, and column visibility toggle
- **D-18:** Extend `CrudModuleConfig` type with optional AG Grid-specific overrides
- **D-19:** Keep existing `loadTableData()` server loader and bulk actions
- **D-20:** Multi-column sorting enabled by default
- **D-21:** Column filters: text filter for strings, number filter for numerics, date filter for dates
- **D-22:** Column resize and reorder enabled by default
- **D-23:** Column state persistence to localStorage per submodule slug
- **D-24:** CSV export via `api.exportDataAsCsv()` -- toolbar button
- **D-25:** Use AG Grid `rowClassRules` and `cellClassRules` for conditional styling
- **D-26:** Style classes use Tailwind CSS utility classes mapped to DESIGN.md tokens

### Claude's Discretion
- Loading skeleton design and animation for ClientOnly wrapper
- Empty state overlay content and styling
- Exact AG Grid theme param values (derived from DESIGN.md during implementation)
- Column state persistence key format
- Detail row expand/collapse animation timing
- Quick-filter debounce timing

### Deferred Ideas (OUT OF SCOPE)
None -- analysis stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GRID-01 | AG Grid Community v35.x installed as project dependency | `ag-grid-react` 35.2.1 verified on npm; single package install pulls `ag-grid-community` |
| GRID-02 | Shared `AgGridWrapper` with ClientOnly SSR safety, stable props, loading/empty overlays | Existing `ClientOnly` from `@aloha/ui/client-only` + `useHydrated()` hook; AG Grid `AgGridProvider` pattern for module registration |
| GRID-03 | AG Grid themed to DESIGN.md using Theming API v35 | `themeQuartz.withParams()` with light/dark mode support via `data-ag-theme-mode`; CSS token values from `shadcn-ui.css` |
| GRID-04 | Full-width detail row for row-click-to-expand | `isFullWidthRow` + `fullWidthCellRenderer` -- Community feature, no Enterprise needed |
| GRID-05 | Column sorting, filtering, quick-filter search | AG Grid built-in: multi-column sort, text/number/date filters, `quickFilterText` prop |
| GRID-06 | Column resize, reorder, responsive hiding | AG Grid defaults + `ColumnConfig.priority` mapped to `hide` property |
| GRID-07 | Pagination on all grids | AG Grid `pagination={true}` + `paginationPageSize={25}` -- client-side pagination with server-loaded data |
| GRID-08 | Side-panel CRUD forms (Shadcn Sheet) | Existing `CreatePanel` component kept as-is; triggered from toolbar button |
| GRID-09 | Status badge cell renderer | Custom `cellRenderer` React component using Shadcn `Badge` |
| GRID-10 | Date/currency formatting via valueFormatters | AG Grid `valueFormatter` with `date-fns` for dates, `Intl.NumberFormat` for currency |
| GRID-11 | Employee photo/avatar cell renderer | Custom `cellRenderer` with `profile_photo_url` + fallback initials |
| GRID-12 | Column state persistence to localStorage | `api.getColumnState()` + `api.applyColumnState()` on `onColumnMoved`/`onColumnResized`/`onSortChanged` events |
| GRID-13 | CSV export | `api.exportDataAsCsv()` -- Community feature, toolbar button triggers |
| GRID-14 | Conditional row/cell styling | `rowClassRules` + `cellClassRules` with Tailwind classes for semantic colors |
| GRID-15 | Convert register submodule from TanStack Table to AG Grid | Replace `TableListView` usage via `resolveListView()` in `sub-module.tsx` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ag-grid-react | 35.2.1 | React wrapper for AG Grid | Only package needed; pulls ag-grid-community as dependency [VERIFIED: npm registry] |
| ag-grid-community | 35.2.1 | Core grid engine | Auto-installed with ag-grid-react [VERIFIED: npm registry] |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Date formatting in valueFormatters | Date column formatting [VERIFIED: pnpm-workspace.yaml catalog] |
| next-themes | 0.4.6 | Theme detection for dark/light switching | AG Grid theme mode bridging [VERIFIED: package.json] |
| @aloha/ui (ClientOnly) | workspace | SSR safety wrapper | AG Grid hydration prevention [VERIFIED: packages/ui/src/kit/client-only.tsx] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ag-grid-react | TanStack Table (existing) | TanStack is headless (no built-in UI), requires building all features manually; AG Grid provides sorting, filtering, pagination, CSV export out of box |
| Client-side AG Grid pagination | Server-side pagination (existing) | Current `loadTableData()` does server-side pagination; AG Grid will receive all page data from loader and do client-side display -- this matches existing pattern where loader returns paged data |

**Installation:**
```bash
pnpm add ag-grid-react
```

Note: `ag-grid-community` is automatically installed as a dependency of `ag-grid-react`. Do NOT install it separately. [VERIFIED: npm registry dependency tree]

## Architecture Patterns

### Recommended Project Structure
```
app/components/ag-grid/
  ag-grid-wrapper.tsx         # Shared wrapper with ClientOnly, theme, defaults
  ag-grid-theme.ts            # themeQuartz.withParams() config (light + dark modes)
  cell-renderers/
    status-badge-renderer.tsx  # Shadcn Badge-based status cell renderer
    avatar-renderer.tsx        # Employee photo/initials cell renderer
    date-formatter.ts          # valueFormatter function for date columns
    currency-formatter.ts      # valueFormatter function for currency columns
  column-mapper.ts             # mapColumnsToColDefs() utility
  column-state.ts              # localStorage persistence helpers
  detail-row-wrapper.tsx       # Full-width detail row expand/collapse mechanics

app/lib/crud/types.ts          # Extended with AG Grid overrides (agGridColDefs, agGridOptions)
```

### Pattern 1: AgGridWrapper with SSR Safety
**What:** A wrapper component that handles ClientOnly rendering, theme bridging, and shared grid defaults
**When to use:** Every AG Grid instance in the application
**Example:**
```typescript
// Source: verified from packages/ui/src/kit/client-only.tsx + AG Grid docs
import { AllCommunityModule } from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

import { ClientOnly } from '@aloha/ui/client-only';

import { getAgGridTheme } from '~/components/ag-grid/ag-grid-theme';

interface AgGridWrapperProps {
  colDefs: ColDef[];
  rowData: Record<string, unknown>[];
  // ...other props
}

export function AgGridWrapper({ colDefs, rowData, ...props }: AgGridWrapperProps) {
  return (
    <ClientOnly fallback={<GridSkeleton />}>
      <AgGridInner colDefs={colDefs} rowData={rowData} {...props} />
    </ClientOnly>
  );
}

function AgGridInner({ colDefs, rowData, ...props }: AgGridWrapperProps) {
  const { resolvedTheme } = useTheme();
  const theme = useMemo(() => getAgGridTheme(), []);

  return (
    <div data-ag-theme-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}>
      <AgGridProvider modules={[AllCommunityModule]}>
        <AgGridReact
          theme={theme}
          columnDefs={colDefs}
          rowData={rowData}
          pagination={true}
          paginationPageSize={25}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
          }}
          {...props}
        />
      </AgGridProvider>
    </div>
  );
}
```

### Pattern 2: Theme Bridging with DESIGN.md Tokens
**What:** Map CSS custom properties from DESIGN.md to AG Grid theme params for both light and dark modes
**When to use:** AG Grid theme configuration
**Example:**
```typescript
// Source: AG Grid docs (theming-colors) + shadcn-ui.css tokens
import { colorSchemeDark, colorSchemeLight, themeQuartz } from 'ag-grid-community';

export function getAgGridTheme() {
  return themeQuartz
    .withParams({
      fontFamily: "'Geist Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSize: 14,
      headerFontSize: 13,
      // Light mode colors from shadcn-ui.css :root
      backgroundColor: '#f5f5f5',       // --background oklch(96.5%)
      foregroundColor: '#2b2b2b',       // --foreground oklch(20%)
      headerBackgroundColor: '#f0f0f0', // --secondary oklch(93%)
      borderColor: '#d4d4d4',           // --border oklch(87%)
      accentColor: '#1d9e65',           // --ring oklch(47% 0.165 160)
      browserColorScheme: 'light',
    }, 'light')
    .withParams({
      // Dark mode colors from shadcn-ui.css .dark
      backgroundColor: '#262626',       // --background oklch(18%)
      foregroundColor: '#e8e8e8',       // --foreground oklch(95%)
      headerBackgroundColor: '#2e2e2e', // --secondary oklch(25%)
      borderColor: '#404040',           // --border oklch(27%)
      accentColor: '#3ecf8e',           // --ring oklch(73.5% 0.158 162)
      browserColorScheme: 'dark',
    }, 'dark');
}
```
**Critical detail:** The mode string passed to `withParams()` ('light'/'dark') must match the value set on `data-ag-theme-mode`. [CITED: ag-grid.com/react-data-grid/theming-colors/]

### Pattern 3: Full-Width Detail Rows (Accordion)
**What:** Click a row to expand a full-width detail panel below it; only one expanded at a time
**When to use:** All submodule grids for row-click-to-expand
**Example:**
```typescript
// Source: AG Grid docs (full-width-rows)
const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

const isFullWidthRow = useCallback(
  (params: IsFullWidthRowParams) => {
    return params.rowNode.data?._isDetailRow === true;
  },
  [],
);

// Accordion: clicking a row toggles its detail row in the data array
const onRowClicked = useCallback(
  (params: RowClickedEvent) => {
    const clickedId = params.data?.[pkColumn];
    // Toggle logic: add/remove detail row from rowData
    // Only one detail row at a time (accordion behavior)
  },
  [expandedRowId],
);
```

### Pattern 4: Column Mapper (Registry Adapter)
**What:** Convert existing `ColumnConfig[]` from `CrudModuleConfig` to AG Grid `ColDef[]`
**When to use:** Every submodule that uses the CRUD registry pattern
**Example:**
```typescript
// Source: app/lib/crud/types.ts ColumnConfig interface
import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { ColumnConfig } from '~/lib/crud/types';

export function mapColumnsToColDefs(columns: ColumnConfig[]): ColDef[] {
  return columns.map((col) => {
    const colDef: ColDef = {
      field: col.key,
      headerName: col.label,
      sortable: col.sortable ?? true,
      filter: getFilterType(col.type),
      hide: col.priority === 'low',
    };

    if (col.type === 'date' || col.type === 'datetime') {
      colDef.valueFormatter = dateFormatter;
    }
    if (col.render === 'full_name') {
      colDef.valueGetter = (params) => {
        const first = params.data?.first_name ?? '';
        const last = params.data?.last_name ?? '';
        return `${last}, ${first}`.replace(/(^, |, $)/, '');
      };
    }
    if (col.render === 'proper_case') {
      colDef.valueFormatter = properCaseFormatter;
    }

    return colDef;
  });
}
```

### Anti-Patterns to Avoid
- **Importing AG Grid in server files:** AG Grid is browser-only. Never import `ag-grid-react` or `ag-grid-community` in `.server.ts` files. The `AgGridWrapper` with `ClientOnly` prevents SSR rendering.
- **Creating separate CSS files for AG Grid theming:** D-01 explicitly requires using `themeQuartz.withParams()` in JS. Do not create `.ag-grid-theme.css` or override AG Grid CSS variables directly.
- **Using `useEffect` to detect theme:** Use `next-themes` `useTheme()` hook + `data-ag-theme-mode` attribute. Do not add a `useEffect` with MutationObserver to watch class changes.
- **Server-side pagination through AG Grid:** The existing `loadTableData()` already handles server-side pagination. AG Grid receives a single page of data from the loader. Do not configure AG Grid's server-side row model.
- **Replacing TanStack Table globally:** AG Grid is only for HR submodules. TanStack Table remains for non-HR modules. Do not remove `@tanstack/react-table` dependency.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Column sorting | Custom sort comparators | AG Grid built-in `sortable: true` | Multi-column sort, sort icons, asc/desc/none cycle all built-in |
| Column filtering | Custom filter dropdowns | AG Grid built-in `filter: 'agTextColumnFilter'` etc. | Text, number, date filters with UI components included |
| Column resize/reorder | Drag handle + resize logic | AG Grid built-in `resizable: true` | Handles edge cases (min/max width, flex columns, header drag) |
| CSV export | `Blob` + manual CSV serialization | `api.exportDataAsCsv()` | Handles value formatters, column visibility, special characters |
| Pagination controls | Custom page buttons | AG Grid `pagination={true}` | Page size selector, page navigation, row count display built-in |
| Dark/light theme switching | MutationObserver + manual CSS vars | `data-ag-theme-mode` + `withParams()` modes | AG Grid handles all internal CSS variable switching |
| Column state serialization | Manual JSON.stringify of column config | `api.getColumnState()` / `api.applyColumnState()` | Captures width, order, visibility, sort, pinned state as one object |

**Key insight:** AG Grid Community v35 provides ~90% of required grid features out of the box. The custom work is limited to: (1) theme bridging to DESIGN.md tokens, (2) cell renderers for domain-specific display (status badge, avatar), (3) full-width detail row expand/collapse orchestration, and (4) the `mapColumnsToColDefs()` adapter from the existing registry pattern.

## Common Pitfalls

### Pitfall 1: SSR Hydration Mismatch
**What goes wrong:** AG Grid renders different HTML on server vs client, causing React hydration errors
**Why it happens:** AG Grid accesses browser APIs (`window`, `document`) during render
**How to avoid:** Wrap with `ClientOnly` from `@aloha/ui/client-only`. Never conditionally render AG Grid based on `typeof window` -- use the dedicated `useHydrated()` hook.
**Warning signs:** Console errors about "Text content does not match server-rendered HTML"

### Pitfall 2: Theme Mode Not Switching
**What goes wrong:** AG Grid stays in light mode when user switches to dark mode
**Why it happens:** `data-ag-theme-mode` must be set on a parent element of the grid. If set on a sibling or the grid element itself, it may not work. Also, the mode string ('dark'/'light') must exactly match the second argument to `withParams()`.
**How to avoid:** Set `data-ag-theme-mode` on the immediate wrapper div around `AgGridReact`. Use `resolvedTheme` from `useTheme()` (not `theme` which can be 'system').
**Warning signs:** Grid renders with default colors instead of custom palette

### Pitfall 3: Infinite Re-renders from Unstable Props
**What goes wrong:** AG Grid re-initializes on every React render, causing flickers and performance issues
**Why it happens:** New object/array references created in render for `columnDefs`, `defaultColDef`, `theme`, `rowClassRules`
**How to avoid:** Memoize all object/array props with `useMemo`. Memoize callbacks with `useCallback`. Define `defaultColDef` and theme outside the component or in a `useMemo`.
**Warning signs:** Grid flickering, slow renders, "Maximum update depth exceeded" errors

### Pitfall 4: Full-Width Row Data Shape Confusion
**What goes wrong:** Full-width rows don't receive column-specific data; trying to access `params.value` or `params.column` returns undefined
**Why it happens:** Full-width cell renderer receives `params.data` (entire row) but not `params.value` or `params.column` -- it's not tied to any column
**How to avoid:** In `fullWidthCellRenderer`, always access data via `params.data.fieldName`, never `params.value`
**Warning signs:** Undefined values in detail row content

### Pitfall 5: Column State Persistence Conflicts
**What goes wrong:** Saved column state includes columns that no longer exist (after config changes), causing silent failures
**Why it happens:** `api.applyColumnState()` returns `false` for unknown columns but doesn't throw
**How to avoid:** Validate restored state against current column definitions. Include a version key in localStorage. Clear state on config changes.
**Warning signs:** Columns appearing in wrong order, hidden columns not showing

### Pitfall 6: AG Grid CSS Not Loading
**What goes wrong:** Grid renders as unstyled HTML table or completely empty
**Why it happens:** AG Grid v35 with Theming API does NOT require importing CSS files -- the theme is applied via the `theme` prop. But if using `AllCommunityModule`, modules must be registered via `AgGridProvider`.
**How to avoid:** Use `AgGridProvider` with `modules={[AllCommunityModule]}` wrapping the grid. Do NOT import `ag-grid-community/styles/ag-grid.css` or `ag-grid-community/styles/ag-theme-quartz.css` -- these are for the legacy theming approach.
**Warning signs:** Grid has no styling, or console warning about missing modules

## Code Examples

### CSV Export Toolbar Button
```typescript
// Source: AG Grid docs (csv-export) - Community feature
import type { GridApi } from 'ag-grid-community';
import { Download } from 'lucide-react';

import { Button } from '@aloha/ui/button';

interface CsvExportButtonProps {
  gridApi: GridApi | null;
  fileName?: string;
}

export function CsvExportButton({ gridApi, fileName = 'export' }: CsvExportButtonProps) {
  const handleExport = useCallback(() => {
    gridApi?.exportDataAsCsv({
      fileName: `${fileName}-${new Date().toISOString().split('T')[0]}.csv`,
    });
  }, [gridApi, fileName]);

  return (
    <Button size="sm" variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
```

### Column State Persistence
```typescript
// Source: AG Grid docs (column-state)
const STORAGE_PREFIX = 'ag-grid-state-';

export function saveColumnState(subModuleSlug: string, api: GridApi) {
  const state = api.getColumnState();
  localStorage.setItem(
    `${STORAGE_PREFIX}${subModuleSlug}`,
    JSON.stringify(state),
  );
}

export function restoreColumnState(subModuleSlug: string, api: GridApi) {
  const saved = localStorage.getItem(`${STORAGE_PREFIX}${subModuleSlug}`);
  if (saved) {
    const state = JSON.parse(saved);
    api.applyColumnState({ state, applyOrder: true });
  }
}
```

### Status Badge Cell Renderer
```typescript
// Source: Shadcn Badge component + DESIGN.md semantic tokens
import { Badge } from '@aloha/ui/badge';

import type { CustomCellRendererProps } from 'ag-grid-react';

const statusVariantMap: Record<string, 'default' | 'destructive' | 'secondary'> = {
  approved: 'default',    // Uses semantic-green via custom variant
  pending: 'secondary',   // Uses semantic-amber via custom variant  
  denied: 'destructive',  // Uses semantic-red
};

export function StatusBadgeRenderer(props: CustomCellRendererProps) {
  const value = props.value as string;
  if (!value) return null;

  const variant = statusVariantMap[value.toLowerCase()] ?? 'secondary';

  return (
    <Badge variant={variant} className="capitalize">
      {value}
    </Badge>
  );
}
```

### Quick-Filter Integration
```typescript
// Source: AG Grid docs (filter-quick)
// Quick filter text is passed as a prop to AgGridReact
<AgGridReact
  quickFilterText={searchValue}
  cacheQuickFilter={true}
  // ... other props
/>

// In toolbar, debounced search input updates searchValue state
// Recommended debounce: 300ms (Claude's discretion)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Import CSS files for theming | `themeQuartz.withParams()` JS API | AG Grid v33 (2024) | No CSS imports needed; theme is a JS object passed as prop [CITED: ag-grid.com/react-data-grid/theming-migration/] |
| `ModuleRegistry.registerModules()` | `AgGridProvider` component | AG Grid v35.1 (2025) | Centralized module registration via React context [CITED: ag-grid.com/react-data-grid/installation/] |
| `gridApi` from `onGridReady` callback | `useRef` on `AgGridReact` | AG Grid v31+ | Access API via `gridRef.current.api` instead of storing in state [ASSUMED] |
| `columnApi` separate from `gridApi` | Merged into `gridApi` | AG Grid v31 | All column methods available on single `api` object [ASSUMED] |

**Deprecated/outdated:**
- `ag-theme-quartz` CSS class approach: replaced by `theme` prop with Theming API
- `@ag-grid-community/react` scoped package: replaced by `ag-grid-react` monolithic package
- `columnApi` object: merged into `gridApi` -- all column methods on single API

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `gridRef.current.api` is the recommended way to access AG Grid API in v35 | State of the Art | Would need to use `onGridReady` callback pattern instead -- minor code change |
| A2 | `columnApi` was merged into `gridApi` in v31 | State of the Art | Would need separate `columnApi` for column state methods -- moderate refactor |
| A3 | `AllCommunityModule` includes CSV export module | Standard Stack | May need to import `CsvExportModule` separately -- minor install |
| A4 | AG Grid client-side pagination works with server-loaded page data (no need for server-side row model) | Architecture | Would need to configure datasource if AG Grid expects to control pagination -- significant change to loader pattern |

## Open Questions

1. **Exact oklch-to-hex mapping for AG Grid params**
   - What we know: DESIGN.md and shadcn-ui.css use oklch color values; AG Grid withParams() likely accepts hex/rgb/hsl
   - What's unclear: Whether AG Grid v35 accepts oklch natively or needs hex conversion
   - Recommendation: Use hex approximations from DESIGN.md comments; test during implementation. The exact values are Claude's discretion per CONTEXT.md.

2. **AG Grid pagination interaction with existing server pagination**
   - What we know: `loadTableData()` returns `{ data, page, pageSize, pageCount, totalCount }`. Current TanStack Table uses manual server-side pagination.
   - What's unclear: Whether to keep server-side pagination (passing page params to loader) or switch to loading all data and letting AG Grid paginate client-side
   - Recommendation: Keep server-side pagination pattern (loader returns one page). AG Grid receives one page of data with `pagination={false}` on the grid itself, and existing pagination controls remain. This preserves the current data flow without changes to the loader.

3. **Full-width detail row implementation approach**
   - What we know: AG Grid Community supports `isFullWidthRow` + `fullWidthCellRenderer` for full-width rows
   - What's unclear: Best approach for accordion behavior -- insert synthetic "detail rows" into data array vs. use row node expansion
   - Recommendation: Use synthetic detail rows injected into `rowData` with a `_isDetailRow` flag. `isFullWidthRow` checks this flag. Clicking a normal row inserts/removes the detail row below it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v24.2.0 | -- |
| pnpm | Package install | Yes | 10.18.1 | -- |
| ag-grid-react | Grid rendering | No (not yet installed) | 35.2.1 (npm) | -- (must install) |

**Missing dependencies with no fallback:**
- `ag-grid-react` must be installed (Phase 1, first task)

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 (unit) + Playwright 1.57.x (E2E) |
| Config file | `vitest.config.ts` (unit), `e2e/playwright.config.ts` (E2E) |
| Quick run command | `pnpm test:unit` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRID-01 | AG Grid installed and importable | unit | `pnpm test:unit -- --run` | No -- Wave 0 |
| GRID-02 | AgGridWrapper renders with ClientOnly safety | unit | `vitest run app/components/ag-grid/__tests__/ag-grid-wrapper.test.ts` | No -- Wave 0 |
| GRID-03 | Theme matches DESIGN.md in light and dark modes | manual-only | Visual inspection in browser (both themes) | N/A |
| GRID-04 | Full-width detail row expands on click | E2E | `pnpm --filter e2e test -- --grep "detail row"` | No -- Wave 0 |
| GRID-05 | Sorting, filtering, quick-filter work | E2E | `pnpm --filter e2e test -- --grep "grid filter"` | No -- Wave 0 |
| GRID-06 | Column resize and reorder work | E2E | `pnpm --filter e2e test -- --grep "column resize"` | No -- Wave 0 |
| GRID-07 | Pagination displays correctly | E2E | `pnpm --filter e2e test -- --grep "pagination"` | No -- Wave 0 |
| GRID-08 | Side-panel CRUD form opens from grid | E2E | `pnpm --filter e2e test -- --grep "create panel"` | Partial -- `e2e/tests/crud/` exists |
| GRID-09 | Status badge renders with correct variant | unit | `vitest run app/components/ag-grid/__tests__/status-badge-renderer.test.ts` | No -- Wave 0 |
| GRID-10 | Date/currency formatting correct | unit | `vitest run app/components/ag-grid/__tests__/formatters.test.ts` | No -- Wave 0 |
| GRID-11 | Avatar renders photo or fallback initials | unit | `vitest run app/components/ag-grid/__tests__/avatar-renderer.test.ts` | No -- Wave 0 |
| GRID-12 | Column state persists across page loads | E2E | `pnpm --filter e2e test -- --grep "column state"` | No -- Wave 0 |
| GRID-13 | CSV export downloads file | E2E | `pnpm --filter e2e test -- --grep "csv export"` | No -- Wave 0 |
| GRID-14 | Conditional row styling applies correct classes | unit | `vitest run app/components/ag-grid/__tests__/row-class-rules.test.ts` | No -- Wave 0 |
| GRID-15 | Register submodule renders AG Grid instead of TanStack Table | E2E | `pnpm --filter e2e test -- --grep "register"` | Partial -- `e2e/tests/crud/` exists |

### Sampling Rate
- **Per task commit:** `pnpm typecheck && pnpm test:unit -- --run`
- **Per wave merge:** `pnpm typecheck && pnpm test:unit -- --run && pnpm --filter e2e test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/components/ag-grid/__tests__/formatters.test.ts` -- covers GRID-10
- [ ] `app/components/ag-grid/__tests__/column-mapper.test.ts` -- covers GRID-08 column mapping
- [ ] `app/components/ag-grid/__tests__/column-state.test.ts` -- covers GRID-12 persistence logic
- [ ] Unit tests for cell renderers require JSDOM environment (AG Grid needs DOM)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A -- grid is rendered behind auth guard (`requireUserLoader`) |
| V3 Session Management | No | N/A -- existing session infrastructure unchanged |
| V4 Access Control | Yes (existing) | Existing `requireModuleAccess()` / `requireSubModuleAccess()` + RLS policies -- no changes needed |
| V5 Input Validation | Yes (existing) | Zod schemas in `CreatePanel` forms -- no changes needed. AG Grid is read-only display. |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for AG Grid

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via cell renderer content | Tampering | React auto-escapes JSX output in cell renderers; never use `dangerouslySetInnerHTML` in renderers |
| CSV injection via exported data | Tampering | AG Grid's CSV export escapes formula characters by default; validate if custom `processCellCallback` is used |
| localStorage tampering (column state) | Tampering | Column state is display-only (widths, order, visibility) -- no security impact. Validate restored state shape defensively. |

## Sources

### Primary (HIGH confidence)
- [AG Grid React Installation](https://www.ag-grid.com/react-data-grid/installation/) - Package install, AgGridProvider pattern
- [AG Grid Theming: Colors & Dark Mode](https://www.ag-grid.com/react-data-grid/theming-colors/) - `data-ag-theme-mode`, `withParams()` light/dark modes, color scheme switching
- [AG Grid Full Width Rows](https://www.ag-grid.com/react-data-grid/full-width-rows/) - `isFullWidthRow`, `fullWidthCellRenderer` API
- [AG Grid Column State](https://www.ag-grid.com/react-data-grid/column-state/) - `getColumnState()`, `applyColumnState()`, `resetColumnState()`
- [AG Grid CSV Export](https://www.ag-grid.com/react-data-grid/csv-export/) - `exportDataAsCsv()` Community API
- [AG Grid Theming Migration](https://www.ag-grid.com/react-data-grid/theming-migration/) - v33 Theming API introduction
- npm registry: `ag-grid-react@35.2.1`, `ag-grid-community@35.2.1` verified 2026-04-08

### Secondary (MEDIUM confidence)
- Codebase inspection: `app/components/crud/table-list-view.tsx`, `app/lib/crud/types.ts`, `app/lib/crud/registry.ts`, `app/routes/workspace/sub-module.tsx` -- existing patterns verified
- `app/styles/shadcn-ui.css` -- exact oklch values for light/dark tokens verified
- `packages/ui/src/kit/client-only.tsx` -- `ClientOnly` and `useHydrated()` implementation verified

### Tertiary (LOW confidence)
- AG Grid `gridRef.current.api` pattern vs `onGridReady` -- based on training knowledge, not verified in v35 docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - npm versions verified, single package install confirmed
- Architecture: HIGH - existing codebase patterns inspected, AG Grid APIs verified from official docs
- Pitfalls: HIGH - SSR hydration and theme switching are well-documented concerns; AG Grid v35 Theming API migration docs address CSS pitfalls
- Cell renderers: HIGH - standard React component pattern, well-documented in AG Grid docs
- Pagination interaction: MEDIUM - need to confirm client-side pagination with server-loaded page data during implementation

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (AG Grid v35 is stable release; 30 days)
