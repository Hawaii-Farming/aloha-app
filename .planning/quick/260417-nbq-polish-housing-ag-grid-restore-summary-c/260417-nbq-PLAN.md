---
phase: quick-260417-nbq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/ag-grid/housing-map-view.tsx
  - app/components/crud/housing-detail-view.tsx
autonomous: true
requirements:
  - BUG-A-summary-cards
  - BUG-B-column-order
  - BUG-C-avatar-size
  - BUG-D-grid-width
must_haves:
  truths:
    - "Housing list shows 4 summary cards (Accommodations, Total Bedrooms, Total Tenants, Occupied) above the grid"
    - "Housing list columns render in order: avatar icon, Name, Beds, Baths, Occupancy"
    - "Housing list avatar circle (h-8 w-8) fits cleanly within the default row height (no crop)"
    - "Housing list grid fills the full viewport width after render (no right-side empty space)"
    - "Housing detail tenants grid fills the detail panel width after render"
  artifacts:
    - path: "app/components/ag-grid/housing-map-view.tsx"
      provides: "Housing list view with SummaryBar, correct column order, correct avatar size, full-width grid"
      contains: "SummaryBar"
    - path: "app/components/crud/housing-detail-view.tsx"
      provides: "Housing detail view where tenants grid fills available width"
  key_links:
    - from: "app/components/ag-grid/housing-map-view.tsx"
      to: "AgGridWrapper.onGridReady"
      via: "setTimeout(sizeColumnsToFit, 20) after wrapper's autoSizeAllColumns"
      pattern: "sizeColumnsToFit"
    - from: "app/components/crud/housing-detail-view.tsx"
      to: "AgGridWrapper.onGridReady (tenants grid)"
      via: "setTimeout(sizeColumnsToFit, 20)"
      pattern: "sizeColumnsToFit"
---

<objective>
Fix four regressions introduced by the 260417-mwl AG Grid rewrite of the Housing views:
- Bug A: restore the 4-card SummaryBar above the Housing list grid.
- Bug B: fix column order (avatar → Name → Beds → Baths → Occupancy) by removing localStorage column-state persistence that reapplies a stale order on mount.
- Bug C: shrink the avatar circle so it fits inside the default row height.
- Bug D: make both the Housing list grid and the Housing detail tenants grid fill their container width — the wrapper's built-in `autoSizeAllColumns` clamps columns to content and defeats `flex: 1`, so we call `sizeColumnsToFit()` afterwards.

Purpose: The 260417-mwl rewrite accidentally dropped the SummaryBar and left column-state restore wired up, which — combined with the wrapper's autoSize — produces a visually broken grid.
Output: Two modified component files; no new files, no tests, no changes to the wrapper or column-state module.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@./app/components/ag-grid/housing-map-view.tsx
@./app/components/crud/housing-detail-view.tsx
@./app/components/ag-grid/ag-grid-wrapper.tsx
@./app/components/ag-grid/column-state.ts

<interfaces>
<!-- Wrapper behavior the executor must account for (DO NOT modify the wrapper). -->
<!-- From app/components/ag-grid/ag-grid-wrapper.tsx the wrapper already runs: -->
<!--   setTimeout(() => event.api.autoSizeAllColumns(), 0); -->
<!-- inside its own handleGridReadyWithMobileUnpin after calling the caller's onGridReady. -->
<!-- autoSizeAllColumns clamps columns to content width, so consumer grids that -->
<!-- want flex-to-fill must call sizeColumnsToFit AFTER that tick — use a -->
<!-- setTimeout with a delay (20ms) greater than 0 to run after the wrapper's tick. -->

From app/components/ag-grid/ag-grid-wrapper.tsx:
```typescript
// Relevant prop signature used by both tasks
onGridReady?: (event: GridReadyEvent) => void;

// Wrapper's own onGridReady handler runs AFTER your onGridReady:
//   setTimeout(() => event.api.autoSizeAllColumns(), 0);
```

