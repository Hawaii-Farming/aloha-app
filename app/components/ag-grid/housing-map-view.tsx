import { useCallback, useMemo, useRef } from 'react';

import { useNavigate, useParams } from 'react-router';

import type {
  ColDef,
  GridReadyEvent,
  RowClassParams,
  RowClickedEvent,
} from 'ag-grid-community';
import type { AgGridReact, CustomCellRendererProps } from 'ag-grid-react';
import { Home } from 'lucide-react';

import {
  useActiveTableSearch,
  useRegisterActiveTable,
} from '~/components/active-table-search-context';
import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

interface HousingRow {
  id: string;
  name: string;
  maximumBeds: number;
  tenantCount: number;
  availableBeds: number;
  isActive: boolean;
  isTotal?: boolean;
}

function parseHousingRow(row: RowData): HousingRow {
  const id = String(row.id ?? '');
  return {
    id,
    name: id,
    maximumBeds: Number(row.maximum_beds ?? 0),
    tenantCount: Number(row.tenant_count ?? 0),
    availableBeds: Number(row.available_beds ?? 0),
    isActive: row.is_deleted === false || row.is_deleted == null,
  };
}

function HomeIconRenderer(props: CustomCellRendererProps) {
  const data = props.data as HousingRow | undefined;
  if (data?.isTotal) return null;
  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Home className="h-4 w-4 shrink-0" />
      </div>
    </div>
  );
}

function OccupancyCellRenderer(props: CustomCellRendererProps) {
  const data = props.data as HousingRow | undefined;
  if (!data) return null;
  const tenants = data.tenantCount;
  const capacity = data.maximumBeds;
  const ratio = capacity > 0 ? Math.min(tenants / capacity, 1) : 0;
  const pct = Math.round(ratio * 100);

  return (
    <div className="flex h-full items-center justify-end gap-3">
      <div
        className="bg-muted h-1.5 w-32 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={tenants}
        aria-valuemax={capacity}
      >
        <div
          className={`h-full rounded-full transition-[width] ${
            data.isTotal ? 'bg-foreground' : 'bg-foreground/70'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-foreground w-16 shrink-0 text-right tabular-nums">
        {tenants} / {capacity}
      </span>
    </div>
  );
}

const colDefs: ColDef[] = [
  {
    colId: 'home_icon',
    headerName: '',
    cellRenderer: HomeIconRenderer,
    maxWidth: 60,
    minWidth: 60,
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
  },
  {
    field: 'name',
    headerName: 'Name',
    flex: 1,
    minWidth: 180,
  },
  {
    field: 'maximumBeds',
    headerName: 'Max Beds',
    type: 'numericColumn',
    flex: 1,
    minWidth: 110,
  },
  {
    field: 'availableBeds',
    headerName: 'Available Beds',
    type: 'numericColumn',
    flex: 1,
    minWidth: 130,
  },
  {
    field: 'tenantCount',
    headerName: 'Occupancy',
    cellRenderer: OccupancyCellRenderer,
    flex: 1,
    minWidth: 200,
  },
];

export default function HousingMapView(props: ListViewProps) {
  const { tableData } = props;

  const navigate = useNavigate();
  const { account } = useParams();
  const { query } = useActiveTableSearch();
  useRegisterActiveTable('housing', props.subModuleDisplayName ?? 'Housing');

  const gridRef = useRef<AgGridReact>(null);

  const rawData = tableData.data as RowData[];

  const rowData = useMemo<HousingRow[]>(() => {
    const rows: HousingRow[] = rawData.map(parseHousingRow);

    if (rows.length === 0) return rows;

    const sum = (k: 'maximumBeds' | 'tenantCount' | 'availableBeds') =>
      rows.reduce((s, r) => s + (r[k] ?? 0), 0);

    rows.push({
      id: '__total__',
      name: 'TOTAL',
      maximumBeds: sum('maximumBeds'),
      tenantCount: sum('tenantCount'),
      availableBeds: sum('availableBeds'),
      isActive: true,
      isTotal: true,
    });

    return rows;
  }, [rawData]);

  const handleRowClicked = useCallback(
    (event: RowClickedEvent) => {
      const row = event.data as HousingRow | undefined;
      if (!account || !row?.id || row.isTotal) return;
      navigate(
        `/home/${account}/${encodeURIComponent('Human Resources')}/${encodeURIComponent('Housing')}/${encodeURIComponent(row.id)}`,
      );
    },
    [navigate, account],
  );

  const handleGridReady = useCallback((event: GridReadyEvent) => {
    setTimeout(() => event.api.sizeColumnsToFit(), 20);
  }, []);

  const getRowStyle = useCallback(
    (params: RowClassParams): Record<string, string> | undefined => {
      const row = params.data as HousingRow | undefined;
      if (row?.isTotal) {
        return {
          fontWeight: 'bold',
          background: 'var(--color-muted)',
          cursor: 'default',
        };
      }
      if (row?.isActive === false) {
        return { opacity: '0.6' };
      }
      return undefined;
    },
    [],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-test="housing-list-view">
      <div className="flex min-h-0 flex-1 flex-col">
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={rowData as unknown as Record<string, unknown>[]}
          quickFilterText={query}
          pagination={false}
          getRowStyle={getRowStyle}
          onRowClicked={handleRowClicked}
          onGridReady={handleGridReady}
        />
      </div>
    </div>
  );
}
