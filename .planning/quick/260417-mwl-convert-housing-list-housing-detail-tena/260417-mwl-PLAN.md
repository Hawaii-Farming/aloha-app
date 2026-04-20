---
phase: quick-260417-mwl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/ag-grid/housing-map-view.tsx
  - app/components/crud/housing-detail-view.tsx
autonomous: true
requirements:
  - QUICK-260417-mwl
must_haves:
  truths:
    - "Housing list renders as an AG Grid with 5 columns: home-icon avatar, Name, Beds, Baths, Occupancy"
    - "Clicking a housing row navigates to /home/{account}/human_resources/housing/{siteId}"
    - "Navbar palette filter (via useActiveTableSearch -> quickFilterText) filters visible housing rows"
    - "Inactive housing rows render with opacity 0.6 via getRowStyle"
    - "Column layout (width, order, sort, visibility) for the housing grid persists across reloads under slug 'housing'"
    - "Housing detail view Tenants section renders as an AG Grid with 4 columns: avatar-initials, Name, Department, Work Auth"
    - "Clicking a tenant row navigates to /home/{accountSlug}/human_resources/employees/{tenantId}"
    - "Navbar palette filter filters tenant rows when the detail page is active (slug 'housing-tenants', display name 'Tenants')"
    - "When tenants.length === 0, the empty paragraph still renders and no grid is mounted"
    - "pnpm typecheck passes with the two files rewritten"
  artifacts:
    - path: "app/components/ag-grid/housing-map-view.tsx"
      provides: "Housing list rendered as AG Grid (replaces card-based custom layout)"
      contains: "AgGridWrapper"
    - path: "app/components/crud/housing-detail-view.tsx"
      provides: "Housing detail with Tenants section rendered as AG Grid (replaces semi-table card)"
      contains: "AgGridWrapper"
  key_links:
    - from: "app/components/ag-grid/housing-map-view.tsx"
      to: "~/components/active-table-search-context"
      via: "useActiveTableSearch().query -> AgGridWrapper quickFilterText; useRegisterActiveTable('housing', ...)"
      pattern: "useRegisterActiveTable\\('housing'"
    - from: "app/components/ag-grid/housing-map-view.tsx"
      to: "AgGridWrapper"
      via: "colDefs + rowData (flattened Accommodation -> AccommodationRow)"
      pattern: "AgGridWrapper"
    - from: "app/components/ag-grid/housing-map-view.tsx"
      to: "~/components/ag-grid/column-state"
      via: "saveColumnState('housing', api) + restoreColumnState('housing', api) on grid events"
      pattern: "saveColumnState\\('housing'"
    - from: "app/components/crud/housing-detail-view.tsx"
      to: "AgGridWrapper"
      via: "tenants rowData + colDefs with domLayout='autoHeight'"
      pattern: "AgGridWrapper"
    - from: "app/components/crud/housing-detail-view.tsx"
      to: "~/components/active-table-search-context"
      via: "useRegisterActiveTable('housing-tenants', 'Tenants') + useActiveTableSearch().query"
      pattern: "useRegisterActiveTable\\('housing-tenants'"
    - from: "app/lib/crud/hr-housing.config.ts"
      to: "app/components/ag-grid/housing-map-view.tsx"
      via: "customViews.list dynamic import — filename unchanged, no registry edit"
      pattern: "housing-map-view"
---

<objective>
Convert the Housing list (`housing-map-view.tsx`) and the Tenants section of the Housing detail view (`housing-detail-view.tsx`) from custom card/semi-table layouts to AG Grid, matching the parity set by Register, Departments, Payroll Hours, and Scheduler.

Purpose: Enforce the app-wide UI-RULES.md table contract (one datum per cell, no per-table search, navbar-only palette filter, uniform `text-sm`, no coloring, flat `ColDef[]`) on the last two remaining custom list/table surfaces.

