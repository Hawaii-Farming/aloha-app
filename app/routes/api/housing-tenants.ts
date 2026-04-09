import { castRows } from '~/lib/crud/typed-query.server';
import { requireUserLoader } from '~/lib/require-user-loader';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

export const loader = async ({ request }: { request: Request }) => {
  await requireUserLoader(request);
  const client = getSupabaseServerClient(request);
  const url = new URL(request.url);
  const siteId = url.searchParams.get('siteId');
  const orgId = url.searchParams.get('orgId');

  if (!siteId || !orgId) {
    return new Response('siteId and orgId are required', { status: 400 });
  }

  const { data, error } = await client
    .from('hr_employee' as never)
    .select(
      'id, first_name, last_name, profile_photo_url, start_date, hr_department(name), hr_work_authorization(name)',
    )
    .eq('org_id', orgId)
    .eq('site_id', siteId)
    .eq('is_deleted', false)
    .order('last_name');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = castRows(data);
  const tenants = rows.map((row) => {
    const dept = row.hr_department as Record<string, unknown> | null;
    const workAuth = row.hr_work_authorization as Record<
      string,
      unknown
    > | null;
    return {
      id: row.id,
      full_name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
      profile_photo_url: row.profile_photo_url ?? null,
      department_name: (dept?.name as string) ?? '',
      start_date: row.start_date ?? null,
      work_authorization_name: (workAuth?.name as string) ?? '',
    };
  });

  return Response.json({ data: tenants });
};
