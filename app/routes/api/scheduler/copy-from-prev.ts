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

  if (!accountSlug || !weekStart) {
    return Response.json(
      { success: false, error: 'accountSlug and weekStart required' },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return Response.json(
      { success: false, error: 'weekStart must be YYYY-MM-DD' },
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

  const currentStart = new Date(`${weekStart}T00:00:00`);
  const currentEnd = new Date(currentStart);
  currentEnd.setDate(currentEnd.getDate() + 7);
  const prevStart = new Date(currentStart);
  prevStart.setDate(prevStart.getDate() - 7);

  const isoDate = (d: Date) => d.toISOString().split('T')[0];

  // Guard: current week must be empty (RLS-scoped — only sees what user can see).
  const { count: currentCount, error: currentErr } = await client
    .from('ops_task_schedule')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .gte('start_time', `${isoDate(currentStart)}T00:00:00`)
    .lt('start_time', `${isoDate(currentEnd)}T00:00:00`);

  if (currentErr) {
    return Response.json(
      { success: false, error: currentErr.message },
      { status: 500 },
    );
  }

  if ((currentCount ?? 0) > 0) {
    return Response.json(
      { success: false, error: 'Current week already has records' },
      { status: 409 },
    );
  }

  // Read prev week (RLS-scoped).
  const { data: prevRows, error: prevErr } = await client
    .from('ops_task_schedule')
    .select(
      'hr_employee_id, ops_task_id, ops_task_tracker_id, farm_id, start_time, stop_time, total_hours',
    )
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .gte('start_time', `${isoDate(prevStart)}T00:00:00`)
    .lt('start_time', `${isoDate(currentStart)}T00:00:00`);

  if (prevErr) {
    return Response.json(
      { success: false, error: prevErr.message },
      { status: 500 },
    );
  }

  if (!prevRows || prevRows.length === 0) {
    return Response.json(
      { success: false, error: 'Previous week has no records to copy' },
      { status: 404 },
    );
  }

  const shift = (ts: string | null) => {
    if (!ts) return null;
    const d = new Date(ts);
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  };

  const rows = prevRows.map((r) => ({
    org_id: orgId,
    hr_employee_id: r.hr_employee_id,
    ops_task_id: r.ops_task_id,
    ops_task_tracker_id: r.ops_task_tracker_id,
    farm_id: r.farm_id,
    start_time: shift(r.start_time)!,
    stop_time: shift(r.stop_time),
    total_hours: r.total_hours,
    created_by: employeeId,
    updated_by: employeeId,
  }));

  const { data, error } = await client
    .from('ops_task_schedule')
    .insert(rows)
    .select('id');

  if (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return Response.json({ success: true, copied: data?.length ?? 0 });
};
