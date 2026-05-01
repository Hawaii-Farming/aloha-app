import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useParams, useSearchParams } from 'react-router';

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
import { Plus } from 'lucide-react';

import { Button } from '@aloha/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@aloha/ui/sheet';

import {
  useActiveTableSearch,
  useRegisterActiveTable,
} from '~/components/active-table-search-context';
import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import { HoursHeatmapRenderer } from '~/components/ag-grid/cell-renderers/hours-heatmap-renderer';
import { ScheduleDayRenderer } from '~/components/ag-grid/cell-renderers/schedule-day-renderer';
import { SchedulerEmployeeRenderer } from '~/components/ag-grid/cell-renderers/scheduler-employee-renderer';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { otWarningRowClassRules } from '~/components/ag-grid/row-class-rules';
import { SchedulerNavbarTools } from '~/components/ag-grid/scheduler-navbar-tools';
import { SchedulerCreatePanel } from '~/components/scheduler/scheduler-create-panel';
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
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  // Compact: "Apr 5 – 11" when same month, "Mar 30 – Apr 5" when spanning.
  // Year is omitted on narrow viewports (restored via title attribute).
  if (sameMonth) {
    return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd')}`;
  }
  return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;
}

interface HistoryRow {
  date: string;
  employee_count: number;
  total_hours: number;
}

export default function SchedulerListView(props: ListViewProps) {
  const { tableData, fkOptions, config, subModuleDisplayName } = props;
  const accountSlug = props.accountSlug;

  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const subModuleSlug = params.subModule ?? 'scheduler';
  useRegisterActiveTable(subModuleSlug, subModuleDisplayName ?? 'Scheduler');
  const { query } = useActiveTableSearch();
  const gridRef = useRef<AgGridReact>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        pinned: 'left' as const,
      },
      {
        headerName: 'Work Auth',
        field: 'work_authorization_name',
        minWidth: 120,
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
      })),
      {
        headerName: 'Total Hrs',
        field: 'total_hours',
        cellRenderer: HoursHeatmapRenderer,
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
        minWidth: 120,
      },
      {
        headerName: 'Employees',
        field: 'employee_count',
        type: 'numericColumn',
        minWidth: 100,
      },
      {
        headerName: 'Total Hours',
        field: 'total_hours',
        cellRenderer: HoursHeatmapRenderer,
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

  return (
    <>
      <div
        className="flex min-h-0 flex-1 flex-col"
        data-test="scheduler-list-view"
      >
        <SchedulerNavbarTools
          weekLabel={formatWeekLabel(currentWeek)}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onHistoryOpen={() => setHistoryOpen(true)}
        />

        {/* Weekly Schedule — full width */}
        <div className="flex min-h-0 flex-1 flex-col">
          <AgGridWrapper
            gridRef={gridRef}
            colDefs={colDefs}
            rowData={tableData.data as RowData[]}
            rowClassRules={otWarningRowClassRules}
            pagination={false}
            quickFilterText={query}
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
              emptyMessage="No schedule history found"
            />
          </div>
        </SheetContent>
      </Sheet>

      {(config?.formFields?.length ?? 0) > 0 && (
        <Button
          variant="brand"
          onClick={() => setCreateOpen(true)}
          data-test="sub-module-create-button"
          aria-label="Create"
          className="fixed right-10 bottom-10 z-30 h-14 w-14 rounded-full p-0 shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <SchedulerCreatePanel
        open={createOpen}
        onOpenChange={setCreateOpen}
        fkOptions={fkOptions}
        subModuleDisplayName={subModuleDisplayName ?? 'Scheduler'}
        accountSlug={accountSlug}
        currentWeek={currentWeek}
      />
    </>
  );
}
