import { useCallback, useMemo, useRef, useState } from 'react';

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

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { CsvExportButton } from '~/components/ag-grid/csv-export-button';
import { useDetailRow } from '~/components/ag-grid/detail-row-wrapper';
import { PayPeriodFilter } from '~/components/ag-grid/pay-period-filter';
import {
  CurrencyRenderer,
  hoursFormatter,
} from '~/components/ag-grid/payroll-formatters';
import { PayrollViewToggle } from '~/components/ag-grid/payroll-view-toggle';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

function fmtCurrency(v: number) {
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return v < 0 ? `($${formatted})` : `$${formatted}`;
}

function EmployeeDeptRenderer(props: CustomCellRendererProps) {
  const data = props.data as RowData | undefined;
  if (!data) return null;

  const fullName = String(data.full_name ?? data.employee_name ?? '');
  const dept = data.department_name ? String(data.department_name) : '';

  if (props.node.rowPinned === 'bottom') {
    return <span className="font-bold">{fullName}</span>;
  }

  return (
    <div className="flex h-full flex-col justify-center leading-tight">
      <span className="text-sm font-medium">{fullName}</span>
      {dept && <span className="text-muted-foreground text-xs">{dept}</span>}
    </div>
  );
}

function PinnedAwareAvatarRenderer(props: CustomCellRendererProps) {
  if (props.node.rowPinned === 'bottom') return null;
  return <AvatarRenderer {...props} />;
}

