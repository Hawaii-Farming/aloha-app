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

  // Run both queries in parallel — they share no data dependency.
  // hr_employee filters by user_id; hr_rba_navigation filters by orgSlug
  // (already known from URL). Worst case: a redirect path wastes the nav
  // result, but the happy path saves a full Supabase RTT (~100-200ms).
  const [empResult, navResult] = await Promise.all([
    params.client
      .from('hr_employee')
      .select('id, org_id, sys_access_level_id, org:org!inner(name)')
      .eq('user_id', user.sub)
      .eq('is_deleted', false),
    queryUntypedView(params.client, 'hr_rba_navigation')
      .select(
        'module_id, sub_module_id, module_display_order, sub_module_display_order, can_edit, can_delete, can_verify',
      )
      .eq('org_id', params.orgSlug),
  ]);

  const { data: employees, error: empError } = empResult;
  const { data: navRows, error: navError } = navResult;

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

  if (navError) {
    console.error(
      `[loadOrgWorkspace] hr_rba_navigation query failed for org ${params.orgSlug}:`,
      navError,
    );
    throw new Response('Failed to load workspace navigation', { status: 500 });
  }

  const rows = castRows<AppNavigationRow>(navRows ?? []);
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

  // The display-name PK IS the URL segment now — there's no separate slug.
  // We keep the property names `module_slug` / `sub_module_slug` on the
  // navigation objects to avoid touching every consumer; the values are
  // simply the Proper Case ids.
  for (const row of rows) {
    if (!moduleMap.has(row.module_id)) {
      moduleMap.set(row.module_id, {
        module_id: row.module_id,
        org_id: orgId,
        module_slug: row.module_id,
        display_name: row.module_id,
        display_order: row.module_display_order,
        can_edit: row.can_edit,
        can_delete: row.can_delete,
        can_verify: row.can_verify,
      });
    }

    // "Payroll Data" is merged under "Payroll Comp"'s 3-way toggle — hide its
    // own sidebar/search entry. Route stays accessible via the toggle.
    if (row.sub_module_id === 'Payroll Data') continue;

    // Rename "Payroll Comp" → "Payroll" in the UI for brevity.
    const displayName =
      row.sub_module_id === 'Payroll Comp' ? 'Payroll' : row.sub_module_id;

    subModules.push({
      sub_module_id: row.sub_module_id,
      org_id: orgId,
      module_slug: row.module_id,
      sub_module_slug: row.sub_module_id,
      display_name: displayName,
      display_order: row.sub_module_display_order,
    });
  }

  return {
    modules: [...moduleMap.values()],
    subModules,
  };
}
