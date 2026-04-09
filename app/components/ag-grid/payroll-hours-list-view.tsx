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
  ValueFormatterParams,
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
import { hoursFormatter } from '~/components/ag-grid/payroll-formatters';
import { varianceHighlightCellClassRules } from '~/components/ag-grid/row-class-rules';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

function varianceFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}`;
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

  if (detailData.length === 0) {
    return (
      <div className="text-muted-foreground px-6 py-4 text-sm">
        No schedule records found.
      </div>
    );
  }

  const totalHours = detailData.reduce(
    (sum, r) => sum + (Number(r.hours) || 0),
    0,
  );

  return (
    <div
      className="border-border/40 mx-4 mt-2 mb-4 overflow-y-auto rounded-lg border"
      style={{
        height: '360px',
        background:
          'repeating-linear-gradient(0deg, transparent, transparent 27px, var(--color-border) 27px, var(--color-border) 28px)',
        backgroundPositionY: '32px',
      }}
    >
      <table
        className="w-full text-xs"
        style={{ borderCollapse: 'separate', borderSpacing: 0 }}
      >
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted/90 text-muted-foreground border-border/40 border-b text-[11px] tracking-wider uppercase backdrop-blur-sm">
            <th className="border-border/15 w-[100px] border-r px-3 py-2 text-left font-semibold">
              Date
            </th>
            <th className="border-border/15 w-[60px] border-r px-3 py-2 text-left font-semibold">
              Day
            </th>
            <th className="border-border/15 w-[140px] border-r px-3 py-2 text-left font-semibold">
              Department
            </th>
            <th className="border-border/15 w-[140px] border-r px-3 py-2 text-left font-semibold">
              Task
            </th>
            <th className="border-border/15 w-[90px] border-r px-3 py-2 text-right font-semibold">
              Start Time
            </th>
            <th className="border-border/15 w-[90px] border-r px-3 py-2 text-right font-semibold">
              End Time
            </th>
            <th className="w-[80px] px-3 py-2 text-right font-semibold">
              Hours
            </th>
          </tr>
        </thead>
        <tbody>
          {detailData.map((row, i) => {
            const isEven = i % 2 === 0;
            return (
              <tr
                key={`${row.date}-${row.start_time_formatted}-${String(i)}`}
                className="group transition-colors"
                style={{
                  background: isEven
                    ? 'transparent'
                    : 'var(--color-muted, rgba(128,128,128,0.06))',
                }}
              >
                <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5">
                  <span className="inline-block rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600 shadow-sm dark:text-emerald-400">
                    {String(row.date ?? '')}
                  </span>
                </td>
                <td className="text-muted-foreground border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5">
                  {String(row.day_of_week ?? '')}
                </td>
                <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5">
                  {String(row.department_name ?? '')}
                </td>
                <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5">
                  {String(row.task_name ?? '')}
                </td>
                <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5 text-right tabular-nums">
                  {String(row.start_time_formatted ?? '')}
                </td>
                <td className="border-border/10 group-hover:bg-primary/5 border-r px-3 py-1.5 text-right tabular-nums">
                  {String(row.end_time_formatted ?? '')}
                </td>
                <td className="group-hover:bg-primary/5 px-3 py-1.5 text-right font-semibold tabular-nums">
                  {row.hours != null ? Number(row.hours).toFixed(2) : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="sticky bottom-0 z-10">
          <tr className="bg-muted/90 border-border/40 border-t font-semibold backdrop-blur-sm">
            <td
              className="border-border/15 border-r px-3 py-2 text-[11px] tracking-wider uppercase"
              colSpan={6}
            >
              <span className="text-primary">{detailData.length}</span> record
              {detailData.length !== 1 ? 's' : ''}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {totalHours.toFixed(2)}
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
    minWidth: 200,
    pinned: 'left',
  },
  {
    field: 'scheduled_hours',
    headerName: 'Scheduled Hrs',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
  },
  {
    field: 'payroll_hours',
    headerName: 'Payroll Hrs',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
  },
  {
    field: 'variance',
    headerName: 'Variance',
    type: 'numericColumn',
    valueFormatter: varianceFormatter,
    cellClassRules: varianceHighlightCellClassRules(4, 0.01),
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
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
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
    setGridApi(event.api);
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
            className="border-input bg-background placeholder:text-muted-foreground h-8 w-[200px] rounded-md border px-3 text-sm"
            data-test="payroll-hours-search"
          />

          <CsvExportButton
            gridApi={gridApi}
            fileName="payroll-hours-comparison"
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
