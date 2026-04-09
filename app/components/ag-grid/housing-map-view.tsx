import { useMemo, useState } from 'react';

import { useParams } from 'react-router';

import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  ChefHat,
  Home,
  Lamp,
  Search,
  Sofa,
  TreePalm,
  UserRound,
  Users,
  Warehouse,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@aloha/ui/avatar';
import { Badge } from '@aloha/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@aloha/ui/card';
import { Input } from '@aloha/ui/input';
import { cn } from '@aloha/ui/utils';

import type { ListViewProps } from '~/lib/crud/types';

type RowData = Record<string, unknown>;

interface TenantData {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  department_name: string;
  start_date: string | null;
  work_authorization_name: string;
}

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

function getRoomLabel(name: string, parentName: string): string {
  let label = name;
  if (parentName && name.startsWith(parentName)) {
    label = name.slice(parentName.length).replace(/^\s*-\s*/, '');
  }
  return label || name;
}

function getOccupancyColor(tenants: number, capacity: number) {
  if (capacity === 0) return { bar: '#a1a1aa', text: 'text-muted-foreground' };
  const ratio = tenants / capacity;
  if (ratio >= 1)
    return { bar: '#ef4444', text: 'text-red-600 dark:text-red-400' };
  if (ratio >= 0.8)
    return { bar: '#f59e0b', text: 'text-amber-600 dark:text-amber-400' };
  return { bar: '#10b981', text: 'text-emerald-600 dark:text-emerald-400' };
}

function RoomIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  const className = 'h-2.5 w-2.5 shrink-0';
  if (lower.includes('bedroom')) return <BedDouble className={className} />;
  if (lower.includes('bathroom')) return <Bath className={className} />;
  if (lower.includes('kitchen')) return <ChefHat className={className} />;
  if (lower.includes('living')) return <Sofa className={className} />;
  if (lower.includes('garage')) return <Warehouse className={className} />;
  if (lower.includes('exterior')) return <TreePalm className={className} />;
  return <Lamp className={className} />;
}

function RoomChip({
  room,
  parentName,
}: {
  room: HousingSite;
  parentName: string;
}) {
  const label = getRoomLabel(room.name, parentName);
  const isBedroom = label.toLowerCase().includes('bedroom');

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]',
        isBedroom
          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
          : 'text-muted-foreground',
      )}
    >
      <RoomIcon name={label} />
      <span className="truncate">{label}</span>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

function formatDate(d: string | null): string {
  if (!d) return '';
  try {
    return format(parseISO(d), 'MMM yyyy');
  } catch {
    return d;
  }
}

const CARD_HEIGHT = 'h-[240px]';

