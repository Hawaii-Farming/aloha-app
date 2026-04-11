import { useCallback, useMemo, useRef, useState } from 'react';

import { useFetcher, useParams, useRevalidator } from 'react-router';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridReadyEvent,
  SelectionChangedEvent,
  SortChangedEvent,
} from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';
import { Plus, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@aloha/ui/alert-dialog';
import { Button } from '@aloha/ui/button';
import { DataTableToolbar } from '@aloha/ui/data-table-toolbar';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import { mapColumnsToColDefs } from '~/components/ag-grid/column-mapper';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { useDetailRow } from '~/components/ag-grid/detail-row-wrapper';
import { InlineDetailRow } from '~/components/ag-grid/inline-detail-row';
import { CreatePanel } from '~/components/crud/create-panel';
import { getModuleConfig } from '~/lib/crud/registry';
import type {
  CrudModuleConfig,
  ListViewProps,
  WorkflowConfig,
} from '~/lib/crud/types';

type RowData = Record<string, unknown>;

const CHECKBOX_COL: ColDef = {
  headerCheckboxSelection: true,
  checkboxSelection: true,
  maxWidth: 50,
  sortable: false,
  filter: false,
  resizable: false,
  suppressMovable: true,
  pinned: 'left',
  lockPosition: true,
};

const AVATAR_COL: ColDef = {
  headerName: '',
  field: 'profile_photo_url',
  cellRenderer: AvatarRenderer,
  maxWidth: 60,
  minWidth: 60,
  sortable: false,
  filter: false,
  resizable: false,
  suppressMovable: true,
  pinned: 'left',
  lockPosition: true,
};

export default function AgGridListView({
  config,
  tableData,
  fkOptions,
  comboboxOptions,
  subModuleDisplayName,
  filterSlot,
}: ListViewProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const params = useParams();

  const subModuleSlug = params.subModule ?? config?.tableName ?? 'unknown';
  const pkColumn = config?.pkColumn ?? 'id';

  // Re-resolve config from registry to recover non-serializable fields
  // (cellRenderer functions are lost during React Router loader serialization)
  const freshConfig = useMemo(
    () => getModuleConfig(subModuleSlug) ?? config,
    [subModuleSlug, config],
  );

  const noDetailRow = freshConfig?.noDetailRow === true;

  // Inline detail row — use custom detail component from config if available
  const CustomDetail = freshConfig?.agGridDetailRow;
  const detailComponent = useMemo(
    () =>
      function DetailRenderer({ data }: { data: Record<string, unknown> }) {
        if (CustomDetail) return <CustomDetail data={data} />;
        return (
          <InlineDetailRow data={data} config={config as CrudModuleConfig} />
        );
      },
    [config, CustomDetail],
  );

  const {
    rowData: detailRowData,
    isFullWidthRow,
    fullWidthCellRenderer,
    handleRowClicked: handleDetailRowClicked,
    getRowId,
    hasExpandedRow: _hasExpandedRow,
  } = useDetailRow({
    sourceData: (tableData.data as Record<string, unknown>[]) ?? [],
    pkColumn,
    detailComponent,
    gridRef,
  });

  const detailRowHeight = 160;
  const getRowHeight = useCallback(
    (params: { data?: Record<string, unknown> }) => {
      if (params.data?._isDetailRow) return detailRowHeight;
      return undefined;
    },
    [detailRowHeight],
  );

  const hasCustomColDefs = Boolean(freshConfig?.agGridColDefs);

  const dataColDefs = useMemo(() => {
    if (freshConfig?.agGridColDefs) return freshConfig.agGridColDefs;
    return mapColumnsToColDefs(freshConfig?.columns ?? []);
  }, [freshConfig]);

  // Show avatar column when data has profile_photo_url (skip when custom colDefs manage their own layout)
  const hasAvatar =
    !hasCustomColDefs &&
    (tableData.data as RowData[])?.[0]?.profile_photo_url !== undefined;

  const allColDefs = useMemo(
    () =>
      hasCustomColDefs
        ? dataColDefs
        : [CHECKBOX_COL, ...(hasAvatar ? [AVATAR_COL] : []), ...dataColDefs],
    [dataColDefs, hasAvatar, hasCustomColDefs],
  );

  const handleGridReady = useCallback(
    (event: GridReadyEvent) => {
      const api = event.api;
      setGridApi(api);
      restoreColumnState(subModuleSlug, api);
    },
    [subModuleSlug],
  );

  const debouncedSaveState = useCallback(
    (api: GridApi) => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
      saveDebounceRef.current = setTimeout(() => {
        saveColumnState(subModuleSlug, api);
      }, 300);
    },
    [subModuleSlug],
  );

  const handleColumnMoved = useCallback(
    (event: ColumnMovedEvent) => {
      if (event.finished && event.api) {
        debouncedSaveState(event.api);
      }
    },
    [debouncedSaveState],
  );

  const handleColumnResized = useCallback(
    (event: ColumnResizedEvent) => {
      if (event.finished && event.api) {
        debouncedSaveState(event.api);
      }
    },
    [debouncedSaveState],
  );

  const handleSortChanged = useCallback(
    (event: SortChangedEvent) => {
      debouncedSaveState(event.api);
    },
    [debouncedSaveState],
  );

  const handleColumnVisible = useCallback(
    (event: ColumnVisibleEvent) => {
      debouncedSaveState(event.api);
    },
    [debouncedSaveState],
  );

  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => {
      const rows = event.api.getSelectedRows() as RowData[];
      const ids = rows
        .map((row) => String(row[pkColumn] ?? ''))
        .filter(Boolean);
      setSelectedIds(ids);
    },
    [pkColumn],
  );

  const clearSelection = useCallback(() => {
    gridApi?.deselectAll();
    setSelectedIds([]);
  }, [gridApi]);

  const selectedCount = selectedIds.length;

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col" data-test="sub-module-list">
        <div className="shrink-0 overflow-visible pb-4">
          <DataTableToolbar
            searchValue={searchValue}
            onSearchChange={(value) => {
              setSearchValue(value);

              if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
              }

              searchDebounceRef.current = setTimeout(() => {
                setSearchValue(value);
              }, 300);
            }}
            searchPlaceholder={
              config?.search?.placeholder ??
              `Search ${subModuleDisplayName.toLowerCase()}...`
            }
            filterSlot={filterSlot}
            actionSlot={
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <BulkActions
                    selectedIds={selectedIds}
                    selectedCount={selectedCount}
                    workflowConfig={config?.workflow}
                    onComplete={clearSelection}
                  />
                )}
                {(config?.formFields?.length ?? 0) > 0 && (
                  <Button
                    variant="brand"
                    onClick={() => setCreateOpen(true)}
                    data-test="sub-module-create-button"
                    aria-label="Create"
                    className="h-9 w-9 rounded-full p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            }
          />
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col"
          data-test="ag-grid-list-view"
        >
          <AgGridWrapper
            gridRef={gridRef}
            colDefs={allColDefs}
            rowData={
              noDetailRow
                ? (tableData.data as RowData[])
                : (detailRowData as RowData[])
            }
            quickFilterText={searchValue}
            onRowClicked={noDetailRow ? undefined : handleDetailRowClicked}
            isFullWidthRow={noDetailRow ? undefined : isFullWidthRow}
            fullWidthCellRenderer={
              noDetailRow ? undefined : fullWidthCellRenderer
            }
            getRowId={noDetailRow ? undefined : getRowId}
            getRowHeight={noDetailRow ? undefined : getRowHeight}
            rowSelection={noDetailRow ? undefined : 'multiple'}
            suppressRowClickSelection={noDetailRow ? undefined : true}
            pagination={false}
            onGridReady={handleGridReady}
            onSelectionChanged={handleSelectionChanged}
            onColumnMoved={handleColumnMoved}
            onColumnResized={handleColumnResized}
            onSortChanged={handleSortChanged}
            onColumnVisible={handleColumnVisible}
          />
        </div>
      </div>

      {(config?.formFields?.length ?? 0) > 0 && (
        <CreatePanel
          open={createOpen}
          onOpenChange={setCreateOpen}
          config={config}
          fkOptions={fkOptions}
          comboboxOptions={comboboxOptions}
          subModuleDisplayName={subModuleDisplayName}
        />
      )}
    </>
  );
}

