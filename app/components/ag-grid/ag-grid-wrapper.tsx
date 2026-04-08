import type { ComponentType, RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GetRowIdParams,
  GridReadyEvent,
  ICellRendererParams,
  IsFullWidthRowParams,
  RowClassParams,
  RowClickedEvent,
  RowHeightParams,
  SelectionChangedEvent,
  SortChangedEvent,
} from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';
import { useTheme } from 'next-themes';

import { ClientOnly } from '@aloha/ui/client-only';

import { getAgGridTheme } from '~/components/ag-grid/ag-grid-theme';

interface AgGridWrapperProps {
  colDefs: ColDef[];
  rowData: Record<string, unknown>[];
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
  rowSelection?: 'single' | 'multiple';
  onGridReady?: (event: GridReadyEvent) => void;
  onSelectionChanged?: (event: SelectionChangedEvent) => void;
  onColumnMoved?: (event: ColumnMovedEvent) => void;
  onColumnResized?: (event: ColumnResizedEvent) => void;
  onSortChanged?: (event: SortChangedEvent) => void;
  onColumnVisible?: (event: ColumnVisibleEvent) => void;
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
}: AgGridWrapperProps) {
  const { resolvedTheme } = useTheme();
  const theme = useMemo(() => getAgGridTheme(), []);
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 100,
    }),
    [],
  );

  const effectiveDomLayout = domLayout ?? 'normal';

  // Horizontal scroll indicator — detect if content overflows to the right
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasScrollRight, setHasScrollRight] = useState(false);

  const checkScrollRef = useRef(() => {
    const el = containerRef.current?.querySelector(
      '.ag-body-horizontal-scroll-viewport',
    ) as HTMLElement | null;
    if (!el) return;
    setHasScrollRight(el.scrollWidth > el.clientWidth + el.scrollLeft + 2);
  });

  useEffect(() => {
    const handler = () => checkScrollRef.current();
    const el = containerRef.current?.querySelector(
      '.ag-body-horizontal-scroll-viewport',
    ) as HTMLElement | null;
    if (!el) return;
    el.addEventListener('scroll', handler);
    const observer = new ResizeObserver(handler);
    observer.observe(el);
    // Defer initial check to after layout
    const raf = requestAnimationFrame(handler);
    return () => {
      el.removeEventListener('scroll', handler);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-ag-theme-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}
      data-test="ag-grid-wrapper"
      className="relative h-full w-full"
      style={
        effectiveDomLayout === 'normal'
          ? { height: height ?? '100%' }
          : undefined
      }
    >
      {/* Right-edge fade indicator when horizontal content overflows */}
      {hasScrollRight && (
        <div
          className="pointer-events-none absolute top-0 right-0 z-10 h-full w-6"
          style={{
            background:
              resolvedTheme === 'dark'
                ? 'linear-gradient(to right, transparent, rgba(38,38,38,0.8))'
                : 'linear-gradient(to right, transparent, rgba(250,250,250,0.8))',
          }}
        />
      )}
      <AgGridProvider modules={[AllCommunityModule]}>
        <AgGridReact
          ref={gridRef}
          theme={theme}
          columnDefs={colDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
          pagination={pagination ?? true}
          paginationPageSize={paginationPageSize ?? 25}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          quickFilterText={quickFilterText}
          cacheQuickFilter={true}
          animateRows={true}
          suppressRowClickSelection={suppressRowClickSelection ?? true}
          onRowClicked={onRowClicked}
          isFullWidthRow={isFullWidthRow}
          fullWidthCellRenderer={fullWidthCellRenderer}
          getRowId={getRowId}
          rowClassRules={rowClassRules}
          domLayout={effectiveDomLayout}
          getRowHeight={getRowHeight}
          loading={loading}
          overlayNoRowsTemplate={emptyMessage ?? 'No records found'}
          rowSelection={rowSelection}
          onGridReady={onGridReady}
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
