import { redirect } from 'react-router';

import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { requireModuleAccess } from '~/lib/workspace/require-module-access.server';

export const loader = async (args: {
  request: Request;
  params: Record<string, string>;
}) => {
  const accountSlug = args.params.account as string;
  const moduleSlug = args.params.module as string;
  const client = getSupabaseServerClient(args.request);

  // Verify module access (throws 403 if unauthorized)
  await requireModuleAccess({
    client,
    moduleSlug,
    orgSlug: accountSlug,
  });

  // Get sub-modules for this module, ordered by display_order
  // Cast to untyped client since app_nav_sub_modules view is not in generated types
  const { data } = await (client as unknown as SupabaseClient)
    .from('app_nav_sub_modules')
    .select(
      'sub_module_id, org_id, module_slug, sub_module_slug, display_name, display_order',
    )
    .eq('org_id', accountSlug)
    .eq('module_slug', moduleSlug)
    .order('display_order');

  const subModules =
    (data as unknown as Array<{ sub_module_slug: string }>) ?? [];

  if (subModules.length > 0) {
    const first = subModules[0]!;
    throw redirect(
      `/home/${accountSlug}/${moduleSlug}/${first.sub_module_slug}`,
    );
  }

  // No sub-modules available -- redirect to org home
  throw redirect(`/home/${accountSlug}`);
};

// This route always redirects, no component needed
export default function ModuleRedirect() {
  return null;
}
