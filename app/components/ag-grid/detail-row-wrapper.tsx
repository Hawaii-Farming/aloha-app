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
  /** Number of currently expanded rows */
  expandedCount: number;
  /** Collapse all expanded rows */
  collapseAll: () => void;
}

export function useDetailRow({
  sourceData,
  pkColumn = 'id',
  detailComponent: DetailComponent,
}: UseDetailRowOptions): UseDetailRowReturn {
  // Use a plain array — React handles array state changes reliably
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const rowData = useMemo(() => {
    const result: Record<string, unknown>[] = [];
    for (const row of sourceData) {
      result.push(row);
      const pk = String(row[pkColumn] ?? '');
      if (expandedIds.includes(pk)) {
        result.push({
          _isDetailRow: true,
          _parentData: row,
          [pkColumn]: `${pk}_detail`,
        });
      }
    }
    return result;
  }, [sourceData, expandedIds, pkColumn]);

  const isFullWidthRow = useCallback((params: IsFullWidthRowParams) => {
    return params.rowNode.data?._isDetailRow === true;
  }, []);

  const handleRowClicked = useCallback(
    (event: RowClickedEvent) => {
      if (event.data?._isDetailRow) return;

      const clickedPk = String(event.data?.[pkColumn] ?? '');
      if (!clickedPk) return;

      setExpandedIds((prev) =>
        prev.includes(clickedPk)
          ? prev.filter((id) => id !== clickedPk)
          : [...prev, clickedPk],
      );
    },
    [pkColumn],
  );

  const collapseAll = useCallback(() => {
    setExpandedIds([]);
  }, []);

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
    expandedCount: expandedIds.length,
    collapseAll,
  };
}
