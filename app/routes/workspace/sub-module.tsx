import { useCallback, useState } from 'react';

import { useNavigate, useSearchParams } from 'react-router';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { Button } from '@aloha/ui/button';
import { DataTableColumnHeader } from '@aloha/ui/data-table-column-header';
import { DataTableToolbar } from '@aloha/ui/data-table-toolbar';
import { DataTable } from '@aloha/ui/enhanced-data-table';
import { PageBody } from '@aloha/ui/page';
import { Trans } from '@aloha/ui/trans';

import { CreatePanel } from '~/components/crud/create-panel';
import { loadTableData } from '~/lib/crud/crud-helpers.server';
import { getModuleConfig } from '~/lib/crud/registry';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import {
  requireModuleAccess,
  requireSubModuleAccess,
} from '~/lib/workspace/require-module-access.server';

type RowData = Record<string, unknown>;

function buildColumns(config?: {
  columns: { key: string; label: string; sortable?: boolean; type?: string; render?: string }[];
}): ColumnDef<RowData>[] {
  if (!config) {
    return [];
  }

  return config.columns.map((col) => {
    const def: ColumnDef<RowData> = {
      accessorKey: col.key,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={col.label} />
      ),
      enableSorting: col.sortable ?? false,
    };

    if (col.render === 'full_name') {
      def.cell = ({ row }) => {
        const first = row.original['first_name'] as string ?? '';
        const last = row.original['last_name'] as string ?? '';
        return `${last}, ${first}`.replace(/(^, |, $)/, '');
      };
    } else if (col.type === 'date') {
      def.cell = ({ getValue }) => {
        const value = getValue() as string | null;
        return value ? new Date(value).toLocaleDateString() : '';
      };
    } else if (col.type === 'datetime' || col.key === 'created_at') {
      def.cell = ({ getValue }) => {
        const value = getValue() as string | null;
        return value ? new Date(value).toLocaleDateString() : '';
      };
    }

    return def;
  });
}

export const loader = async (args: {
  request: Request;
  params: Record<string, string>;
}) => {
  const accountSlug = args.params.account as string;
  const moduleSlug = args.params.module as string;
  const subModuleSlug = args.params.subModule as string;
  const client = getSupabaseServerClient(args.request);

  const config = getModuleConfig(subModuleSlug);

  const [moduleAccess, subModuleAccess] = await Promise.all([
    requireModuleAccess({
      client,
      moduleSlug,
      orgSlug: accountSlug,
    }),
    requireSubModuleAccess({
      client,
      moduleSlug,
      subModuleSlug,
      orgSlug: accountSlug,
    }),
  ]);

  const viewName = config?.views.list ?? subModuleSlug;
  const searchColumns = config?.search?.columns ?? ['name'];
  const defaultSortCol =
    config?.columns.find((c) => c.sortable)?.key ?? 'created_at';

  const url = new URL(args.request.url);
  const pageSize = Number(url.searchParams.get('pageSize') ?? '25');
  const tableData = await loadTableData({
    client,
    viewName,
    orgId: accountSlug,
    searchParams: url.searchParams,
    searchColumns,
    defaultSort: { column: defaultSortCol, ascending: true },
    pageSize,
  });

  const fkFields = (config?.formFields ?? []).filter((f) => f.type === 'fk');
  const fkOptions: Record<string, Array<{ value: string; label: string }>> = {};
  const untypedClient = client as unknown as SupabaseClient;

  for (const field of fkFields) {
    if (field.fkTable && field.fkLabelColumn) {
      const { data } = await untypedClient
        .from(field.fkTable)
        .select(`id, ${field.fkLabelColumn}`)
        .eq('org_id', accountSlug)
        .eq('is_deleted', false)
        .order(field.fkLabelColumn)
        .limit(200);

      const rows = (data ?? []) as unknown as Record<string, unknown>[];
      fkOptions[field.key] = rows.map((row) => ({
        value: String(row['id']),
        label: String(row[field.fkLabelColumn!]),
      }));
    }
  }

  return {
    config,
    moduleAccess,
    subModuleAccess,
    accountSlug,
    tableData,
    fkOptions,
  };
};

export default function SubModulePage(props: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const {
    config,
    moduleAccess: _moduleAccess,
    subModuleAccess,
    accountSlug: _accountSlug,
    tableData,
    fkOptions,
  } = props.loaderData;

  const [createOpen, setCreateOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sort = searchParams.get('sort') ?? 'id';
  const dir = searchParams.get('dir') ?? 'asc';
  const q = searchParams.get('q') ?? '';
  const inactive = searchParams.get('inactive') ?? 'false';

  const updateParams = useCallback(
    (updates: Record<string, string | number>) => {
      const next = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value === '' || value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      navigate(`?${next.toString()}`, { preventScrollReset: true });
    },
    [searchParams, navigate],
  );

  const columns = buildColumns(config);
  const pkColumn = config?.pkColumn ?? 'id';

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden" data-test="sub-module-list">
        <div className="shrink-0 pb-4">
          <DataTableToolbar
            searchValue={q}
            onSearchChange={(value) => updateParams({ q: value, page: 1 })}
            searchPlaceholder={
              config?.search?.placeholder ??
              `Search ${subModuleAccess.display_name.toLowerCase()}...`
            }
            showInactive={inactive === 'true'}
            onShowInactiveChange={(value) =>
              updateParams({ inactive: value ? 'true' : 'false', page: 1 })
            }
            actionSlot={
              <Button
                size="sm"
                variant="brand"
                onClick={() => setCreateOpen(true)}
                data-test="sub-module-create-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                <Trans i18nKey="common:create" />
              </Button>
            }
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <DataTable
            data={tableData.data as RowData[]}
            columns={columns}
            pageIndex={tableData.page - 1}
            pageSize={tableData.pageSize}
            pageCount={tableData.pageCount}
            totalCount={tableData.totalCount}
            manualPagination={true}
            manualSorting={true}
            sorting={[{ id: sort, desc: dir === 'desc' }]}
            onSortingChange={(sorting) => {
              const s = sorting[0];

              if (s) {
                updateParams({
                  sort: s.id,
                  dir: s.desc ? 'desc' : 'asc',
                  page: 1,
                });
              }
            }}
            onPaginationChange={(pagination) => {
              updateParams({ page: pagination.pageIndex + 1 });
            }}
            onPageSizeChange={(size) => {
              updateParams({ pageSize: size, page: 1 });
            }}
            onRowClick={(row) => {
              const id = row[pkColumn] as string;

              if (id) {
                navigate(id);
              }
            }}
            emptyStateProps={{ heading: 'No records found' }}
            tableProps={{ 'data-test': 'crud-data-table' }}
          />
        </div>
      </div>

      <CreatePanel
        open={createOpen}
        onOpenChange={setCreateOpen}
        config={config}
        fkOptions={fkOptions}
        subModuleDisplayName={subModuleAccess.display_name}
      />
    </>
  );
}
