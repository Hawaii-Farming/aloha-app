import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router';

import type { ColDef, RowHeightParams } from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';
import {
  addDays,
  addWeeks,
  format,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, History, Plus } from 'lucide-react';

import { Button } from '@aloha/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import { useDetailRow } from '~/components/ag-grid/detail-row-wrapper';
import { otWarningRowClassRules } from '~/components/ag-grid/row-class-rules';
import { CreatePanel } from '~/components/crud/create-panel';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

function getCurrentWeekStart(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
}

function formatWeekLabel(weekStartStr: string): string {
  const weekStart = parseISO(weekStartStr);
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
}

interface HistoryRow {
  date: string;
  employee_count: number;
  total_hours: number;
}

function ScheduleDetailRowInner({
  data,
  accountSlug,
}: {
  data: Record<string, unknown>;
  accountSlug: string;
}) {
  const [detailData, setDetailData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);

  const employeeId = data.hr_employee_id as string;

  // Justified: fetch on mount when detail row is expanded
  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      try {
        const res = await fetch(
          `/api/schedule-history?mode=detail&employeeId=${encodeURIComponent(employeeId)}&orgId=${encodeURIComponent(accountSlug)}`,
        );
        const json = (await res.json()) as { data?: RowData[] };

        if (!cancelled && json.data) {
          setDetailData(json.data);
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [employeeId, accountSlug]);

  const detailColDefs: ColDef[] = useMemo(
    () => [
      { headerName: 'Day', field: 'day_of_week', maxWidth: 70 },
      { headerName: 'Date', field: 'date', minWidth: 100 },
      { headerName: 'Task', field: 'ops_task_id', minWidth: 120 },
      {
        headerName: 'Start',
        field: 'start_time_formatted',
        maxWidth: 80,
      },
      { headerName: 'End', field: 'end_time_formatted', maxWidth: 80 },
      {
        headerName: 'Hours',
        field: 'hours',
        maxWidth: 70,
        type: 'numericColumn',
      },
    ],
    [],
  );

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-4 text-sm">
        Loading schedule history...
      </div>
    );
  }

  if (detailData.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-4 text-sm">
        No historical schedule entries found
      </div>
    );
  }

  return (
    <div className="px-2 py-1">
      <AgGridWrapper
        colDefs={detailColDefs}
        rowData={detailData}
        domLayout="autoHeight"
        pagination={false}
      />
    </div>
  );
}

