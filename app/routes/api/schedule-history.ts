import { castRows } from '~/lib/crud/typed-query.server';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

export const loader = async ({ request }: { request: Request }) => {
  const client = getSupabaseServerClient(request);
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') ?? 'detail';
  const employeeId = url.searchParams.get('employeeId');
  const orgId = url.searchParams.get('orgId');

  if (!orgId) {
    return new Response('orgId required', { status: 400 });
  }

  if (mode === 'detail') {
    if (!employeeId) {
      return new Response('employeeId required for detail mode', {
        status: 400,
      });
    }

    const { data, error } = await client
      .from('ops_task_schedule' as never)
      .select(
        'id, start_time, stop_time, ops_task_id, hr_employee_id, org_id, farm_id, is_deleted, created_at, hr_employee!inner(hr_department(name), hr_work_authorization(name)), ops_task!inner(name), org_farm(name)',
      )
      .eq('org_id', orgId)
      .eq('hr_employee_id', employeeId)
      .eq('is_deleted', false)
      .order('start_time', { ascending: false })
      .limit(50);

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

      if (start) {
        const startDate = new Date(start);
        dayOfWeek = startDate.toLocaleDateString('en-US', {
          weekday: 'short',
        });
        dateStr = startDate.toISOString().split('T')[0] ?? '';

        if (stop) {
          const stopDate = new Date(stop);
          hours =
            Math.round(
              ((stopDate.getTime() - startDate.getTime()) / 3600000) * 100,
            ) / 100;
        }
      }

      const startTime = start
        ? new Date(start).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '';
      const endTime = stop
        ? new Date(stop).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '';

      const emp = row.hr_employee as Record<string, unknown> | null | undefined;
      const dept = emp?.hr_department as
        | Record<string, unknown>
        | null
        | undefined;
      const wa = emp?.hr_work_authorization as
        | Record<string, unknown>
        | null
        | undefined;
      const task = row.ops_task as Record<string, unknown> | null | undefined;
      const farm = row.org_farm as Record<string, unknown> | null | undefined;

      return {
        ...row,
        day_of_week: dayOfWeek,
        date: dateStr,
        start_time_formatted: startTime,
        end_time_formatted: endTime,
        hours,
        department_name: (dept?.name as string) ?? '',
        stat: (wa?.name as string) ?? '',
        task_name: (task?.name as string) ?? (row.ops_task_id as string),
        farm_name: (farm?.name as string) ?? '',
      };
    });

    return Response.json({ data: enriched });
  }

  if (mode === 'summary') {
    const { data, error } = await client
      .from('ops_task_schedule' as never)
      .select('start_time, stop_time, hr_employee_id')
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .not('start_time', 'is', null)
      .is('ops_task_tracker_id' as never, null)
      .order('start_time', { ascending: false })
      .limit(500);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const rows = castRows(data);

    const byDate = new Map<
      string,
      { employees: Set<string>; totalHours: number }
    >();

    for (const row of rows) {
      const start = row.start_time as string | null;
      const stop = row.stop_time as string | null;
      const empId = row.hr_employee_id as string;

      if (!start) continue;

      const dateKey = new Date(start).toISOString().split('T')[0] ?? '';
      const entry = byDate.get(dateKey) ?? {
        employees: new Set<string>(),
        totalHours: 0,
      };

      entry.employees.add(empId);

      if (stop) {
        const hours =
          (new Date(stop).getTime() - new Date(start).getTime()) / 3600000;
        entry.totalHours += hours;
      }

      byDate.set(dateKey, entry);
    }

    const summary = Array.from(byDate.entries())
      .map(([date, entry]) => ({
        date,
        employee_count: entry.employees.size,
        total_hours: Math.round(entry.totalHours * 100) / 100,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return Response.json({ data: summary });
  }

  return new Response('Invalid mode', { status: 400 });
};
