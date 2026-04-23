import { redirect } from 'react-router';

import type { JwtPayload, SupabaseClient } from '@supabase/supabase-js';

import { castRows, queryUntypedView } from '~/lib/crud/typed-query.server';
import type { Database } from '~/lib/database.types';
import { requireUserLoader } from '~/lib/require-user-loader';
import type {
  AppNavModule,
  AppNavSubModule,
  AppNavigationRow,
} from '~/lib/workspace/types';

export interface OrgWorkspace {
  currentOrg: {
    org_id: string;
    org_name: string;
    employee_id: string;
    access_level_id: string;
  };
  userOrgs: Array<{ org_id: string; org_name: string }>;
  user: JwtPayload;
  navigation: {
    modules: AppNavModule[];
    subModules: AppNavSubModule[];
  };
}

interface EmployeeOrgRow {
  id: string;
  org_id: string;
  sys_access_level_id: string;
  org: { name: string };
}

export async function loadOrgWorkspace(params: {
  orgSlug: string;
  client: SupabaseClient<Database>;
  request: Request;
}): Promise<OrgWorkspace> {
  const user = await requireUserLoader(params.request);

  // Query hr_employee directly — RLS ensures org-scoped access
  const { data: employees, error: empError } = await params.client
    .from('hr_employee')
    .select('id, org_id, sys_access_level_id, org:org!inner(name)')
    .eq('user_id', user.sub)
    .eq('is_deleted', false);

  const allOrgs = castRows<EmployeeOrgRow>(employees);

  if (empError || allOrgs.length === 0) {
    throw redirect('/no-access');
  }

  const current = allOrgs.find((e) => e.org_id === params.orgSlug);

  if (!current) {
    throw redirect(`/home/${allOrgs[0]!.org_id}`);
  }

  const orgContext = {
    org_id: current.org_id,
    org_name: current.org.name,
    employee_id: current.id,
    access_level_id: current.sys_access_level_id,
  };

  // Single view query — not in generated types, use queryUntypedView helper
  const { data: navRows, error: navError } = await queryUntypedView(
    params.client,
    'hr_rba_navigation',
  )
    .select('*')
    .eq('org_id', params.orgSlug);

  if (navError) {
    console.error(
      `[loadOrgWorkspace] hr_rba_navigation query failed for org ${params.orgSlug}:`,
      navError,
    );
    throw new Response('Failed to load workspace navigation', { status: 500 });
  }

  const rows = castRows<AppNavigationRow>(navRows);
  const { modules, subModules } = deriveNavigation(rows, params.orgSlug);

  return {
    currentOrg: orgContext,
    userOrgs: allOrgs.map((e) => ({
      org_id: e.org_id,
      org_name: e.org.name,
    })),
    user,
    navigation: { modules, subModules },
  };
}

/** Derive deduplicated modules and sub-modules from flat navigation rows */
function deriveNavigation(
  rows: AppNavigationRow[],
  orgId: string,
): { modules: AppNavModule[]; subModules: AppNavSubModule[] } {
  const moduleMap = new Map<string, AppNavModule>();
  const subModules: AppNavSubModule[] = [];

  for (const row of rows) {
    if (!moduleMap.has(row.module_slug)) {
      moduleMap.set(row.module_slug, {
        module_id: row.module_id,
        org_id: orgId,
        module_slug: row.module_slug,
        display_name: row.module_display_name,
        display_order: row.module_display_order,
        can_edit: row.can_edit,
        can_delete: row.can_delete,
        can_verify: row.can_verify,
      });
    }

    subModules.push({
      sub_module_id: row.sub_module_id,
      org_id: orgId,
      module_slug: row.module_slug,
      sub_module_slug: row.sub_module_slug,
      display_name: row.sub_module_display_name,
      display_order: row.sub_module_display_order,
    });
  }

  return {
    modules: [...moduleMap.values()],
    subModules,
  };
}
