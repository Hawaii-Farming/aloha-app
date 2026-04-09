import { castRows } from '~/lib/crud/typed-query.server';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

export const loader = async ({ request }: { request: Request }) => {
  const client = getSupabaseServerClient(request);
  const url = new URL(request.url);
  const employeeId = url.searchParams.get('employeeId');
  const orgId = url.searchParams.get('orgId');
  const periodStart = url.searchParams.get('periodStart');
  const periodEnd = url.searchParams.get('periodEnd');

  if (!orgId || !employeeId || !periodStart || !periodEnd) {
    return new Response(
      'orgId, employeeId, periodStart, and periodEnd are required',
      { status: 400 },
    );
  }

  const { data, error } = await client
    .from('ops_task_schedule' as never)
    .select(
      'id, start_time, stop_time, hr_employee_id, org_id, hr_employee!inner(hr_department(name)), ops_task!inner(name)',
    )
    .eq('org_id', orgId)
    .eq('hr_employee_id', employeeId)
    .eq('is_deleted', false)
    .not('start_time', 'is', null)
    .gte('start_time', `${periodStart}T00:00:00`)
    .lte('start_time', `${periodEnd}T23:59:59`)
    .order('start_time', { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = castRows(data);

  const enriched = rows.map((row) => {
    const start = row.start_time as string | null;
    const stop = row.stop_time as string | null;
    let hours: number | null = null;
    let dayOfWeek = '';
    let dateStr = '';
    let startTimeFormatted = '';
    let endTimeFormatted = '';

    if (start) {
      const startDate = new Date(start);
      dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'short' });
      dateStr = startDate.toISOString().split('T')[0] ?? '';
      startTimeFormatted = startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      if (stop) {
        const stopDate = new Date(stop);
        hours =
          Math.round(
            ((stopDate.getTime() - startDate.getTime()) / 3600000) * 100,
          ) / 100;
        endTimeFormatted = stopDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }
    }

    const emp = row.hr_employee as Record<string, unknown> | null | undefined;
    const dept = emp?.hr_department as
      | Record<string, unknown>
      | null
      | undefined;
    const task = row.ops_task as Record<string, unknown> | null | undefined;

    return {
      date: dateStr,
      day_of_week: dayOfWeek,
      department_name: (dept?.name as string) ?? '',
      task_name: (task?.name as string) ?? '',
      start_time_formatted: startTimeFormatted,
      end_time_formatted: endTimeFormatted,
      hours,
    };
  });

  return Response.json({ data: enriched });
};
