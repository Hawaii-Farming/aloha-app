import { useCallback, useEffect, useRef, useState } from 'react';

import { useFetcher, useNavigate, useRevalidator } from 'react-router';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CellClickedEvent,
  ColDef,
  GridReadyEvent,
} from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';
import { ArrowLeft, ChevronsUpDown, Home, Plus, Trash2, X } from 'lucide-react';

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@aloha/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@aloha/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@aloha/ui/sheet';
import { toast } from '@aloha/ui/sonner';
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
    {
      colId: 'remove',
      headerName: '',
      maxWidth: 56,
      minWidth: 56,
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
  accountSlug,
  onRemove,
}: {
  tenants: TenantRow[];
  accountSlug: string;
  onRemove: (tenantId: string, fullName: string) => void;
}) {
  const navigate = useNavigate();
  const { query } = useActiveTableSearch();
  useRegisterActiveTable('housing-tenants', 'Tenants');

  const handleCellClicked = useCallback(
    (event: CellClickedEvent) => {
      // Skip navigation when the click landed in the X (remove) column —
      // that cell handles its own action.
      if (event.column.getColId() === 'remove') return;
      const tenantId = (event.data as TenantRow | undefined)?.id;
      if (!tenantId || !accountSlug) return;
      navigate(
        `/home/${accountSlug}/${encodeURIComponent('Human Resources')}/${encodeURIComponent('Register')}/${encodeURIComponent(tenantId)}`,
      );
    },
    [navigate, accountSlug],
  );

  const handleGridReady = useCallback((event: GridReadyEvent) => {
    setTimeout(() => event.api.sizeColumnsToFit(), 20);
  }, []);

  const colDefs = buildTenantColDefs(onRemove);

  return (
    <AgGridWrapper
      colDefs={colDefs}
      rowData={tenants as unknown as Record<string, unknown>[]}
      quickFilterText={query}
      pagination={false}
      domLayout="autoHeight"
      onCellClicked={handleCellClicked}
      onGridReady={handleGridReady}
    />
  );
}