Output: Two rewritten files. No new files. No test changes. No registry changes. Behavior preserved for row-click navigation and navbar palette filtering; column state persisted for the list under slug `'housing'`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@./CLAUDE.md
@./UI-RULES.md
@./DESIGN.md
@app/components/ag-grid/housing-map-view.tsx
@app/components/crud/housing-detail-view.tsx
@app/components/ag-grid/ag-grid-list-view.tsx
@app/components/ag-grid/payroll-hours-list-view.tsx
@app/components/ag-grid/ag-grid-wrapper.tsx
@app/components/ag-grid/cell-renderers/avatar-renderer.tsx
@app/components/ag-grid/column-state.ts
@app/components/active-table-search-context.tsx
@app/lib/crud/hr-housing.config.ts

<interfaces>
<!-- Key contracts the executor needs. Extracted from codebase. No exploration required. -->

From app/components/ag-grid/ag-grid-wrapper.tsx — `AgGridWrapperProps`:
```ts
interface AgGridWrapperProps {
  colDefs: (ColDef | ColGroupDef)[];
  rowData: Record<string, unknown>[];
  pinnedBottomRowData?: Record<string, unknown>[];
  quickFilterText?: string;
  onRowClicked?: (event: RowClickedEvent) => void;
  gridRef?: RefObject<AgGridReact | null>;
  pagination?: boolean;                          // defaults to true inside wrapper — pass `false` explicitly when not wanted
  domLayout?: 'normal' | 'autoHeight' | 'print'; // 'autoHeight' for embedded grids inside a scrollable parent
  onGridReady?: (event: GridReadyEvent) => void;
  onColumnMoved?: (event: ColumnMovedEvent) => void;
  onColumnResized?: (event: ColumnResizedEvent) => void;
  onSortChanged?: (event: SortChangedEvent) => void;
  onColumnVisible?: (event: ColumnVisibleEvent) => void;
  getRowStyle?: (params: RowClassParams) => Record<string, string> | undefined;
  // ...plus row-selection / full-width-row / loading / emptyMessage options not used by these tasks
}
```
Wrapper-level defaults (do not redeclare on colDefs): `defaultColDef = { resizable: true, sortable: true, filter: false, minWidth: 100, autoHeaderHeight: true }`. Wrapper sets `animateRows={false}`, `cacheQuickFilter={true}`, `suppressRowClickSelection={true}` by default.

From app/components/ag-grid/column-state.ts:
```ts
export function saveColumnState(subModuleSlug: string, api: GridApi): void;
export function restoreColumnState(subModuleSlug: string, api: GridApi): void;
```

From app/components/active-table-search-context.tsx:
```ts
export function useActiveTableSearch(): {
  query: string;
  setQuery: (q: string) => void;
  clearQuery: () => void;
  activeTable: { slug: string; displayName: string } | null;
  // ...register/unregister
};
export function useRegisterActiveTable(slug: string, displayName: string): void;
```

From app/components/ag-grid/payroll-hours-list-view.tsx — the reference pattern to mirror for slug-keyed column state (extract debounce ref + four handlers verbatim, swap `'payroll_hours'` for `'housing'`).

From app/lib/crud/types.ts (indirect, already imported): `ListViewProps`, `DetailViewProps`. `ListViewProps` shape used by the current file is `{ tableData: { data: unknown[] }, subModuleDisplayName?: string, ... }`. `DetailViewProps` shape used by detail is `{ record, config, accountSlug, subModuleDisplayName, fkOptions, comboboxOptions }` — all unchanged.

