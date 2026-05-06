import { opsTaskScheduleWeeklySchema } from '~/lib/crud/ops-task-schedule.schema';
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
    // DB columns are plain TIMESTAMP (wall-clock, no time zone). The
    // value is stored verbatim as the user picked it.
    start_time: `${entry.date}T${entry.start_time}:00`,
    stop_time: `${entry.date}T${entry.stop_time}:00`,
    created_by: employeeId,
    updated_by: employeeId,
  }));

  // Replace-week semantics when `weekStart` is provided: hard-delete any
  // existing PLANNED rows (ops_task_tracker_id IS NULL) for this employee in
  // [weekStart, weekStart+7d) before inserting the new set. Hard delete is
  // required because `uq_ops_task_schedule_planned` is a partial unique index
  // that doesn't include `is_deleted` in its WHERE clause — a soft-delete
  // doesn't free the unique slot, so a subsequent insert with the same
  // (org_id, hr_employee_id, start_time) collides. Real time entries
  // (ops_task_tracker_id IS NOT NULL) are preserved.
  if (parsed.data.weekStart) {
    const start = parsed.data.weekStart;
    const end = addDaysToDate(start, 7);

    const { error: clearError } = await client
      .from('ops_task_schedule')
      .delete()
      .eq('org_id', orgId)
      .eq('hr_employee_id', parsed.data.hr_employee_id)
      .is('ops_task_tracker_id', null)
      .gte('start_time', `${start}T00:00:00`)
      .lt('start_time', `${end}T00:00:00`);

    if (clearError) {
      return Response.json(
        { success: false, error: clearError.message },
        { status: 500 },
      );
    }
  }

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
