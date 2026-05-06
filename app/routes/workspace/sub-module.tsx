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
import { flattenRow, loadTableData } from '~/lib/crud/crud-helpers.server';
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
      subModuleSlug.startsWith('Payroll') ||
      subModuleSlug === 'Payroll Comp' ||
      subModuleSlug === 'Hours Comp'
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
    if (subModuleSlug === 'Employee Review') {
      const { data: yearData } = await queryUntypedView(
        client,
        'hr_employee_review',
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

    // Honour the CRUD config's `select` (postgrest embeds and column
    // aliases) when specified; otherwise fall back to '*'. This lets
    // table-backed sub-modules (Time Off, Employee Review, ...) pull
    // joined display fields without needing a wrapping view.
    let query = queryUntypedView(client, viewName)
      .select(config?.select ?? '*')
      .eq('org_id', accountSlug);

    // Slug-specific query params
    if (subModuleSlug === 'Scheduler') {
      const weekStart = url.searchParams.get('week') ?? getCurrentWeekStart();
      query = query.eq('week_start_date', weekStart);
      const deptFilter = url.searchParams.get('dept') ?? null;
      if (deptFilter) {
        query = query.eq('hr_department_id', deptFilter);
      }
      query = query.order('full_name');
    } else if (
      subModuleSlug === 'Payroll Comparison' ||
      subModuleSlug === 'Payroll Comp'
    ) {
      // Server-aggregated comparison views with period-over-period deltas.
      // by_task   -> hr_payroll_task_comparison      (one row per task)
      // by_employee -> hr_payroll_employee_comparison (one row per employee)
      const view = url.searchParams.get('view') ?? 'by_task';
      const sourceView =
        view === 'by_employee'
          ? 'hr_payroll_employee_comparison'
          : 'hr_payroll_task_comparison';
      query = queryUntypedView(client, sourceView)
        .select('*')
        .eq('org_id', accountSlug);
      const checkDate = url.searchParams.get('check_date');
      if (checkDate) {
        query = query.eq('check_date', checkDate);
      }
      query = query.order(view === 'by_employee' ? 'hr_employee_id' : 'task');
    } else if (subModuleSlug === 'Payroll Comp Manager') {
      // hr_payroll_employee_comparison auto-anchors to the most recent
      // is_standard=TRUE HRB check_date and exposes deltas vs the prior
      // period — no explicit period filtering needed at the query level.
      const managerId = url.searchParams.get('manager');
      if (managerId) {
        query = query.eq('compensation_manager_id', managerId);
      }
      query = query.order('hr_employee_id');
    } else if (subModuleSlug === 'Hours Comp') {
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
      query = query.order('hr_employee_id');
    } else if (subModuleSlug === 'Payroll Data') {
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
      query = query.order('employee_name');
    } else if (subModuleSlug === 'Employee Review') {
      const year = url.searchParams.get('year');
      const quarter = url.searchParams.get('quarter');
      if (year) query = query.eq('review_year', parseInt(year, 10));
      if (quarter) query = query.eq('review_quarter', parseInt(quarter, 10));
      query = query.order('hr_employee_id');
    } else if (subModuleSlug === 'Housing') {
      query = query.order('id');
    } else {
      // Generic fallback for future custom views
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      throw new Response(error.message, { status: 500 });
    }

    const rawRows = castRows(data);
    // Flatten postgrest embeds so list-view configs see flat keys
    // (subject_preferred_name, subject_hr_department_name, etc.) — mirrors
    // loadTableData's behaviour for the regular path.
    let rows = config?.select ? rawRows.map((r) => flattenRow(r)) : rawRows;

    // Enrich payroll-summary views with employee display fields. The
    // hr_payroll_employee_comparison view exposes hr_employee_id but not
    // preferred_name / department / photo, and PostgREST embeds aren't
    // reliable on these views. Fetch a single batch and merge by id.
    // (hr_payroll_task_comparison has no employee dimension; the loop
    // is a no-op there since employeeIds will be empty.)
    if (
      subModuleSlug === 'Payroll Comparison' ||
      subModuleSlug === 'Payroll Comp' ||
      subModuleSlug === 'Payroll Comp Manager' ||
      subModuleSlug === 'Hours Comp'
    ) {
      const employeeIds = new Set<string>();
      for (const r of rows) {
        const eid = r.hr_employee_id;
        if (typeof eid === 'string' && eid) employeeIds.add(eid);
      }
      if (employeeIds.size > 0) {
        const { data: empData } = await client
          .from('hr_employee' as never)
          .select(
            'id, preferred_name, profile_photo_url, hr_department_id, hr_work_authorization_id',
          )
          .in('id', Array.from(employeeIds));
        const empMap = new Map<string, Record<string, unknown>>();
        for (const e of castRows(empData)) {
          empMap.set(String(e.id), e);
        }
        rows = rows.map((r) => {
          const eid = String(r.hr_employee_id ?? '');
          const emp = empMap.get(eid);
          if (!emp) return r;
          return {
            ...r,
            hr_employee_preferred_name: emp.preferred_name,
            hr_employee_profile_photo_url: emp.profile_photo_url,
            hr_employee_hr_department_id: emp.hr_department_id,
            hr_employee_hr_work_authorization_id: emp.hr_work_authorization_id,
          };
        });
      }
    }

    // Enrich by_task rows with comp-manager name and per-task work
    // authorization labels. The comparison view groups by
    // (compensation_manager_id, task, status) but only exposes the
    // manager id and no work-auth dimension at all. We derive both
    // here so the UI can render Comp Manager + Work Auth columns
    // without extra round-trips from the client.
    if (
      (subModuleSlug === 'Payroll Comparison' ||
        subModuleSlug === 'Payroll Comp') &&
      (url.searchParams.get('view') ?? 'by_task') === 'by_task'
    ) {
      const managerIds = new Set<string>();
      const taskNames = new Set<string>();
      for (const r of rows) {
        const mid = r.compensation_manager_id;
        if (typeof mid === 'string' && mid) managerIds.add(mid);
        const t = r.task;
        if (typeof t === 'string' && t) taskNames.add(t);
      }

      const managerNameMap = new Map<string, string>();
      if (managerIds.size > 0) {
        const { data: mgrRows } = await client
          .from('hr_employee' as never)
          .select('id, preferred_name, first_name, last_name')
          .in('id', Array.from(managerIds));
        for (const m of castRows(mgrRows)) {
          const id = String(m.id ?? '');
          const name =
            (m.preferred_name as string) ||
            [m.first_name, m.last_name].filter(Boolean).join(' ');
          if (id) managerNameMap.set(id, name);
        }
      }

      // hr_payroll has no `task` column — task lives on the
      // hr_payroll_by_task view, which carries hr_employee_id but no
      // work-auth. Two-step: by_task gives us {task, employee_id};
      // hr_employee gives us {employee_id, hr_work_authorization_id}.
      const taskWorkAuthMap = new Map<string, Set<string>>();
      if (taskNames.size > 0) {
        const { data: byTaskRows } = await queryUntypedView(
          client,
          'hr_payroll_by_task',
        )
          .select('task, hr_employee_id')
          .eq('org_id', accountSlug)
          .in('task', Array.from(taskNames));
        const byTaskList = castRows(byTaskRows);
        const empIds = new Set<string>();
        for (const r of byTaskList) {
          const eid = r.hr_employee_id;
          if (typeof eid === 'string' && eid) empIds.add(eid);
        }

        const empWorkAuthMap = new Map<string, string>();
        if (empIds.size > 0) {
          const { data: empWaRows } = await client
            .from('hr_employee' as never)
            .select('id, hr_work_authorization_id')
            .in('id', Array.from(empIds));
          for (const e of castRows(empWaRows)) {
            const id = String(e.id ?? '');
            const wa = e.hr_work_authorization_id;
            if (id && typeof wa === 'string' && wa) {
              empWorkAuthMap.set(id, wa);
            }
          }
        }

        for (const r of byTaskList) {
          const t = String(r.task ?? '');
          const eid = String(r.hr_employee_id ?? '');
          const wa = empWorkAuthMap.get(eid);
          if (!t || !wa) continue;
          const set = taskWorkAuthMap.get(t) ?? new Set<string>();
          set.add(wa);
          taskWorkAuthMap.set(t, set);
        }
      }

      rows = rows.map((r) => {
        const mid = String(r.compensation_manager_id ?? '');
        const t = String(r.task ?? '');
        return {
          ...r,
          compensation_manager_name: managerNameMap.get(mid) ?? mid,
          hr_work_authorization_id: [...(taskWorkAuthMap.get(t) ?? [])].join(
            ', ',
          ),
        };
      });
    }

    // Load distinct managers for payroll_comp_manager
    let managers: Record<string, unknown>[] = [];
    if (subModuleSlug === 'Payroll Comp Manager') {
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
      {subModuleSlug === 'Payroll Data' && (
        <>
          <PayrollViewToggle />
          <Suspense fallback={null}>
            <LazyPayrollDataFilterBar />
          </Suspense>
        </>
      )}
      <ViewComponent {...viewProps} />
    </Suspense>
  );
}