function AssignTenantPanel({
  open,
  onOpenChange,
  siteName,
  accountSlug,
  availableBeds,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteName: string;
  accountSlug: string;
  availableBeds: number;
  onAssigned: () => void;
}) {
  const fetcher = useFetcher();
  const handledRef = useRef(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: eligible = [], isLoading } = useQuery({
    queryKey: ['housing-eligible-employees', accountSlug],
    queryFn: () => fetchEligibleEmployees(accountSlug),
    enabled: open && !!accountSlug,
  });

  const isSubmitting = fetcher.state !== 'idle';
  const tooMany = selected.size > availableBeds;

  // Parent remounts this component each time the drawer opens (via the
  // `key` prop on AssignTenantPanel below), so internal `selected` and
  // `handledRef` start fresh — no setState-in-effect needed.

  // Close on success, surface error otherwise. handleOpenChange (wrapped
  // below) resets local selection state when closing.
  useEffect(() => {
    if (fetcher.state !== 'idle' || handledRef.current) return;
    const data = fetcher.data as
      | { success: boolean; error?: string; count?: number }
      | undefined;
    if (data?.success) {
      handledRef.current = true;
      toast.success(
        `Assigned ${data.count ?? 0} tenant${(data.count ?? 0) === 1 ? '' : 's'}`,
      );
      onAssigned();
      onOpenChange(false);
      // intentional: parent close will trigger our handleOpenChange via
      // the controlled-open prop change in the next render cycle, which
      // resets selected. Direct setSelected here would trip the
      // set-state-in-effect lint rule.
    } else if (data?.error) {
      handledRef.current = true;
      toast.error(data.error);
    }
  }, [fetcher.state, fetcher.data, onAssigned, onOpenChange]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (selected.size === 0 || tooMany) return;
    handledRef.current = false;
    fetcher.submit(
      { intent: 'assign_tenant', tenantIds: Array.from(selected) },
      { method: 'POST', encType: 'application/json' },
    );
  }, [fetcher, selected, tooMany]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 rounded-none border-0 p-0 sm:w-[90%] sm:max-w-md sm:rounded-l-2xl sm:border-l"
        data-test="housing-assign-panel"
      >
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle>Assign tenants to {siteName}</SheetTitle>
          <p className="text-muted-foreground text-xs">
            {availableBeds} bed{availableBeds === 1 ? '' : 's'} available ·{' '}
            {selected.size} selected
          </p>
        </SheetHeader>

        {/* Body: chips strip + dropdown picker */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {eligible
                .filter((e) => selected.has(e.id))
                .map((emp) => (
                  <span
                    key={emp.id}
                    className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    data-test={`housing-assign-chip-${emp.id}`}
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
                data-test="housing-assign-dropdown-trigger"
              >
                <span className="text-muted-foreground">
                  {eligible.length === 0
                    ? 'All employees are already housed'
                    : isLoading
                      ? 'Loading…'
                      : 'Select employees…'}
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
                          data-test={`housing-assign-pick-${emp.id}`}
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

        <div className="flex shrink-0 items-center gap-3 border-t px-6 py-4">
          <Button
            type="button"
            variant="brand"
            onClick={handleSubmit}
            disabled={isSubmitting || selected.size === 0 || tooMany}
            data-test="housing-assign-submit"
          >
            {isSubmitting
              ? 'Assigning…'
              : `Assign ${selected.size || ''}`.trim()}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {tooMany && (
            <p className="text-destructive text-xs">
              Only {availableBeds} bed{availableBeds === 1 ? '' : 's'} available
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
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
  const removeFetcher = useFetcher();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const siteId = String(record.id ?? '');
  const name = String(record.name ?? 'Housing');
  const notes = record.notes ? String(record.notes) : null;
  const availableBeds = Number(record.available_beds ?? 0);

  const { data: tenants = [] } = useQuery({
    queryKey: ['housing-tenants', siteId, accountSlug],
    queryFn: () => fetchTenants(siteId, accountSlug),
    enabled: !!siteId && !!accountSlug,
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

  // Dedupe ref so the success-handler effect runs once per submission —
  // without this, fetcher.data stays { success: true } and the
  // refreshAfterMutation dependency churn re-fires the effect, causing an
  // infinite revalidate loop.
  const removeHandledRef = useRef(false);

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

  const handleRemoveTenant = useCallback(
    (tenantId: string, fullName: string) => {
      removeHandledRef.current = false;
      removeFetcher.submit(
        { intent: 'unassign_tenant', tenantId },
        { method: 'POST', encType: 'application/json' },
      );
      toast.success(`Removed ${fullName}`);
    },
    [removeFetcher],
  );

  const handleDelete = useCallback(() => {
    fetcher.submit(
      { intent: 'delete' },
      { method: 'POST', encType: 'application/json' },
    );
  }, [fetcher]);

  const isDeleting = fetcher.state !== 'idle';

  return (
    <>
      <div
        className="bg-card flex min-h-0 flex-1 flex-col"
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

            <div className="bg-border h-5 w-px" />

            <span
              className="text-muted-foreground text-sm"
              data-test="housing-detail-tenants-count"
            >
              Tenants ({tenants.length})
            </span>
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

        {/* Body — bg-card so empty space below the auto-height grid matches palette */}
        <div className="bg-card flex min-h-0 flex-1 flex-col">
          {notes && (
            <div className="text-foreground border-border shrink-0 border-b px-6 py-3 text-sm">
              <span className="text-muted-foreground">Notes: </span>
              {notes}
            </div>
          )}

          {tenants.length === 0 ? (
            <p className="text-muted-foreground px-6 py-4 text-sm">
              No tenants currently assigned.
            </p>
          ) : (
            <div className="bg-card flex min-h-0 flex-1 flex-col">
              <TenantsGrid
                tenants={tenants}
                accountSlug={accountSlug}
                onRemove={handleRemoveTenant}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating "Assign tenant" FAB — hidden when no beds available */}
      <AccessGate permission="can_edit">
        {availableBeds > 0 && (
          <Button
            variant="brand"
            aria-label="Assign tenant"
            data-test="housing-assign-fab"
            onClick={() => setAssignOpen(true)}
            className="fixed right-10 bottom-10 z-30 h-14 w-14 rounded-full p-0 shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </AccessGate>

      {/*
        Keying on assignOpen forces the panel to remount each time it
        reopens — gives us a fresh selection set without setState-in-effect.
      */}
      <AssignTenantPanel
        key={assignOpen ? 'open' : 'closed'}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        siteName={name}
        accountSlug={accountSlug}
        availableBeds={availableBeds}
        onAssigned={refreshAfterMutation}
      />

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
