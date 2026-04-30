import { useCallback, useRef } from 'react';

import { useLoaderData, useSearchParams } from 'react-router';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridReadyEvent,
  SortChangedEvent,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';
import type { AgGridReact, CustomCellRendererProps } from 'ag-grid-react';
import { Lock } from 'lucide-react';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { SchedulerEmployeeRenderer } from '~/components/ag-grid/cell-renderers/scheduler-employee-renderer';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { scoreColorCellClassRules } from '~/components/ag-grid/row-class-rules';
import { NavbarFilterButton } from '~/components/navbar-filter-button';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

function LockCellRenderer(props: CustomCellRendererProps) {
  if (props.value !== true) return null;
  return <Lock className="text-muted-foreground h-4 w-4" />;
}

function averageFormatter(params: ValueFormatterParams): string {
  return params.value != null ? Number(params.value).toFixed(1) : '';
}

function quarterLabelGetter(params: ValueGetterParams): string {
  const year = params.data?.review_year;
  const quarter = params.data?.review_quarter;
  if (year == null || quarter == null) return '';
  return `${year} Q${quarter}`;
}

const colDefs: ColDef[] = [
  {
    headerName: 'Employee',
    field: 'subject_preferred_name',
    cellRenderer: SchedulerEmployeeRenderer,
    minWidth: 200,
  },
  {
    headerName: 'Dept',
    field: 'subject_hr_department_id',
    minWidth: 100,
  },
  {
    headerName: 'Quarter',
    colId: 'quarter_label',
    valueGetter: quarterLabelGetter,
    minWidth: 90,
  },
  {
    headerName: 'Prod',
    field: 'productivity',
    minWidth: 70,
    maxWidth: 90,
    cellClassRules: scoreColorCellClassRules(),
  },
  {
    headerName: 'Attend',
    field: 'attendance',
    minWidth: 70,
    maxWidth: 90,
    cellClassRules: scoreColorCellClassRules(),
  },
  {
    headerName: 'Quality',
    field: 'quality',
    minWidth: 70,
    maxWidth: 90,
    cellClassRules: scoreColorCellClassRules(),
  },
  {
    headerName: 'Engage',
    field: 'engagement',
    minWidth: 70,
    maxWidth: 90,
    cellClassRules: scoreColorCellClassRules(),
  },
  {
    headerName: 'Avg',
    field: 'average',
    minWidth: 70,
    maxWidth: 80,
    valueFormatter: averageFormatter,
  },
  {
    headerName: 'Notes',
    field: 'notes',
    minWidth: 100,
    maxWidth: 200,
  },
  {
    headerName: 'Lead',
    field: 'lead_preferred_name',
    minWidth: 100,
  },
  {
    headerName: '',
    field: 'is_locked',
    maxWidth: 50,
    minWidth: 50,
    sortable: false,
    filter: false,
    cellRenderer: LockCellRenderer,
  },
];

export default function EmployeeReviewListView(props: ListViewProps) {
  const { tableData } = props;

  const loaderData = useLoaderData() as RowData;
  const reviewYears = (loaderData.reviewYears ?? []) as number[];

  const gridRef = useRef<AgGridReact>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawRows = tableData.data as RowData[];

  // Column state persistence
  const handleGridReady = useCallback((event: GridReadyEvent) => {
    restoreColumnState('employee_review', event.api);
  }, []);

  const debouncedSaveState = useCallback((api: GridApi) => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = setTimeout(() => {
      saveColumnState('employee_review', api);
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

  const [searchParams, setSearchParams] = useSearchParams();
  const yearValue = searchParams.get('year') ?? '';
  const quarterValue = searchParams.get('quarter') ?? '';

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value === '') next.delete(key);
      else next.set(key, value);
      setSearchParams(next, { preventScrollReset: true });
    },
    [searchParams, setSearchParams],
  );

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-test="employee-review-list-view"
    >
      <NavbarFilterButton
        testKey="employee-review-filter"
        filters={[
          {
            key: 'year',
            label: 'Year',
            allLabel: 'All Years',
            value: yearValue,
            onChange: (v) => setParam('year', v),
            options: reviewYears.map((y) => ({
              value: String(y),
              label: String(y),
            })),
          },
          {
            key: 'quarter',
            label: 'Quarter',
            allLabel: 'All Quarters',
            value: quarterValue,
            onChange: (v) => setParam('quarter', v),
            options: [
              { value: '1', label: 'Q1' },
              { value: '2', label: 'Q2' },
              { value: '3', label: 'Q3' },
              { value: '4', label: 'Q4' },
            ],
          },
        ]}
      />

      {/* Grid */}
      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={rawRows}
          pagination={false}
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
