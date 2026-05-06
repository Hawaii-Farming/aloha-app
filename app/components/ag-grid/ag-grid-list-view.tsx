import { useCallback, useMemo, useRef, useState } from 'react';

import {
  useFetcher,
  useNavigate,
  useParams,
  useRevalidator,
  useRouteLoaderData,
} from 'react-router';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
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

import {
  useActiveTableSearch,
  useRegisterActiveTable,
} from '~/components/active-table-search-context';
import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import { mapColumnsToColDefs } from '~/components/ag-grid/column-mapper';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { InactiveToggle } from '~/components/ag-grid/inactive-toggle';
import { CreatePanel } from '~/components/crud/create-panel';
import { getModuleConfig } from '~/lib/crud/registry';
import type { ListViewProps, WorkflowConfig } from '~/lib/crud/types';

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
};

// Payroll Data $ columns to hide from the grid when current user is
// Team Lead. Mirrors the NULL-mask applied by hr_payroll_data_secure;
// see aloha-data-migrations 20260501120100_hr_payroll_rbac_views.sql.
const PAYROLL_DOLLAR_FIELDS = new Set([
  'hourly_rate',
  'regular_pay',
  'overtime_pay',
  'discretionary_overtime_pay',
  'holiday_pay',
  'pto_pay',
  'sick_pay',
  'funeral_pay',
  'other_pay',
  'bonus_pay',
  'auto_allowance',
  'per_diem',
  'salary',
  'gross_wage',
  'fit',
  'sit',
  'social_security',
  'medicare',
  'comp_plus',
  'hds_dental',
  'pre_tax_401k',
  'auto_deduction',
  'child_support',
  'program_fees',
  'net_pay',
  'labor_tax',
  'other_tax',
  'workers_compensation',
  'health_benefits',
  'other_health_charges',
  'admin_fees',
  'hawaii_get',
  'other_charges',
  'tdi',
  'total_cost',
]);

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
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const params = useParams();

  const subModuleSlug = params.subModule ?? config?.tableName ?? 'unknown';
  const pkColumn = config?.pkColumn ?? 'id';

  const { query } = useActiveTableSearch();
  useRegisterActiveTable(subModuleSlug, subModuleDisplayName ?? subModuleSlug);

  // Re-resolve config from registry to recover non-serializable fields
  // (cellRenderer functions are lost during React Router loader serialization)
  const freshConfig = useMemo(
    () => getModuleConfig(subModuleSlug) ?? config,
    [subModuleSlug, config],
  );

  const navigate = useNavigate();
  const account = params.account ?? '';
  const moduleSlug = params.module ?? '';

  const handleRowClicked = useCallback(
    (event: RowClickedEvent) => {
      // AG Grid listens on the row DOM directly, so React's synthetic
      // stopPropagation in cell renderers fires too late. Inspect the native
      // event target and skip navigation when the click originated from an
      // interactive control (buttons, links, inputs) inside a cell renderer.
      const nativeTarget = (event.event?.target ?? null) as HTMLElement | null;
      if (
        nativeTarget?.closest(
          'button, a, input, textarea, select, [role="button"], [role="menuitem"], [data-ag-grid-skip-row-click]',
        )
      ) {
        return;
      }
      const recordId = event.data?.[pkColumn];
      if (!recordId) return;
      navigate(`/home/${account}/${moduleSlug}/${subModuleSlug}/${recordId}`);
    },
    [navigate, account, moduleSlug, subModuleSlug, pkColumn],
  );

  const hasCustomColDefs = Boolean(freshConfig?.agGridColDefs);

  // Team Lead RBAC: hide $ columns from the Payroll Data sub-module.
  // The DB view (hr_payroll_data_secure) already returns NULL for these
  // fields when access_level_id = 'Team Lead'; this is the cosmetic
  // mirror so empty columns don't render in the grid. Scoped to
  // 'Payroll Data' so other sub-modules using this list view are
  // unaffected.
  const layoutData = useRouteLoaderData('routes/workspace/layout') as
    | { workspace?: { currentOrg?: { access_level_id?: string } } }
    | undefined;
  const isTeamLead =
    layoutData?.workspace?.currentOrg?.access_level_id === 'Team Lead';
  const isPayrollData = subModuleSlug === 'Payroll Data';

  const dataColDefs = useMemo(() => {
    const raw = freshConfig?.agGridColDefs
      ? freshConfig.agGridColDefs
      : mapColumnsToColDefs(freshConfig?.columns ?? []);
    if (!isPayrollData || !isTeamLead) return raw;
    return raw.filter((c) => {
      const field = 'field' in c ? c.field : undefined;
      return !field || !PAYROLL_DOLLAR_FIELDS.has(field);
    });
  }, [freshConfig, isPayrollData, isTeamLead]);

  // Show avatar column when data has profile_photo_url (skip when custom colDefs manage their own layout)
  const hasAvatar =
    !hasCustomColDefs &&
    (tableData.data as RowData[])?.[0]?.profile_photo_url !== undefined;

  const allColDefs = useMemo(
    () =>
      hasCustomColDefs
        ? dataColDefs
        : [...(hasAvatar ? [AVATAR_COL] : []), ...dataColDefs],
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
        {selectedCount > 0 && (
          <div className="shrink-0 overflow-visible px-4 py-2">
            <BulkActions
              selectedIds={selectedIds}
              selectedCount={selectedCount}
              workflowConfig={config?.workflow}
              onComplete={clearSelection}
            />
          </div>
        )}

        <div
          className="flex min-h-0 flex-1 flex-col"
          data-test="ag-grid-list-view"
        >
          <AgGridWrapper
            gridRef={gridRef}
            colDefs={allColDefs}
            rowData={tableData.data as RowData[]}
            quickFilterText={query}
            onRowClicked={
              freshConfig?.noRowClickNav ? undefined : handleRowClicked
            }
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

      {subModuleSlug === 'Register' && <InactiveToggle />}

      {(config?.formFields?.length ?? 0) > 0 && (
        <Button
          variant="brand"
          onClick={() => setCreateOpen(true)}
          data-test="sub-module-create-button"
          aria-label="Create"
          className="fixed right-10 bottom-10 z-30 h-14 w-14 rounded-full p-0 shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

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
