import type { ComponentType, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  CellClassParams,
  CellClickedEvent,
  ColDef,
  ColGroupDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GetRowIdParams,
  GridReadyEvent,
  ICellRendererParams,
  IsFullWidthRowParams,
  PostSortRowsParams,
  RowClassParams,
  RowClickedEvent,
  RowHeightParams,
  RowSelectionOptions,
  SelectionChangedEvent,
  SortChangedEvent,
} from 'ag-grid-community';
import { AllCommunityModule, type Module } from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';
import { useTheme } from 'next-themes';

import { ClientOnly } from '@aloha/ui/client-only';

import { getAgGridTheme } from '~/components/ag-grid/ag-grid-theme';

// Match MOBILE_BREAKPOINT from @aloha/ui/hooks/use-mobile (768). Local copy
// because the shared hook isn't exported from the package.
const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

// Module-level constants so references are stable across renders
const AG_GRID_MODULES: Module[] = [AllCommunityModule];
const PAGE_SIZE_SELECTOR = [10, 25, 50, 100];

// Auto-size columns to their content; if the total fits inside the grid,
// flex-fill the remaining space so columns don't leave a blank gutter.
function autoSizeThenFill(api: {
  autoSizeAllColumns: (skipHeader?: boolean) => void;
  sizeColumnsToFit: () => void;
  getColumns: () => { getActualWidth: () => number }[] | null;
}) {
  api.autoSizeAllColumns(false);
  const cols = api.getColumns();
  if (!cols) return;
  const total = cols.reduce((sum, c) => sum + c.getActualWidth(), 0);
  // Read grid body width via DOM — AG Grid doesn't expose viewport width
  // through the API. Falls back to no-op if not yet rendered.
  const viewport = document.querySelector(
    '.ag-center-cols-viewport',
  ) as HTMLElement | null;
  const width = viewport?.clientWidth ?? 0;
  if (width > 0 && total < width) api.sizeColumnsToFit();
}

interface AgGridWrapperProps {
  colDefs: (ColDef | ColGroupDef)[];
  rowData: Record<string, unknown>[];
  pinnedBottomRowData?: Record<string, unknown>[];
  quickFilterText?: string;
  onRowClicked?: (event: RowClickedEvent) => void;
  onCellClicked?: (event: CellClickedEvent) => void;
  isFullWidthRow?: (params: IsFullWidthRowParams) => boolean;
  fullWidthCellRenderer?: ComponentType<ICellRendererParams>;
  getRowId?: (params: GetRowIdParams) => string;
  rowClassRules?: Record<
    string,
    string | ((params: RowClassParams) => boolean)
  >;
  gridRef?: RefObject<AgGridReact | null>;
  loading?: boolean;
  emptyMessage?: string;
  height?: string;
  paginationPageSize?: number;
  pagination?: boolean;
  domLayout?: 'normal' | 'autoHeight' | 'print';
  getRowHeight?: (params: RowHeightParams) => number | undefined;
  suppressRowClickSelection?: boolean;
  rowSelection?: 'single' | 'multiple' | RowSelectionOptions;
  onGridReady?: (event: GridReadyEvent) => void;
  onSelectionChanged?: (event: SelectionChangedEvent) => void;
  onColumnMoved?: (event: ColumnMovedEvent) => void;
  onColumnResized?: (event: ColumnResizedEvent) => void;
  onSortChanged?: (event: SortChangedEvent) => void;
  onColumnVisible?: (event: ColumnVisibleEvent) => void;
  getRowStyle?: (params: RowClassParams) => Record<string, string> | undefined;
}

export function AgGridWrapper(props: AgGridWrapperProps) {
  return (
    <ClientOnly fallback={<GridSkeleton />}>
      <AgGridInner {...props} />
    </ClientOnly>
  );
}

