import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridReadyEvent,
  SortChangedEvent,
} from 'ag-grid-community';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@aloha/ui/sheet';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import { HoursHeatmapRenderer } from '~/components/ag-grid/cell-renderers/hours-heatmap-renderer';
import { ScheduleDayRenderer } from '~/components/ag-grid/cell-renderers/schedule-day-renderer';
import { SchedulerEmployeeRenderer } from '~/components/ag-grid/cell-renderers/scheduler-employee-renderer';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { useDetailRow } from '~/components/ag-grid/detail-row-wrapper';
import { otWarningRowClassRules } from '~/components/ag-grid/row-class-rules';
import { TableSearchInput } from '~/components/ag-grid/table-search-input';
import { CreatePanel } from '~/components/crud/create-panel';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

const AVATAR_COL: ColDef = {
  headerName: '',
  field: 'profile_photo_url',
  cellRenderer: AvatarRenderer,
  maxWidth: 60,
  minWidth: 60,
  sortable: false,
  filter: false,
  resizable: false,
  suppressMovable: true,
  pinned: 'left',
  lockPosition: true,
};

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

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-4 text-sm">
        Loading schedule history...
      </div>
    );
  }

  // Group entries by week (Sunday-anchored), fill missing days
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build a map of date → entry
  const byDate = new Map<string, RowData>();
  for (const row of detailData) {
    const date = (row.date as string) ?? '';
    if (date) byDate.set(date, row);
  }

  // Helper to generate a week of day slots from a Sunday start date
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
    // No data — show current week as all "Off"
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    recentWeeks = [buildWeek(weekStart)];
  } else {
    // Find all unique week start dates, then fill 7 days per week
    const allDates = [...byDate.keys()].sort();
    const weeks: typeof recentWeeks = [];

    const seen = new Set<string>();
    for (const date of allDates) {
      const d = new Date(date + 'T00:00:00');
      const dow = d.getDay(); // 0=Sun
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - dow);
      const weekKey = weekStart.toISOString().split('T')[0] ?? '';

      if (seen.has(weekKey)) continue;
      seen.add(weekKey);

      weeks.push(buildWeek(weekStart));
    }

    // Show only the 3 most recent weeks
    recentWeeks = weeks.slice(-3);
  }

  return (
    <div className="h-full max-h-[310px] overflow-y-auto px-4 py-2 sm:max-h-none sm:overflow-hidden">
      {recentWeeks.map((week, wi) => (
        <div key={wi} className={`${wi > 0 ? 'mt-2' : ''}`}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 md:grid-cols-7">
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
                    {entry.farm_name ? (
                      <span className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        {String(entry.farm_name)}
                      </span>
                    ) : null}
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
                    {entry.stat ? (
                      <span className="text-muted-foreground text-[10px]">
                        · {String(entry.stat)}
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentWeek = searchParams.get('week') ?? getCurrentWeekStart();

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

  const handlePrev = useCallback(() => navigateWeek('prev'), [navigateWeek]);
  const handleNext = useCallback(() => navigateWeek('next'), [navigateWeek]);
  const handleToday = useCallback(() => navigateWeek('today'), [navigateWeek]);

  // Fetch history summary on mount
  // Justified: both tables render simultaneously, history needs its own data
  useEffect(() => {
    let cancelled = false;

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
  }, [accountSlug]);

  // Data columns (after checkbox + avatar) for column visibility dropdown
  const dataColDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: 'Employee',
        field: 'full_name',
        cellRenderer: SchedulerEmployeeRenderer,
        minWidth: 220,
        sortable: true,
        filter: true,
        pinned: 'left' as const,
      },
      ...['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({
        headerName: day,
        field: [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][i],
        cellRenderer: ScheduleDayRenderer,
        sortable: false,
        filter: false,
        minWidth: 100,
        cellStyle:
          i % 2 === 0
            ? {
                background:
                  'repeating-linear-gradient(135deg, rgba(128,128,128,0.06), rgba(128,128,128,0.06) 4px, transparent 4px, transparent 8px)',
              }
            : undefined,
      })),
      {
        headerName: 'Total Hrs',
        field: 'total_hours',
        cellRenderer: HoursHeatmapRenderer,
        sortable: true,
        type: 'numericColumn',
        minWidth: 100,
      },
    ],
    [],
  );

  // Full column defs including checkbox and avatar
  const colDefs: ColDef[] = useMemo(
    () => [AVATAR_COL, ...dataColDefs],
    [dataColDefs],
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
        cellRenderer: HoursHeatmapRenderer,
        sortable: true,
        type: 'numericColumn',
        minWidth: 110,
      },
    ],
    [],
  );

  // Column state persistence
  const handleGridReady = useCallback((event: GridReadyEvent) => {
    const api = event.api;
    restoreColumnState('scheduler', api);
  }, []);

  const debouncedSaveState = useCallback((api: GridApi) => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = setTimeout(() => {
      saveColumnState('scheduler', api);
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

  // Create synthetic _rowId for detail row tracking
  const dataWithIds = useMemo(
    () =>
      (tableData.data as RowData[]).map((row, idx) => ({
        ...row,
        _rowId: `${row.hr_employee_id}_${row.task}_${row.week_start_date}_${idx}`,
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

  const getRowHeight = useCallback(
    (params: { data?: Record<string, unknown> }) => {
      if (params.data?._isDetailRow) return 330;
      return 52;
    },
    [],
  );

  const getHistoryRowHeight = useCallback(() => 46, []);

  return (
    <>
      <div
        className="flex min-h-0 flex-1 flex-col"
        data-test="scheduler-list-view"
      >
        {/* Toolbar — wraps on narrow viewports */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 pb-4">
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

            <span className="text-sm font-medium whitespace-nowrap">
              {formatWeekLabel(currentWeek)}
            </span>
          </div>

          <div className="ml-auto flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
            <TableSearchInput
              value={searchValue}
              onChange={(value) => {
                setSearchValue(value);
                if (searchDebounceRef.current) {
                  clearTimeout(searchDebounceRef.current);
                }
                searchDebounceRef.current = setTimeout(() => {
                  setSearchValue(value);
                }, 300);
              }}
              placeholder="Search scheduler..."
              data-test="scheduler-search"
            />

            <Button
              variant="outline"
              onClick={() => setHistoryOpen(true)}
              data-test="history-toggle"
              aria-label="History"
              className="h-9 w-9 rounded-full p-0"
            >
              <History className="h-4 w-4" />
            </Button>

            <Button
              variant="brand"
              onClick={() => setCreateOpen(true)}
              data-test="sub-module-create-button"
              aria-label="Create"
              className="h-9 w-9 rounded-full p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Weekly Schedule — full width */}
        <div className="flex min-h-0 flex-1 flex-col">
          <AgGridWrapper
            gridRef={gridRef}
            colDefs={colDefs}
            rowData={detailRowData as RowData[]}
            rowClassRules={otWarningRowClassRules}
            quickFilterText={searchValue}
            onRowClicked={handleDetailRowClicked}
            isFullWidthRow={isFullWidthRow}
            fullWidthCellRenderer={fullWidthCellRenderer}
            getRowId={getRowId}
            getRowHeight={getRowHeight}
            pagination={false}
            onGridReady={handleGridReady}
            onColumnMoved={handleColumnMoved}
            onColumnResized={handleColumnResized}
            onSortChanged={handleSortChanged}
            onColumnVisible={handleColumnVisible}
          />
        </div>
      </div>

      {/* Historical Data drawer */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-[440px] sm:w-[480px]">
          <SheetHeader>
            <SheetTitle>Historical Data</SheetTitle>
          </SheetHeader>
          <div className="mt-4 h-[calc(100vh-120px)]">
            <AgGridWrapper
              colDefs={historyColDefs}
              rowData={historyData as unknown as RowData[]}
              loading={historyLoading}
              pagination={false}
              getRowHeight={getHistoryRowHeight}
              emptyMessage="No schedule history found"
            />
          </div>
        </SheetContent>
      </Sheet>

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
