import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router';

import type { ColDef, GetRowIdParams } from 'ag-grid-community';
import {
  addDays,
  addWeeks,
  format,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
import { otWarningRowClassRules } from '~/components/ag-grid/row-class-rules';
import type { ListViewProps } from '~/lib/crud/types';

function getCurrentWeekStart(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
}

function formatWeekLabel(weekStartStr: string): string {
  const weekStart = parseISO(weekStartStr);
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
}

export default function SchedulerListView({
  tableData,
  fkOptions,
}: ListViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();

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

  const getRowId = useCallback(
    (params: GetRowIdParams) =>
      `${params.data.hr_employee_id}_${params.data.task}_${params.data.week_start_date}`,
    [],
  );

  const departmentOptions = fkOptions.hr_department_id ?? [];

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-test="scheduler-list-view"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 pb-4">
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

        <div className="flex items-center gap-2">
          <Select value={currentDept || 'all'} onValueChange={handleDeptChange}>
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
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          colDefs={colDefs}
          rowData={tableData.data as Record<string, unknown>[]}
          rowClassRules={otWarningRowClassRules}
          getRowId={getRowId}
          pagination={true}
          paginationPageSize={25}
        />
      </div>
    </div>
  );
}