function AgGridInner({
  colDefs,
  rowData,
  pinnedBottomRowData,
  quickFilterText,
  onRowClicked,
  onCellClicked,
  isFullWidthRow,
  fullWidthCellRenderer,
  getRowId,
  rowClassRules,
  gridRef,
  loading,
  emptyMessage,
  height,
  paginationPageSize,
  pagination,
  domLayout,
  getRowHeight,
  suppressRowClickSelection,
  rowSelection,
  onGridReady,
  onSelectionChanged,
  onColumnMoved,
  onColumnResized,
  onSortChanged,
  onColumnVisible,
  getRowStyle,
}: AgGridWrapperProps) {
  const { resolvedTheme } = useTheme();
  const theme = useMemo(() => getAgGridTheme(), []);
  const isMobile = useIsMobile();

  // Strip pinned: 'left'/'right' from colDefs on mobile — pinned columns
  // occupy too much of the narrow viewport and hide the rest of the table.
  const effectiveColDefs = useMemo(() => {
    if (!isMobile) return colDefs;
    return colDefs.map((col) => {
      if ('pinned' in col && col.pinned) {
        const { pinned: _pinned, ...rest } = col as ColDef;
        return rest;
      }
      return col;
    });
  }, [colDefs, isMobile]);

  // Wrap user's onGridReady so that on mobile we force-unpin every column
  // AFTER any restored column state has been applied. Without this, a
  // persisted `pinned: 'left'` from localStorage would override the
  // stripped colDefs on mount.
  const handleGridReadyWithMobileUnpin = useCallback(
    (event: GridReadyEvent) => {
      onGridReady?.(event);
      if (isMobile) {
        event.api.applyColumnState({
          defaultState: { pinned: null },
        });
      }
      // Auto-size columns to fit their content (header + cell values).
      // If the resulting total is narrower than the grid, expand the
      // remainder proportionally so the table fills the viewport.
      setTimeout(() => {
        autoSizeThenFill(event.api);
      }, 0);
    },
    [onGridReady, isMobile],
  );

  // Re-fit columns when the grid container resizes (e.g. sidebar toggle)
  const handleGridSizeChanged = useCallback(
    (event: {
      api: {
        autoSizeAllColumns: (skipHeader?: boolean) => void;
        sizeColumnsToFit: () => void;
        getColumns: () => { getActualWidth: () => number }[] | null;
      };
      clientWidth?: number;
    }) => {
      autoSizeThenFill(event.api);
    },
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: false,
      // Tight floor — autoSizeAllColumns sets actual widths from content;
      // this is just a safety floor so unusually short columns don't
      // collapse to nothing.
      minWidth: 70,
      autoHeaderHeight: true,
      // Wrap header text onto two lines instead of clipping ("Start Date"
      // becomes "Start" / "Date" rather than "Start Da…"). Combined with
      // the `.ag-header-cell-text` CSS override in kit.css, single words
      // never break mid-character.
      wrapHeaderText: true,
      // Right-align any cell whose value is a finite number — covers
      // integer/decimal columns that aren't explicitly tagged
      // type:'number' in their CrudModuleConfig. tabular-nums keeps
      // digits in stable columns. Skips columns that already carry a
      // custom cellClass (e.g. numericColDef adds 'text-right' itself).
      cellClass: (params: CellClassParams) => {
        const v = params.value;
        if (typeof v !== 'number' || !Number.isFinite(v)) return '';
        return 'text-right tabular-nums';
      },
    }),
    [],
  );

  const effectiveDomLayout = domLayout ?? 'normal';

  // Keep detail rows pinned right after their parent row after sorting
  const postSortRows = useCallback((params: PostSortRowsParams) => {
    const nodes = params.nodes;
    const detailNodes: typeof nodes = [];
    const parentNodes: typeof nodes = [];

    for (const node of nodes) {
      if (node.data?._isDetailRow) {
        detailNodes.push(node);
      } else {
        parentNodes.push(node);
      }
    }

    if (detailNodes.length === 0) return;

    nodes.length = 0;
    for (const parent of parentNodes) {
      nodes.push(parent);
      const detail = detailNodes.find(
        (d) => d.data?._parentData === parent.data,
      );
      if (detail) nodes.push(detail);
    }
  }, []);

  // Horizontal scroll indicator — add a visible scrollbar track
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector(
      '.ag-body-horizontal-scroll-viewport',
    ) as HTMLElement | null;
    if (!el) return;
    // Force scrollbar to always be visible when content overflows
    el.style.overflowX = 'auto';
    el.style.scrollbarWidth = 'thin';
  }, []);

  return (
    <div
      ref={containerRef}
      data-ag-theme-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}
      data-test="ag-grid-wrapper"
      className="ag-grid-cell-borders h-full w-full"
      style={
        effectiveDomLayout === 'normal'
          ? { height: height ?? '100%' }
          : undefined
      }
    >
      <AgGridProvider modules={AG_GRID_MODULES}>
        <AgGridReact
          ref={gridRef}
          theme={theme}
          columnDefs={effectiveColDefs}
          rowData={rowData}
          pinnedBottomRowData={pinnedBottomRowData}
          defaultColDef={defaultColDef}
          pagination={pagination ?? true}
          paginationPageSize={paginationPageSize ?? 25}
          paginationPageSizeSelector={PAGE_SIZE_SELECTOR}
          quickFilterText={quickFilterText}
          cacheQuickFilter={true}
          animateRows={false}
          suppressRowClickSelection={suppressRowClickSelection ?? true}
          onRowClicked={onRowClicked}
          onCellClicked={onCellClicked}
          isFullWidthRow={isFullWidthRow}
          fullWidthCellRenderer={fullWidthCellRenderer}
          getRowId={getRowId}
          postSortRows={postSortRows}
          rowClassRules={rowClassRules}
          domLayout={effectiveDomLayout}
          getRowHeight={getRowHeight}
          getRowStyle={getRowStyle}
          loading={loading}
          overlayNoRowsTemplate={emptyMessage ?? 'No records found'}
          rowSelection={rowSelection}
          onGridReady={handleGridReadyWithMobileUnpin}
          onGridSizeChanged={handleGridSizeChanged}
          onSelectionChanged={onSelectionChanged}
          onColumnMoved={onColumnMoved}
          onColumnResized={onColumnResized}
          onSortChanged={onSortChanged}
          onColumnVisible={onColumnVisible}
        />
      </AgGridProvider>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="animate-pulse" data-test="ag-grid-skeleton">
      <div className="bg-muted h-10 rounded" />
      <div className="bg-muted/50 mt-1 h-8 rounded" />
      <div className="bg-muted/50 mt-1 h-8 rounded" />
      <div className="bg-muted/50 mt-1 h-8 rounded" />
      <div className="bg-muted/50 mt-1 h-8 rounded" />
      <div className="bg-muted/50 mt-1 h-8 rounded" />
    </div>
  );
}
