import { useCallback, useMemo, useRef } from 'react';

import { useParams, useRouteLoaderData, useSearchParams } from 'react-router';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridReadyEvent,
  RowClassParams,
  SortChangedEvent,
} from 'ag-grid-community';
import type { AgGridReact, CustomCellRendererProps } from 'ag-grid-react';

import {
  useActiveTableSearch,
  useRegisterActiveTable,
} from '~/components/active-table-search-context';
import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { useDetailRow } from '~/components/ag-grid/detail-row-wrapper';
import {
  CurrencyDeltaRenderer,
  CurrencyRenderer,
  hoursFormatter,
} from '~/components/ag-grid/payroll-formatters';
import { PayrollTaskEmployeeDetail } from '~/components/ag-grid/payroll-task-employee-detail';
import { PayrollViewToggle } from '~/components/ag-grid/payroll-view-toggle';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

function EmployeeNameRenderer(props: CustomCellRendererProps) {
  const data = props.data as RowData | undefined;
  if (!data) return null;
  const fullName = String(
    data.hr_employee_preferred_name ??
      data.full_name ??
      data.employee_name ??
      '',
  );
  const pinned = props.node.rowPinned === 'bottom';
  return (
    <span
      className={`flex h-full items-center truncate text-sm ${pinned ? 'font-bold' : 'font-medium'}`}
    >
      {fullName}
    </span>
  );
}

function PinnedAwareAvatarRenderer(props: CustomCellRendererProps) {
  if (props.node.rowPinned === 'bottom') return null;
  return <AvatarRenderer {...props} />;
}

// Delta renderer: signed value with arrow, no color coding.
// Currency deltas defer to CurrencyRenderer for consistent app-wide
// formatting. Hours deltas stay inline.
function DeltaRenderer(
  props: CustomCellRendererProps & { format?: 'currency' | 'hours' },
) {
  const raw = props.value;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const isPinned = props.node.rowPinned === 'bottom';
  const arrow = isPinned ? '' : n > 0 ? '▲' : n < 0 ? '▼' : '·';

  if (props.format === 'currency') {
    return (
      <div
        className={`flex h-full w-full items-center ${isPinned ? 'font-bold' : ''}`}
      >
        <CurrencyDeltaRenderer {...props} />
      </div>
    );
  }

  const text = formatSignedHours(n);
  return (
    <div
      className={`flex h-full w-full items-center justify-between text-sm ${isPinned ? 'font-bold' : ''}`}
    >
      <span aria-hidden className="shrink-0">
        {arrow}
      </span>
      <span>{text}</span>
    </div>
  );
}

