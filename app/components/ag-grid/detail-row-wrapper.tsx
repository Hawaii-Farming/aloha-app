import type { ComponentType } from 'react';
import { useCallback, useMemo, useState } from 'react';

import type {
  GetRowIdParams,
  ICellRendererParams,
  IsFullWidthRowParams,
  RowClickedEvent,
} from 'ag-grid-community';

interface UseDetailRowOptions {
  sourceData: Record<string, unknown>[];
  pkColumn?: string;
  detailComponent: ComponentType<{ data: Record<string, unknown> }>;
}

interface UseDetailRowReturn {
  rowData: Record<string, unknown>[];
  isFullWidthRow: (params: IsFullWidthRowParams) => boolean;
  fullWidthCellRenderer: ComponentType<ICellRendererParams>;
  handleRowClicked: (event: RowClickedEvent) => void;
  getRowId: (params: GetRowIdParams) => string;
  expandedCount: number;
  collapseAll: () => void;
}

export function useDetailRow({
  sourceData,
  pkColumn = 'id',
  detailComponent: DetailComponent,
}: UseDetailRowOptions): UseDetailRowReturn {
  // Single expanded row — proven working pattern
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
      if (event.data?._isDetailRow) return;
      const clickedPk = String(event.data?.[pkColumn] ?? '');
      if (!clickedPk) return;
      setExpandedRowId((prev) => (prev === clickedPk ? null : clickedPk));
    },
    [pkColumn],
  );

  const collapseAll = useCallback(() => {
    setExpandedRowId(null);
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
    expandedCount: expandedRowId !== null ? 1 : 0,
    collapseAll,
  };
}
