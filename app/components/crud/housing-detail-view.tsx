import { useCallback, useState } from 'react';

import { useFetcher, useNavigate } from 'react-router';

import { useQuery } from '@tanstack/react-query';
import type { ColDef, RowClickedEvent } from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';
import { ArrowLeft, Home, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@aloha/ui/alert-dialog';
import { Button } from '@aloha/ui/button';
import { Card } from '@aloha/ui/card';
import { Separator } from '@aloha/ui/separator';
import { Trans } from '@aloha/ui/trans';

import {
  useActiveTableSearch,
  useRegisterActiveTable,
} from '~/components/active-table-search-context';
import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { EditPanel } from '~/components/crud/edit-panel';
import type { DetailViewProps } from '~/lib/crud/types';
import { AccessGate } from '~/lib/workspace/access-gate';

interface TenantRow {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  department_name: string;
  start_date: string | null;
  work_authorization_name: string;
}

async function fetchTenants(
  siteId: string,
  accountSlug: string,
): Promise<TenantRow[]> {
  const params = new URLSearchParams({ siteId, orgId: accountSlug });
  const res = await fetch(`/api/housing-tenants?${params.toString()}`);
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: TenantRow[] };
  return json.data ?? [];
}

function TenantInitialsRenderer(props: CustomCellRendererProps) {
  const data = props.data as TenantRow | undefined;
  if (!data) return null;
  const initials = data.full_name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
        {initials}
      </div>
    </div>
  );
}

const TENANT_COL_DEFS: ColDef[] = [
  {
    headerName: '',
    cellRenderer: TenantInitialsRenderer,
    maxWidth: 60,
    minWidth: 60,
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
  },
  { field: 'full_name', headerName: 'Name', flex: 1, minWidth: 200 },
  {
    field: 'department_name',
    headerName: 'Department',
    flex: 1,
    minWidth: 160,
    valueFormatter: (p) => (p.value ? String(p.value) : '—'),
  },
  {
    field: 'work_authorization_name',
    headerName: 'Work Auth',
    flex: 1,
    minWidth: 140,
    valueFormatter: (p) => (p.value ? String(p.value) : '—'),
  },
];

function TenantsGrid({
  tenants,
  accountSlug,
}: {
  tenants: TenantRow[];
  accountSlug: string;
}) {
  const navigate = useNavigate();
  const { query } = useActiveTableSearch();
  useRegisterActiveTable('housing-tenants', 'Tenants');

  const handleRowClicked = useCallback(
    (event: RowClickedEvent) => {
      const tenantId = (event.data as TenantRow | undefined)?.id;
      if (!tenantId || !accountSlug) return;
      navigate(`/home/${accountSlug}/human_resources/employees/${tenantId}`);
    },
    [navigate, accountSlug],
  );

  return (
    <AgGridWrapper
      colDefs={TENANT_COL_DEFS}
      rowData={tenants as unknown as Record<string, unknown>[]}
      quickFilterText={query}
      pagination={false}
      domLayout="autoHeight"
      onRowClicked={handleRowClicked}
    />
  );
}

export default function HousingDetailView({
  record,
  config,
  accountSlug,
  subModuleDisplayName,
  fkOptions,
  comboboxOptions,
}: DetailViewProps) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const siteId = String(record.id ?? '');
  const name = String(record.name ?? 'Housing');
  const maxBeds = record.max_beds != null ? Number(record.max_beds) : null;
  const tenantCount = Number(record.tenant_count ?? 0);
  const availableBeds = Number(record.available_beds ?? 0);
  const notes = record.notes ? String(record.notes) : null;

  const { data: tenants = [] } = useQuery({
    queryKey: ['housing-tenants', siteId, accountSlug],
    queryFn: () => fetchTenants(siteId, accountSlug),
    enabled: !!siteId && !!accountSlug,
  });

  const handleDelete = useCallback(() => {
    fetcher.submit(
      { intent: 'delete' },
      { method: 'POST', encType: 'application/json' },
    );
  }, [fetcher]);

  const isDeleting = fetcher.state !== 'idle';

  const stats: { label: string; value: string | number }[] = [
    { label: 'Max Beds', value: maxBeds ?? '—' },
    { label: 'Tenants', value: tenantCount },
    { label: 'Available Beds', value: availableBeds },
  ];

  return (
    <>
      <div
        className="flex min-h-0 flex-1 flex-col"
        data-test="housing-detail-page"
      >
        {/* Top bar */}
        <div className="border-border flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="bg-border h-5 w-px" />

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
                <Home className="text-primary h-4 w-4" />
              </div>
              <span className="text-foreground text-sm font-semibold">
                {name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AccessGate permission="can_edit">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
            </AccessGate>

            <AccessGate permission="can_delete">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <Trans i18nKey="common:confirmDelete" />
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <Trans i18nKey="common:confirmDeleteMessage" />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      <Trans i18nKey="common:cancel" />
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      <Trans i18nKey="common:delete" />
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </AccessGate>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 px-8 py-6">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <Card key={s.label} className="p-4">
                  <div className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                    {s.label}
                  </div>
                  <div className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                    {s.value}
                  </div>
                </Card>
              ))}
            </div>

            {/* Notes */}
            {notes && (
              <div>
                <h2 className="text-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
                  Notes
                </h2>
                <Separator className="mb-3" />
                <p className="text-foreground text-sm">{notes}</p>
              </div>
            )}

            {/* Tenants */}
            <div>
              <h2 className="text-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
                Tenants ({tenants.length})
              </h2>
              <Separator className="mb-3" />
              {tenants.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No tenants currently assigned.
                </p>
              ) : (
                <TenantsGrid tenants={tenants} accountSlug={accountSlug} />
              )}
            </div>
          </div>
        </div>
      </div>

      <EditPanel
        open={editOpen}
        onOpenChange={setEditOpen}
        config={config}
        record={record}
        fkOptions={fkOptions}
        comboboxOptions={comboboxOptions}
        subModuleDisplayName={subModuleDisplayName}
      />
    </>
  );
}
