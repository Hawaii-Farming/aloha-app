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

interface HousingSite {
  id: string;
  name: string;
  maxBeds: number | null;
  tenantCount: number;
  availableBeds: number;
  notes: string | null;
  isActive: boolean;
  parentId: string | null;
  parentName: string | null;
}

interface Accommodation {
  site: HousingSite;
  rooms: HousingSite[];
  bedroomCount: number;
  bathroomCount: number;
}

interface AccommodationRow {
  id: string;
  name: string;
  beds: number;
  baths: number;
  tenantCount: number;
  capacity: number;
  isActive: boolean;
}

function parseHousingSite(row: RowData): HousingSite {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    maxBeds: row.max_beds != null ? Number(row.max_beds) : null,
    tenantCount: Number(row.tenant_count ?? 0),
    availableBeds: Number(row.available_beds ?? 0),
    notes: row.notes ? String(row.notes) : null,
    isActive: row.is_active !== false,
    parentId: row.site_id_parent ? String(row.site_id_parent) : null,
    parentName: row.parent_name ? String(row.parent_name) : null,
  };
}

function buildAccommodations(sites: HousingSite[]): Accommodation[] {
  const parents = sites.filter((s) => !s.parentId);
  const childMap = new Map<string, HousingSite[]>();
  for (const site of sites) {
    if (site.parentId) {
      const arr = childMap.get(site.parentId) ?? [];
      arr.push(site);
      childMap.set(site.parentId, arr);
    }
  }

  return parents.map((parent) => {
    const rooms = childMap.get(parent.id) ?? [];
    const bedroomCount = rooms.filter((r) =>
      r.name.toLowerCase().includes('bedroom'),
    ).length;
    const bathroomCount = rooms.filter((r) =>
      r.name.toLowerCase().includes('bathroom'),
    ).length;
    return { site: parent, rooms, bedroomCount, bathroomCount };
  });
}

function HomeIconRenderer(_props: CustomCellRendererProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Home className="h-4 w-4 shrink-0" />
      </div>
    </div>
  );
}

function OccupancyCellRenderer(props: CustomCellRendererProps) {
  const data = props.data as AccommodationRow | undefined;
  if (!data) return null;
  const tenants = data.tenantCount;
  const capacity = data.capacity;
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
          className="bg-foreground/70 h-full rounded-full transition-[width]"
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
    field: 'beds',
    headerName: 'Beds',
    type: 'numericColumn',
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'baths',
    headerName: 'Baths',
    type: 'numericColumn',
    flex: 1,
    minWidth: 100,
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
  const accommodations = useMemo(
    () => buildAccommodations(rawData.map(parseHousingSite)),
    [rawData],
  );

  const rowData = useMemo<AccommodationRow[]>(
    () =>
      accommodations.map((accom) => ({
        id: accom.site.id,
        name: accom.site.name,
        beds: accom.bedroomCount,
        baths: accom.bathroomCount,
        tenantCount: accom.site.tenantCount,
        capacity: accom.site.maxBeds ?? accom.bedroomCount,
        isActive: accom.site.isActive,
      })),
    [accommodations],
  );

  const handleRowClicked = useCallback(
    (event: RowClickedEvent) => {
      const row = event.data as AccommodationRow | undefined;
      if (!account || !row?.id) return;
      navigate(`/home/${account}/human_resources/housing/${row.id}`);
    },
    [navigate, account],
  );

  const handleGridReady = useCallback((event: GridReadyEvent) => {
    setTimeout(() => event.api.sizeColumnsToFit(), 20);
  }, []);

  const getRowStyle = useCallback((params: RowClassParams) => {
    const row = params.data as AccommodationRow | undefined;
    if (row?.isActive === false) {
      return { opacity: '0.6' };
    }
    return undefined;
  }, []);

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
