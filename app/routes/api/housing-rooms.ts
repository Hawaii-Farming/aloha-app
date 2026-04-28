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
    .from('org_site' as never)
    .select('id, name:id, max_beds, notes')
    .eq('org_id', orgId)
    .eq('site_id_parent', siteId)
    .eq('is_deleted', false)
    .order('id');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = castRows(data);
  const rooms = rows.map((row) => ({
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    max_beds: row.max_beds != null ? Number(row.max_beds) : null,
    notes: row.notes ? String(row.notes) : null,
  }));

  return Response.json({ data: rooms });
};
