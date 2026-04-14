import { useCallback, useMemo, useRef } from 'react';

import {
  useLoaderData,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridReadyEvent,
  RowClassParams,
  RowClickedEvent,
  SortChangedEvent,
} from 'ag-grid-community';
import type { AgGridReact, CustomCellRendererProps } from 'ag-grid-react';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { hoursFormatter } from '~/components/ag-grid/payroll-formatters';
import { NavbarFilterButton } from '~/components/navbar-filter-button';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

function VariancePillRenderer(props: CustomCellRendererProps) {
  const value = props.value as number | null;
  if (value == null) return null;

  const prefix = value > 0 ? '+' : '';
  const weight =
    props.node.rowPinned === 'bottom' ? 'font-bold' : 'font-medium';

  return (
    <span
      className={`flex h-full items-center justify-end font-mono tabular-nums ${weight}`}
    >
      {prefix}
      {value.toFixed(1)}
    </span>
  );
}

function PinnedAwareAvatarRenderer(props: CustomCellRendererProps) {
  if (props.node.rowPinned === 'bottom') return null;
  return <AvatarRenderer {...props} />;
}

function EmployeeDeptRenderer(props: CustomCellRendererProps) {
  const data = props.data as RowData | undefined;
  if (!data) return null;

  const fullName = String(data.full_name ?? '');
  const pinned = props.node.rowPinned === 'bottom';

  return (
    <span
      className={`flex h-full items-center truncate text-sm ${pinned ? 'font-bold' : 'font-medium'}`}
    >
      {fullName}
    </span>
  );
}

const AVATAR_COL: ColDef = {
  headerName: '',
  field: 'profile_photo_url',
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

const colDefs: ColDef[] = [
  AVATAR_COL,
  {
    field: 'full_name',
    headerName: 'Employee',
    cellRenderer: EmployeeDeptRenderer,
    minWidth: 200,
    pinned: 'left',
  },
  {
    field: 'department_name',
    headerName: 'Department',
    minWidth: 140,
  },
  {
    field: 'scheduled_hours',
    headerName: 'Scheduled Hrs',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'payroll_hours',
    headerName: 'Payroll Hrs',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'variance',
    headerName: 'Variance',
    type: 'numericColumn',
    cellRenderer: VariancePillRenderer,
    flex: 1,
    minWidth: 120,
  },
];

export default function PayrollHoursListView(props: ListViewProps) {
  const { tableData } = props;

  const loaderData = useLoaderData() as RowData;
  const payPeriods = (loaderData.payPeriods ?? []) as RowData[];
  const navigate = useNavigate();
  const { account } = useParams();

  const gridRef = useRef<AgGridReact>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRowClicked = useCallback(
    (event: RowClickedEvent) => {
      if (event.node.rowPinned) return;
      const employeeId = event.data?.hr_employee_id as string | undefined;
      if (!employeeId || !account) return;
      navigate(`/home/${account}/human_resources/register/${employeeId}`);
    },
    [navigate, account],
  );

  const rawRows = tableData.data as RowData[];

  const totalsRow = useMemo(() => {
    if (!rawRows.length) return [];

    const sumField = (field: string) =>
      rawRows.reduce((sum, r) => sum + (Number(r[field]) || 0), 0);

    const totalScheduled = sumField('scheduled_hours');
    const totalPayroll = sumField('payroll_hours');

    return [
      {
        full_name: 'TOTAL',
        scheduled_hours: totalScheduled,
        payroll_hours: totalPayroll,
        variance: totalPayroll - totalScheduled,
      },
    ];
  }, [rawRows]);

  const getRowStyle = useCallback((params: RowClassParams) => {
    if (params.node.rowPinned === 'bottom') {
      return {
        fontWeight: 'bold',
        background: 'var(--color-muted)',
      };
    }
    return undefined;
  }, []);

  // Column state persistence
  const handleGridReady = useCallback((event: GridReadyEvent) => {
    restoreColumnState('payroll_hours', event.api);
  }, []);

  const debouncedSaveState = useCallback((api: GridApi) => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = setTimeout(() => {
      saveColumnState('payroll_hours', api);
    }, 300);
  }, []);

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

  const [searchParams, setSearchParams] = useSearchParams();
  const periodStart = searchParams.get('period_start') ?? '';
  const periodEnd = searchParams.get('period_end') ?? '';
  const periodValue =
    periodStart && periodEnd ? `${periodStart}|${periodEnd}` : '';

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-test="payroll-hours-list-view"
    >
      <NavbarFilterButton
        testKey="payroll-hours-filter"
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
                label: `${start} – ${end}`,
              };
            }),
          },
        ]}
      />

      {/* Grid */}
      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={rawRows}
          pinnedBottomRowData={totalsRow}
          pagination={false}
          getRowStyle={getRowStyle}
          onRowClicked={handleRowClicked}
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
