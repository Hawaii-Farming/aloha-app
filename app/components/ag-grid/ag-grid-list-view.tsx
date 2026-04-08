import { useCallback, useMemo, useRef, useState } from 'react';

import { useFetcher, useRevalidator, useSearchParams } from 'react-router';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridReadyEvent,
  RowHeightParams,
  SelectionChangedEvent,
  SortChangedEvent,
} from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';
import { ChevronsUpDown, Columns3, Plus, Trash2 } from 'lucide-react';

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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@aloha/ui/dropdown-menu';
import { Trans } from '@aloha/ui/trans';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import { mapColumnsToColDefs } from '~/components/ag-grid/column-mapper';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { CsvExportButton } from '~/components/ag-grid/csv-export-button';
import { useDetailRow } from '~/components/ag-grid/detail-row-wrapper';
import { InlineDetailRow } from '~/components/ag-grid/inline-detail-row';
import { CreatePanel } from '~/components/crud/create-panel';
import type {
  CrudModuleConfig,
  ListViewProps,
  WorkflowConfig,
} from '~/lib/crud/types';

type RowData = Record<string, unknown>;

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
}: ListViewProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const inactive = searchParams.get('inactive') ?? 'false';

  const subModuleSlug = config?.tableName ?? 'unknown';
  const pkColumn = config?.pkColumn ?? 'id';

  // Inline detail row — renders record details in an expanded full-width row
  const detailComponent = useMemo(
    () =>
      function DetailRenderer({ data }: { data: Record<string, unknown> }) {
        return (
          <InlineDetailRow data={data} config={config as CrudModuleConfig} />
        );
      },
    [config],
  );

  const {
    rowData: detailRowData,
    isFullWidthRow,
    fullWidthCellRenderer,
    handleRowClicked: handleDetailRowClicked,
    getRowId,
    expandedCount,
    collapseAll,
  } = useDetailRow({
    sourceData: (tableData.data as Record<string, unknown>[]) ?? [],
    pkColumn,
    detailComponent,
  });

  // Detail rows: compact card layout with avatar + info strips
  const getRowHeight = useCallback((params: RowHeightParams) => {
    if (params.data?._isDetailRow) {
      return 140;
    }
    return undefined;
  }, []);

  const dataColDefs = useMemo(() => {
    if (config?.agGridColDefs) return config.agGridColDefs;
    return mapColumnsToColDefs(config?.columns ?? []);
  }, [config?.agGridColDefs, config?.columns]);

  // Show avatar column when data has profile_photo_url
  const hasAvatar =
    (tableData.data as RowData[])?.[0]?.profile_photo_url !== undefined;

  const allColDefs = useMemo(
    () => [...(hasAvatar ? [AVATAR_COL] : []), ...dataColDefs],
    [dataColDefs, hasAvatar],
  );

  const updateParams = useCallback(
    (updates: Record<string, string | number>) => {
      const next = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value === '' || value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      setSearchParams(next, { preventScrollReset: true });
    },
    [searchParams, setSearchParams],
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
            showInactive={inactive === 'true'}
            onShowInactiveChange={(value) =>
              updateParams({ inactive: value ? 'true' : 'false', page: 1 })
            }
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
                <Button
                  size="sm"
                  variant="outline"
                  disabled={expandedCount === 0}
                  onClick={collapseAll}
                  data-test="collapse-all-button"
                >
                  <ChevronsUpDown className="mr-2 h-4 w-4" />
                  Collapse ({expandedCount})
                </Button>
                <ColumnVisibilityDropdown
                  gridApi={gridApi}
                  colDefs={dataColDefs}
                />
                <CsvExportButton
                  gridApi={gridApi}
                  fileName={config?.tableName}
                />
                <Button
                  size="sm"
                  variant="brand"
                  onClick={() => setCreateOpen(true)}
                  data-test="sub-module-create-button"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <Trans i18nKey="common:create" />
                </Button>
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
            rowData={detailRowData as RowData[]}
            quickFilterText={searchValue}
            onRowClicked={handleDetailRowClicked}
            isFullWidthRow={isFullWidthRow}
            fullWidthCellRenderer={fullWidthCellRenderer}
            getRowId={getRowId}
            getRowHeight={getRowHeight}
            rowSelection={{
              mode: 'multiRow',
              checkboxes: true,
              headerCheckbox: true,
              enableClickSelection: false,
            }}
            pagination={true}
            paginationPageSize={tableData.pageSize}
            onGridReady={handleGridReady}
            onSelectionChanged={handleSelectionChanged}
            onColumnMoved={handleColumnMoved}
            onColumnResized={handleColumnResized}
            onSortChanged={handleSortChanged}
            onColumnVisible={handleColumnVisible}
          />
        </div>
      </div>

      <CreatePanel
        open={createOpen}
        onOpenChange={setCreateOpen}
        config={config}
        fkOptions={fkOptions}
        comboboxOptions={comboboxOptions}
        subModuleDisplayName={subModuleDisplayName}
      />
    </>
  );
}

function ColumnVisibilityDropdown({
  gridApi,
  colDefs,
}: {
  gridApi: GridApi | null;
  colDefs: ColDef[];
}) {
  const [, forceUpdate] = useState(0);

  const handleToggle = useCallback(
    (colId: string, visible: boolean) => {
      if (!gridApi) return;
      gridApi.setColumnsVisible([colId], visible);
      forceUpdate((n) => n + 1);
    },
    [gridApi],
  );

  const columnStates = gridApi?.getColumnState();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          data-test="column-visibility-toggle"
        >
          <Columns3 className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {colDefs.map((col) => {
          const colId = col.field ?? col.colId ?? '';
          if (!colId) return null;

          const state = columnStates?.find((s) => s.colId === colId);
          const isVisible = state ? !state.hide : !col.hide;

          return (
            <DropdownMenuCheckboxItem
              key={colId}
              checked={isVisible}
              onCheckedChange={(checked) =>
                handleToggle(colId, checked as boolean)
              }
            >
              {col.headerName ?? colId}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
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
            size="sm"
            variant="destructive"
            disabled={isSubmitting}
            data-test="bulk-delete-button"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
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
