import { useCallback } from 'react';

import { Link, useNavigate, useSearchParams } from 'react-router';

import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { getSupabaseServerClient } from '@aloha/supabase/server-client';
import { AppBreadcrumbs } from '@aloha/ui/app-breadcrumbs';
import { Button } from '@aloha/ui/button';
import { DataTableColumnHeader } from '@aloha/ui/data-table-column-header';
import { DataTableToolbar } from '@aloha/ui/data-table-toolbar';
import { DataTable } from '@aloha/ui/enhanced-data-table';
import { PageBody, PageHeader } from '@aloha/ui/page';
import { Trans } from '@aloha/ui/trans';

import {
  requireModuleAccess,
  requireSubModuleAccess,
} from '~/lib/workspace/require-module-access.server';
import { loadTableData } from '~/lib/crud/crud-helpers.server';
import { getModuleConfig } from '~/lib/crud/registry';

type RowData = Record<string, unknown>;

function buildColumns(config?: {
  columns: { key: string; label: string; sortable?: boolean }[];
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

    if (col.key === 'created_at') {
      def.cell = ({ getValue }) => {
        const value = getValue() as string | null;
        return value ? new Date(value).toLocaleDateString() : '-';
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
  const tableData = await loadTableData({
    client,
    viewName,
    orgId: accountSlug,
    searchParams: url.searchParams,
    searchColumns,
    defaultSort: { column: defaultSortCol, ascending: true },
    pageSize: 25,
  });

  return {
    config,
    moduleAccess,
    subModuleAccess,
    accountSlug,
    tableData,
  };
};

export default function SubModulePage(props: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const { config, moduleAccess, subModuleAccess, accountSlug, tableData } =
    props.loaderData;

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sort = searchParams.get('sort') ?? 'id';
  const dir = searchParams.get('dir') ?? 'asc';
  const q = searchParams.get('q') ?? '';
  const deleted = searchParams.get('deleted') ?? 'false';

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

  const breadcrumbValues: Record<string, string> = {
    [accountSlug]: accountSlug,
    [moduleAccess.module_slug]: moduleAccess.display_name,
    [subModuleAccess.sub_module_slug]: subModuleAccess.display_name,
  };

  const columns = buildColumns(config);
  const pkColumn = config?.pkColumn ?? 'id';

  return (
    <>
      <PageHeader
        title={subModuleAccess.display_name}
        description={`${moduleAccess.display_name} > ${subModuleAccess.display_name}`}
      >
        <AppBreadcrumbs values={breadcrumbValues} />
      </PageHeader>

      <PageBody>
        <div className="flex flex-col gap-4" data-test="sub-module-list">
          <DataTableToolbar
            searchValue={q}
            onSearchChange={(value) => updateParams({ q: value, page: 1 })}
            searchPlaceholder={
              config?.search?.placeholder ??
              `Search ${subModuleAccess.display_name.toLowerCase()}...`
            }
            showDeleted={deleted === 'true'}
            onShowDeletedChange={(value) =>
              updateParams({ deleted: value ? 'true' : 'false', page: 1 })
            }
            actionSlot={
              <Button asChild size="sm">
                <Link to="create">
                  <Plus className="mr-2 h-4 w-4" />
                  <Trans i18nKey="common:create" />
                </Link>
              </Button>
            }
          />

          <DataTable
            data={tableData.data as RowData[]}
            columns={columns}
            pageIndex={tableData.page - 1}
            pageSize={tableData.pageSize}
            pageCount={tableData.pageCount}
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
      </PageBody>
    </>
  );
}
