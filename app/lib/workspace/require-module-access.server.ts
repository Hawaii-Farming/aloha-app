import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AppNavModule as NavModule,
  AppNavSubModule as NavSubModule,
  AppNavigationRow,
} from '~/lib/workspace/types';

/**
 * Server-side guard: verifies the current user has access to the requested module.
 * Queries the app_navigation view (which pre-filters by auth.uid() and all 3 layers).
 * If no row is returned, the user has no access — throws 403 Response.
 */
export async function requireModuleAccess(params: {
  client: SupabaseClient;
  moduleSlug: string;
  orgSlug: string;
}): Promise<NavModule> {
  const { data, error } = await params.client
    .from('app_navigation')
    .select('*')
    .eq('org_id', params.orgSlug)
    .eq('module_slug', params.moduleSlug)
    .limit(1)
    .maybeSingle();

  // PGRST116 = no rows matched. That's a real 403 (no access).
  // Anything else is an unexpected error and should surface as 500.
  if (error && error.code !== 'PGRST116') {
    console.error(
      `[requireModuleAccess] DB error for ${params.orgSlug}/${params.moduleSlug}:`,
      error,
    );
    throw new Response('Internal Server Error', { status: 500 });
  }

  const row = data as unknown as AppNavigationRow | null;

  if (!row) {
    throw new Response('Forbidden', { status: 403 });
  }

  return {
    module_id: row.module_id,
    org_id: row.org_id,
    module_slug: row.module_slug,
    display_name: row.module_display_name,
    display_order: row.module_display_order,
    can_edit: row.can_edit,
    can_delete: row.can_delete,
    can_verify: row.can_verify,
  };
}

/**
 * Server-side guard: verifies the current user has access to the requested sub-module.
 * Queries the app_navigation view filtered by org + module + sub-module.
 * If no row is returned, the user has no access — throws 403 Response.
 */
export async function requireSubModuleAccess(params: {
  client: SupabaseClient;
  moduleSlug: string;
  subModuleSlug: string;
  orgSlug: string;
}): Promise<NavSubModule> {
  const { data, error } = await params.client
    .from('app_navigation')
    .select('*')
    .eq('org_id', params.orgSlug)
    .eq('module_slug', params.moduleSlug)
    .eq('sub_module_slug', params.subModuleSlug)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error(
      `[requireSubModuleAccess] DB error for ${params.orgSlug}/${params.moduleSlug}/${params.subModuleSlug}:`,
      error,
    );
    throw new Response('Internal Server Error', { status: 500 });
  }

  const row = data as unknown as AppNavigationRow | null;

  if (!row) {
    throw new Response('Forbidden', { status: 403 });
  }

  return {
    sub_module_id: row.sub_module_id,
    org_id: row.org_id,
    module_slug: row.module_slug,
    sub_module_slug: row.sub_module_slug,
    display_name: row.sub_module_display_name,
    display_order: row.sub_module_display_order,
  };
}