function BulkActions({
  selectedIds,
  selectedCount,
  workflowConfig,
  onComplete,
}: {
  selectedIds: string[];
  selectedCount: number;
  workflowConfig?: WorkflowConfig;
  onComplete: () => void;
}) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const isSubmitting = fetcher.state !== 'idle';
  const hasHandledCompletion = useRef(false);

  // Watch fetcher state for completion. When the submit finishes (state goes
  // back to 'idle' and we have data), revalidate the loader and clear selection.
  // The ref guards against re-running on every render once handled.
  // Same pattern as table-list-view.tsx BulkActions.
  /* eslint-disable react-hooks/refs */
  if (
    fetcher.state === 'idle' &&
    fetcher.data !== undefined &&
    !hasHandledCompletion.current
  ) {
    hasHandledCompletion.current = true;
    revalidator.revalidate();
    onComplete();
  }
  /* eslint-enable react-hooks/refs */

  const handleBulkDelete = useCallback(() => {
    hasHandledCompletion.current = false;
    fetcher.submit(
      JSON.stringify({ intent: 'bulk_delete', ids: selectedIds }),
      { method: 'POST', encType: 'application/json' },
    );
  }, [fetcher, selectedIds]);

  const handleBulkTransition = useCallback(
    (newStatus: string) => {
      if (!workflowConfig) return;

      hasHandledCompletion.current = false;
      fetcher.submit(
        JSON.stringify({
          intent: 'bulk_transition',
          ids: selectedIds,
          statusColumn: workflowConfig.statusColumn,
          newStatus,
          transitionFields: workflowConfig.transitionFields?.[newStatus],
        }),
        { method: 'POST', encType: 'application/json' },
      );
    },
    [fetcher, selectedIds, workflowConfig],
  );

  const allTransitions = useMemo(() => {
    if (!workflowConfig) return [];

    const transitions = new Set<string>();

    for (const targets of Object.values(workflowConfig.transitions)) {
      for (const target of targets) {
        transitions.add(target);
      }
    }

    return Array.from(transitions);
  }, [workflowConfig]);

  return (
    <>
      <span className="text-muted-foreground text-xs font-medium">
        {selectedCount} selected
      </span>

      {workflowConfig &&
        allTransitions.map((status) => (
          <Button
            key={status}
            size="sm"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleBulkTransition(status)}
            data-test={`bulk-transition-${status}`}
          >
            {workflowConfig.states[status]?.label ?? status}
          </Button>
        ))}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            disabled={isSubmitting}
            data-test="bulk-delete-button"
            aria-label="Delete selected"
            className="h-9 w-9 rounded-full p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCount} record{selectedCount > 1 ? 's' : ''}?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will mark {selectedCount} record
              {selectedCount > 1 ? 's' : ''} as deleted. This can be undone by
              an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
