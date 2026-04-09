import { useCallback, useMemo, useRef, useState } from 'react';

import { useLoaderData, useSearchParams } from 'react-router';

import type {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  GridReadyEvent,
  RowClassParams,
  SortChangedEvent,
} from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import { DatePillRenderer } from '~/components/ag-grid/cell-renderers/date-pill-renderer';
import {
  restoreColumnState,
  saveColumnState,
} from '~/components/ag-grid/column-state';
import { CsvExportButton } from '~/components/ag-grid/csv-export-button';
import { PayPeriodFilter } from '~/components/ag-grid/pay-period-filter';
import {
  currencyFormatter,
  hoursFormatter,
} from '~/components/ag-grid/payroll-formatters';
import type { ListViewProps } from '~/lib/crud/types';

function ManagerFilter({ managers }: { managers: Record<string, unknown>[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentManager = searchParams.get('manager') ?? '';

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('manager');
    } else {
      next.set('manager', value);
    }
    setSearchParams(next, { preventScrollReset: true });
  };

  return (
    <Select value={currentManager || 'all'} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[220px]" data-test="manager-filter">
        <SelectValue placeholder="All managers" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Managers</SelectItem>
        {managers.map((m) => (
          <SelectItem
            key={String(m.compensation_manager_id)}
            value={String(m.compensation_manager_id)}
          >
            {String(m.compensation_manager_name ?? 'Unknown')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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

const colDefs: ColDef[] = [
  AVATAR_COL,
  {
    field: 'full_name',
    headerName: 'Employee',
    sortable: true,
    filter: true,
    minWidth: 180,
    pinned: 'left',
  },
  {
    field: 'department_name',
    headerName: 'Department',
    sortable: true,
    filter: true,
  },
  {
    field: 'check_date',
    headerName: 'Check Date',
    cellRenderer: DatePillRenderer,
    sortable: true,
  },
  {
    field: 'regular_hours',
    headerName: 'Reg Hours',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
  },
  {
    field: 'overtime_hours',
    headerName: 'OT Hours',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
  },
  {
    field: 'total_hours',
    headerName: 'Total Hours',
    type: 'numericColumn',
    valueFormatter: hoursFormatter,
  },
  {
    field: 'gross_wage',
    headerName: 'Gross Wage',
    type: 'numericColumn',
    valueFormatter: currencyFormatter,
  },
  {
    field: 'net_pay',
    headerName: 'Net Pay',
    type: 'numericColumn',
    valueFormatter: currencyFormatter,
  },
];

export default function PayrollCompManagerListView(props: ListViewProps) {
  const { tableData } = props;

  const loaderData = useLoaderData() as Record<string, unknown>;
  const payPeriods = (loaderData.payPeriods ?? []) as Record<string, unknown>[];
  const managers = (loaderData.managers ?? []) as Record<string, unknown>[];

  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalsRow = useMemo(() => {
    const rows = tableData.data as Record<string, unknown>[];
    if (!rows.length) return [];

    const sumField = (field: string) =>
      rows.reduce((sum, r) => sum + (Number(r[field]) || 0), 0);

    return [
      {
        full_name: 'TOTAL',
        regular_hours: sumField('regular_hours'),
        overtime_hours: sumField('overtime_hours'),
        total_hours: sumField('total_hours'),
        gross_wage: sumField('gross_wage'),
        net_pay: sumField('net_pay'),
      },
    ];
  }, [tableData.data]);

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
    restoreColumnState('payroll_comp_manager', event.api);
  }, []);

  const debouncedSaveState = useCallback((api: GridApi) => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = setTimeout(() => {
      saveColumnState('payroll_comp_manager', api);
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
      data-test="payroll-comp-manager-list-view"
    >
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <ManagerFilter managers={managers} />
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
            placeholder="Search payroll..."
            className="border-input bg-background placeholder:text-muted-foreground h-8 w-[200px] rounded-md border px-3 text-sm"
            data-test="payroll-comp-manager-search"
          />

          <CsvExportButton gridApi={gridApi} fileName="payroll-comp-manager" />
        </div>
      </div>

      {/* Grid */}
      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={tableData.data as Record<string, unknown>[]}
          pinnedBottomRowData={totalsRow}
          quickFilterText={searchValue}
          pagination={false}
          getRowStyle={getRowStyle}
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
