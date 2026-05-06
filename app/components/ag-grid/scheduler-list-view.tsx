import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useParams, useRevalidator, useSearchParams } from 'react-router';

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
import { Plus, X } from 'lucide-react';

import { Button } from '@aloha/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@aloha/ui/sheet';
import { toast } from '@aloha/ui/sonner';

import {
  useActiveTableSearch,
  useRegisterActiveTable,
} from '~/components/active-table-search-context';
import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import { HoursHeatmapRenderer } from '~/components/ag-grid/cell-renderers/hours-heatmap-renderer';
import { ScheduleDayRenderer } from '~/components/ag-grid/cell-renderers/schedule-day-renderer';
import { SchedulerEmployeeRenderer } from '~/components/ag-grid/cell-renderers/scheduler-employee-renderer';
import { SchedulerTotalHoursRenderer } from '~/components/ag-grid/cell-renderers/scheduler-total-hours-renderer';
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
  week_start: string;
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
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [copyPending, setCopyPending] = useState(false);
  const revalidator = useRevalidator();
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

  const handleCopyFromPrev = useCallback(async () => {
    setCopyPending(true);
    try {
      const res = await fetch('/api/scheduler/copy-from-prev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountSlug, weekStart: currentWeek }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        copied?: number;
        error?: string;
      };
      if (json.success) {
        toast.success(`Copied ${json.copied ?? 0} entries from previous week`);
        revalidator.revalidate();
      } else if (res.status === 409) {
        toast.error('Current week already has records', {
          description: 'Please select an empty week.',
        });
      } else {
        toast.error(json.error ?? 'Failed to copy previous week');
      }
    } catch {
      toast.error('Failed to copy previous week');
    } finally {
      setCopyPending(false);
    }
  }, [accountSlug, currentWeek, revalidator]);

  const fetchHistorySummary = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/schedule-history?mode=summary&orgId=${encodeURIComponent(accountSlug)}`,
      );
      const json = (await res.json()) as { data?: HistoryRow[] };
      if (json.data) setHistoryData(json.data);
    } catch {
      // Silently handle fetch errors
    } finally {
      setHistoryLoading(false);
    }
  }, [accountSlug]);

  // Fetch history summary on mount
  // Justified: drawer needs its own data fetch separate from main table loader
  useEffect(() => {
    fetchHistorySummary();
  }, [fetchHistorySummary]);

  const handleDeleteEmployeeWeek = useCallback(
    async (employeeId: string, employeeName: string) => {
      const confirmed = window.confirm(
        `Delete ${employeeName}'s schedule for the week of ${format(
          parseISO(currentWeek),
          'MMM d, yyyy',
        )}?`,
      );
      if (!confirmed) return;
      try {
        const res = await fetch('/api/scheduler/delete-week', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountSlug,
            weekStart: currentWeek,
            employeeId,
          }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          deleted?: number;
          error?: string;
        };
        if (json.success) {
          toast.success(`Deleted ${json.deleted ?? 0} entries`);
          await fetchHistorySummary();
          revalidator.revalidate();
        } else {
          toast.error(json.error ?? 'Failed to delete week');
        }
      } catch {
        toast.error('Failed to delete week');
      }
    },
    [accountSlug, currentWeek, fetchHistorySummary, revalidator],
  );

  const handlePrint = useCallback(() => {
    const api = gridRef.current?.api;
    document.body.classList.add('print-schedule');
    api?.setColumnsVisible(['profile_photo_url', 'delete'], false);
    api?.setGridOption('domLayout', 'print');

    const cleanup = () => {
      api?.setGridOption('domLayout', 'normal');
      api?.setColumnsVisible(['profile_photo_url', 'delete'], true);
      document.body.classList.remove('print-schedule');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => window.print(), 50);
  }, []);

  const handleEditRow = useCallback((employeeId: string) => {
    setEditEmployeeId(employeeId);
    setCreateOpen(true);
  }, []);

  const handleRowClicked = useCallback(
    (event: { data?: RowData }) => {
      const empId = event.data?.hr_employee_id as string | undefined;
      if (!empId) return;
      handleEditRow(empId);
    },
    [handleEditRow],
  );

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
        cellRenderer: SchedulerTotalHoursRenderer,
        type: 'numericColumn',
        minWidth: 100,
      },
      {
        headerName: '',
        colId: 'delete',
        width: 56,
        maxWidth: 56,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellRenderer: (p: { data?: RowData }) => {
          const empId = p.data?.hr_employee_id as string | undefined;
          const name =
            (p.data?.full_name as string | undefined) ?? 'this employee';
          if (!empId) return null;
          return (
            <button
              type="button"
              aria-label="Delete employee week"
              title="Delete employee week"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEmployeeWeek(empId, name);
              }}
              className="text-muted-foreground hover:text-destructive flex h-full w-full items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          );
        },
      },
    ],
    [handleDeleteEmployeeWeek],
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
        headerName: 'Week Of',
        field: 'week_start',
        minWidth: 140,
        valueFormatter: (p: { value?: string | null }) =>
          p.value ? format(parseISO(p.value), 'MMM d, yyyy') : '',
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
          onCopyFromPrev={handleCopyFromPrev}
          copyPending={copyPending}
          onPrint={handlePrint}
        />

        {/* Weekly Schedule — full width */}
        <div
          className="flex min-h-0 flex-1 flex-col"
          data-print-target="scheduler-grid"
        >
          {/* Print-only header — week range */}
          <div className="hidden print:mb-3 print:block">
            <h1 className="text-base font-semibold">
              Schedule — Week of {formatWeekLabel(currentWeek)}
            </h1>
          </div>
          <AgGridWrapper
            gridRef={gridRef}
            colDefs={colDefs}
            rowData={tableData.data as RowData[]}
            rowClassRules={otWarningRowClassRules}
            pagination={false}
            quickFilterText={query}
            onRowClicked={handleRowClicked}
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
          onClick={() => {
            setEditEmployeeId(null);
            setCreateOpen(true);
          }}
          data-test="sub-module-create-button"
          aria-label="Create"
          className="fixed right-10 bottom-10 z-30 h-14 w-14 rounded-full p-0 shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <SchedulerCreatePanel
        open={createOpen}
        onOpenChange={(next) => {
          setCreateOpen(next);
          if (!next) setEditEmployeeId(null);
        }}
        fkOptions={fkOptions}
        subModuleDisplayName={subModuleDisplayName ?? 'Scheduler'}
        accountSlug={accountSlug}
        currentWeek={currentWeek}
        editEmployeeId={editEmployeeId}
      />
    </>
  );
}
