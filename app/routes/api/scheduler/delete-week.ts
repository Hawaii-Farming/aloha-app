import { addDaysToDate } from '~/lib/scheduler/wallclock-time';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';

export const action = async ({ request }: { request: Request }) => {
  if (request.method !== 'POST') {
    return Response.json(
      { success: false, error: 'Method not allowed' },
      { status: 405 },
    );
  }

  const client = getSupabaseServerClient(request);
  const body = (await request.json()) as Record<string, unknown>;

  const accountSlug = body.accountSlug as string | undefined;
  const weekStart = body.weekStart as string | undefined;
  const employeeId = body.employeeId as string | undefined;

  if (!accountSlug) {
    return Response.json(
      { success: false, error: 'accountSlug required' },
      { status: 400 },
    );
  }
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return Response.json(
      { success: false, error: 'weekStart (yyyy-MM-dd) required' },
      { status: 400 },
    );
  }

  const workspace = await loadOrgWorkspace({
    orgSlug: accountSlug,
    client,
    request,
  });
  const actingEmployeeId = workspace.currentOrg.employee_id;
  const orgId = workspace.currentOrg.org_id;

  const end = addDaysToDate(weekStart, 7);

  let query = client
    .from('ops_task_schedule')
    .update(
      { is_deleted: true, updated_by: actingEmployeeId },
      { count: 'exact' },
    )
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .gte('start_time', `${weekStart}T00:00:00`)
    .lt('start_time', `${end}T00:00:00`);

  if (employeeId) {
    query = query.eq('hr_employee_id', employeeId);
  }

  const { error, count } = await query;

  if (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return Response.json({ success: true, deleted: count ?? 0 });
};
