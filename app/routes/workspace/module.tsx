import { redirect } from 'react-router';

import { castRows, queryUntypedView } from '~/lib/crud/typed-query.server';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { requireModuleAccess } from '~/lib/workspace/require-module-access.server';

// Modules whose landing page should pin to a specific sub-module
// rather than whichever sub-module has display_order=1 in hr_rba_navigation.
// Slugs are the Proper-Case URL segments — see app/config/module-icons.config.ts.
const MODULE_DEFAULT_SUB_MODULE: Record<string, string> = {
  'Human Resources': 'Register',
};

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

  // Get sub-modules for this module, ordered by display_order.
  // Uses the `hr_rba_navigation` view (one row per accessible sub-module) —
  // the previous query targeted `app_nav_sub_modules`, which doesn't exist
  // in the database and silently returned empty → false redirect to
  // `/home/{account}`.
  const { data } = await queryUntypedView(client, 'hr_rba_navigation')
    .select('sub_module_slug, sub_module_display_order')
    .eq('org_id', accountSlug)
    .eq('module_slug', moduleSlug)
    .order('sub_module_display_order');

  const subModules = castRows<{ sub_module_slug: string }>(data);

  // Module-specific landing override (e.g. HR → Register instead of
  // whichever sub-module has display_order=1). Falls through to the
  // standard first-by-display-order redirect if the override sub-module
  // is not in this user's accessible navigation (RBA blocked).
  const override = MODULE_DEFAULT_SUB_MODULE[moduleSlug];
  if (override && subModules.some((s) => s.sub_module_slug === override)) {
    throw redirect(`/home/${accountSlug}/${moduleSlug}/${override}`);
  }

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