export default function SchedulerListView(props: ListViewProps) {
  const {
    tableData,
    fkOptions,
    config,
    comboboxOptions,
    subModuleDisplayName,
  } = props;
  const accountSlug = props.accountSlug;

  const [searchParams, setSearchParams] = useSearchParams();
  const gridRef = useRef<AgGridReact>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'schedule' | 'history'>('schedule');
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const currentWeek = searchParams.get('week') ?? getCurrentWeekStart();
  const currentDept = searchParams.get('dept') ?? '';

  const navigateWeek = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      const next = new URLSearchParams(searchParams);

      if (direction === 'today') {
        next.delete('week');
      } else {
        const current = parseISO(currentWeek);
        const newWeek =
          direction === 'prev'
            ? format(subWeeks(current, 1), 'yyyy-MM-dd')
            : format(addWeeks(current, 1), 'yyyy-MM-dd');
        next.set('week', newWeek);
      }

      setSearchParams(next, { preventScrollReset: true });
    },
    [searchParams, setSearchParams, currentWeek],
  );

  const handleDeptChange = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams);

      if (value === 'all') {
        next.delete('dept');
      } else {
        next.set('dept', value);
      }

      setSearchParams(next, { preventScrollReset: true });
    },
    [searchParams, setSearchParams],
  );

  const handlePrev = useCallback(() => navigateWeek('prev'), [navigateWeek]);
  const handleNext = useCallback(() => navigateWeek('next'), [navigateWeek]);
  const handleToday = useCallback(() => navigateWeek('today'), [navigateWeek]);

  const handleViewToggle = useCallback(() => {
    setViewMode((prev) => (prev === 'schedule' ? 'history' : 'schedule'));
  }, []);

  // Fetch history summary when switching to history mode
  // Justified: data fetch triggered by view mode change
  useEffect(() => {
    if (viewMode !== 'history') return;

    let cancelled = false;
    setHistoryLoading(true);

    async function fetchSummary() {
      try {
        const res = await fetch(
          `/api/schedule-history?mode=summary&orgId=${encodeURIComponent(accountSlug)}`,
        );
        const json = (await res.json()) as { data?: HistoryRow[] };

        if (!cancelled && json.data) {
          setHistoryData(json.data);
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [viewMode, accountSlug]);

  // Schedule view column definitions
  const colDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: '',
        field: 'profile_photo_url',
        cellRenderer: AvatarRenderer,
        maxWidth: 60,
        minWidth: 60,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        pinned: 'left' as const,
      },
      {
        headerName: 'Employee',
        field: 'full_name',
        sortable: true,
        filter: true,
        minWidth: 140,
      },
      {
        headerName: 'Department',
        field: 'department_name',
        sortable: true,
        filter: true,
        minWidth: 120,
      },
      {
        headerName: 'Work Auth',
        field: 'work_authorization_name',
        sortable: true,
        filter: true,
        minWidth: 100,
        hide: true,
      },
      {
        headerName: 'Task',
        field: 'task',
        sortable: true,
        filter: true,
        minWidth: 120,
      },
      {
        headerName: 'Sun',
        field: 'sunday',
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Mon',
        field: 'monday',
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Tue',
        field: 'tuesday',
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Wed',
        field: 'wednesday',
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Thu',
        field: 'thursday',
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Fri',
        field: 'friday',
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Sat',
        field: 'saturday',
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Total Hrs',
        field: 'total_hours',
        sortable: true,
        type: 'numericColumn',
        minWidth: 90,
      },
    ],
    [],
  );

  // History summary column definitions
  const historyColDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: 'Date',
        field: 'date',
        sortable: true,
        minWidth: 120,
      },
      {
        headerName: 'Employees',
        field: 'employee_count',
        sortable: true,
        type: 'numericColumn',
        minWidth: 100,
      },
      {
        headerName: 'Total Hours',
        field: 'total_hours',
        sortable: true,
        type: 'numericColumn',
        minWidth: 110,
      },
    ],
    [],
  );

  // Create synthetic _rowId for detail row tracking
  const dataWithIds = useMemo(
    () =>
      (tableData.data as RowData[]).map((row) => ({
        ...row,
        _rowId: `${row.hr_employee_id}_${row.task}_${row.week_start_date}`,
      })),
    [tableData.data],
  );

  // Detail row component that captures accountSlug via closure
  const detailComponent = useMemo(
    () =>
      function DetailRenderer({ data }: { data: Record<string, unknown> }) {
        return <ScheduleDetailRowInner data={data} accountSlug={accountSlug} />;
      },
    [accountSlug],
  );

  const {
    rowData: detailRowData,
    isFullWidthRow,
    fullWidthCellRenderer,
    handleRowClicked: handleDetailRowClicked,
    getRowId,
    hasExpandedRow: _hasExpandedRow,
  } = useDetailRow({
    sourceData: dataWithIds,
    pkColumn: '_rowId',
    detailComponent,
    gridRef,
  });

  const getRowHeight = useCallback((params: RowHeightParams) => {
    if (params.data?._isDetailRow) return 200;
    return undefined;
  }, []);

  const departmentOptions = fkOptions.hr_department_id ?? [];

  return (
    <>
      <div
        className="flex min-h-0 flex-1 flex-col"
        data-test="scheduler-list-view"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 pb-4">
          {viewMode === 'schedule' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrev}
                data-test="week-nav-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleToday}
                data-test="week-nav-today"
              >
                Today
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
                data-test="week-nav-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <span className="text-sm font-medium">
                {formatWeekLabel(currentWeek)}
              </span>
            </div>
          )}

          {viewMode === 'history' && (
            <div className="text-sm font-medium">Schedule History Summary</div>
          )}

          <div className="flex items-center gap-2">
            {viewMode === 'schedule' && (
              <Select
                value={currentDept || 'all'}
                onValueChange={handleDeptChange}
              >
                <SelectTrigger className="w-[200px]" data-test="dept-filter">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              size="sm"
              variant={viewMode === 'history' ? 'default' : 'outline'}
              onClick={handleViewToggle}
              data-test="history-toggle"
            >
              <History className="mr-2 h-4 w-4" />
              {viewMode === 'schedule' ? 'History' : 'Schedule'}
            </Button>

            <Button
              size="sm"
              variant="brand"
              onClick={() => setCreateOpen(true)}
              data-test="sub-module-create-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {viewMode === 'schedule' ? (
            <AgGridWrapper
              gridRef={gridRef}
              colDefs={colDefs}
              rowData={detailRowData as RowData[]}
              rowClassRules={otWarningRowClassRules}
              onRowClicked={handleDetailRowClicked}
              isFullWidthRow={isFullWidthRow}
              fullWidthCellRenderer={fullWidthCellRenderer}
              getRowId={getRowId}
              getRowHeight={getRowHeight}
              pagination={true}
              paginationPageSize={25}
            />
          ) : (
            <AgGridWrapper
              colDefs={historyColDefs}
              rowData={historyData as unknown as RowData[]}
              loading={historyLoading}
              pagination={true}
              paginationPageSize={25}
              emptyMessage="No schedule history found"
            />
          )}
        </div>
      </div>

      <CreatePanel
        open={createOpen}
        onOpenChange={setCreateOpen}
        config={config}
        fkOptions={fkOptions}
        comboboxOptions={comboboxOptions}
        subModuleDisplayName={subModuleDisplayName}
      />
    </>
  );
}
