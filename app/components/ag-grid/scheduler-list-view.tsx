import { useCallback, useMemo, useRef, useState } from 'react';

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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@aloha/ui/alert-dialog';
import { Button } from '@aloha/ui/button';
import { toast } from '@aloha/ui/sonner';

import {
  useActiveTableSearch,
  useRegisterActiveTable,
} from '~/components/active-table-search-context';
import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
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

function lastNameKey(value: unknown): string {
  const name = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!name) return '';
  const parts = name.split(/\s+/);
  // Sort key: "lastname firstname…" so ties on last name fall back to first.
  return [parts[parts.length - 1], ...parts.slice(0, -1)].join(' ');
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
  const [copyPending, setCopyPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteWeekConfirmOpen, setDeleteWeekConfirmOpen] = useState(false);
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

  const handleDeleteEmployeeWeek = useCallback(
    async (employeeId: string, _employeeName: string) => {
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
          revalidator.revalidate();
        } else {
          toast.error(json.error ?? 'Failed to delete week');
        }
      } catch {
        toast.error('Failed to delete week');
      }
    },
    [accountSlug, currentWeek, revalidator],
  );

  const handleDeleteWeek = useCallback(async () => {
    setDeletePending(true);
    try {
      const res = await fetch('/api/scheduler/delete-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountSlug, weekStart: currentWeek }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        deleted?: number;
        error?: string;
      };
      if (json.success) {
        toast.success(`Deleted ${json.deleted ?? 0} entries for the week`);
        revalidator.revalidate();
      } else {
        toast.error(json.error ?? 'Failed to delete week');
      }
    } catch {
      toast.error('Failed to delete week');
    } finally {
      setDeletePending(false);
      setDeleteWeekConfirmOpen(false);
    }
  }, [accountSlug, currentWeek, revalidator]);

  const handlePrint = useCallback(() => {
    const api = gridRef.current?.api;

    // Snapshot the user's current sort so we can restore after print.
    const previousSort = api?.getColumnState().map((c) => ({
      colId: c.colId,
      sort: c.sort ?? null,
      sortIndex: c.sortIndex ?? null,
    }));

    document.body.classList.add('print-schedule');
    api?.setColumnsVisible(['profile_photo_url', 'delete'], false);
    api?.applyColumnState({
      state: [{ colId: 'full_name', sort: 'asc', sortIndex: 0 }],
      defaultState: { sort: null },
    });
    api?.setGridOption('domLayout', 'print');

    const cleanup = () => {
      api?.setGridOption('domLayout', 'normal');
      api?.setColumnsVisible(['profile_photo_url', 'delete'], true);
      if (previousSort) {
        api?.applyColumnState({
          state: previousSort,
          defaultState: { sort: null },
        });
      }
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

  const handleCellClicked = useCallback(
    (event: { data?: RowData; column?: { getColId: () => string } }) => {
      if (event.column?.getColId() === 'delete') return;
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
        sortable: true,
        sort: 'asc' as const,
        comparator: (a: unknown, b: unknown) =>
          lastNameKey(a).localeCompare(lastNameKey(b)),
      },
      {
        headerName: 'Task',
        field: 'task',
        minWidth: 140,
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
          onCopyFromPrev={handleCopyFromPrev}
          copyPending={copyPending}
          onDeleteWeek={() => setDeleteWeekConfirmOpen(true)}
          deletePending={deletePending}
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
            onCellClicked={handleCellClicked}
            onGridReady={handleGridReady}
            onColumnMoved={handleColumnMoved}
            onColumnResized={handleColumnResized}
            onSortChanged={handleSortChanged}
            onColumnVisible={handleColumnVisible}
          />
        </div>
      </div>

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

      <AlertDialog
        open={deleteWeekConfirmOpen}
        onOpenChange={setDeleteWeekConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete week schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all schedule entries for{' '}
              <span className="font-medium">
                {formatWeekLabel(currentWeek)}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteWeek();
              }}
              disabled={deletePending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePending ? 'Deleting…' : 'Delete week'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
