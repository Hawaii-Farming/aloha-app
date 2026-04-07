import { redirect } from 'react-router';

import pathsConfig from '~/config/paths.config';
import { castRows } from '~/lib/crud/typed-query.server';
import { requireUserLoader } from '~/lib/require-user-loader';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

export async function homeLoader(request: Request) {
  const client = getSupabaseServerClient(request);
  const user = await requireUserLoader(request);

  // Query hr_employee directly — RLS ensures org-scoped access
  const { data, error } = await client
    .from('hr_employee')
    .select('org_id, org:org!inner(name)')
    .eq('user_id', user.sub)
    .eq('is_deleted', false);

  const rows = castRows<{ org_id: string; org: { name: string } }>(data);

  if (error || rows.length === 0) {
    return redirect('/no-access');
  }

  if (rows.length === 1) {
    const orgId = rows[0]!.org_id;

    return redirect(pathsConfig.app.accountHome.replace('[account]', orgId));
  }

  return {
    orgs: rows.map((r) => ({ org_id: r.org_id, org_name: r.org.name })),
  };
}
