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

import { getAgGridTheme } from '~/components/ag-grid/ag-grid-theme';

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

const AG_GRID_MODULES: Module[] = [AllCommunityModule];
const PAGE_SIZE_SELECTOR = [10, 25, 50, 100];

function autoSizeThenFill(api: {
  autoSizeAllColumns: (skipHeader?: boolean) => void;
  sizeColumnsToFit: () => void;
  getColumns: () => { getActualWidth: () => number }[] | null;
}) {
  api.autoSizeAllColumns(false);
  const cols = api.getColumns();
  if (!cols) return;
  const total = cols.reduce((sum, c) => sum + c.getActualWidth(), 0);
  const viewport = document.querySelector(
    '.ag-center-cols-viewport',
  ) as HTMLElement | null;
  const width = viewport?.clientWidth ?? 0;
  if (width > 0 && total < width) api.sizeColumnsToFit();
}

export interface AgGridInnerProps {
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
  /** Disable the wrapper's autoSize-then-fill on grid ready and size changes.
   * Set to false when restoring persisted column widths via onGridReady so
   * the wrapper does not immediately recompute and override them. */
  autoSizeColumns?: boolean;
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
  autoSizeColumns = true,
}: AgGridInnerProps) {
  const { resolvedTheme } = useTheme();
  const theme = useMemo(() => getAgGridTheme(), []);
  const isMobile = useIsMobile();

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

  const handleGridReadyWithMobileUnpin = useCallback(
    (event: GridReadyEvent) => {
      onGridReady?.(event);
      if (isMobile) {
        event.api.applyColumnState({
          defaultState: { pinned: null },
        });
      }
      if (autoSizeColumns) {
        setTimeout(() => {
          autoSizeThenFill(event.api);
        }, 0);
      }
    },
    [onGridReady, isMobile, autoSizeColumns],
  );

  const handleGridSizeChanged = useCallback(
    (event: {
      api: {
        autoSizeAllColumns: (skipHeader?: boolean) => void;
        sizeColumnsToFit: () => void;
        getColumns: () => { getActualWidth: () => number }[] | null;
      };
      clientWidth?: number;
    }) => {
      if (!autoSizeColumns) return;
      autoSizeThenFill(event.api);
    },
    [autoSizeColumns],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: false,
      minWidth: 70,
      autoHeaderHeight: true,
      wrapHeaderText: true,
      cellClass: (params: CellClassParams) => {
        const v = params.value;
        if (typeof v !== 'number' || !Number.isFinite(v)) return '';
        return 'text-right tabular-nums';
      },
    }),
    [],
  );

  const effectiveDomLayout = domLayout ?? 'normal';

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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector(
      '.ag-body-horizontal-scroll-viewport',
    ) as HTMLElement | null;
    if (!el) return;
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

export default AgGridInner;
