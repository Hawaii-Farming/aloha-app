import { useMemo } from 'react';

import { useNavigate, useParams } from 'react-router';

import { ChevronRight, Home } from 'lucide-react';

import { Card } from '@aloha/ui/card';
import { cn } from '@aloha/ui/utils';

import {
  useActiveTableSearch,
  useRegisterActiveTable,
} from '~/components/active-table-search-context';
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

function SummaryBar({ accommodations }: { accommodations: Accommodation[] }) {
  const totalBedrooms = accommodations.reduce(
    (sum, a) => sum + a.bedroomCount,
    0,
  );
  const totalTenants = accommodations.reduce(
    (sum, a) => sum + a.site.tenantCount,
    0,
  );
  const occupied = accommodations.filter((a) => a.site.tenantCount > 0).length;

  const items = [
    { label: 'Accommodations', value: accommodations.length },
    { label: 'Total Bedrooms', value: totalBedrooms },
    { label: 'Total Tenants', value: totalTenants },
    { label: 'Occupied', value: occupied },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <div className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            {item.label}
          </div>
          <div className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
            {item.value}
          </div>
        </Card>
      ))}
    </div>
  );
}

const ROW_COLS =
  'grid grid-cols-[40px_minmax(0,1fr)_120px_120px_240px_20px] items-center gap-6 px-5 py-3 text-sm';

function HousingListHeader() {
  return (
    <div
      className={cn(
        ROW_COLS,
        'text-muted-foreground border-border border-b font-medium tracking-wide uppercase',
      )}
    >
      <span />
      <span>Name</span>
      <span className="text-center">Beds</span>
      <span className="text-center">Baths</span>
      <span className="text-right">Occupancy</span>
      <span />
    </div>
  );
}

function OccupancyBar({
  tenants,
  capacity,
}: {
  tenants: number;
  capacity: number;
}) {
  const ratio = capacity > 0 ? Math.min(tenants / capacity, 1) : 0;
  const pct = Math.round(ratio * 100);

  return (
    <div className="flex items-center justify-end gap-3">
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

function HousingListRow({ accom }: { accom: Accommodation }) {
  const { account } = useParams();
  const navigate = useNavigate();
  const { site, bedroomCount, bathroomCount } = accom;
  const capacity = site.maxBeds ?? bedroomCount;

  const openDetail = () => {
    if (!account) return;
    navigate(`/home/${account}/human_resources/housing/${site.id}`);
  };

  return (
    <button
      type="button"
      onClick={openDetail}
      data-test={`housing-list-row-${site.id}`}
      className={cn(
        ROW_COLS,
        'hover:bg-muted/50 group border-border w-full border-b text-left transition-colors last:border-b-0',
        !site.isActive && 'opacity-60',
      )}
    >
      <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full">
        <Home className="h-4 w-4" />
      </div>
      <span className="text-foreground truncate font-medium">{site.name}</span>
      <span className="text-foreground text-center tabular-nums">
        {bedroomCount}
      </span>
      <span className="text-foreground text-center tabular-nums">
        {bathroomCount}
      </span>
      <OccupancyBar tenants={site.tenantCount} capacity={capacity} />
      <ChevronRight className="text-muted-foreground group-hover:text-foreground h-4 w-4 transition-colors" />
    </button>
  );
}

export default function HousingMapView(props: ListViewProps) {
  const { tableData } = props;

  const { query } = useActiveTableSearch();
  useRegisterActiveTable('housing', props.subModuleDisplayName ?? 'Housing');

  const allSites = (tableData.data as RowData[]).map(parseHousingSite);
  const accommodations = useMemo(
    () => buildAccommodations(allSites),
    [allSites],
  );

  const filteredAccommodations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accommodations;
    return accommodations.filter((accom) => {
      if (accom.site.name.toLowerCase().includes(q)) return true;
      return accom.rooms.some((room) => room.name.toLowerCase().includes(q));
    });
  }, [accommodations, query]);

  return (
    <div
      className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4"
      data-test="housing-list-view"
    >
      <SummaryBar accommodations={filteredAccommodations} />

      {filteredAccommodations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Home className="text-muted-foreground h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No accommodations found</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Housing sites will appear here once added
            </p>
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <HousingListHeader />
          <div className="flex flex-col">
            {filteredAccommodations.map((accom) => (
              <HousingListRow key={accom.site.id} accom={accom} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
