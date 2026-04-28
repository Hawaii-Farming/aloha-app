import type { ComponentType } from 'react';
import { Suspense, lazy } from 'react';

import { useParams } from 'react-router';

import { format, startOfWeek } from 'date-fns';

import { PayrollViewToggle } from '~/components/ag-grid/payroll-view-toggle';
import { StatusFilterTabs } from '~/components/ag-grid/status-filter-tabs';
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

  // Custom loader path for views that need non-standard query logic
  if (config?.viewType?.list === 'custom') {
    // Pre-load pay periods for all payroll submodules (needed before query
    // for payroll_data default period selection)
    let payPeriods: Record<string, unknown>[] = [];
    if (
      subModuleSlug.startsWith('payroll_') ||
      subModuleSlug === 'payroll_comp' ||
      subModuleSlug === 'hours_comp'
    ) {
      const { data: periodData } = await queryUntypedView(client, 'hr_payroll')
        .select('pay_period_start, pay_period_end')
        .eq('org_id', accountSlug)
        .eq('is_deleted', false)
        .order('pay_period_start', { ascending: false });
      const seen = new Set<string>();
      payPeriods = castRows(periodData).filter((r) => {
        const key = `${r.pay_period_start}|${r.pay_period_end}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Load distinct review years for YearQuarterFilter
    let reviewYears: number[] = [];
    if (subModuleSlug === 'employee_review') {
      const { data: yearData } = await queryUntypedView(
        client,
        'app_hr_employee_reviews',
      )
        .select('review_year')
        .eq('org_id', accountSlug);
      const yearSet = new Set<number>();
      castRows(yearData).forEach((r) => {
        const y = Number(r.review_year);
        if (y) yearSet.add(y);
      });
      reviewYears = Array.from(yearSet).sort((a, b) => b - a);
      if (reviewYears.length === 0) {
        reviewYears = [new Date().getFullYear()];
      }
    }

    let query = queryUntypedView(client, viewName)
      .select('*')
      .eq('org_id', accountSlug);

    // Slug-specific query params
    if (subModuleSlug === 'scheduler') {
      const weekStart = url.searchParams.get('week') ?? getCurrentWeekStart();
      query = query.eq('week_start_date', weekStart);
      const deptFilter = url.searchParams.get('dept') ?? null;
      if (deptFilter) {
        query = query.eq('hr_department_id', deptFilter);
      }
      query = query.order('full_name');
    } else if (
      subModuleSlug === 'payroll_comparison' ||
      subModuleSlug === 'payroll_comp'
    ) {
      // Both views use detail data for client-side grouping + inline detail tables
      query = queryUntypedView(client, 'app_hr_payroll_detail')
        .select('*')
        .eq('org_id', accountSlug);
      const periodStart = url.searchParams.get('period_start');
      const periodEnd = url.searchParams.get('period_end');
      if (periodStart && periodEnd) {
        query = query
          .eq('pay_period_start', periodStart)
          .eq('pay_period_end', periodEnd);
      }
      query = query.order('employee_name');
    } else if (subModuleSlug === 'payroll_comp_manager') {
      // hr_payroll_employee_comparison auto-anchors to the most recent
      // is_standard=TRUE HRB check_date and exposes deltas vs the prior
      // period — no explicit period filtering needed at the query level.
      const managerId = url.searchParams.get('manager');
      if (managerId) {
        query = query.eq('compensation_manager_id', managerId);
      }
      query = query.order('hr_employee_id');
    } else if (subModuleSlug === 'hours_comp') {
      let periodStart = url.searchParams.get('period_start');
      let periodEnd = url.searchParams.get('period_end');

      // Default to most recent pay period when none selected
      if (!periodStart && !periodEnd && payPeriods.length > 0) {
        const defaultPeriod = payPeriods[0] as Record<string, unknown>;
        const defStart = String(defaultPeriod.pay_period_start ?? '');
        const defEnd = String(defaultPeriod.pay_period_end ?? '');
        if (defStart && defEnd) {
          periodStart = defStart;
          periodEnd = defEnd;
        }
      }

      if (periodStart && periodEnd) {
        query = query
          .eq('pay_period_start', periodStart)
          .eq('pay_period_end', periodEnd);
      }
      query = query.order('full_name');
    } else if (subModuleSlug === 'payroll_data') {
      let periodStart = url.searchParams.get('period_start');
      let periodEnd = url.searchParams.get('period_end');
      const employeeId = url.searchParams.get('employee');

      // Default to most recent pay period when none selected
      if (!periodStart && !periodEnd && payPeriods.length > 0) {
        const defaultPeriod = payPeriods[0] as Record<string, unknown>;
        const defStart = String(defaultPeriod.pay_period_start ?? '');
        const defEnd = String(defaultPeriod.pay_period_end ?? '');
        if (defStart && defEnd) {
          periodStart = defStart;
          periodEnd = defEnd;
        }
      }

      if (periodStart && periodEnd) {
        query = query
          .eq('pay_period_start', periodStart)
          .eq('pay_period_end', periodEnd);
      }
      if (employeeId) {
        query = query.eq('hr_employee_id', employeeId);
      }
      query = query.order('full_name');
    } else if (subModuleSlug === 'employee_review') {
      const year = url.searchParams.get('year');
      const quarter = url.searchParams.get('quarter');
      if (year) query = query.eq('review_year', parseInt(year, 10));
      if (quarter) query = query.eq('review_quarter', parseInt(quarter, 10));
      query = query.order('full_name');
    } else if (subModuleSlug === 'housing') {
      query = query.order('id');
    } else {
      // Generic fallback for future custom views
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      throw new Response(error.message, { status: 500 });
    }

    const rows = castRows(data);

    // Load distinct managers for payroll_comp_manager
    let managers: Record<string, unknown>[] = [];
    if (subModuleSlug === 'payroll_comp_manager') {
      const { data: mgrData } = await queryUntypedView(
        client,
        'hr_payroll_employee_comparison',
      )
        .select('compensation_manager_id')
        .eq('org_id', accountSlug);
      const mgrSeen = new Set<string>();
      managers = castRows(mgrData).filter((r) => {
        const id = r.compensation_manager_id as string;
        if (!id || mgrSeen.has(id)) return false;
        mgrSeen.add(id);
        return true;
      });
    }

    // Load employee options for payroll_data employee filter
    let employees: Array<{ value: string; label: string }> = [];
    if (subModuleSlug === 'payroll_data') {
      const { data: empData } = await client
        .from('hr_employee' as never)
        .select('id, first_name, last_name')
        .eq('org_id', accountSlug)
        .eq('is_deleted', false)
        .order('last_name');
      employees = castRows(empData).map((r) => ({
        value: String(r.id),
        label: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(),
      }));
    }

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
      payPeriods,
      managers,
      employees,
      reviewYears,
    };
  }

  const pageSize = config?.noPagination
    ? 10000
    : Number(url.searchParams.get('pageSize') ?? '25');
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
    skipDeletedFilter: config?.skipDeletedFilter,
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
      extraFields: body.extraFields,
    });
  }

  return new Response('Invalid action', { status: 400 });
};

// Lazy-loaded view components — declared at module scope so they are
// created once and not re-created on every render.
const LazyAgGridListView = lazy(
  () => import('~/components/ag-grid/ag-grid-list-view'),
);

const LazyPayrollDataFilterBar = lazy(() =>
  import('~/components/ag-grid/payroll-data-filter-bar').then((m) => ({
    default: m.PayrollDataFilterBar,
  })),
);

// Cache for custom lazy views keyed by loader reference
const customViewCache = new Map<
  () => Promise<{ default: ComponentType<ListViewProps> }>,
  ComponentType<ListViewProps>
>();

function resolveListView(subModuleSlug: string) {
  // Re-resolve config from the registry on the client side.
  // The config from loaderData is serialized over the wire and loses
  // non-serializable fields like customViews (functions).
  const freshConfig = getModuleConfig(subModuleSlug);
  const viewType = freshConfig?.viewType?.list ?? 'table';

  switch (viewType) {
    case 'agGrid': {
      return LazyAgGridListView;
    }

    case 'custom': {
      const loader = freshConfig?.customViews?.list;

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

  const params = useParams();
  const subModuleSlug = params.subModule ?? '';
  const ViewComponent = resolveListView(subModuleSlug);

  // Re-resolve config from the client registry so non-serializable fields
  // (Zod schema prototype methods, customViews functions) are live.
  // loaderData config is JSON-serialized and loses all class prototypes.
  const typedConfig = (getModuleConfig(subModuleSlug) ??
    config) as CrudModuleConfig;

  const viewProps: ListViewProps = {
    data: tableData.data as Record<string, unknown>[],
    config: typedConfig,
    tableData,
    fkOptions,
    comboboxOptions,
    subModuleDisplayName: subModuleAccess.display_name,
    accountSlug,
    filterSlot: typedConfig.workflow ? (
      <StatusFilterTabs workflow={typedConfig.workflow} />
    ) : subModuleSlug === 'payroll_data' ? (
      <Suspense fallback={null}>
        <LazyPayrollDataFilterBar />
      </Suspense>
    ) : undefined,
  };

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading view...</div>
        </div>
      }
    >
      {subModuleSlug === 'payroll_data' && <PayrollViewToggle />}
      <ViewComponent {...viewProps} />
    </Suspense>
  );
}
