import { redirect } from 'react-router';

import type { JwtPayload, SupabaseClient } from '@supabase/supabase-js';

import type {
  AppNavModule,
  AppNavSubModule,
} from '@aloha/access-control/view-contracts';
import type { AppOrgContext, AppUserOrgs } from '@aloha/auth/view-contracts';

import type { Database } from '~/lib/database.types';
import { requireUserLoader } from '~/lib/require-user-loader';

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

export async function loadOrgWorkspace(params: {
  orgSlug: string;
  client: SupabaseClient<Database>;
  request: Request;
}): Promise<OrgWorkspace> {
  const user = await requireUserLoader(params.request);

  const { data: rawOrgs, error: orgsError } = await params.client
    .from('app_user_orgs' as const)
    .select('org_id, org_name');

  const userOrgs = rawOrgs as AppUserOrgs[] | null;

  if (orgsError || !userOrgs || userOrgs.length === 0) {
    throw redirect('/no-access');
  }

  const { data: rawContext, error: contextError } = await params.client
    .from('app_org_context' as const)
    .select('org_id, org_name, employee_id, access_level_id')
    .eq('org_id', params.orgSlug)
    .single();

  const orgContext = rawContext as AppOrgContext | null;

  if (contextError || !orgContext) {
    throw redirect(`/home/${userOrgs[0]!.org_id}`);
  }

  // Nav views exist in SQL but not in generated types — use untyped client
  const untypedClient = params.client as unknown as SupabaseClient;

  const modulesQuery = untypedClient
    .from('app_nav_modules')
    .select(
      'module_id, org_id, module_slug, display_name, display_order, can_edit, can_delete, can_verify',
    )
    .eq('org_id', params.orgSlug)
    .order('display_order');

  const subModulesQuery = untypedClient
    .from('app_nav_sub_modules')
    .select(
      'sub_module_id, org_id, module_slug, sub_module_slug, display_name, display_order',
    )
    .eq('org_id', params.orgSlug)
    .order('display_order');

  const [modulesResult, subModulesResult] = await Promise.all([
    modulesQuery,
    subModulesQuery,
  ]);

  const modules = (modulesResult.data as AppNavModule[]) ?? [];
  const subModules = (subModulesResult.data as AppNavSubModule[]) ?? [];

  return {
    currentOrg: orgContext,
    userOrgs,
    user,
    navigation: {
      modules,
      subModules,
    },
  };
}
