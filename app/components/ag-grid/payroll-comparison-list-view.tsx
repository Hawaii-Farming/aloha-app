import { useCallback, useMemo, useRef } from 'react';

import { useLoaderData, useSearchParams } from 'react-router';

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
import {
  CurrencyRenderer,
  hoursFormatter,
} from '~/components/ag-grid/payroll-formatters';
import { PayrollViewToggle } from '~/components/ag-grid/payroll-view-toggle';
import { NavbarFilterButton } from '~/components/navbar-filter-button';
import type { ListViewProps } from '~/lib/crud/types';
import { formatPayPeriodLabel } from '~/lib/format/pay-period';

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

// Color-coded delta renderer: green positive, red negative, muted zero.
// Used for *_delta columns from hr_payroll_*_comparison views.
function DeltaRenderer(
  props: CustomCellRendererProps & { format?: 'currency' | 'hours' },
) {
  const raw = props.value;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (props.node.rowPinned === 'bottom') {
    return (
      <span className="text-sm font-bold">
        {props.format === 'currency'
          ? formatSignedCurrency(n)
          : formatSignedHours(n)}
      </span>
    );
  }
  const cls =
    n > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : n < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground';
  const arrow = n > 0 ? '▲' : n < 0 ? '▼' : '·';
  const text =
    props.format === 'currency'
      ? formatSignedCurrency(n)
      : formatSignedHours(n);
  return (
    <span className={`inline-flex items-center gap-1 text-sm ${cls}`}>
      <span aria-hidden>{arrow}</span>
      <span>{text}</span>
    </span>
  );
}

function formatSignedCurrency(n: number) {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}$${formatted}`;
}

function formatSignedHours(n: number) {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
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
  numericCol('total_hours', 'Total Hours', { formatter: hoursFormatter }),
  numericCol('scheduled_hours', 'Scheduled', { formatter: hoursFormatter }),
  numericCol('discretionary_overtime_hours', 'OT Hours', {
    formatter: hoursFormatter,
  }),
  numericCol('regular_pay', 'Regular Pay', { currency: true, width: 130 }),
  numericCol('total_cost', 'Total Cost', { currency: true, width: 130 }),
  deltaCol('hours_delta', 'Δ Hours', 'hours'),
  deltaCol('regular_pay_delta', 'Δ Reg Pay', 'currency'),
  deltaCol('discretionary_overtime_pay_delta', 'Δ OT Pay', 'currency'),
  deltaCol('total_cost_delta', 'Δ Total Cost', 'currency'),
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
  numericCol('total_hours', 'Total Hours', { formatter: hoursFormatter }),
  numericCol('scheduled_hours', 'Scheduled', { formatter: hoursFormatter }),
  numericCol('discretionary_overtime_hours', 'OT Hours', {
    formatter: hoursFormatter,
  }),
  numericCol('regular_pay', 'Regular Pay', { currency: true, width: 130 }),
  numericCol('total_cost', 'Total Cost', { currency: true, width: 130 }),
  deltaCol('hours_delta', 'Δ Hours', 'hours'),
  deltaCol('regular_pay_delta', 'Δ Reg Pay', 'currency'),
  deltaCol('discretionary_overtime_pay_delta', 'Δ OT Pay', 'currency'),
  deltaCol('total_cost_delta', 'Δ Total Cost', 'currency'),
];

export default function PayrollComparisonListView(props: ListViewProps) {
  const { tableData } = props;

  const loaderData = useLoaderData() as RowData;
  const payPeriods = (loaderData.payPeriods ?? []) as RowData[];

  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') ?? 'by_task';
  const isByEmployee = currentView === 'by_employee';
  const periodStart = searchParams.get('period_start') ?? '';
  const periodEnd = searchParams.get('period_end') ?? '';
  const periodValue =
    periodStart && periodEnd ? `${periodStart}|${periodEnd}` : '';

  const subModuleSlug = 'Payroll Comp';
  const { query } = useActiveTableSearch();
  useRegisterActiveTable(
    subModuleSlug,
    props.subModuleDisplayName ?? 'Payroll Comparison',
  );

  const gridRef = useRef<AgGridReact>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows = tableData.data as RowData[];
  const colDefs = isByEmployee ? byEmployeeColDefs : byTaskColDefs;

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

  const rowData = [...rows, ...totalsRow];

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-test="payroll-comparison-list-view"
    >
      <PayrollViewToggle />

      <NavbarFilterButton
        testKey="payroll-comparison-filter"
        filters={[
          {
            key: 'period',
            label: 'Pay Period',
            allLabel: 'All Pay Periods',
            value: periodValue,
            onChange: (v) => {
              const next = new URLSearchParams(searchParams);
              if (v === '') {
                next.delete('period_start');
                next.delete('period_end');
              } else {
                const [start, end] = v.split('|');
                if (start && end) {
                  next.set('period_start', start);
                  next.set('period_end', end);
                }
              }
              setSearchParams(next, { preventScrollReset: true });
            },
            options: payPeriods.map((p) => {
              const start = String(p.pay_period_start ?? '');
              const end = String(p.pay_period_end ?? '');
              return {
                value: `${start}|${end}`,
                label: formatPayPeriodLabel(start, end),
              };
            }),
          },
        ]}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={rowData}
          quickFilterText={query}
          pagination={false}
          getRowStyle={getRowStyle}
          onGridReady={handleGridReady}
          onColumnMoved={handleColumnMoved}
          onColumnResized={handleColumnResized}
          onSortChanged={handleSortChanged}
          onColumnVisible={handleColumnVisible}
        />
      </div>
    </div>
  );
}
