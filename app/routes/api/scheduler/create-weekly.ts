import { opsTaskScheduleWeeklySchema } from '~/lib/crud/ops-task-schedule.schema';
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
  if (!accountSlug) {
    return Response.json(
      { success: false, error: 'accountSlug required' },
      { status: 400 },
    );
  }

  const parsed = opsTaskScheduleWeeklySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const workspace = await loadOrgWorkspace({
    orgSlug: accountSlug,
    client,
    request,
  });
  const employeeId = workspace.currentOrg.employee_id;
  const orgId = workspace.currentOrg.org_id;

  const rows = parsed.data.entries.map((entry) => ({
    org_id: orgId,
    hr_employee_id: parsed.data.hr_employee_id,
    ops_task_id: entry.ops_task_id,
    // Combine date + time into a local-time ISO string. The DB column is
    // timestamptz; the existing single-entry path already submits the
    // browser-local datetime-local string, so we follow that contract.
    start_time: `${entry.date}T${entry.start_time}:00`,
    stop_time: `${entry.date}T${entry.stop_time}:00`,
    created_by: employeeId,
    updated_by: employeeId,
  }));

  const { data, error } = await client
    .from('ops_task_schedule')
    .insert(rows)
    .select();

  if (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return Response.json({ success: true, count: data?.length ?? 0 });
};
