import { redirect } from 'react-router';

import pathsConfig from '~/config/paths.config';
import { requireUserLoader } from '~/lib/require-user-loader';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

interface OrgRow {
  org_id: string;
  org_name: string;
}

export async function homeLoader(request: Request) {
  const client = getSupabaseServerClient(request);
  await requireUserLoader(request);

  const { data, error } = await client
    .from('app_user_orgs' as const)
    .select('org_id, org_name');

  const orgs = data as OrgRow[] | null;

  if (error || !orgs || orgs.length === 0) {
    return redirect('/no-access');
  }

  if (orgs.length === 1) {
    const orgId = orgs[0]!.org_id;

    return redirect(pathsConfig.app.accountHome.replace('[account]', orgId));
  }

  return { orgs };
}
