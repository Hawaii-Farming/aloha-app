import { useCallback, useRef, useState } from 'react';

import { useLoaderData } from 'react-router';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridReadyEvent,
  SortChangedEvent,
  ValueFormatterParams,
} from 'ag-grid-community';
import type { AgGridReact, CustomCellRendererProps } from 'ag-grid-react';
import { Lock } from 'lucide-react';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { SchedulerEmployeeRenderer } from '~/components/ag-grid/cell-renderers/scheduler-employee-renderer';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { CsvExportButton } from '~/components/ag-grid/csv-export-button';
import { useDetailRow } from '~/components/ag-grid/detail-row-wrapper';
import { scoreColorCellClassRules } from '~/components/ag-grid/row-class-rules';
import { YearQuarterFilter } from '~/components/ag-grid/year-quarter-filter';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

function LockCellRenderer(props: CustomCellRendererProps) {
  if (props.value !== true) return null;
  return <Lock className="text-muted-foreground h-4 w-4" />;
}

function averageFormatter(params: ValueFormatterParams): string {
  return params.value != null ? Number(params.value).toFixed(1) : '';
}

const colDefs: ColDef[] = [
  {
    headerName: 'Employee',
    field: 'full_name',
    cellRenderer: SchedulerEmployeeRenderer,
    sortable: true,
    filter: 'agTextColumnFilter',
    minWidth: 200,
  },
  {
    headerName: 'Dept',
    field: 'department_name',
    sortable: true,
    filter: 'agTextColumnFilter',
    minWidth: 100,
  },
  {
    headerName: 'Quarter',
    field: 'quarter_label',
    sortable: true,
    filter: 'agTextColumnFilter',
    minWidth: 90,
  },
  {
    headerName: 'Prod',
    field: 'productivity',
    sortable: true,
    minWidth: 70,
    maxWidth: 90,
    cellClassRules: scoreColorCellClassRules(),
  },
  {
    headerName: 'Attend',
    field: 'attendance',
    sortable: true,
    minWidth: 70,
    maxWidth: 90,
    cellClassRules: scoreColorCellClassRules(),
  },
  {
    headerName: 'Quality',
    field: 'quality',
    sortable: true,
    minWidth: 70,
    maxWidth: 90,
    cellClassRules: scoreColorCellClassRules(),
  },
  {
    headerName: 'Engage',
    field: 'engagement',
    sortable: true,
    minWidth: 70,
    maxWidth: 90,
    cellClassRules: scoreColorCellClassRules(),
  },
  {
    headerName: 'Avg',
    field: 'average',
    sortable: true,
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
    field: 'lead_name',
    sortable: true,
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

// Lazy-loaded detail component cached at module scope
const LazyDetailRow = function EmployeeReviewDetailWrapper({
  data,
}: {
  data: RowData;
}) {
  // Dynamic import resolved via useDetailRow's fullWidthCellRenderer
  return <EmployeeReviewDetailInline data={data} />;
};

function EmployeeReviewDetailInline({ data }: { data: RowData }) {
  const scoreDisplay = (value: unknown) => {
    const num = Number(value);
    if (num === 1)
      return { text: '1 - Below', className: 'text-red-600 dark:text-red-400' };
    if (num === 2)
      return {
        text: '2 - Meets',
        className: 'text-amber-600 dark:text-amber-400',
      };
    if (num === 3)
      return {
        text: '3 - Exceeds',
        className: 'text-green-600 dark:text-green-400',
      };
    return { text: String(value ?? ''), className: '' };
  };

  const avg = data.average != null ? Number(data.average).toFixed(1) : '';

  return (
    <div className="px-6 py-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm font-semibold">
          {String(data.full_name ?? '')}
        </span>
        <span className="text-muted-foreground text-xs">
          {String(data.department_name ?? '')}
        </span>
        <span className="text-muted-foreground text-xs">
          {String(data.quarter_label ?? '')}
        </span>
        {data.is_locked === true && (
          <Lock className="text-muted-foreground h-3.5 w-3.5" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(['productivity', 'attendance', 'quality', 'engagement'] as const).map(
          (key) => {
            const score = scoreDisplay(data[key]);
            return (
              <div key={key} className="rounded-lg border px-3 py-2">
                <div className="text-muted-foreground text-[10px] capitalize">
                  {key}
                </div>
                <div className={`text-sm font-semibold ${score.className}`}>
                  {score.text}
                </div>
              </div>
            );
          },
        )}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div>
          <span className="text-muted-foreground text-xs">Average: </span>
          <span className="text-sm font-semibold">{avg}</span>
        </div>
        {data.lead_name ? (
          <div>
            <span className="text-muted-foreground text-xs">Lead: </span>
            <span className="text-sm">{String(data.lead_name)}</span>
          </div>
        ) : null}
      </div>
      {data.notes ? (
        <div className="text-muted-foreground mt-2 text-xs">
          {String(data.notes)}
        </div>
      ) : null}
    </div>
  );
}

export default function EmployeeReviewListView(props: ListViewProps) {
  const { tableData } = props;

  const loaderData = useLoaderData() as RowData;
  const reviewYears = (loaderData.reviewYears ?? []) as number[];

  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawRows = tableData.data as RowData[];

  const {
    rowData: detailRowData,
    isFullWidthRow,
    fullWidthCellRenderer,
    handleRowClicked: handleDetailRowClicked,
    getRowId,
  } = useDetailRow({
    sourceData: rawRows,
    pkColumn: 'id',
    detailComponent: LazyDetailRow,
    gridRef,
  });

  const getRowHeight = useCallback((params: { data?: RowData }) => {
    if (params.data?._isDetailRow) return 250;
    return 52;
  }, []);

  // Column state persistence
  const handleGridReady = useCallback((event: GridReadyEvent) => {
    setGridApi(event.api);
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

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-test="employee-review-list-view"
    >
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <YearQuarterFilter years={reviewYears} />
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
            placeholder="Search reviews..."
            className="border-input bg-background placeholder:text-muted-foreground h-8 w-[200px] rounded-md border px-3 text-sm"
            data-test="employee-review-search"
          />

          <CsvExportButton gridApi={gridApi} fileName="employee-reviews" />
        </div>
      </div>

      {/* Grid */}
      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={detailRowData as RowData[]}
          quickFilterText={searchValue}
          pagination={false}
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
