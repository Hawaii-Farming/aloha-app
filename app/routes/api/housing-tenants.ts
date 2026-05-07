import { castRows, queryUntypedView } from '~/lib/crud/typed-query.server';
import { requireUserLoader } from '~/lib/require-user-loader';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

export const loader = async ({ request }: { request: Request }) => {
  await requireUserLoader(request);
  const client = getSupabaseServerClient(request);
  const url = new URL(request.url);
  const siteId = url.searchParams.get('siteId');
  const orgId = url.searchParams.get('orgId');
  const available = url.searchParams.get('available');

  if (!orgId) {
    return new Response('orgId is required', { status: 400 });
  }

  // Eligible-employee picker for the "Assign tenant" drawer:
  //   - Currently employed (end_date NULL or in the future)
  //   - Not currently housed anywhere (housing_id IS NULL — strict, no
  //     double-counting across houses)
  // Stricter than the inverse of org_site_housing_tenants on purpose:
  // we don't want to assign housing to former employees that still carry
  // a stale housing_id (would be a data-cleanup artefact, not a free bed).
  if (available === 'true') {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await client
      .from('hr_employee')
      .select('id, first_name, last_name')
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .is('housing_id', null)
      .or(`end_date.is.null,end_date.gt.${today}`)
      .order('last_name');

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const result = (data ?? []).map((e) => ({
      id: e.id,
      full_name: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
    }));
    return Response.json({ data: result });
  }

  if (!siteId) {
    return new Response('siteId is required', { status: 400 });
  }

  // org_site_housing_tenants already filters to active assignments
  // (matches the active-tenant logic used by org_site_housing_tenant_count,
  // so detail-page counts agree with the list view).
  const { data: tenantRows, error: tenantError } = await queryUntypedView(
    client,
    'org_site_housing_tenants',
  )
    .select('hr_employee_id, first_name, last_name, start_date')
    .eq('org_id', orgId)
    .eq('housing_id', siteId)
    .order('last_name');

  if (tenantError) {
    return Response.json({ error: tenantError.message }, { status: 500 });
  }

  const tenants = castRows(tenantRows);
  const employeeIds = tenants
    .map((t) => t.hr_employee_id as string | undefined)
    .filter((id): id is string => !!id);

  // Enrich with display fields the view doesn't expose: photo, department
  // display name, work authorization name.
  const employeeDetails = new Map<string, Record<string, unknown>>();
  if (employeeIds.length > 0) {
    const { data: empData } = await client
      .from('hr_employee' as never)
      .select(
        'id, profile_photo_url, hr_department(name:id), hr_work_authorization(name:id)',
      )
      .in('id', employeeIds);

    for (const row of castRows(empData)) {
      employeeDetails.set(String(row.id), row);
    }
  }

  const result = tenants.map((row) => {
    const id = String(row.hr_employee_id ?? '');
    const detail = employeeDetails.get(id);
    const dept = detail?.hr_department as Record<string, unknown> | null;
    const workAuth = detail?.hr_work_authorization as Record<
      string,
      unknown
    > | null;
    return {
      id,
      full_name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
      profile_photo_url: (detail?.profile_photo_url as string | null) ?? null,
      department_name: (dept?.name as string) ?? '',
      start_date: (row.start_date as string | null) ?? null,
      work_authorization_name: (workAuth?.name as string) ?? '',
    };
  });

  return Response.json({ data: result });
};