From app/lib/crud/hr-housing.config.ts:
```ts
customViews: {
  list:   () => import('~/components/ag-grid/housing-map-view'),    // path preserved — DO NOT CHANGE
  detail: () => import('~/components/crud/housing-detail-view'),    // path preserved — DO NOT CHANGE
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite housing-map-view.tsx as AG Grid (Home + Name + Beds + Baths + Occupancy)</name>
  <files>app/components/ag-grid/housing-map-view.tsx</files>
  <action>
Fully rewrite `app/components/ag-grid/housing-map-view.tsx` so Housing renders via `AgGridWrapper` instead of custom cards.

Keep:
- `parseHousingSite` and `buildAccommodations` exactly as-is (parent/child grouping logic: hr_site has parent rows that become grid rows, child rows feed bedroom/bathroom counts).
- `HousingSite` and `Accommodation` interfaces.
- `useRegisterActiveTable('housing', props.subModuleDisplayName ?? 'Housing')` + `useActiveTableSearch()` wiring.
- `data-test="housing-list-view"` on the outer wrapper.

Drop (delete entirely):
- Shadcn `Card` import + all Card usage.
- `cn` import (no longer used after component rewrite).
- `SummaryBar`, `HousingListHeader`, `HousingListRow` components.
- `OccupancyBar` as a standalone (its progress-bar markup is re-used inline inside the Occupancy cell renderer — see below).
- The `ROW_COLS` grid-template constant.
- The `filteredAccommodations` useMemo (AG Grid's `quickFilterText` replaces it).
- The outer `flex-1 flex-col gap-5 overflow-y-auto px-4 py-4` wrapper class — replace with `flex min-h-0 flex-1 flex-col`.

Flatten after `buildAccommodations`. Define a row shape and map the memoized accommodations to it:
```ts
interface AccommodationRow {
  id: string;
  name: string;
  beds: number;
  baths: number;
  tenantCount: number;
  capacity: number;
  isActive: boolean;
}
```
Mapping rules: `beds = accom.bedroomCount`, `baths = accom.bathroomCount`, `tenantCount = accom.site.tenantCount`, `capacity = accom.site.maxBeds ?? accom.bedroomCount`, `isActive = accom.site.isActive`, `id = accom.site.id`, `name = accom.site.name`. Memoize the flattened `rowData` off the `accommodations` memo.

Build `colDefs: ColDef[]` as a module-level constant (stable reference across renders; see the payroll-hours reference). Five columns in this order:

1. Home-icon avatar column:
   - `headerName: ''`, no `field`.
   - `cellRenderer`: a tiny local `HomeIconRenderer` function component that ignores `props` and renders:
     ```tsx
     <div className="flex h-full items-center justify-center">
       <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full">
         <Home className="h-4 w-4" />
       </div>
     </div>
     ```
   - `maxWidth: 60`, `minWidth: 60`, `sortable: false`, `filter: false`, `resizable: false`, `suppressMovable: true`.
   - Do not set `pinned` — list has no horizontal overflow need.

2. Name:
   - `field: 'name'`, `headerName: 'Name'`, `flex: 1`, `minWidth: 180`.

3. Beds:
   - `field: 'beds'`, `headerName: 'Beds'`, `type: 'numericColumn'`, `flex: 1`, `minWidth: 100`.

4. Baths:
   - `field: 'baths'`, `headerName: 'Baths'`, `type: 'numericColumn'`, `flex: 1`, `minWidth: 100`.

5. Occupancy:
   - `field: 'tenantCount'` (so sort orders by tenant count — integer ranking is the most useful axis per UI-RULES "Numbers always right-aligned, tabular-nums").
   - `headerName: 'Occupancy'`.
   - `flex: 1`, `minWidth: 200`.
   - `cellRenderer`: local `OccupancyCellRenderer` taking `CustomCellRendererProps` — read `data.tenantCount` and `data.capacity` off `props.data` (cast to `AccommodationRow | undefined`, bail out returning `null` if absent). Inline the existing progress-bar markup from the deleted `OccupancyBar`:
     ```tsx
     <div className="flex h-full items-center justify-end gap-3">
       <div
         className="bg-muted h-1.5 w-32 overflow-hidden rounded-full"
         role="progressbar"
         aria-valuenow={tenants}
         aria-valuemax={capacity}
       >
         <div
           className="bg-foreground/70 h-full rounded-full transition-[width]"
           style={{ width: `${pct}%` }}
         />
       </div>
       <span className="text-foreground w-16 shrink-0 text-right tabular-nums">
         {tenants} / {capacity}
       </span>
     </div>
     ```
     Where `const ratio = capacity > 0 ? Math.min(tenants / capacity, 1) : 0;` and `const pct = Math.round(ratio * 100);`.

Component body (mirror payroll-hours-list-view.tsx verbatim for refs, handlers, and hookup):
- `const gridRef = useRef<AgGridReact>(null);`
- `const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);`
- `const navigate = useNavigate();`
- `const { account } = useParams();`
- `const { query } = useActiveTableSearch();`
- `useRegisterActiveTable('housing', props.subModuleDisplayName ?? 'Housing');`
- `handleRowClicked` (useCallback): guard on `account` AND `event.data?.id`, then `navigate(\`/home/${account}/human_resources/housing/${event.data.id}\`)`.
- `handleGridReady` (useCallback): `restoreColumnState('housing', event.api);`
- `debouncedSaveState` (useCallback): 300ms debounce calling `saveColumnState('housing', api)` — same shape as payroll-hours.
- `handleColumnMoved`, `handleColumnResized` (useCallback): only call `debouncedSaveState(event.api)` when `event.finished && event.api`.
- `handleSortChanged`, `handleColumnVisible` (useCallback): call `debouncedSaveState(event.api)` unconditionally.
- `getRowStyle` (useCallback): return `{ opacity: '0.6' }` when `params.data?.isActive === false`, otherwise `undefined`. NOTE: `getRowStyle` signature returns `Record<string, string> | undefined`, so pass `'0.6'` as a string.

Return JSX:
```tsx
<div className="flex min-h-0 flex-1 flex-col" data-test="housing-list-view">
  <AgGridWrapper
    gridRef={gridRef}
    colDefs={colDefs}
    rowData={rowData}
    quickFilterText={query}
    pagination={false}
    getRowStyle={getRowStyle}
    onRowClicked={handleRowClicked}
    onGridReady={handleGridReady}
    onColumnMoved={handleColumnMoved}
    onColumnResized={handleColumnResized}
    onSortChanged={handleSortChanged}
    onColumnVisible={handleColumnVisible}
  />
</div>
```

Imports for the final file:
- `useCallback`, `useMemo`, `useRef` from `'react'`.
- `useNavigate`, `useParams` from `'react-router'`.
- `Home` from `'lucide-react'` (ChevronRight no longer used — drop it).
- Types from `'ag-grid-community'`: `ColDef`, `ColumnMovedEvent`, `ColumnResizedEvent`, `ColumnVisibleEvent`, `GridReadyEvent`, `GridApi`, `RowClassParams`, `RowClickedEvent`, `SortChangedEvent`.
- `AgGridReact`, `CustomCellRendererProps` from `'ag-grid-react'`.
- `useActiveTableSearch`, `useRegisterActiveTable` from `'~/components/active-table-search-context'`.
- `AgGridWrapper` from `'~/components/ag-grid/ag-grid-wrapper'`.
- `restoreColumnState`, `saveColumnState` from `'~/components/ag-grid/column-state'`.
- `ListViewProps` from `'~/lib/crud/types'`.

UI-RULES compliance checklist (verify each):
- One datum per cell (name/beds/baths stay separate; occupancy bar shows only tenants/capacity).
- No per-table search (navbar palette only).
- `defaultColDef.filter = false` inherited from wrapper — DO NOT set `filter` on any colDef.
- Sortable default stays true via wrapper; the Home column opts out via `sortable: false`.
- Numbers right-aligned via `type: 'numericColumn'` on Beds/Baths, and manual `text-right tabular-nums` inside the Occupancy renderer.
- Uniform `text-sm` inherited from the wrapper theme — no `text-xs` or `text-lg` in renderers.
- No coloring / no row class rules / no cell color.
- Flat `ColDef[]` — no `ColGroupDef`.

CLAUDE.md compliance:
- Functional components only, no `any`.
- `interface` for `AccommodationRow`; `HousingSite`/`Accommodation` already interfaces — keep.
- Use `useCallback` for event handlers passed as props.
- No `useEffect` introduced (only the indirect one inside `useRegisterActiveTable`, which is already justified in the context module).
- camelCase functions, PascalCase components, no obvious comments.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
  </verify>
  <done>
- File compiles; `pnpm typecheck` clean.
- No references to `Card`, `cn`, `ROW_COLS`, `SummaryBar`, `HousingListHeader`, `HousingListRow`, `OccupancyBar`, `filteredAccommodations` remain in the file.
- Module-level `colDefs` constant exists with exactly 5 entries: home avatar, `name`, `beds`, `baths`, `tenantCount` (header `'Occupancy'`).
- Grid renders via `AgGridWrapper` with `quickFilterText={query}`, `pagination={false}`, `getRowStyle`, and `onRowClicked`.
- Column state handlers call `saveColumnState('housing', api)` via a 300ms debounce; `handleGridReady` calls `restoreColumnState('housing', event.api)`.
- `useRegisterActiveTable('housing', props.subModuleDisplayName ?? 'Housing')` is the only registration call.
- Outer wrapper is `flex min-h-0 flex-1 flex-col` with `data-test="housing-list-view"`.
  </done>
</task>

<task type="auto">
  <name>Task 2: Replace Tenants section of housing-detail-view.tsx with AG Grid (autoHeight)</name>
  <files>app/components/crud/housing-detail-view.tsx</files>
  <action>
Edit `app/components/crud/housing-detail-view.tsx` to replace only the Tenants rendering inside the `{/* Tenants */}` block. Do NOT touch the top bar, stat cards, notes section, edit/delete dialogs, or the `fetchTenants` / `useQuery` call.

Delete:
- The `TENANT_COLS` module-level grid-template constant.
- The `TenantRowView` component (its header row, its mapped list, and the `Card` wrapper around the tenant list).
- The `Link` import from `'react-router'` if it is no longer used elsewhere in the file (it is only used by `TenantRowView`). Keep `useFetcher`, `useNavigate` — they are still used by the top bar / delete.

Keep:
- `TenantRow` interface (used for typing the `useQuery` result and the new AG Grid rows).
- `fetchTenants`, `useQuery({ queryKey, queryFn, enabled })` — unchanged.
- The `<h2>TENANTS ({tenants.length})</h2>` heading and the `<Separator />` directly below it.
- The empty-state `<p>No tenants currently assigned.</p>` branch — render exactly as today when `tenants.length === 0`.
- The `Card` import IF it is still used elsewhere in the file. NOTE: `Card` is used by the stat-cards block (`stats.map((s) => <Card ... />)`), so keep the import.

Add a new local component inside this file (below the `TenantRow` interface, above `HousingDetailView`):

```tsx
import type { ColDef, RowClickedEvent } from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';

import {
  useActiveTableSearch,
  useRegisterActiveTable,
} from '~/components/active-table-search-context';
import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';

function TenantInitialsRenderer(props: CustomCellRendererProps) {
  const data = props.data as TenantRow | undefined;
  if (!data) return null;
  const initials = data.full_name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
        {initials}
      </div>
    </div>
  );
}

const TENANT_COL_DEFS: ColDef[] = [
  {
    headerName: '',
    cellRenderer: TenantInitialsRenderer,
    maxWidth: 60,
    minWidth: 60,
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
  },
  { field: 'full_name', headerName: 'Name', flex: 1, minWidth: 200 },
  {
    field: 'department_name',
    headerName: 'Department',
    flex: 1,
    minWidth: 160,
    valueFormatter: (p) => (p.value ? String(p.value) : '—'),
  },
  {
    field: 'work_authorization_name',
    headerName: 'Work Auth',
    flex: 1,
    minWidth: 140,
    valueFormatter: (p) => (p.value ? String(p.value) : '—'),
  },
];

function TenantsGrid({
  tenants,
  accountSlug,
}: {
  tenants: TenantRow[];
  accountSlug: string;
}) {
  const navigate = useNavigate();
  const { query } = useActiveTableSearch();
  useRegisterActiveTable('housing-tenants', 'Tenants');

  const handleRowClicked = useCallback(
    (event: RowClickedEvent) => {
      const tenantId = (event.data as TenantRow | undefined)?.id;
      if (!tenantId || !accountSlug) return;
      navigate(`/home/${accountSlug}/human_resources/employees/${tenantId}`);
    },
    [navigate, accountSlug],
  );

  return (
    <AgGridWrapper
      colDefs={TENANT_COL_DEFS}
      rowData={tenants as unknown as Record<string, unknown>[]}
      quickFilterText={query}
      pagination={false}
      domLayout="autoHeight"
      onRowClicked={handleRowClicked}
    />
  );
}
```

Rationale for `domLayout='autoHeight'`: the Tenants grid is embedded inside the already-scrollable `<div className="min-h-0 flex-1 overflow-y-auto">` content region. `autoHeight` sizes the grid to its row content without hijacking vertical scroll, per the AgGridWrapper contract. We do NOT set an explicit height/min-h container.

Replace the current Tenants block body with:
```tsx
<div>
  <h2 className="text-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
    Tenants ({tenants.length})
  </h2>
  <Separator className="mb-3" />
  {tenants.length === 0 ? (
    <p className="text-muted-foreground text-sm">
      No tenants currently assigned.
    </p>
  ) : (
    <TenantsGrid tenants={tenants} accountSlug={accountSlug} />
  )}
</div>
```

Call-site hook-ordering note: `useRegisterActiveTable` lives inside `TenantsGrid`, which is only mounted when `tenants.length > 0`. That is intentional — when there are no tenants there is nothing searchable, so the navbar palette should not advertise a "Tenants" active table. React's Rules of Hooks are satisfied because `TenantsGrid` is a distinct component; its own hooks are unconditional inside it.

Additional imports to add to the top of the file:
- `useCallback` from `'react'` (current file already imports from 'react'; extend the existing import).
- `type { ColDef, RowClickedEvent }` from `'ag-grid-community'`.
- `type { CustomCellRendererProps }` from `'ag-grid-react'`.
- `useActiveTableSearch`, `useRegisterActiveTable` from `'~/components/active-table-search-context'`.
- `AgGridWrapper` from `'~/components/ag-grid/ag-grid-wrapper'`.

Imports to remove if unused after the rewrite:
- `Link` from `'react-router'` (verify nothing else in the file uses it — only `TenantRowView` did).

Do NOT:
- Modify `active-table-search-context.tsx`, `ag-grid-list-view.tsx`, `ag-grid-wrapper.tsx`, `column-state.ts`, or `hr-housing.config.ts`.
- Change the detail view's outer layout, header bar, stat cards, notes section, edit panel, or delete flow.
- Add any filtering logic — `quickFilterText` handles it.
- Add per-table search UI.
- Set `filter` on any colDef (UI-RULES: `defaultColDef.filter = false` via wrapper).
- Set any color on rows or cells.

UI-RULES compliance checklist:
- 4 columns, one datum per cell (avatar / name / department / work auth).
- No per-table search input.
- `defaultColDef.filter = false` inherited.
- Uniform `text-sm` via wrapper theme (the `text-xs` on the initials circle is a label inside the avatar chip, not a data cell).
- No coloring beyond the existing `bg-primary/10 text-primary` initials badge (matches current tenant row styling and the Register avatar fallback styling — this is the avatar convention, not data color).
- Flat `ColDef[]`.
- Column persistence intentionally NOT wired for the tenants grid — it is ephemeral per-detail-view and not slug-routable; skipping `saveColumnState`/`restoreColumnState` here keeps localStorage clean.

CLAUDE.md compliance:
- No `any`.
- `interface` only for new props (`{ tenants: TenantRow[]; accountSlug: string }` is inline object — acceptable per existing file conventions); component name `TenantsGrid` PascalCase; `TenantInitialsRenderer` PascalCase (cell renderer).
- `useCallback` wraps the row-click handler.
- No `useEffect` added.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
  </verify>
  <done>
- `pnpm typecheck` clean.
- `TENANT_COLS` constant and `TenantRowView` component fully removed from the file.
- Empty-state `<p>No tenants currently assigned.</p>` still renders when `tenants.length === 0`.
- When tenants exist, `TenantsGrid` renders via `AgGridWrapper` with `domLayout='autoHeight'`, `pagination={false}`, `quickFilterText={query}`, and the 4-colDef layout.
- `useRegisterActiveTable('housing-tenants', 'Tenants')` is invoked inside `TenantsGrid`.
- Row click navigates to `/home/${accountSlug}/human_resources/employees/${tenantId}` (guarded).
- `hr-housing.config.ts`, `ag-grid-wrapper.tsx`, `ag-grid-list-view.tsx`, `column-state.ts`, and `active-table-search-context.tsx` are unchanged (git diff shows no edits).
- `Link` import removed from `housing-detail-view.tsx` if no longer used; `Card` import retained (stat cards still use it).
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

1. `pnpm typecheck` passes with zero errors touching the two modified files.
2. Open the Housing list page:
   - Grid renders with columns: (home-icon), Name, Beds, Baths, Occupancy.
   - Sort by Name / Beds / Baths / Occupancy works.
   - Clicking a row navigates to `/home/{account}/human_resources/housing/{siteId}`.
   - Typing in the navbar palette's "Filter Housing" row narrows the visible rows.
   - Reloading the page preserves any column width / order / sort set under slug `'housing'` (localStorage key `ag-grid-state-housing`).
   - Inactive rows (if any) render at 0.6 opacity.
3. Open a housing detail page with at least one tenant:
   - Tenants section renders as an AG Grid with avatar, Name, Department, Work Auth columns.
   - Clicking a tenant navigates to `/home/{accountSlug}/human_resources/employees/{tenantId}`.
   - Typing in the navbar palette's "Filter Tenants" row filters the tenants grid.
   - Missing department / work auth values render as `—`.
4. Open a housing detail page with zero tenants:
   - Only the `No tenants currently assigned.` paragraph renders. No empty AG Grid skeleton.
5. `git diff --name-only` should list only:
   - `app/components/ag-grid/housing-map-view.tsx`
   - `app/components/crud/housing-detail-view.tsx`
</verification>

<success_criteria>
- Housing list view is an AG Grid (`AgGridWrapper`) with 5 columns and navbar-palette filtering; column state persists under slug `'housing'`.
- Housing detail Tenants section is an AG Grid (`AgGridWrapper`, `domLayout='autoHeight'`) with 4 columns and navbar-palette filtering under slug `'housing-tenants'`.
- No dead code: `Card`-wrapped semi-table rendering, `TENANT_COLS`, `TENANTS` grid-template classes, `SummaryBar`, `HousingListHeader`, `HousingListRow`, `OccupancyBar`, `TenantRowView`, `filteredAccommodations` all removed.
- Only the two files in `files_modified` are touched.
- Navigation preserved: list row -> housing detail; tenant row -> employee detail.
- `pnpm typecheck` clean.
</success_criteria>

<output>
After completion, summary may be embedded inside the quick task commit message. No SUMMARY.md required for quick mode.
</output>
