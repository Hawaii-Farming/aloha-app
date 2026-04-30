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
import { NavbarFilterButton } from '~/components/navbar-filter-button';
import type { ListViewProps } from '~/lib/crud/types';
import { formatPayPeriodLabel } from '~/lib/format/pay-period';

type RowData = Record<string, unknown>;

function EmployeeDeptRenderer(props: CustomCellRendererProps) {
  const data = props.data as RowData | undefined;
  if (!data) return null;

  const fullName = String(data.hr_employee_preferred_name ?? '');
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

// Backing view: hr_payroll_employee_comparison. Real columns:
// regular_pay, total_hours, total_cost, scheduled_hours,
// discretionary_overtime_hours, discretionary_overtime_pay, plus deltas
// (hours_delta, regular_pay_delta, total_cost_delta, ...). Employee
// display fields come from the loader's hr_employee enrichment step.
const colDefs: ColDef[] = [
  AVATAR_COL,
  {
    field: 'hr_employee_preferred_name',
    headerName: 'Employee',
    cellRenderer: EmployeeDeptRenderer,
    minWidth: 200,
    pinned: 'left',
  },
  {
    field: 'hr_employee_hr_department_name',
    headerName: 'Department',
    minWidth: 140,
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
    field: 'hours_delta',
    headerName: 'Hours Δ',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'regular_pay',
    headerName: 'Regular Pay',
    cellRenderer: CurrencyRenderer,
    type: 'numericColumn',
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'regular_pay_delta',
    headerName: 'Reg Pay Δ',
    cellRenderer: CurrencyRenderer,
    type: 'numericColumn',
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'total_cost',
    headerName: 'Total Cost',
    cellRenderer: CurrencyRenderer,
    type: 'numericColumn',
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'total_cost_delta',
    headerName: 'Cost Δ',
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
        hr_employee_preferred_name: row.hr_employee_preferred_name,
        hr_employee_profile_photo_url: row.hr_employee_profile_photo_url,
        hr_employee_hr_department_name: row.hr_employee_hr_department_name,
        compensation_manager_id: row.compensation_manager_id,
        total_hours: Number(row.total_hours) || 0,
        hours_delta: Number(row.hours_delta) || 0,
        regular_pay: Number(row.regular_pay) || 0,
        regular_pay_delta: Number(row.regular_pay_delta) || 0,
        total_cost: Number(row.total_cost) || 0,
        total_cost_delta: Number(row.total_cost_delta) || 0,
        _detailRows: [row],
      });
    } else {
      existing.total_hours =
        (Number(existing.total_hours) || 0) + (Number(row.total_hours) || 0);
      existing.hours_delta =
        (Number(existing.hours_delta) || 0) + (Number(row.hours_delta) || 0);
      existing.regular_pay =
        (Number(existing.regular_pay) || 0) + (Number(row.regular_pay) || 0);
      existing.regular_pay_delta =
        (Number(existing.regular_pay_delta) || 0) +
        (Number(row.regular_pay_delta) || 0);
      existing.total_cost =
        (Number(existing.total_cost) || 0) + (Number(row.total_cost) || 0);
      existing.total_cost_delta =
        (Number(existing.total_cost_delta) || 0) +
        (Number(row.total_cost_delta) || 0);
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

  const subModuleSlug = 'Payroll Comp Manager';
  const { query } = useActiveTableSearch();
  useRegisterActiveTable(
    subModuleSlug,
    props.subModuleDisplayName ?? 'Payroll Comp Manager',
  );

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
        hr_employee_preferred_name: 'TOTAL',
        total_hours: sumField('total_hours'),
        hours_delta: sumField('hours_delta'),
        regular_pay: sumField('regular_pay'),
        regular_pay_delta: sumField('regular_pay_delta'),
        total_cost: sumField('total_cost'),
        total_cost_delta: sumField('total_cost_delta'),
      },
    ];
  }, [groupedRows]);

  const getRowStyle = useCallback((params: RowClassParams) => {
    if (
      (params.data as { hr_employee_preferred_name?: string } | undefined)
        ?.hr_employee_preferred_name === 'TOTAL'
    ) {
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
          rowData={[...groupedRows, ...totalsRow]}
          quickFilterText={query}
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
              label: String(m.compensation_manager_id ?? 'Unknown'),
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
                label: formatPayPeriodLabel(start, end),
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
