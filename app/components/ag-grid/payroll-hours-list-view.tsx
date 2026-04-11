import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLoaderData, useParams } from 'react-router';

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
import { useDetailRow } from '~/components/ag-grid/detail-row-wrapper';
import { PayPeriodFilter } from '~/components/ag-grid/pay-period-filter';
import { hoursFormatter } from '~/components/ag-grid/payroll-formatters';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

function VariancePillRenderer(props: CustomCellRendererProps) {
  const value = props.value as number | null;
  if (value == null) return null;

  if (props.node.rowPinned === 'bottom') {
    const prefix = value > 0 ? '+' : '';
    const pillClass =
      value > 0
        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
        : value < 0
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          : 'bg-muted text-muted-foreground border-border';
    return (
      <div className="flex h-full items-center justify-end">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums ${pillClass}`}
        >
          {prefix}
          {value.toFixed(1)}
        </span>
      </div>
    );
  }

  const prefix = value > 0 ? '+' : '';
  const label = `${prefix}${value.toFixed(1)}`;

  const pillClass =
    value > 0
      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      : value < 0
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        : 'bg-muted text-muted-foreground border-border';

  return (
    <div className="flex h-full items-center justify-end">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${pillClass}`}
      >
        {label}
      </span>
    </div>
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

interface HoursDetailInnerProps {
  data: RowData;
  accountSlug: string;
}

function HoursDetailInner({ data, accountSlug }: HoursDetailInnerProps) {
  const [detailData, setDetailData] = useState<RowData[]>([]);

  const employeeId = String(data.hr_employee_id ?? '');
  const periodStart = String(data.pay_period_start ?? '');
  const periodEnd = String(data.pay_period_end ?? '');

  const canFetch = !!(employeeId && periodStart && periodEnd);
  const [loading, setLoading] = useState(canFetch);

  // Justified: fetch schedule data on mount when detail row expands
  useEffect(() => {
    if (!canFetch) return;

    let cancelled = false;

    const params = new URLSearchParams({
      employeeId,
      orgId: accountSlug,
      periodStart,
      periodEnd,
    });

    fetch(`/api/schedule-by-period?${params.toString()}`)
      .then((res) => res.json())
      .then((json: { data?: RowData[] }) => {
        if (!cancelled) {
          setDetailData(json.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canFetch, employeeId, accountSlug, periodStart, periodEnd]);

  if (loading) {
    return (
      <div className="text-muted-foreground px-6 py-4 text-sm">
        Loading schedule data...
      </div>
    );
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const byDate = new Map<string, RowData>();
  for (const row of detailData) {
    const date = (row.date as string) ?? '';
    if (date) byDate.set(date, row);
  }

  function buildWeek(weekStart: Date) {
    const week: { date: string; dayName: string; entry: RowData | null }[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dayStr = dayDate.toISOString().split('T')[0] ?? '';
      week.push({
        date: dayStr,
        dayName: dayNames[i] ?? '',
        entry: byDate.get(dayStr) ?? null,
      });
    }
    return week;
  }

  let recentWeeks: { date: string; dayName: string; entry: RowData | null }[][];

  if (detailData.length === 0) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    recentWeeks = [buildWeek(weekStart)];
  } else {
    const allDates = [...byDate.keys()].sort();
    const weeks: typeof recentWeeks = [];
    const seen = new Set<string>();

    for (const date of allDates) {
      const d = new Date(date + 'T00:00:00');
      const dow = d.getDay();
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - dow);
      const weekKey = weekStart.toISOString().split('T')[0] ?? '';

      if (seen.has(weekKey)) continue;
      seen.add(weekKey);
      weeks.push(buildWeek(weekStart));
    }

    recentWeeks = weeks;
  }

  return (
    <div className="overflow-hidden px-4 py-2">
      {recentWeeks.map((week, wi) => (
        <div key={wi} className={`${wi > 0 ? 'mt-2' : ''}`}>
          <div className="grid grid-cols-7 gap-2">
            {week.map(({ date, dayName, entry }) => {
              const isWeekend = dayName === 'Sun' || dayName === 'Sat';
              const isOff = !entry;

              if (isOff) {
                return (
                  <div
                    key={date}
                    className={`overflow-hidden rounded-lg border border-dashed px-2 py-1.5 opacity-40 ${
                      isWeekend ? 'border-amber-500/30' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{dayName}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {date}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1 text-[10px]">
                      Off
                    </div>
                  </div>
                );
              }

              const hours = entry.hours as number | null;

              return (
                <div
                  key={date}
                  className={`overflow-hidden rounded-lg border px-2 py-1.5 ${
                    isWeekend
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{dayName}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {date}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-muted-foreground text-[10px]">
                      {(entry.start_time_formatted as string) ?? ''} -{' '}
                      {(entry.end_time_formatted as string) ?? ''}
                    </span>
                    {hours !== null && (
                      <span className="text-primary ml-1 text-[10px] font-semibold">
                        {hours}h
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {entry.task_name ? (
                      <span className="inline-flex items-center rounded bg-emerald-500/15 px-1.5 text-[10px] font-medium text-emerald-500">
                        {String(entry.task_name)}
                      </span>
                    ) : null}
                    {entry.department_name ? (
                      <span className="text-muted-foreground text-[10px]">
                        {String(entry.department_name)}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
  const params = useParams();
  const accountSlug = params.account ?? '';

  const gridRef = useRef<AgGridReact>(null);
  const [searchValue, setSearchValue] = useState('');
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const detailComponent = useMemo(
    () =>
      function DetailRenderer({ data }: { data: RowData }) {
        return <HoursDetailInner data={data} accountSlug={accountSlug} />;
      },
    [accountSlug],
  );

  const {
    rowData: detailRowData,
    isFullWidthRow,
    fullWidthCellRenderer,
    handleRowClicked: handleDetailRowClicked,
    getRowId,
  } = useDetailRow({
    sourceData: rawRows,
    pkColumn: 'hr_employee_id',
    detailComponent,
    gridRef,
  });

  const getRowHeight = useCallback((params: { data?: RowData }) => {
    if (params.data?._isDetailRow) {
      const parent = params.data._parentData as RowData | undefined;
      const start = parent?.pay_period_start as string | undefined;
      const end = parent?.pay_period_end as string | undefined;
      if (start && end) {
        const days =
          (new Date(end).getTime() - new Date(start).getTime()) / 86400000 + 1;
        const weeks = Math.ceil(days / 7);
        return weeks * 80 + 24;
      }
      return 200;
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

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-test="payroll-hours-list-view"
    >
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <PayPeriodFilter periods={payPeriods} />
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
            placeholder="Search employees..."
            className="border-input bg-background placeholder:text-muted-foreground/50 h-8 w-[200px] rounded-md border px-3 text-xs"
            data-test="payroll-hours-search"
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
