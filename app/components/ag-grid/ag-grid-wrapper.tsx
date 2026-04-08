import type { ComponentType, RefObject } from 'react';
import { useMemo } from 'react';

import type {
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
  IsFullWidthRowParams,
  RowClassParams,
  RowClickedEvent,
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
  suppressRowClickSelection?: boolean;
  rowSelection?: 'single' | 'multiple';
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
  suppressRowClickSelection,
  rowSelection,
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

  const effectiveDomLayout = domLayout ?? 'autoHeight';

  return (
    <div
      data-ag-theme-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}
      data-test="ag-grid-wrapper"
      className="w-full"
      style={
        effectiveDomLayout === 'normal'
          ? { height: height ?? 'auto' }
          : undefined
      }
    >
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
          loading={loading}
          overlayNoRowsTemplate={emptyMessage ?? 'No records found'}
          rowSelection={rowSelection}
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
