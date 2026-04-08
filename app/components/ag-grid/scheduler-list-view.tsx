import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridReadyEvent,
  SelectionChangedEvent,
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
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  History,
  Plus,
} from 'lucide-react';

import { Button } from '@aloha/ui/button';
import { DataTableToolbar } from '@aloha/ui/data-table-toolbar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@aloha/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import { BadgeCellRenderer } from '~/components/ag-grid/cell-renderers/badge-cell-renderer';
import { EmployeeCellRenderer } from '~/components/ag-grid/cell-renderers/employee-cell-renderer';
import { ScheduleDayRenderer } from '~/components/ag-grid/cell-renderers/schedule-day-renderer';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { CsvExportButton } from '~/components/ag-grid/csv-export-button';
import { useDetailRow } from '~/components/ag-grid/detail-row-wrapper';
import { otWarningRowClassRules } from '~/components/ag-grid/row-class-rules';
import { CreatePanel } from '~/components/crud/create-panel';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

const CHECKBOX_COL: ColDef = {
  headerCheckboxSelection: true,
  checkboxSelection: true,
  maxWidth: 50,
  sortable: false,
  filter: false,
  resizable: false,
  suppressMovable: true,
  pinned: 'left',
  lockPosition: true,
};

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

function ColumnVisibilityDropdown({
  gridApi,
  colDefs,
}: {
  gridApi: GridApi | null;
  colDefs: ColDef[];
}) {
  const [, forceUpdate] = useState(0);

  const handleToggle = useCallback(
    (colId: string, visible: boolean) => {
      if (!gridApi) return;
      gridApi.setColumnsVisible([colId], visible);
      forceUpdate((n) => n + 1);
    },
    [gridApi],
  );

  const columnStates = gridApi?.getColumnState();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          data-test="column-visibility-toggle"
        >
          <Columns3 className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {colDefs.map((col) => {
          const colId = col.field ?? col.colId ?? '';
          if (!colId) return null;

          const state = columnStates?.find((s) => s.colId === colId);
          const isVisible = state ? !state.hide : !col.hide;

          return (
            <DropdownMenuCheckboxItem
              key={colId}
              checked={isVisible}
              onCheckedChange={(checked) =>
                handleToggle(colId, checked as boolean)
              }
            >
              {col.headerName ?? colId}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const noop = () => {};

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
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'schedule' | 'history'>('schedule');
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Data columns (after checkbox + avatar) for column visibility dropdown
  const dataColDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: 'Employee',
        field: 'first_name',
        cellRenderer: EmployeeCellRenderer,
        minWidth: 180,
        sortable: true,
        filter: true,
        pinned: 'left' as const,
      },
      {
        headerName: 'Task',
        field: 'task',
        cellRenderer: BadgeCellRenderer,
        minWidth: 120,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Sun',
        field: 'sunday',
        cellRenderer: ScheduleDayRenderer,
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Mon',
        field: 'monday',
        cellRenderer: ScheduleDayRenderer,
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Tue',
        field: 'tuesday',
        cellRenderer: ScheduleDayRenderer,
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Wed',
        field: 'wednesday',
        cellRenderer: ScheduleDayRenderer,
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Thu',
        field: 'thursday',
        cellRenderer: ScheduleDayRenderer,
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Fri',
        field: 'friday',
        cellRenderer: ScheduleDayRenderer,
        sortable: false,
        filter: false,
        minWidth: 100,
      },
      {
        headerName: 'Sat',
        field: 'saturday',
        cellRenderer: ScheduleDayRenderer,
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

  // Full column defs including checkbox and avatar
  const colDefs: ColDef[] = useMemo(
    () => [CHECKBOX_COL, AVATAR_COL, ...dataColDefs],
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
    setGridApi(api);
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

  const handleSelectionChanged = useCallback(
    (_event: SelectionChangedEvent) => {
      // Capture selected IDs for future bulk actions
    },
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

  const getRowHeight = useCallback(
    (params: { data?: Record<string, unknown> }) => {
      if (params.data?._isDetailRow) return 200;
      return 52;
    },
    [],
  );

  const departmentOptions = fkOptions.hr_department_id ?? [];

  return (
    <>
      <div
        className="flex min-h-0 flex-1 flex-col"
        data-test="scheduler-list-view"
      >
        {/* Top row: week navigation + dept filter + history + create */}
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

        {/* Second row: search + column visibility + CSV export */}
        {viewMode === 'schedule' && (
          <div className="shrink-0 overflow-visible pb-4">
            <DataTableToolbar
              searchValue={searchValue}
              onSearchChange={(value) => {
                setSearchValue(value);

                if (searchDebounceRef.current) {
                  clearTimeout(searchDebounceRef.current);
                }

                searchDebounceRef.current = setTimeout(() => {
                  setSearchValue(value);
                }, 300);
              }}
              searchPlaceholder="Search scheduler..."
              showInactive={false}
              onShowInactiveChange={noop}
              actionSlot={
                <div className="flex items-center gap-2">
                  <ColumnVisibilityDropdown
                    gridApi={gridApi}
                    colDefs={dataColDefs}
                  />
                  <CsvExportButton gridApi={gridApi} fileName="scheduler" />
                </div>
              }
            />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          {viewMode === 'schedule' ? (
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
              rowSelection="multiple"
              suppressRowClickSelection={true}
              pagination={true}
              paginationPageSize={25}
              onGridReady={handleGridReady}
              onSelectionChanged={handleSelectionChanged}
              onColumnMoved={handleColumnMoved}
              onColumnResized={handleColumnResized}
              onSortChanged={handleSortChanged}
              onColumnVisible={handleColumnVisible}
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
