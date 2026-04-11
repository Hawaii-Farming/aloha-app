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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { useDetailRow } from '~/components/ag-grid/detail-row-wrapper';
import { PayPeriodFilter } from '~/components/ag-grid/pay-period-filter';
import {
  CurrencyRenderer,
  hoursFormatter,
} from '~/components/ag-grid/payroll-formatters';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

function ManagerFilter({ managers }: { managers: RowData[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentManager = searchParams.get('manager') ?? '';

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('manager');
    } else {
      next.set('manager', value);
    }
    setSearchParams(next, { preventScrollReset: true });
  };

  return (
    <Select value={currentManager || 'all'} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[220px]" data-test="manager-filter">
        <SelectValue placeholder="All managers" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Managers</SelectItem>
        {managers.map((m) => (
          <SelectItem
            key={String(m.compensation_manager_id)}
            value={String(m.compensation_manager_id)}
          >
            {String(m.compensation_manager_name ?? 'Unknown')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CheckDateFilter({ dates }: { dates: string[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentDate = searchParams.get('check_date') ?? '';

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('check_date');
    } else {
      next.set('check_date', value);
    }
    setSearchParams(next, { preventScrollReset: true });
  };

  return (
    <Select value={currentDate || 'all'} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[160px]" data-test="check-date-filter">
        <SelectValue placeholder="All Dates" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Dates</SelectItem>
        {dates.map((d) => (
          <SelectItem key={d} value={d}>
            {d}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmployeeDeptRenderer(props: CustomCellRendererProps) {
  const data = props.data as RowData | undefined;
  if (!data) return null;

  const fullName = String(data.full_name ?? '');
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

function fmtCurrency(v: number) {
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return v < 0 ? `($${formatted})` : `$${formatted}`;
}

/** Detail row: payroll records table for the expanded employee */
function PayrollDetailInner({ data }: { data: RowData }) {
  const parentData = (data._parentData ?? data) as RowData;
  const unsorted = parentData._detailRows as RowData[] | undefined;
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
              colSpan={2}
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
  const [searchParams] = useSearchParams();
  const checkDateFilter = searchParams.get('check_date') ?? '';

  const gridRef = useRef<AgGridReact>(null);
  const [searchValue, setSearchValue] = useState('');
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Detail row expansion (like scheduler)
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
    pkColumn: 'hr_employee_id',
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
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <ManagerFilter managers={managers} />
          <PayPeriodFilter periods={payPeriods} />
          <CheckDateFilter dates={checkDates} />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              const value = e.target.value;
              setSearchValue(value);

              if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
              }

              searchDebounceRef.current = setTimeout(() => {
                setSearchValue(value);
              }, 300);
            }}
            placeholder="Search payroll..."
            className="border-input bg-background placeholder:text-muted-foreground/50 h-8 w-[200px] rounded-md border px-3 text-xs"
            data-test="payroll-comp-manager-search"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={detailRowData as RowData[]}
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
