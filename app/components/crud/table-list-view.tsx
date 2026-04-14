import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  useFetcher,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from 'react-router';

import type { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { Columns3, Plus, Trash2 } from 'lucide-react';

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
import { Checkbox } from '@aloha/ui/checkbox';
import { DataTableColumnHeader } from '@aloha/ui/data-table-column-header';
import { DataTableToolbar } from '@aloha/ui/data-table-toolbar';
import { DataTable } from '@aloha/ui/enhanced-data-table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@aloha/ui/tooltip';

import { CreatePanel } from '~/components/crud/create-panel';
import type {
  ColumnConfig,
  ListViewProps,
  WorkflowConfig,
} from '~/lib/crud/types';

type RowData = Record<string, unknown>;

function subscribeToMedia(callback: () => void) {
  const mql = window.matchMedia('(min-width: 768px)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getIsDesktop() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(min-width: 768px)').matches;
}

function getIsDesktopServer() {
  return true;
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeToMedia,
    getIsDesktop,
    getIsDesktopServer,
  );
}

function buildVisibility(
  columns: ColumnConfig[],
  expanded: boolean,
): VisibilityState {
  if (expanded) return {};

  const visibility: VisibilityState = {};

  for (const col of columns) {
    if (col.priority === 'low') {
      visibility[col.key] = false;
    }
  }

  return visibility;
}

function buildColumns(columns: ColumnConfig[]): ColumnDef<RowData>[] {
  return columns.map((col) => {
    const def: ColumnDef<RowData> = {
      accessorKey: col.key,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={col.label} />
      ),
      enableSorting: true,
    };

    if (col.render === 'full_name') {
      def.cell = ({ row }) => {
        const first = (row.original['first_name'] as string) ?? '';
        const last = (row.original['last_name'] as string) ?? '';
        return `${last}, ${first}`.replace(/(^, |, $)/, '');
      };
    } else if (col.render === 'proper_case') {
      def.cell = ({ getValue }) => {
        const value = getValue() as string | null;
        if (!value) return '';
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      };
    } else if (col.type === 'date') {
      def.cell = ({ getValue }) => {
        const value = getValue() as string | null;
        if (!value) return '';
        const d = new Date(value);
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
      };
    } else if (col.type === 'datetime' || col.key === 'created_at') {
      def.cell = ({ getValue }) => {
        const value = getValue() as string | null;
        if (!value) return '';
        const d = new Date(value);
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
      };
    }

    return def;
  });
}

function buildSelectColumn(): ColumnDef<RowData> {
  return {
    id: '_select',
    size: 40,
    maxSize: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

function buildExpandColumn(
  expanded: boolean,
  onToggle: () => void,
): ColumnDef<RowData> {
  return {
    id: '_expand_cols',
    size: 36,
    maxSize: 36,
    enableSorting: false,
    enableHiding: false,
    header: () => (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggle}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                expanded
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-label={expanded ? 'Hide extra columns' : 'Show more columns'}
              data-test="expand-columns-toggle"
            >
              <Columns3 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {expanded ? 'Hide extra columns' : 'Show more columns'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    cell: () => null,
  };
}

export function TableListView({
  config,
  tableData,
  fkOptions,
  comboboxOptions,
  subModuleDisplayName,
}: ListViewProps) {
  const isDesktop = useIsDesktop();
  const configColumns = config?.columns ?? [];
  const hasLowPriorityCols = configColumns.some((c) => c.priority === 'low');

  const [expanded, setExpanded] = useState(isDesktop);

  const columnVisibility = useMemo(
    () => buildVisibility(configColumns, expanded),
    [configColumns, expanded],
  );

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const [createOpen, setCreateOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sort = searchParams.get('sort') ?? 'id';
  const dir = searchParams.get('dir') ?? 'asc';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending search debounce on unmount so we don't try to update
  // state on an unmounted component if the user navigates away mid-typing.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

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

      navigate(`?${next.toString()}`, { preventScrollReset: true });
    },
    [searchParams, navigate],
  );

  const selectCol = useMemo(() => buildSelectColumn(), []);
  const dataColumns = useMemo(
    () => buildColumns(configColumns),
    [configColumns],
  );
  const expandCol = useMemo(
    () => buildExpandColumn(expanded, toggleExpanded),
    [expanded, toggleExpanded],
  );
  const columns = useMemo(
    () => [
      selectCol,
      ...dataColumns,
      ...(hasLowPriorityCols ? [expandCol] : []),
    ],
    [selectCol, dataColumns, expandCol, hasLowPriorityCols],
  );
  const pkColumn = config?.pkColumn ?? 'id';

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;
  const selectedIds = useMemo(() => {
    const rows = tableData.data as RowData[];
    return Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([index]) => String(rows[Number(index)]?.[pkColumn] ?? ''))
      .filter(Boolean);
  }, [rowSelection, tableData.data, pkColumn]);

  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  return (
    <>
      <div
        className="flex flex-1 flex-col overflow-hidden"
        data-test="sub-module-list"
      >
        <div className="shrink-0 pb-4">
          <DataTableToolbar
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
                  variant="brand"
                  onClick={() => setCreateOpen(true)}
                  data-test="sub-module-create-button"
                  aria-label="Create"
                  className="h-9 w-9 rounded-full p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            }
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <DataTable
            data={tableData.data as RowData[]}
            columns={columns}
            columnVisibility={columnVisibility}
            enableRowSelection={true}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            pageIndex={tableData.page - 1}
            pageSize={tableData.pageSize}
            pageCount={tableData.pageCount}
            totalCount={tableData.totalCount}
            manualPagination={true}
            manualSorting={true}
            sorting={[{ id: sort, desc: dir === 'desc' }]}
            onSortingChange={(sorting) => {
              const s = sorting[0];

              if (s) {
                updateParams({
                  sort: s.id,
                  dir: s.desc ? 'desc' : 'asc',
                  page: 1,
                });
              }
            }}
            onPaginationChange={(pagination) => {
              updateParams({ page: pagination.pageIndex + 1 });
            }}
            onPageSizeChange={(size) => {
              updateParams({ pageSize: size, page: 1 });
            }}
            onRowClick={(row) => {
              const id = row[pkColumn] as string;

              if (id) {
                navigate(id);
              }
            }}
            emptyStateProps={{ heading: 'No records found' }}
            tableProps={{ 'data-test': 'crud-data-table' }}
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