/** Inline detail table — shows individual payroll records */
function PayrollDetailInner({ data }: { data: RowData }) {
  const parentData = (data._parentData ?? data) as RowData;
  const unsorted = parentData._detailRows as RowData[] | undefined;
  // Show employee name column when expanding a department row
  const isDeptGroup = Boolean(parentData.employee_count);
  const rawRows = unsorted
    ? [...unsorted].sort((a, b) =>
        String(b.check_date ?? '').localeCompare(String(a.check_date ?? '')),
      )
    : undefined;

  if (!rawRows || rawRows.length === 0) {
    return (
      <div className="text-muted-foreground px-6 py-4 text-sm">
        No payroll records found.
      </div>
    );
  }

  const sumField = (field: string) =>
    rawRows.reduce((sum, r) => sum + (Number(r[field]) || 0), 0);

  return (
    <div
      className="border-border/40 mx-4 mt-2 mb-4 overflow-y-auto rounded-lg border"
      style={{
        height: '360px',
        background:
          'repeating-linear-gradient(0deg, transparent, transparent 27px, color-mix(in srgb, var(--color-border) 15%, transparent) 27px, color-mix(in srgb, var(--color-border) 15%, transparent) 28px)',
        backgroundPositionY: '32px',
      }}
    >
      <table
        className="w-full text-xs"
        style={{ borderCollapse: 'separate', borderSpacing: 0 }}
      >
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted/90 text-muted-foreground border-border/40 border-b text-[11px] tracking-wider uppercase backdrop-blur-sm">
            {isDeptGroup && (
              <th className="border-border/15 border-r px-3 py-2 text-left font-semibold">
                Employee
              </th>
            )}
            <th className="border-border/15 w-[110px] border-r px-3 py-2 text-left font-semibold">
              Check Date
            </th>
            <th className="border-border/15 w-[200px] border-r px-3 py-2 text-left font-semibold">
              Pay Period
            </th>
            <th className="border-border/15 w-[80px] border-r px-3 py-2 text-right font-semibold">
              Reg Hrs
            </th>
            <th className="border-border/15 w-[80px] border-r px-3 py-2 text-right font-semibold">
              OT Hrs
            </th>
            <th className="border-border/15 w-[80px] border-r px-3 py-2 text-right font-semibold">
              Total Hrs
            </th>
            <th className="border-border/15 w-[120px] border-r px-3 py-2 text-right font-semibold">
              Gross Wage
            </th>
            <th className="w-[120px] px-3 py-2 text-right font-semibold">
              Net Pay
            </th>
          </tr>
        </thead>
        <tbody>
          {rawRows.map((row, i) => {
            const otHrs = Number(row.overtime_hours) || 0;
            const isEven = i % 2 === 0;
            return (
              <tr
                key={String(row.id ?? i)}
                className="group transition-colors"
                style={{
                  background: isEven
                    ? 'transparent'
                    : 'var(--color-muted, rgba(128,128,128,0.06))',
                }}
              >
                {isDeptGroup && (
                  <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5 font-medium">
                    {String(row.employee_name ?? row.full_name ?? '')}
                  </td>
                )}
                <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5">
                  <span className="inline-block rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600 shadow-sm dark:text-emerald-400">
                    {String(row.check_date ?? '')}
                  </span>
                </td>
                <td className="text-muted-foreground border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5">
                  {String(row.pay_period_start ?? '')} –{' '}
                  {String(row.pay_period_end ?? '')}
                </td>
                <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5 text-right tabular-nums">
                  {(Number(row.regular_hours) || 0).toFixed(1)}
                </td>
                <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5 text-right tabular-nums">
                  {otHrs > 0 ? (
                    <span className="font-semibold text-amber-500">
                      {otHrs.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
                <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5 text-right font-semibold tabular-nums">
                  {(Number(row.total_hours) || 0).toFixed(1)}
                </td>
                <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5 text-right font-mono tabular-nums">
                  {fmtCurrency(Number(row.gross_wage) || 0)}
                </td>
                <td className="group-hover:bg-primary/5 px-3 py-1.5 text-right font-mono tabular-nums">
                  {fmtCurrency(Number(row.net_pay) || 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="sticky bottom-0 z-10">
          <tr className="bg-muted/90 border-border/40 border-t font-semibold backdrop-blur-sm">
            <td
              className="border-border/15 border-r px-3 py-2 text-[11px] tracking-wider uppercase"
              colSpan={isDeptGroup ? 3 : 2}
            >
              <span className="text-primary">{rawRows.length}</span> record
              {rawRows.length !== 1 ? 's' : ''}
            </td>
            <td className="border-border/15 border-r px-3 py-2 text-right tabular-nums">
              {sumField('regular_hours').toFixed(1)}
            </td>
            <td className="border-border/15 border-r px-3 py-2 text-right tabular-nums">
              {sumField('overtime_hours') > 0 ? (
                <span className="text-amber-500">
                  {sumField('overtime_hours').toFixed(1)}
                </span>
              ) : (
                '0.0'
              )}
            </td>
            <td className="border-border/15 border-r px-3 py-2 text-right tabular-nums">
              {sumField('total_hours').toFixed(1)}
            </td>
            <td className="border-border/15 border-r px-3 py-2 text-right font-mono tabular-nums">
              {fmtCurrency(sumField('gross_wage'))}
            </td>
            <td className="px-3 py-2 text-right font-mono tabular-nums">
              {fmtCurrency(sumField('net_pay'))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// --- Column definitions ---

const byDeptColDefs: ColDef[] = [
  {
    field: 'department_name',
    headerName: 'Department',
    sortable: true,
    filter: true,
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
    sortable: true,
    filter: true,
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

  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view') ?? 'by_task';
  const isByEmployee = currentView === 'by_employee';

  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Detail row expansion (by_employee only)
  const detailComponent = useMemo(
    () =>
      function DetailRenderer({ data }: { data: RowData }) {
        return <PayrollDetailInner data={data} />;
      },
    [],
  );

  const {
    rowData: detailRowData,
    isFullWidthRow,
    fullWidthCellRenderer,
    handleRowClicked: handleDetailRowClicked,
    getRowId,
  } = useDetailRow({
    sourceData: groupedRows,
    pkColumn: isByEmployee ? 'hr_employee_id' : 'department_name',
    detailComponent,
    gridRef,
  });

  const getRowHeight = useCallback((params: { data?: RowData }) => {
    if (params.data?._isDetailRow) {
      return 400;
    }
    return 52;
  }, []);

  const getRowStyle = useCallback((params: RowClassParams) => {
    if (params.node.rowPinned === 'bottom') {
      return { fontWeight: 'bold', background: 'var(--color-muted)' };
    }
    return undefined;
  }, []);

  const handleGridReady = useCallback((event: GridReadyEvent) => {
    setGridApi(event.api);
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

  const rowData = detailRowData as RowData[];

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-test="payroll-comparison-list-view"
    >
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <PayrollViewToggle />
          <PayPeriodFilter periods={payPeriods} />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              const value = e.target.value;
              setSearchValue(value);
              if (searchDebounceRef.current)
                clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(
                () => setSearchValue(value),
                300,
              );
            }}
            placeholder="Search payroll..."
            className="border-input bg-background placeholder:text-muted-foreground h-8 w-[200px] rounded-md border px-3 text-sm"
            data-test="payroll-comparison-search"
          />
          <CsvExportButton gridApi={gridApi} fileName="payroll-comparison" />
        </div>
      </div>

      {/* Grid */}
      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={rowData}
          pinnedBottomRowData={totalsRow}
          quickFilterText={searchValue}
          pagination={false}
          getRowStyle={getRowStyle}
          onRowClicked={handleDetailRowClicked}
          isFullWidthRow={isFullWidthRow}
          fullWidthCellRenderer={fullWidthCellRenderer}
          getRowId={getRowId}
          getRowHeight={getRowHeight}
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
