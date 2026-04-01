import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AppNavModule as NavModule,
  AppNavSubModule as NavSubModule,
} from '@aloha/access-control/view-contracts';

/**
 * Server-side guard: verifies the current user has access to the requested module.
 * Queries the app_nav_modules view (which pre-filters by auth.uid() and is_enabled).
 * If no row is returned, the user has no access -- throws 403 Response.
 */
export async function requireModuleAccess(params: {
  client: SupabaseClient;
  moduleSlug: string;
  orgSlug: string;
}): Promise<NavModule> {
  const { data } = await params.client
    .from('app_nav_modules')
    .select(
      'module_id, org_id, module_slug, display_name, display_order, can_edit, can_delete, can_verify',
    )
    .eq('org_id', params.orgSlug)
    .eq('module_slug', params.moduleSlug)
    .single();

  const module = data as unknown as NavModule | null;

  if (!module) {
    throw new Response('Forbidden', { status: 403 });
  }

  return module;
}

/**
 * Server-side guard: verifies the current user has access to the requested sub-module.
 * Queries the app_nav_sub_modules view (which pre-filters by auth.uid() and access level).
 * If no row is returned, the user has no access -- throws 403 Response.
 */
export async function requireSubModuleAccess(params: {
  client: SupabaseClient;
  moduleSlug: string;
  subModuleSlug: string;
  orgSlug: string;
}): Promise<NavSubModule> {
  const { data } = await params.client
    .from('app_nav_sub_modules')
    .select(
      'sub_module_id, org_id, module_slug, sub_module_slug, display_name, display_order',
    )
    .eq('org_id', params.orgSlug)
    .eq('module_slug', params.moduleSlug)
    .eq('sub_module_slug', params.subModuleSlug)
    .single();

  const subModule = data as unknown as NavSubModule | null;

  if (!subModule) {
    throw new Response('Forbidden', { status: 403 });
  }

  return subModule;
}
