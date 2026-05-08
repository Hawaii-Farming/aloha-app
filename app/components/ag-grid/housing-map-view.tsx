import { useCallback, useMemo, useRef, useState } from 'react';

import { useParams } from 'react-router';

import type {
  ColDef,
  RowClassParams,
  RowClickedEvent,
} from 'ag-grid-community';
import type { AgGridReact, CustomCellRendererProps } from 'ag-grid-react';
import { Home } from 'lucide-react';

import { useIsMobile } from '@aloha/ui/hooks/use-mobile';

import {
  useActiveTableSearch,
  useRegisterActiveTable,
} from '~/components/active-table-search-context';
import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import HousingSitePanel, {
  type HousingSitePanelSite,
} from '~/components/ag-grid/housing-site-panel';
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

function VacancyCellRenderer(props: CustomCellRendererProps) {
  const data = props.data as HousingRow | undefined;
  if (!data) return null;
  const vacant = data.availableBeds;
  const capacity = data.maximumBeds;
  const ratio = capacity > 0 ? Math.min(vacant / capacity, 1) : 0;
  const pct = Math.round(ratio * 100);

  return (
    <div className="flex h-full items-center justify-end gap-3">
      <div
        className="bg-muted hidden h-1.5 w-32 overflow-hidden rounded-full md:block"
        role="progressbar"
        aria-valuenow={vacant}
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
        {vacant} / {capacity}
      </span>
    </div>
  );
}

// Keeps TOTAL row last regardless of sort direction.
function pinTotalLast<T>(
  cmp: (a: T, b: T) => number,
): (
  valueA: T,
  valueB: T,
  nodeA: { data?: HousingRow },
  nodeB: { data?: HousingRow },
  isDescending: boolean,
) => number {
  return (valueA, valueB, nodeA, nodeB, isDescending) => {
    const aTotal = nodeA.data?.isTotal === true;
    const bTotal = nodeB.data?.isTotal === true;
    if (aTotal && !bTotal) return isDescending ? -1 : 1;
    if (!aTotal && bTotal) return isDescending ? 1 : -1;
    return cmp(valueA, valueB);
  };
}

const stringCmp = pinTotalLast<string>((a, b) =>
  String(a ?? '').localeCompare(String(b ?? '')),
);
const numberCmp = pinTotalLast<number>((a, b) => (a ?? 0) - (b ?? 0));

const TABLE_WIDTH = 620;

function buildColDefs(isMobile: boolean): ColDef[] {
  return [
    {
      colId: 'home_icon',
      headerName: '',
      cellRenderer: HomeIconRenderer,
      width: 50,
      minWidth: 50,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
    },
    {
      field: 'name',
      headerName: 'Name',
      width: isMobile ? 100 : 170,
      comparator: stringCmp,
    },
    {
      field: 'maximumBeds',
      headerName: isMobile ? 'Max' : 'Max Beds',
      type: 'numericColumn',
      width: isMobile ? 60 : 100,
      comparator: numberCmp,
    },
    {
      field: 'tenantCount',
      headerName: isMobile ? 'Used' : 'Tenants',
      type: 'numericColumn',
      width: isMobile ? 60 : 100,
      comparator: numberCmp,
    },
    {
      field: 'availableBeds',
      headerName: 'Vacancy',
      cellRenderer: VacancyCellRenderer,
      ...(isMobile ? { flex: 1, minWidth: 100 } : { width: 200 }),
      comparator: numberCmp,
    },
  ];
}

export default function HousingMapView(props: ListViewProps) {
  const { tableData, accountSlug } = props;

  const { account } = useParams();
  const { query } = useActiveTableSearch();
  useRegisterActiveTable('housing', props.subModuleDisplayName ?? 'Housing');

  const isMobile = useIsMobile();
  const gridRef = useRef<AgGridReact>(null);
  const [panelSiteId, setPanelSiteId] = useState<string | null>(null);

  // Stretch the Vacancy column to fill the table on mobile (full-width grid).
  // On desktop, columns stay at declared widths so the header ends cleanly
  // at the edge of the 620px table.
  const colDefs = useMemo(() => buildColDefs(isMobile), [isMobile]);

  const rawData = tableData.data as RowData[];

  const rowData = useMemo<HousingRow[]>(() => {
    const rows = rawData.map(parseHousingRow);
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

  // Derive panel site live from rowData so tenant_count / available_beds
  // refresh after revalidation (assign/unassign mutations) without forcing
  // the user to re-click the row.
  const panelSite = useMemo<HousingSitePanelSite | null>(() => {
    if (!panelSiteId) return null;
    const row = rowData.find((r) => r.id === panelSiteId && !r.isTotal);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      maximumBeds: row.maximumBeds,
      availableBeds: row.availableBeds,
    };
  }, [panelSiteId, rowData]);

  const handleRowClicked = useCallback((event: RowClickedEvent) => {
    const row = event.data as HousingRow | undefined;
    if (!row?.id || row.isTotal) return;
    setPanelSiteId((prev) => (prev === row.id ? null : row.id));
  }, []);

  const detailActionUrl =
    account && panelSite
      ? `/home/${account}/${encodeURIComponent('Human Resources')}/${encodeURIComponent('Housing')}/${encodeURIComponent(panelSite.id)}`
      : null;

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

  // Mobile (< md): single-pane drill-down — table OR panel, never both.
  //   panel closed: table is full width, panel hidden (no empty placeholder)
  //   panel open:   panel is full width, table hidden
  // md+: side-by-side — table fixed at TABLE_WIDTH, panel/empty-state fills rest.
  const tableClassName = panelSite
    ? 'hidden md:flex min-h-0 md:shrink-0 flex-col overflow-hidden'
    : 'flex flex-1 min-h-0 flex-col overflow-hidden md:flex-none md:shrink-0';
  const tableStyle =
    !isMobile || panelSite ? { width: TABLE_WIDTH } : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-row" data-test="housing-list-view">
      <div className={tableClassName} style={tableStyle}>
        <AgGridWrapper
          gridRef={gridRef}
          colDefs={colDefs}
          rowData={rowData as unknown as Record<string, unknown>[]}
          quickFilterText={query}
          pagination={false}
          autoSizeColumns={false}
          getRowStyle={getRowStyle}
          onRowClicked={handleRowClicked}
        />
      </div>
      <HousingSitePanel
        key={panelSite?.id ?? 'empty'}
        site={panelSite}
        accountSlug={accountSlug}
        detailActionUrl={detailActionUrl}
        onClose={() => setPanelSiteId(null)}
        isMobile={isMobile}
      />
    </div>
  );
}
