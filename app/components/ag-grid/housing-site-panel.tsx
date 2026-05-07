import { useCallback, useEffect, useRef, useState } from 'react';

import { useFetcher, useRevalidator } from 'react-router';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CellClickedEvent,
  ColDef,
  GridReadyEvent,
} from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';
import { ChevronsUpDown, Home, Plus, Trash2, X } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@aloha/ui/alert-dialog';
import { Button } from '@aloha/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@aloha/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@aloha/ui/popover';
import { toast } from '@aloha/ui/sonner';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AccessGate } from '~/lib/workspace/access-gate';

interface TenantRow {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  department_name: string;
  start_date: string | null;
  work_authorization_name: string;
}

interface EligibleEmployee {
  id: string;
  full_name: string;
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

async function fetchEligibleEmployees(
  accountSlug: string,
): Promise<EligibleEmployee[]> {
  const params = new URLSearchParams({
    available: 'true',
    orgId: accountSlug,
  });
  const res = await fetch(`/api/housing-tenants?${params.toString()}`);
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: EligibleEmployee[] };
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
      <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {initials}
      </div>
    </div>
  );
}

function buildTenantColDefs(
  onRemove: (tenantId: string, fullName: string) => void,
): ColDef[] {
  return [
    {
      headerName: '',
      cellRenderer: TenantInitialsRenderer,
      maxWidth: 56,
      minWidth: 56,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
    },
    { field: 'full_name', headerName: 'Name', flex: 1, minWidth: 160 },
    {
      field: 'department_name',
      headerName: 'Department',
      flex: 1,
      minWidth: 120,
      valueFormatter: (p) => (p.value ? String(p.value) : '—'),
    },
    {
      colId: 'remove',
      headerName: '',
      maxWidth: 48,
      minWidth: 48,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
      cellRenderer: (props: CustomCellRendererProps) => {
        const data = props.data as TenantRow | undefined;
        if (!data) return null;
        return (
          <button
            type="button"
            aria-label={`Remove ${data.full_name} from housing`}
            data-test={`housing-tenant-remove-${data.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(data.id, data.full_name);
            }}
            className="text-muted-foreground hover:text-destructive flex h-full w-full items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        );
      },
    },
  ];
}

function TenantsGrid({
  tenants,
  onRemove,
}: {
  tenants: TenantRow[];
  onRemove: (tenantId: string, fullName: string) => void;
}) {
  const handleCellClicked = useCallback((_event: CellClickedEvent) => {
    // No-op: panel context is read-only browse; remove column handles itself.
  }, []);

  const handleGridReady = useCallback((event: GridReadyEvent) => {
    setTimeout(() => event.api.sizeColumnsToFit(), 20);
  }, []);

  const colDefs = buildTenantColDefs(onRemove);

  return (
    <AgGridWrapper
      colDefs={colDefs}
      rowData={tenants as unknown as Record<string, unknown>[]}
      pagination={false}
      domLayout="autoHeight"
      onCellClicked={handleCellClicked}
      onGridReady={handleGridReady}
    />
  );
}

function EligiblePicker({
  accountSlug,
  selected,
  toggle,
  open,
}: {
  accountSlug: string;
  selected: Set<string>;
  toggle: (id: string) => void;
  open: boolean;
}) {
  const { data: eligible = [], isLoading } = useQuery({
    queryKey: ['housing-eligible-employees', accountSlug],
    queryFn: () => fetchEligibleEmployees(accountSlug),
    enabled: open && !!accountSlug,
  });

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {eligible
            .filter((e) => selected.has(e.id))
            .map((emp) => (
              <span
                key={emp.id}
                className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
              >
                {emp.full_name}
                <button
                  type="button"
                  aria-label={`Unselect ${emp.full_name}`}
                  onClick={() => toggle(emp.id)}
                  className="hover:text-primary/70 -mr-1 ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
        </div>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
            disabled={isLoading || eligible.length === 0}
          >
            <span className="text-muted-foreground">
              {eligible.length === 0
                ? 'All employees are already housed'
                : isLoading
                  ? 'Loading…'
                  : 'Add tenants…'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={true}>
            <CommandInput placeholder="Search employees…" />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              <CommandGroup>
                {eligible
                  .filter((emp) => !selected.has(emp.id))
                  .map((emp) => (
                    <CommandItem
                      key={emp.id}
                      value={emp.full_name}
                      onSelect={() => toggle(emp.id)}
                    >
                      {emp.full_name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export interface HousingSitePanelSite {
  id: string;
  name: string;
  maximumBeds: number;
  availableBeds: number;
}

interface HousingSitePanelProps {
  site: HousingSitePanelSite | null;
  accountSlug: string;
  detailActionUrl: string | null;
  onClose: () => void;
}

export default function HousingSitePanel({
  site,
  accountSlug,
  detailActionUrl,
  onClose,
}: HousingSitePanelProps) {
  const open = !!site;
  const assignFetcher = useFetcher();
  const removeFetcher = useFetcher();
  const revalidator = useRevalidator();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingRemove, setPendingRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const assignHandledRef = useRef(false);
  const removeHandledRef = useRef(false);

  const siteId = site?.id ?? '';
  const siteName = site?.name ?? '';
  const availableBeds = site?.availableBeds ?? 0;

  const { data: tenants = [] } = useQuery({
    queryKey: ['housing-tenants', siteId, accountSlug],
    queryFn: () => fetchTenants(siteId, accountSlug),
    enabled: open && !!siteId && !!accountSlug,
  });

  const refreshAfterMutation = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['housing-tenants', siteId, accountSlug],
    });
    queryClient.invalidateQueries({
      queryKey: ['housing-eligible-employees', accountSlug],
    });
    revalidator.revalidate();
  }, [queryClient, revalidator, siteId, accountSlug]);

  // Selection reset on close/site-switch is handled by the `key` prop on
  // the parent — remounting beats a setState-in-effect cascade.

  useEffect(() => {
    if (assignFetcher.state !== 'idle' || assignHandledRef.current) return;
    const data = assignFetcher.data as
      | { success: boolean; error?: string; count?: number }
      | undefined;
    if (data?.success) {
      assignHandledRef.current = true;
      toast.success(
        `Assigned ${data.count ?? 0} tenant${(data.count ?? 0) === 1 ? '' : 's'}`,
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot cleanup after fetcher transitions to idle; guarded by handledRef
      setSelected(new Set());
      refreshAfterMutation();
    } else if (data?.error) {
      assignHandledRef.current = true;
      toast.error(data.error);
    }
  }, [assignFetcher.state, assignFetcher.data, refreshAfterMutation]);

  useEffect(() => {
    if (removeFetcher.state !== 'idle' || removeHandledRef.current) return;
    const data = removeFetcher.data as
      | { success: boolean; error?: string }
      | undefined;
    if (data?.success) {
      removeHandledRef.current = true;
      refreshAfterMutation();
    } else if (data?.error) {
      removeHandledRef.current = true;
      toast.error(data.error);
    }
  }, [removeFetcher.state, removeFetcher.data, refreshAfterMutation]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAssign = useCallback(() => {
    if (!detailActionUrl || selected.size === 0) return;
    if (selected.size > availableBeds) {
      toast.error(
        `Only ${availableBeds} bed${availableBeds === 1 ? '' : 's'} available`,
      );
      return;
    }
    assignHandledRef.current = false;
    assignFetcher.submit(
      { intent: 'assign_tenant', tenantIds: Array.from(selected) },
      {
        method: 'POST',
        encType: 'application/json',
        action: detailActionUrl,
      },
    );
  }, [assignFetcher, selected, availableBeds, detailActionUrl]);

  const handleRemove = useCallback((tenantId: string, fullName: string) => {
    setPendingRemove({ id: tenantId, name: fullName });
  }, []);

  const confirmRemove = useCallback(() => {
    if (!detailActionUrl || !pendingRemove) return;
    removeHandledRef.current = false;
    removeFetcher.submit(
      { intent: 'unassign_tenant', tenantId: pendingRemove.id },
      {
        method: 'POST',
        encType: 'application/json',
        action: detailActionUrl,
      },
    );
    toast.success(`Removed ${pendingRemove.name}`);
    setPendingRemove(null);
  }, [removeFetcher, detailActionUrl, pendingRemove]);

  const isAssigning = assignFetcher.state !== 'idle';
  const tooMany = selected.size > availableBeds;

  if (!site) {
    return (
      <aside
        className="bg-card border-border flex h-full min-h-0 min-w-0 flex-1 flex-col border-l"
        data-test="housing-site-panel-empty"
      >
        <div className="border-border bg-muted h-[47px] shrink-0 border-b" />
        <div className="text-muted-foreground flex flex-1 items-center justify-center px-6 text-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <Home className="h-6 w-6" />
            <span>Select a housing site to view tenants</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside
        className="bg-card border-border flex h-full min-h-0 min-w-0 flex-1 flex-col border-l"
        data-test="housing-site-panel"
      >
        <div className="border-border bg-muted flex h-[47px] shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <Home className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-foreground truncate text-sm font-semibold">
              {siteName || '—'}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">
              · {tenants.length} tenant{tenants.length === 1 ? '' : 's'} ·{' '}
              {availableBeds} bed{availableBeds === 1 ? '' : 's'} available
            </span>
          </div>
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
          <AccessGate permission="can_edit">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-sm font-semibold">
                  Assign tenants
                </h3>
                <span className="text-muted-foreground text-xs">
                  {selected.size} selected
                </span>
              </div>
              <EligiblePicker
                accountSlug={accountSlug}
                selected={selected}
                toggle={toggle}
                open={open}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  onClick={handleAssign}
                  disabled={
                    isAssigning ||
                    selected.size === 0 ||
                    tooMany ||
                    !detailActionUrl
                  }
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {isAssigning
                    ? 'Assigning…'
                    : `Assign ${selected.size || ''}`.trim()}
                </Button>
                {tooMany && (
                  <p className="text-destructive text-xs">
                    Only {availableBeds} bed
                    {availableBeds === 1 ? '' : 's'} available
                  </p>
                )}
              </div>
            </div>
          </AccessGate>

          <div className="flex flex-col gap-3">
            <h3 className="text-foreground text-sm font-semibold">
              Current tenants
            </h3>
            {tenants.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No tenants currently assigned.
              </p>
            ) : (
              <TenantsGrid tenants={tenants} onRemove={handleRemove} />
            )}
          </div>
        </div>
      </aside>

      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(next) => {
          if (!next) setPendingRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unassign{' '}
              <span className="font-medium">{pendingRemove?.name}</span> from{' '}
              <span className="font-medium">{siteName}</span>. The bed will
              become available for other employees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRemove();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
