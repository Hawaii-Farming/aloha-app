import type { ComponentType, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  GetRowIdParams,
  GridApi,
  ICellRendererParams,
  IsFullWidthRowParams,
  RowClickedEvent,
} from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';

interface UseDetailRowOptions {
  sourceData: Record<string, unknown>[];
  pkColumn?: string;
  detailComponent: ComponentType<{ data: Record<string, unknown> }>;
  gridRef: RefObject<AgGridReact | null>;
}

interface UseDetailRowReturn {
  rowData: Record<string, unknown>[];
  isFullWidthRow: (params: IsFullWidthRowParams) => boolean;
  fullWidthCellRenderer: ComponentType<ICellRendererParams>;
  handleRowClicked: (event: RowClickedEvent) => void;
  getRowId: (params: GetRowIdParams) => string;
  hasExpandedRow: boolean;
}

export function useDetailRow({
  sourceData,
  pkColumn = 'id',
  detailComponent: DetailComponent,
  gridRef,
}: UseDetailRowOptions): UseDetailRowReturn {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const expandedRef = useRef<string | null>(null);

  // Initial rowData includes source data only — detail rows are managed via transactions
  const rowData = useMemo(() => [...sourceData], [sourceData]);

  // Apply detail row add/remove via grid API transaction (no rowData prop change)
  useEffect(() => {
    const api = gridRef.current?.api as GridApi | undefined;
    if (!api) return;

    const prevId = expandedRef.current;
    const nextId = expandedRowId;
    expandedRef.current = nextId;

    if (prevId === nextId) return;

    const remove: Record<string, unknown>[] = [];
    const add: Record<string, unknown>[] = [];
    let addIndex: number | undefined;

    // Remove previous detail row
    if (prevId !== null) {
      const prevDetail = { [pkColumn]: `${prevId}_detail` };
      remove.push(prevDetail);
    }

    // Add new detail row after its parent
    if (nextId !== null) {
      const parentRow = sourceData.find(
        (row) => String(row[pkColumn] ?? '') === nextId,
      );
      if (parentRow) {
        const parentIndex = sourceData.indexOf(parentRow);
        // Account for any existing detail row before this index
        const offset =
          prevId !== null
            ? (() => {
                const prevParentIdx = sourceData.findIndex(
                  (r) => String(r[pkColumn] ?? '') === prevId,
                );
                return prevParentIdx !== -1 && prevParentIdx < parentIndex
                  ? 0
                  : 0;
              })()
            : 0;
        addIndex = parentIndex + 1 + offset;
        add.push({
          _isDetailRow: true,
          _parentData: parentRow,
          [pkColumn]: `${nextId}_detail`,
        });
      }
    }

    api.applyTransaction({ remove, add, addIndex });
  }, [expandedRowId, sourceData, pkColumn, gridRef]);

  // When sourceData changes (e.g. revalidation), re-insert the detail row if one was expanded
  const prevSourceRef = useRef(sourceData);
  useEffect(() => {
    if (prevSourceRef.current === sourceData) return;
    prevSourceRef.current = sourceData;

    const api = gridRef.current?.api as GridApi | undefined;
    if (!api || expandedRef.current === null) return;

    const currentId = expandedRef.current;
    const parentRow = sourceData.find(
      (row) => String(row[pkColumn] ?? '') === currentId,
    );

    if (parentRow) {
      const parentIndex = sourceData.indexOf(parentRow);
      // Remove old detail row and re-add with fresh parent data
      api.applyTransaction({
        remove: [{ [pkColumn]: `${currentId}_detail` }],
        add: [
          {
            _isDetailRow: true,
            _parentData: parentRow,
            [pkColumn]: `${currentId}_detail`,
          },
        ],
        addIndex: parentIndex + 1,
      });
    } else {
      // Parent row no longer exists — collapse via ref only
      // (avoid setState in effect to prevent cascading renders)
      api.applyTransaction({
        remove: [{ [pkColumn]: `${currentId}_detail` }],
      });
      expandedRef.current = null;
    }
  }, [sourceData, pkColumn, gridRef]);

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
          <div className="animate-in fade-in-0 slide-in-from-top-1 px-2 py-2 duration-300 ease-out">
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
    hasExpandedRow: expandedRowId !== null,
  };
}
