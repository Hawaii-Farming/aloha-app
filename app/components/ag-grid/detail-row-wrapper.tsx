import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

  const [pendingOpen, setPendingOpen] = useState<string | null>(null);

  // Two-phase open: after close commits to DOM, open the pending row
  useEffect(() => {
    if (pendingOpen && expandedRowId === null) {
      const id = pendingOpen;
      const t = setTimeout(() => {
        setPendingOpen(null);
        setExpandedRowId(id);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [pendingOpen, expandedRowId]);

  const handleRowClicked = useCallback(
    (event: RowClickedEvent) => {
      if (event.data?._isDetailRow) return;

      const clickedPk = String(event.data?.[pkColumn] ?? '');

      // Same row — toggle off
      if (expandedRowId === clickedPk) {
        setPendingOpen(null);
        setExpandedRowId(null);
        return;
      }

      // Different row open — close it, queue the new one
      if (expandedRowId !== null) {
        setPendingOpen(clickedPk);
        setExpandedRowId(null);
        return;
      }

      setExpandedRowId(clickedPk);
    },
    [pkColumn, expandedRowId],
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
          <div className="border-border animate-in fade-in slide-in-from-top-3 border-b px-2 py-2 duration-500 ease-out">
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
