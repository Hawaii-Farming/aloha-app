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

  // Rooms are now `org_site_housing_area` rows scoped by housing_id.
  // The current schema only carries id + housing_id; max_beds and notes
  // are properties of the parent org_site_housing record, not the area.
  const { data, error } = await client
    .from('org_site_housing_area' as never)
    .select('id')
    .eq('org_id', orgId)
    .eq('housing_id', siteId)
    .eq('is_deleted', false)
    .order('id');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = castRows(data);
  const rooms = rows.map((row) => ({
    id: String(row.id ?? ''),
    name: String(row.id ?? ''),
    max_beds: null,
    notes: null,
  }));

  return Response.json({ data: rooms });
};