function AccommodationCard({ accom }: { accom: Accommodation }) {
  const { account } = useParams();
  const [face, setFace] = useState<'rooms' | 'tenants'>('rooms');
  const { site, rooms, bedroomCount, bathroomCount } = accom;

  const capacity = site.maxBeds ?? bedroomCount;
  const colors = getOccupancyColor(site.tenantCount, capacity);

  const { data: tenants = [], isLoading: loading } = useQuery({
    queryKey: ['housing-tenants', site.id, account],
    queryFn: () => fetchTenants(site.id, account!),
    enabled: !!site.id && !!account && site.tenantCount > 0,
  });

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort((a, b) => {
        const order = [
          'bedroom',
          'bathroom',
          'living',
          'kitchen',
          'garage',
          'exterior',
        ];
        const aIdx = order.findIndex((k) => a.name.toLowerCase().includes(k));
        const bIdx = order.findIndex((k) => b.name.toLowerCase().includes(k));
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
      }),
    [rooms],
  );

  if (face === 'tenants') {
    return (
      <Card
        className={cn(
          CARD_HEIGHT,
          'flex flex-col',
          !site.isActive && 'opacity-60',
        )}
        data-test={`housing-card-${site.id}`}
      >
        <CardHeader className="shrink-0 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFace('rooms')}
              className="text-muted-foreground hover:text-foreground -ml-1 rounded-md p-1 transition-colors"
              aria-label="Back to rooms"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <CardTitle className="text-sm">{site.name}</CardTitle>
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {site.tenantCount} tenant{site.tenantCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pt-0">
          {loading ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              Loading tenants...
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-xs">
              <UserRound className="h-3.5 w-3.5" />
              No tenants assigned
            </div>
          ) : (
            <div className="space-y-0.5">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2.5 rounded-md px-1 py-1.5"
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    {t.profile_photo_url && (
                      <AvatarImage src={t.profile_photo_url} />
                    )}
                    <AvatarFallback className="bg-muted text-muted-foreground text-[9px]">
                      {initials(t.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm leading-tight">
                      {t.full_name}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      {t.department_name && <span>{t.department_name}</span>}
                      {t.department_name && t.start_date && (
                        <span className="text-border">&middot;</span>
                      )}
                      {t.start_date && <span>{formatDate(t.start_date)}</span>}
                      {t.work_authorization_name && (
                        <>
                          <span className="text-border">&middot;</span>
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[10px]"
                          >
                            {t.work_authorization_name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        CARD_HEIGHT,
        'flex flex-col',
        !site.isActive && 'opacity-60',
      )}
      data-test={`housing-card-${site.id}`}
    >
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Home className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                {site.name}
              </CardTitle>
              {site.notes && (
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                  {site.notes}
                </p>
              )}
            </div>
          </div>
          {site.tenantCount > 0 && capacity > 0 && (
            <Badge
              variant={site.tenantCount >= capacity ? 'destructive' : 'success'}
              className="text-[10px]"
            >
              {site.tenantCount >= capacity
                ? 'Full'
                : `${capacity - site.tenantCount} avail`}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
        <div className="flex shrink-0 items-center gap-3 pb-2">
          {bedroomCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <BedDouble className="text-muted-foreground h-3.5 w-3.5" />
              <span className="font-medium">{bedroomCount}</span>
              <span className="text-muted-foreground">bed</span>
            </div>
          )}
          {bathroomCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Bath className="text-muted-foreground h-3.5 w-3.5" />
              <span className="font-medium">{bathroomCount}</span>
              <span className="text-muted-foreground">bath</span>
            </div>
          )}
          {site.tenantCount > 0 && (
            <button
              type="button"
              onClick={() => setFace('tenants')}
              className="flex items-center gap-1 text-xs hover:underline"
            >
              <Users className="h-3.5 w-3.5" style={{ color: colors.bar }} />
              <span className="font-medium" style={{ color: colors.bar }}>
                {site.tenantCount}
              </span>
              <span className="text-muted-foreground">
                tenant{site.tenantCount !== 1 ? 's' : ''}
              </span>
            </button>
          )}
        </div>

        {sortedRooms.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-wrap content-start gap-1.5 overflow-y-auto pb-2">
            {sortedRooms.map((room) => (
              <RoomChip key={room.id} room={room} parentName={site.name} />
            ))}
          </div>
        )}

        <div
          className={cn(
            'border-border -mx-6 mt-auto flex w-[calc(100%+3rem)] shrink-0 items-center gap-1 border-t px-6 pt-2',
            tenants.length > 0 && 'cursor-pointer',
          )}
          role={tenants.length > 0 ? 'button' : undefined}
          tabIndex={tenants.length > 0 ? 0 : undefined}
          onClick={tenants.length > 0 ? () => setFace('tenants') : undefined}
        >
          {tenants.length > 0 ? (
            <>
              <div className="flex items-center -space-x-2">
                {tenants.slice(0, 5).map((t) => (
                  <Avatar
                    key={t.id}
                    className="ring-card h-6 w-6 ring-2"
                    title={t.full_name}
                  >
                    {t.profile_photo_url && (
                      <AvatarImage src={t.profile_photo_url} />
                    )}
                    <AvatarFallback className="bg-muted text-muted-foreground text-[9px]">
                      {initials(t.full_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {tenants.length > 5 && (
                  <div className="ring-card bg-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-medium ring-2">
                    +{tenants.length - 5}
                  </div>
                )}
              </div>
              <span className="text-muted-foreground ml-1 text-[10px] hover:underline">
                View all
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="bg-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-medium">
                0
              </div>
              <span className="text-muted-foreground text-[10px]">tenants</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

async function fetchTenants(
  siteId: string,
  orgId: string,
): Promise<TenantData[]> {
  const params = new URLSearchParams({ siteId, orgId });
  const res = await fetch(`/api/housing-tenants?${params}`);
  if (!res.ok) throw new Error('Failed to load tenants');
  const json = (await res.json()) as { data?: TenantData[] };
  return json.data ?? [];
}

function SummaryBar({ accommodations }: { accommodations: Accommodation[] }) {
  const totalAccom = accommodations.length;
  const totalBedrooms = accommodations.reduce((s, a) => s + a.bedroomCount, 0);
  const totalTenants = accommodations.reduce(
    (s, a) => s + a.site.tenantCount,
    0,
  );
  const occupiedAccom = accommodations.filter(
    (a) => a.site.tenantCount > 0,
  ).length;

  const stats = [
    { label: 'Accommodations', value: totalAccom, icon: Home },
    { label: 'Total Bedrooms', value: totalBedrooms, icon: BedDouble },
    { label: 'Total Tenants', value: totalTenants, icon: Users },
    { label: 'Occupied', value: occupiedAccom, icon: Home },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card flex items-center gap-3 rounded-lg border px-4 py-3"
        >
          <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-lg">
            <stat.icon className="text-muted-foreground h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-xl leading-none font-semibold">
              {stat.value}
            </div>
            <div className="text-muted-foreground mt-0.5 text-xs">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HousingMapView(props: ListViewProps) {
  const { tableData } = props;
  const [search, setSearch] = useState('');

  const allSites = (tableData.data as RowData[]).map(parseHousingSite);
  const accommodations = useMemo(
    () => buildAccommodations(allSites),
    [allSites],
  );

  const filtered = search
    ? accommodations.filter((a) =>
        a.site.name.toLowerCase().includes(search.toLowerCase()),
      )
    : accommodations;

  return (
    <div
      className="flex flex-1 flex-col gap-5 overflow-y-auto"
      data-test="housing-map-view"
    >
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accommodations..."
            className="pl-9"
            data-test="housing-search"
          />
        </div>
        <div className="text-muted-foreground text-sm">
          {filtered.length} accommodation
          {filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      <SummaryBar accommodations={accommodations} />

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Home className="text-muted-foreground h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No accommodations found</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {search
                ? 'Try a different search term'
                : 'Housing sites will appear here once added'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((accom) => (
            <AccommodationCard key={accom.site.id} accom={accom} />
          ))}
        </div>
      )}
    </div>
  );
}