function formatSignedHours(n: number) {
  const formatted = Math.round(Math.abs(n)).toLocaleString();
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${formatted}`;
}

const numericCol = (
  field: string,
  headerName: string,
  opts?: {
    width?: number;
    formatter?: typeof hoursFormatter;
    currency?: boolean;
  },
): ColDef => ({
  field,
  headerName,
  type: 'numericColumn',
  flex: 1,
  minWidth: opts?.width ?? 100,
  valueFormatter: opts?.currency ? undefined : opts?.formatter,
  cellRenderer: opts?.currency ? CurrencyRenderer : undefined,
});

const deltaCol = (
  field: string,
  headerName: string,
  format: 'currency' | 'hours',
): ColDef => ({
  field,
  headerName,
  type: 'numericColumn',
  flex: 1,
  minWidth: 110,
  cellRenderer: (p: CustomCellRendererProps) => DeltaRenderer({ ...p, format }),
});

// Source view: hr_payroll_task_comparison (one row per task with deltas
// vs prior period). No employee/department dimension.
const byTaskColDefs: ColDef[] = [
  { field: 'task', headerName: 'Task', minWidth: 220, pinned: 'left' },
  numericCol('scheduled_hours', 'Scheduled', { formatter: hoursFormatter }),
  numericCol('total_hours', 'Total Hours', { formatter: hoursFormatter }),
  deltaCol('hours_delta', 'Δ Hours', 'hours'),
  numericCol('total_cost', 'Total Cost', { currency: true, width: 130 }),
  deltaCol('total_cost_delta', 'Δ Total Cost', 'currency'),
  numericCol('discretionary_overtime_hours', 'OT Hours', {
    formatter: hoursFormatter,
  }),
  deltaCol('regular_pay_delta', 'Δ Reg Pay', 'currency'),
  deltaCol('discretionary_overtime_pay_delta', 'Δ OT Pay', 'currency'),
];

const AVATAR_COL: ColDef = {
  headerName: '',
  field: 'hr_employee_profile_photo_url',
  cellRenderer: PinnedAwareAvatarRenderer,
  maxWidth: 60,
  minWidth: 60,
  sortable: false,
  filter: false,
  resizable: false,
  suppressMovable: true,
  pinned: 'left',
  lockPosition: true,
};

// Source view: hr_payroll_employee_comparison (one row per employee
// with deltas vs prior period). hr_employee_id present; loader enriches
// preferred_name + photo + department via hr_employee join.
const byEmployeeColDefs: ColDef[] = [
  AVATAR_COL,
  {
    field: 'hr_employee_preferred_name',
    headerName: 'Employee',
    cellRenderer: EmployeeNameRenderer,
    minWidth: 220,
    pinned: 'left',
  },
  numericCol('scheduled_hours', 'Scheduled', { formatter: hoursFormatter }),
  numericCol('total_hours', 'Total Hours', { formatter: hoursFormatter }),
  deltaCol('hours_delta', 'Δ Hours', 'hours'),
  numericCol('total_cost', 'Total Cost', { currency: true, width: 130 }),
  deltaCol('total_cost_delta', 'Δ Total Cost', 'currency'),
  numericCol('discretionary_overtime_hours', 'OT Hours', {
    formatter: hoursFormatter,
  }),
  deltaCol('regular_pay_delta', 'Δ Reg Pay', 'currency'),
  deltaCol('discretionary_overtime_pay_delta', 'Δ OT Pay', 'currency'),
];

export default function PayrollComparisonListView(props: ListViewProps) {
  const { tableData } = props;

  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view') ?? 'by_task';
  const isByEmployee = currentView === 'by_employee';
  const params = useParams();
  const accountSlug = params.account ?? '';

  const subModuleSlug = 'Payroll Comp';
  const { query } = useActiveTableSearch();
  useRegisterActiveTable(
    subModuleSlug,
    props.subModuleDisplayName ?? 'Payroll Comparison',
  );

  const gridRef = useRef<AgGridReact>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows = tableData.data as RowData[];

  // Team Lead sees hours only — DB already NULLs $ columns; this hides
  // the empty columns from the grid for a clean UI. Owner/Admin/Manager
  // see everything.
  const layoutData = useRouteLoaderData('routes/workspace/layout') as
    | { workspace?: { currentOrg?: { access_level_id?: string } } }
    | undefined;
  const isTeamLead =
    layoutData?.workspace?.currentOrg?.access_level_id === 'Team Lead';

  const DOLLAR_FIELDS = new Set([
    'regular_pay',
    'total_cost',
    'regular_pay_delta',
    'discretionary_overtime_pay_delta',
    'total_cost_delta',
  ]);
  const baseColDefs = isByEmployee ? byEmployeeColDefs : byTaskColDefs;
  const colDefs = isTeamLead
    ? baseColDefs.filter((c) => !c.field || !DOLLAR_FIELDS.has(c.field))
    : baseColDefs;

  // Synthetic PK for by_task rows. The view groups by (org_id,
  // compensation_manager_id, task, status), so the same task name can
  // appear under multiple managers — task+status alone would collide.
  // by_employee rows already have a unique hr_employee_id.
  const rowsWithIds = useMemo(() => {
    if (isByEmployee) {
      return rows.map((r) => ({
        ...r,
        _rowId: String(r.hr_employee_id ?? ''),
      }));
    }
    return rows.map((r, idx) => ({
      ...r,
      _rowId: `${String(r.compensation_manager_id ?? '')}|${String(r.task ?? '')}|${String(r.status ?? '')}|${idx}`,
    }));
  }, [rows, isByEmployee]);

  // Detail component captures accountSlug + isTeamLead via closure so
  // the hook only re-renders when the column-mask gate flips. The
  // detail uses gridRef + the synthetic detail row id (parent _rowId +
  // '_detail', matching useDetailRow's convention) to resize its parent
  // row once the breakdown query resolves.
  const detailComponent = useMemo(
    () =>
      function TaskBreakdownRenderer({
        data,
      }: {
        data: Record<string, unknown>;
      }) {
        const parentRowId = String(data._rowId ?? '');
        return (
          <PayrollTaskEmployeeDetail
            data={data}
            accountSlug={accountSlug}
            isTeamLead={isTeamLead}
            parentGridRef={gridRef}
            detailRowId={`${parentRowId}_detail`}
          />
        );
      },
    [accountSlug, isTeamLead],
  );

  const {
    rowData: rowDataWithDetails,
    isFullWidthRow,
    fullWidthCellRenderer,
    handleRowClicked,
    getRowId,
  } = useDetailRow({
    sourceData: rowsWithIds,
    pkColumn: '_rowId',
    detailComponent,
    gridRef,
  });

  // Initial detail-row placeholder height. The PayrollTaskEmployeeDetail
  // component calls node.setRowHeight() + api.onRowHeightChanged() after
  // its data loads, so this is only used during the brief loading state.
  const getRowHeight = useCallback(
    (params: { data?: Record<string, unknown> }) =>
      params.data?._isDetailRow ? 120 : undefined,
    [],
  );

  // Pinned bottom TOTAL row — sums every numeric/delta column in view.
  const totalsRow = useMemo(() => {
    if (!rows.length) return [];
    const numericFields = [
      'total_hours',
      'scheduled_hours',
      'discretionary_overtime_hours',
      'regular_pay',
      'total_cost',
      'hours_delta',
      'regular_pay_delta',
      'discretionary_overtime_pay_delta',
      'total_cost_delta',
    ];
    const totals: RowData = isByEmployee
      ? { hr_employee_preferred_name: 'TOTAL' }
      : { task: 'TOTAL' };
    for (const f of numericFields) {
      totals[f] = rows.reduce((sum, r) => sum + (Number(r[f]) || 0), 0);
    }
    return [totals];
  }, [rows, isByEmployee]);

  const getRowStyle = useCallback((params: RowClassParams) => {
    const d = params.data as
      | { hr_employee_preferred_name?: string; task?: string }
      | undefined;
    if (d?.hr_employee_preferred_name === 'TOTAL' || d?.task === 'TOTAL') {
      return { fontWeight: 'bold', background: 'var(--color-muted)' };
    }
    return undefined;
  }, []);

  const handleGridReady = useCallback((event: GridReadyEvent) => {
    restoreColumnState('payroll_comparison', event.api);
  }, []);

  const debouncedSaveState = useCallback((api: GridApi) => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = setTimeout(() => {
      saveColumnState('payroll_comparison', api);
    }, 300);
  }, []);

  const handleColumnMoved = useCallback(
    (event: ColumnMovedEvent) => {
      if (event.finished && event.api) debouncedSaveState(event.api);
    },
    [debouncedSaveState],
  );

  const handleColumnResized = useCallback(
    (event: ColumnResizedEvent) => {
      if (event.finished && event.api) debouncedSaveState(event.api);
    },
    [debouncedSaveState],
  );

  const handleSortChanged = useCallback(
    (event: SortChangedEvent) => debouncedSaveState(event.api),
    [debouncedSaveState],
  );

  const handleColumnVisible = useCallback(
    (event: ColumnVisibleEvent) => debouncedSaveState(event.api),
    [debouncedSaveState],
  );

  // by_task rows go through useDetailRow (which manages its own row inserts
  // via grid transactions); TOTAL is wired via pinnedBottomRowData so it
  // stays anchored regardless of sort.
  const rowData = isByEmployee ? rows : rowDataWithDetails;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-test="payroll-comparison-list-view"
    >
      <PayrollViewToggle />

      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={rowData}
          pinnedBottomRowData={totalsRow}
          quickFilterText={query}
          pagination={false}
          getRowStyle={getRowStyle}
          onGridReady={handleGridReady}
          onColumnMoved={handleColumnMoved}
          onColumnResized={handleColumnResized}
          onSortChanged={handleSortChanged}
          onColumnVisible={handleColumnVisible}
          {...(isByEmployee
            ? {}
            : {
                onRowClicked: handleRowClicked,
                isFullWidthRow,
                fullWidthCellRenderer,
                getRowId,
                getRowHeight,
              })}
        />
      </div>
    </div>
  );
}
