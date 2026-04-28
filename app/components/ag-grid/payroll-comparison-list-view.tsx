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

function EmployeeDeptRenderer(props: CustomCellRendererProps) {
  const data = props.data as RowData | undefined;
  if (!data) return null;

  const fullName = String(data.full_name ?? data.employee_name ?? '');
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

// --- Column definitions ---

const byDeptColDefs: ColDef[] = [
  {
    field: 'department_name',
    headerName: 'Department',
    minWidth: 250,
  },
  {
    field: 'employee_count',
    headerName: 'Employees',
    type: 'numericColumn',
    flex: 1,
    minWidth: 100,
    cellRenderer: (props: CustomCellRendererProps) => {
      const value = props.value as number | null;
      if (value == null) return null;
      return (
        <div className="flex h-full items-center justify-center">
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {value}
          </span>
        </div>
      );
    },
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
    type: 'numericColumn',
    cellRenderer: CurrencyRenderer,
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'net_pay',
    headerName: 'Net Pay',
    type: 'numericColumn',
    cellRenderer: CurrencyRenderer,
    flex: 1,
    minWidth: 120,
  },
];

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

const byEmployeeColDefs: ColDef[] = [
  AVATAR_COL,
  {
    field: 'full_name',
    headerName: 'Employee',
    cellRenderer: EmployeeDeptRenderer,
    minWidth: 250,
    pinned: 'left',
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
    type: 'numericColumn',
    cellRenderer: CurrencyRenderer,
    flex: 1,
    minWidth: 120,
  },
  {
    field: 'net_pay',
    headerName: 'Net Pay',
    type: 'numericColumn',
    cellRenderer: CurrencyRenderer,
    flex: 1,
    minWidth: 120,
  },
];

/** Group raw payroll rows by department, sum numeric fields, count unique employees, stash detail rows */
function groupByDepartment(rows: RowData[]): RowData[] {
  const map = new Map<string, RowData>();

  for (const row of rows) {
    const dept = String(row.department_name ?? 'Unknown');
    const existing = map.get(dept);
    if (!existing) {
      map.set(dept, {
        department_name: dept,
        _employees: new Set([String(row.hr_employee_id ?? '')]),
        employee_count: 0,
        regular_hours: Number(row.regular_hours) || 0,
        overtime_hours: Number(row.overtime_hours) || 0,
        total_hours: Number(row.total_hours) || 0,
        gross_wage: Number(row.gross_wage) || 0,
        net_pay: Number(row.net_pay) || 0,
        _detailRows: [row],
      });
    } else {
      (existing._employees as Set<string>).add(
        String(row.hr_employee_id ?? ''),
      );
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

  // Resolve employee count from Set
  for (const entry of map.values()) {
    entry.employee_count = (entry._employees as Set<string>).size;
    delete entry._employees;
  }

  return [...map.values()];
}

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
        full_name: row.employee_name ?? row.full_name,
        profile_photo_url: row.profile_photo_url,
        department_name: row.department_name,
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

  const rawRows = tableData.data as RowData[];

  // Group by employee or department depending on view
  const groupedRows = useMemo(() => {
    if (isByEmployee) return groupByEmployee(rawRows);
    return groupByDepartment(rawRows);
  }, [rawRows, isByEmployee]);

  const colDefs = isByEmployee ? byEmployeeColDefs : byDeptColDefs;

  const totalsRow = useMemo(() => {
    if (!groupedRows.length) return [];
    const sumField = (field: string) =>
      groupedRows.reduce((sum, r) => sum + (Number(r[field]) || 0), 0);

    if (isByEmployee) {
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
    }
    return [
      {
        department_name: 'TOTAL',
        employee_count: groupedRows.reduce(
          (sum, r) => sum + (Number(r.employee_count) || 0),
          0,
        ),
        regular_hours: sumField('regular_hours'),
        overtime_hours: sumField('overtime_hours'),
        total_hours: sumField('total_hours'),
        gross_wage: sumField('gross_wage'),
        net_pay: sumField('net_pay'),
      },
    ];
  }, [groupedRows, isByEmployee]);

  const getRowStyle = useCallback((params: RowClassParams) => {
    const d = params.data as
      | { full_name?: string; department_name?: string }
      | undefined;
    if (d?.full_name === 'TOTAL' || d?.department_name === 'TOTAL') {
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

  const rowData = [...groupedRows, ...totalsRow];

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

      {/* Grid */}
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
