import type { ComponentType } from 'react';
import { useCallback, useMemo, useState } from 'react';

import type {
  GetRowIdParams,
  ICellRendererParams,
  IsFullWidthRowParams,
  RowClickedEvent,
} from 'ag-grid-community';

interface UseDetailRowOptions {
  /** The data array from the server loader */
  sourceData: Record<string, unknown>[];
  /** Primary key column name (default: 'id') */
  pkColumn?: string;
  /** React component to render inside the detail row */
  detailComponent: ComponentType<{ data: Record<string, unknown> }>;
}

interface UseDetailRowReturn {
  /** Modified rowData with detail rows injected */
  rowData: Record<string, unknown>[];
  /** Pass to AgGridWrapper.isFullWidthRow */
  isFullWidthRow: (params: IsFullWidthRowParams) => boolean;
  /** Pass to AgGridWrapper.fullWidthCellRenderer */
  fullWidthCellRenderer: ComponentType<ICellRendererParams>;
  /** Pass to AgGridWrapper.onRowClicked */
  handleRowClicked: (event: RowClickedEvent) => void;
  /** Pass to AgGridWrapper.getRowId */
  getRowId: (params: GetRowIdParams) => string;
  /** Currently expanded row ID (null if none) */
  expandedRowId: string | null;
}

export function useDetailRow({
  sourceData,
  pkColumn = 'id',
  detailComponent: DetailComponent,
}: UseDetailRowOptions): UseDetailRowReturn {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const rowData = useMemo(() => {
    const result: Record<string, unknown>[] = [];
    for (const row of sourceData) {
      result.push(row);
      const pk = String(row[pkColumn] ?? '');
      if (expandedRowId !== null && pk === expandedRowId) {
        result.push({
          _isDetailRow: true,
          _parentData: row,
          [pkColumn]: `${pk}_detail`,
        });
      }
    }
    return result;
  }, [sourceData, expandedRowId, pkColumn]);

  const isFullWidthRow = useCallback((params: IsFullWidthRowParams) => {
    return params.rowNode.data?._isDetailRow === true;
  }, []);

  const handleRowClicked = useCallback(
    (event: RowClickedEvent) => {
      // Ignore clicks on detail rows
      if (event.data?._isDetailRow) return;

      const clickedPk = String(event.data?.[pkColumn] ?? '');
      setExpandedRowId((prev) => (prev === clickedPk ? null : clickedPk));
    },
    [pkColumn],
  );

  const getRowId = useCallback(
    (params: GetRowIdParams) => {
      return String(params.data?.[pkColumn] ?? '');
    },
    [pkColumn],
  );

  const fullWidthCellRenderer = useMemo(
    () =>
      function DetailRowRenderer(params: ICellRendererParams) {
        const parentData = params.data?._parentData as
          | Record<string, unknown>
          | undefined;
        if (!parentData) return null;

        return (
          <div className="border-border bg-muted/30 border-b px-4 py-3">
            <DetailComponent data={parentData} />
          </div>
        );
      },
    [DetailComponent],
  );

  return {
    rowData,
    isFullWidthRow,
    fullWidthCellRenderer,
    handleRowClicked,
    getRowId,
    expandedRowId,
  };
}
