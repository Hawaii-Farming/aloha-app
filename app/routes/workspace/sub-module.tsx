import type { ComponentType } from 'react';
import { Suspense, lazy } from 'react';

import { format, startOfWeek } from 'date-fns';

import { TableListView } from '~/components/crud/table-list-view';
import {
  crudBulkDeleteAction,
  crudBulkTransitionAction,
} from '~/lib/crud/crud-action.server';
import { loadTableData } from '~/lib/crud/crud-helpers.server';
import { loadFormOptions } from '~/lib/crud/load-form-options.server';
import { getModuleConfig } from '~/lib/crud/registry';
import { castRows, queryUntypedView } from '~/lib/crud/typed-query.server';
import type { CrudModuleConfig, ListViewProps } from '~/lib/crud/types';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';
import {
  requireModuleAccess,
  requireSubModuleAccess,
} from '~/lib/workspace/require-module-access.server';

function getCurrentWeekStart(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
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

  // Custom loader path for views that lack is_deleted/end_date columns
  if (config?.viewType?.list === 'custom') {
    const weekStart = url.searchParams.get('week') ?? getCurrentWeekStart();
    const deptFilter = url.searchParams.get('dept') ?? null;

    let query = queryUntypedView(client, viewName)
      .select('*')
      .eq('org_id', accountSlug)
      .eq('week_start_date', weekStart);

    if (deptFilter) {
      query = query.eq('hr_department_id', deptFilter);
    }

    query = query.order('full_name');

    const { data, error } = await query;

    if (error) {
      throw new Response(error.message, { status: 500 });
    }

    const rows = castRows(data);

    const { fkOptions, comboboxOptions } = await loadFormOptions({
      client,
      config,
      orgId: accountSlug,
      subModuleSlug,
    });

    return {
      config,
      moduleAccess,
      subModuleAccess,
      accountSlug,
      tableData: {
        data: rows,
        page: 1,
        pageSize: rows.length,
        pageCount: 1,
        totalCount: rows.length,
      },
      fkOptions,
      comboboxOptions,
    };
  }

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
    allowedColumns: config?.columns.map((c) => c.key),
  });

  const { fkOptions, comboboxOptions } = await loadFormOptions({
    client,
    config,
    orgId: accountSlug,
    subModuleSlug,
  });

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

// Lazy-loaded view components — declared at module scope so they are
// created once and not re-created on every render.
const LazyAgGridListView = lazy(
  () => import('~/components/ag-grid/ag-grid-list-view'),
);

// Cache for custom lazy views keyed by loader reference
const customViewCache = new Map<
  () => Promise<{ default: ComponentType<ListViewProps> }>,
  ComponentType<ListViewProps>
>();

function resolveListView(config: CrudModuleConfig | undefined) {
  const viewType = config?.viewType?.list ?? 'table';

  switch (viewType) {
    case 'agGrid': {
      return LazyAgGridListView;
    }

    case 'custom': {
      const loader = config?.customViews?.list;

      if (loader) {
        let cached = customViewCache.get(loader);

        if (!cached) {
          cached = lazy(loader);
          customViewCache.set(loader, cached);
        }

        return cached;
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

// Dynamic view resolution uses module-scope cached lazy components.
/* eslint-disable react-hooks/static-components */
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
