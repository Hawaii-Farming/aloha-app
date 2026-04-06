import { lazy, Suspense } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

import { TableListView } from '~/components/crud/table-list-view';
import {
  crudBulkDeleteAction,
  crudBulkTransitionAction,
} from '~/lib/crud/crud-action.server';
import { loadTableData } from '~/lib/crud/crud-helpers.server';
import { getModuleConfig } from '~/lib/crud/registry';
import type { CrudModuleConfig, ListViewProps } from '~/lib/crud/types';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';
import {
  requireModuleAccess,
  requireSubModuleAccess,
} from '~/lib/workspace/require-module-access.server';

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
    select: config?.select,
    selfJoins: config?.selfJoins,
  });

  const fkFields = (config?.formFields ?? []).filter((f) => f.type === 'fk');
  const fkOptions: Record<string, Array<{ value: string; label: string }>> = {};
  const untypedClient = client as unknown as SupabaseClient;

  for (const field of fkFields) {
    if (field.fkTable && field.fkLabelColumn) {
      const orderCol = field.fkOrderColumn ?? field.fkLabelColumn;
      const selectCols = new Set(['id', field.fkLabelColumn, orderCol]);
      let query = untypedClient
        .from(field.fkTable)
        .select([...selectCols].join(', '))
        .eq('is_deleted', false);

      if (field.fkOrgScoped !== false) {
        query = query.eq('org_id', accountSlug);
      }

      if (field.fkFilter) {
        for (const [col, val] of Object.entries(field.fkFilter)) {
          query = query.eq(col, val);
        }
      }

      const { data } = await query
        .order(orderCol)
        .limit(200);

      const rows = (data ?? []) as unknown as Record<string, unknown>[];
      fkOptions[field.key] = rows.map((row) => ({
        value: String(row['id']),
        label: String(row[field.fkLabelColumn!]),
      }));
    }
  }

  // Load distinct values for combobox fields
  const comboboxFields = (config?.formFields ?? []).filter(
    (f) => f.type === 'combobox',
  );
  const comboboxOptions: Record<string, string[]> = {};

  for (const field of comboboxFields) {
    const source = field.comboboxSource ?? {
      table: config?.tableName ?? subModuleSlug,
      column: field.key,
    };

    const { data } = await untypedClient
      .from(source.table)
      .select(source.column)
      .eq('org_id', accountSlug)
      .eq('is_deleted', false)
      .not(source.column, 'is', null)
      .order(source.column)
      .limit(500);

    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    const unique = [...new Set(rows.map((r) => String(r[source.column])))];
    comboboxOptions[field.key] = unique;
  }

  return {
    config,
    moduleAccess,
    subModuleAccess,
    accountSlug,
    tableData,
    fkOptions,
    comboboxOptions,
  };
};

export const action = async (args: {
  request: Request;
  params: Record<string, string>;
}) => {
  const accountSlug = args.params.account as string;
  const subModuleSlug = args.params.subModule as string;
  const client = getSupabaseServerClient(args.request);
  const body = await args.request.json();
  const workspace = await loadOrgWorkspace({
    orgSlug: accountSlug,
    client,
    request: args.request,
  });

  const config = getModuleConfig(subModuleSlug);
  const tableName = config?.tableName ?? subModuleSlug;
  const pkColumn = config?.pkColumn ?? 'id';

  if (body.intent === 'bulk_delete') {
    return crudBulkDeleteAction({
      client,
      tableName,
      orgId: accountSlug,
      employeeId: workspace.currentOrg.employee_id,
      pkColumn,
      pkValues: body.ids,
    });
  }

  if (body.intent === 'bulk_transition') {
    return crudBulkTransitionAction({
      client,
      tableName,
      orgId: accountSlug,
      employeeId: workspace.currentOrg.employee_id,
      pkColumn,
      pkValues: body.ids,
      statusColumn: body.statusColumn,
      newStatus: body.newStatus,
      transitionFields: body.transitionFields,
    });
  }

  return new Response('Invalid action', { status: 400 });
};

function resolveListView(config: CrudModuleConfig | undefined) {
  const viewType = config?.viewType?.list ?? 'table';

  switch (viewType) {
    case 'custom': {
      const loader = config?.customViews?.list;

      if (loader) {
        return lazy(loader);
      }

      return TableListView;
    }

    // Future view types will be added here:
    // case 'kanban':
    // case 'calendar':
    // case 'dashboard':

    default:
      return TableListView;
  }
}

export default function SubModulePage(props: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const {
    config,
    moduleAccess: _moduleAccess,
    subModuleAccess,
    accountSlug,
    tableData,
    fkOptions,
    comboboxOptions,
  } = props.loaderData;

  const ViewComponent = resolveListView(config);

  const viewProps: ListViewProps = {
    data: tableData.data as Record<string, unknown>[],
    config: config as CrudModuleConfig,
    tableData,
    fkOptions,
    comboboxOptions,
    subModuleDisplayName: subModuleAccess.display_name,
    accountSlug,
  };

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading view...</div>
        </div>
      }
    >
      <ViewComponent {...viewProps} />
    </Suspense>
  );
}