From app/components/ag-grid/column-state.ts:
```typescript
export function saveColumnState(subModuleSlug: string, api: GridApi): void;
export function restoreColumnState(subModuleSlug: string, api: GridApi): void;
// Not touched — but both imports are being removed from housing-map-view.tsx.
// column-state.ts itself stays on disk (still used by other list views).
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite HousingMapView — remove column-state persistence, restore SummaryBar, fix avatar size, fill viewport width</name>
  <files>app/components/ag-grid/housing-map-view.tsx</files>
  <action>
Apply four changes to `app/components/ag-grid/housing-map-view.tsx`:

1. **Remove column-state persistence entirely.**
   - Delete the import block:
     ```ts
     import {
       restoreColumnState,
       saveColumnState,
     } from '~/components/ag-grid/column-state';
     ```
   - Delete `saveDebounceRef`, `debouncedSaveState`, `handleColumnMoved`, `handleColumnResized`, `handleSortChanged`, `handleColumnVisible`.
   - Remove the corresponding props (`onColumnMoved`, `onColumnResized`, `onSortChanged`, `onColumnVisible`) from the `<AgGridWrapper>` JSX.
   - From the `ag-grid-community` type import, drop `ColumnMovedEvent`, `ColumnResizedEvent`, `ColumnVisibleEvent`, `GridApi`, and `SortChangedEvent`. Keep `ColDef`, `GridReadyEvent`, `RowClassParams`, `RowClickedEvent`. Drop the `useRef` import if and only if nothing else uses it (the `gridRef` still uses `useRef`, so **keep `useRef`**).

2. **Rewrite `handleGridReady`** so it fills width AFTER the wrapper's autoSize runs. The wrapper calls `autoSizeAllColumns()` in a `setTimeout(..., 0)`; our 20ms timeout runs strictly after:
   ```ts
   const handleGridReady = useCallback((event: GridReadyEvent) => {
     setTimeout(() => event.api.sizeColumnsToFit(), 20);
   }, []);
   ```
   No `restoreColumnState` call.

3. **Shrink the avatar** in `HomeIconRenderer`: change the inner circle from `h-10 w-10` to `h-8 w-8`. Keep the `Home` icon at `h-4 w-4`. All other classes unchanged.

4. **Give the avatar colDef a stable `colId`** to harden against any stray stored state:
   ```ts
   {
     colId: 'home_icon',
     headerName: '',
     cellRenderer: HomeIconRenderer,
     maxWidth: 60,
     minWidth: 60,
     sortable: false,
     filter: false,
     resizable: false,
     suppressMovable: true,
   },
   ```

5. **Restore the SummaryBar** above the grid. Add the import:
   ```ts
   import { Card } from '@aloha/ui/card';
   ```
   Add this component above `HousingMapView` (or just below `OccupancyCellRenderer` — placement is functionally equivalent, pick one):
   ```tsx
   function SummaryBar({ accommodations }: { accommodations: Accommodation[] }) {
     const totalBedrooms = accommodations.reduce((sum, a) => sum + a.bedroomCount, 0);
     const totalTenants = accommodations.reduce((sum, a) => sum + a.site.tenantCount, 0);
     const occupied = accommodations.filter((a) => a.site.tenantCount > 0).length;

     const items = [
       { label: 'Accommodations', value: accommodations.length },
       { label: 'Total Bedrooms', value: totalBedrooms },
       { label: 'Total Tenants', value: totalTenants },
       { label: 'Occupied', value: occupied },
     ];

     return (
       <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
         {items.map((item) => (
           <Card key={item.label} className="p-4">
             <div className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
               {item.label}
             </div>
             <div className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
               {item.value}
             </div>
           </Card>
         ))}
       </div>
     );
   }
   ```

6. **Replace the outer return** so the SummaryBar sits above the grid and the grid fills remaining height:
   ```tsx
   return (
     <div
       className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4"
       data-test="housing-list-view"
     >
       <div className="shrink-0">
         <SummaryBar accommodations={accommodations} />
       </div>
       <div className="flex min-h-0 flex-1 flex-col">
         <AgGridWrapper
           gridRef={gridRef}
           colDefs={colDefs}
           rowData={rowData as unknown as Record<string, unknown>[]}
           quickFilterText={query}
           pagination={false}
           getRowStyle={getRowStyle}
           onRowClicked={handleRowClicked}
           onGridReady={handleGridReady}
         />
       </div>
     </div>
   );
   ```

7. **After editing, re-check the import list.** Any symbol dropped above that is still referenced somewhere = bug; any symbol left imported that nothing references = lint error (`@typescript-eslint/no-unused-vars`). Prettier will sort imports — don't hand-sort.

Do NOT modify: `ag-grid-wrapper.tsx`, `column-state.ts`, `active-table-search-context.tsx`, or `hr-housing.config.ts`.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
  </verify>
  <done>
- `pnpm typecheck` passes.
- `saveColumnState` / `restoreColumnState` no longer imported in `housing-map-view.tsx`.
- No `onColumnMoved` / `onColumnResized` / `onSortChanged` / `onColumnVisible` props passed to `AgGridWrapper`.
- `handleGridReady` calls `event.api.sizeColumnsToFit()` inside a `setTimeout(..., 20)`.
- Avatar circle classes are `h-8 w-8` (icon still `h-4 w-4`).
- Avatar colDef has `colId: 'home_icon'`.
- `SummaryBar` function is defined and rendered above the grid; `Card` imported from `@aloha/ui/card`.
- Outer wrapper uses the `flex min-h-0 flex-1 flex-col gap-4 px-4 py-4` layout with the SummaryBar in a `shrink-0` div and the grid in a `flex min-h-0 flex-1 flex-col` div.
- Visually (manual sanity, not required for pnpm typecheck): summary cards appear above grid; columns render avatar → Name → Beds → Baths → Occupancy; avatar fits inside the row; grid fills viewport width.
  </done>
</task>

<task type="auto">
  <name>Task 2: Make Housing detail tenants grid fill panel width</name>
  <files>app/components/crud/housing-detail-view.tsx</files>
  <action>
In `app/components/crud/housing-detail-view.tsx`, inside the `TenantsGrid` component, add a `handleGridReady` callback that calls `sizeColumnsToFit` after the wrapper's autoSize tick, and pass it to `<AgGridWrapper>`. Keep `domLayout="autoHeight"` untouched.

1. **Add `GridReadyEvent` to the existing `ag-grid-community` type import** at the top of the file. The current line is:
   ```ts
   import type { ColDef, RowClickedEvent } from 'ag-grid-community';
   ```
   Change to:
   ```ts
   import type { ColDef, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
   ```

2. **Inside `TenantsGrid`**, add the handler alongside the existing `handleRowClicked`:
   ```ts
   const handleGridReady = useCallback((event: GridReadyEvent) => {
     setTimeout(() => event.api.sizeColumnsToFit(), 20);
   }, []);
   ```

3. **Pass it to `<AgGridWrapper>`**. The returned JSX becomes:
   ```tsx
   return (
     <AgGridWrapper
       colDefs={TENANT_COL_DEFS}
       rowData={tenants as unknown as Record<string, unknown>[]}
       quickFilterText={query}
       pagination={false}
       domLayout="autoHeight"
       onRowClicked={handleRowClicked}
       onGridReady={handleGridReady}
     />
   );
   ```

No other changes. Do NOT touch `ag-grid-wrapper.tsx`, the top-level layout chrome, the stat cards, the notes section, the edit panel, or anything else in this file.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
  </verify>
  <done>
- `pnpm typecheck` passes.
- `GridReadyEvent` imported from `ag-grid-community`.
- `TenantsGrid` defines `handleGridReady` using `useCallback` and passes it to `<AgGridWrapper onGridReady={handleGridReady} />`.
- `domLayout="autoHeight"` still present.
- Visually (manual sanity): tenants grid columns stretch to fill the detail panel width.
  </done>
</task>

</tasks>

<verification>
- `pnpm typecheck` passes after both tasks.
- Imports are clean: no unused identifiers, no missing ones. Prettier/ESLint will flag either.
- Only two files changed: `app/components/ag-grid/housing-map-view.tsx` and `app/components/crud/housing-detail-view.tsx`. `git status` should show exactly those two modified files.
- Wrapper (`ag-grid-wrapper.tsx`) and `column-state.ts` are untouched.
</verification>

<success_criteria>
- `pnpm typecheck` exits 0.
- `git diff --stat` lists exactly 2 modified files.
- Housing list (`/home/:account/human_resources/housing`) renders the 4-card SummaryBar above the grid.
- Housing list columns render in the order: avatar, Name, Beds, Baths, Occupancy — even after a fresh load (no reliance on localStorage state).
- Housing list avatar is a `h-8 w-8` circle that fits cleanly within the default row.
- Housing list grid stretches to full container width after mount.
- Housing detail tenants grid stretches to full detail-panel width after mount.
</success_criteria>

<output>
After completion, create `.planning/quick/260417-nbq-polish-housing-ag-grid-restore-summary-c/260417-nbq-01-SUMMARY.md`.
</output>
