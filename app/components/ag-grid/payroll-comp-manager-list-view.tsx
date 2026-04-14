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
import {
  CurrencyRenderer,
  hoursFormatter,
} from '~/components/ag-grid/payroll-formatters';
import { NavbarFilterButton } from '~/components/navbar-filter-button';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

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

function PinnedAwareAvatarRenderer(props: CustomCellRendererProps) {
  if (props.node.rowPinned === 'bottom') return null;
  return <AvatarRenderer {...props} />;
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
    field: 'regular_hours',
    headerName: 'Reg Hours',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'overtime_hours',
    headerName: 'OT Hours',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'total_hours',
    headerName: 'Total Hours',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'gross_wage',
    headerName: 'Gross Wage',
    cellRenderer: CurrencyRenderer,
    type: 'numericColumn',
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'net_pay',
    headerName: 'Net Pay',
    cellRenderer: CurrencyRenderer,
    type: 'numericColumn',
    flex: 1,
    minWidth: 120,
  },
];

/** Group raw payroll rows by employee, sum numeric fields, stash detail rows */
function groupByEmployee(rows: RowData[]): RowData[] {
  const map = new Map<string, RowData>();

  for (const row of rows) {
    const empId = String(row.hr_employee_id ?? '');
    if (!empId) continue;

    const existing = map.get(empId);
    if (!existing) {
      map.set(empId, {
        hr_employee_id: empId,
        full_name: row.full_name,
        profile_photo_url: row.profile_photo_url,
        department_name: row.department_name,
        compensation_manager_id: row.compensation_manager_id,
        compensation_manager_name: row.compensation_manager_name,
        regular_hours: Number(row.regular_hours) || 0,
        overtime_hours: Number(row.overtime_hours) || 0,
        total_hours: Number(row.total_hours) || 0,
        gross_wage: Number(row.gross_wage) || 0,
        net_pay: Number(row.net_pay) || 0,
        _detailRows: [row],
      });
    } else {
      existing.regular_hours =
        (Number(existing.regular_hours) || 0) +
        (Number(row.regular_hours) || 0);
      existing.overtime_hours =
        (Number(existing.overtime_hours) || 0) +
        (Number(row.overtime_hours) || 0);
      existing.total_hours =
        (Number(existing.total_hours) || 0) + (Number(row.total_hours) || 0);
      existing.gross_wage =
        (Number(existing.gross_wage) || 0) + (Number(row.gross_wage) || 0);
      existing.net_pay =
        (Number(existing.net_pay) || 0) + (Number(row.net_pay) || 0);
      (existing._detailRows as RowData[]).push(row);
    }
  }

  return [...map.values()];
}

export default function PayrollCompManagerListView(props: ListViewProps) {
  const { tableData } = props;

  const loaderData = useLoaderData() as RowData;
  const payPeriods = (loaderData.payPeriods ?? []) as RowData[];
  const managers = (loaderData.managers ?? []) as RowData[];
  const [searchParams, setSearchParams] = useSearchParams();
  const checkDateFilter = searchParams.get('check_date') ?? '';
  const managerFilter = searchParams.get('manager') ?? '';
  const periodStartFilter = searchParams.get('period_start') ?? '';
  const periodEndFilter = searchParams.get('period_end') ?? '';
  const periodFilter =
    periodStartFilter && periodEndFilter
      ? `${periodStartFilter}|${periodEndFilter}`
      : '';

  const gridRef = useRef<AgGridReact>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const { account } = useParams();

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

  // Extract distinct check dates for the filter dropdown
  const checkDates = useMemo(() => {
    const dates = new Set<string>();
    for (const row of rawRows) {
      const d = row.check_date ? String(row.check_date) : '';
      if (d) dates.add(d);
    }
    return [...dates].sort().reverse();
  }, [rawRows]);

  // Filter raw data by check date, then group by employee
  const groupedRows = useMemo(() => {
    const filtered = checkDateFilter
      ? rawRows.filter((r) => String(r.check_date ?? '') === checkDateFilter)
      : rawRows;
    return groupByEmployee(filtered);
  }, [rawRows, checkDateFilter]);

  const totalsRow = useMemo(() => {
    if (!groupedRows.length) return [];

    const sumField = (field: string) =>
      groupedRows.reduce((sum, r) => sum + (Number(r[field]) || 0), 0);

    return [
      {
        full_name: 'TOTAL',
        regular_hours: sumField('regular_hours'),
        overtime_hours: sumField('overtime_hours'),
        total_hours: sumField('total_hours'),
        gross_wage: sumField('gross_wage'),
        net_pay: sumField('net_pay'),
      },
    ];
  }, [groupedRows]);

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
    restoreColumnState('payroll_comp_manager', event.api);
  }, []);

  const debouncedSaveState = useCallback((api: GridApi) => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = setTimeout(() => {
      saveColumnState('payroll_comp_manager', api);
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

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-test="payroll-comp-manager-list-view"
    >
      {/* Grid */}
      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={groupedRows}
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

      <NavbarFilterButton
        testKey="payroll-comp-manager-filter"
        filters={[
          {
            key: 'manager',
            label: 'Manager',
            allLabel: 'All Managers',
            value: managerFilter,
            onChange: (v) => {
              const next = new URLSearchParams(searchParams);
              if (v === '') next.delete('manager');
              else next.set('manager', v);
              setSearchParams(next, { preventScrollReset: true });
            },
            options: managers.map((m) => ({
              value: String(m.compensation_manager_id),
              label: String(m.compensation_manager_name ?? 'Unknown'),
            })),
          },
          {
            key: 'period',
            label: 'Pay Period',
            allLabel: 'All Pay Periods',
            value: periodFilter,
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
          {
            key: 'check_date',
            label: 'Check Date',
            allLabel: 'All Check Dates',
            value: checkDateFilter,
            onChange: (v) => {
              const next = new URLSearchParams(searchParams);
              if (v === '') next.delete('check_date');
              else next.set('check_date', v);
              setSearchParams(next, { preventScrollReset: true });
            },
            options: checkDates.map((d) => ({ value: d, label: d })),
          },
        ]}
      />
    </div>
  );
}
