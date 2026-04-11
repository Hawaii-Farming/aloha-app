import type { ComponentType, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
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

interface AgGridWrapperProps {
  colDefs: (ColDef | ColGroupDef)[];
  rowData: Record<string, unknown>[];
  pinnedBottomRowData?: Record<string, unknown>[];
  quickFilterText?: string;
  onRowClicked?: (event: RowClickedEvent) => void;
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
    },
    [onGridReady, isMobile],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      width: 120,
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
      className="h-full w-full"
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
