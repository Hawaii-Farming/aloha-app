import { castRows } from '~/lib/crud/typed-query.server';
import {
  addDaysToDate,
  dayOfWeekIndex,
  dayOfWeekName,
  diffHours,
  extractDate,
  extractHHmm,
} from '~/lib/scheduler/wallclock-time';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

export const loader = async ({ request }: { request: Request }) => {
  const client = getSupabaseServerClient(request);
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') ?? 'detail';
  const employeeId = url.searchParams.get('employeeId');
  const orgId = url.searchParams.get('orgId');
  const weekStart = url.searchParams.get('weekStart');

  if (!orgId) {
    return new Response('orgId required', { status: 400 });
  }

  if (mode === 'detail') {
    if (!employeeId) {
      return new Response('employeeId required for detail mode', {
        status: 400,
      });
    }

    let query = client
      .from('ops_task_schedule' as never)
      .select(
        'id, start_time, stop_time, ops_task_id, hr_employee_id, org_id, farm_id, is_deleted, created_at, hr_employee!inner(hr_department(name:id), hr_work_authorization(name:id)), ops_task!inner(name:id), org_farm(name:id)',
      )
      .eq('org_id', orgId)
      .eq('hr_employee_id', employeeId)
      .eq('is_deleted', false);

    if (weekStart && /^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      const end = addDaysToDate(weekStart, 7);
      query = query
        .gte('start_time', `${weekStart}T00:00:00`)
        .lt('start_time', `${end}T00:00:00`);
    }

    const { data, error } = await query
      .order('start_time', { ascending: false })
      .limit(50);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const rows = castRows(data);

    const enriched = rows.map((row) => {
      const start = row.start_time as string | null;
      const stop = row.stop_time as string | null;
      const dateStr = extractDate(start);
      const dayOfWeek = dateStr ? dayOfWeekName(dateStr) : '';
      const hours = diffHours(start, stop);
      const startTime = extractHHmm(start);
      const endTime = extractHHmm(stop);

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
    // Look back 13 weeks (~3 months) of schedule history.
    const today = new Date();
    const lookbackStart = new Date(today);
    lookbackStart.setDate(today.getDate() - 13 * 7);
    const lookbackStartIso = lookbackStart.toISOString().slice(0, 10);

    const { data, error } = await client
      .from('ops_task_schedule' as never)
      .select('start_time, stop_time, hr_employee_id')
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .not('start_time', 'is', null)
      .is('ops_task_tracker_id' as never, null)
      .gte('start_time', `${lookbackStartIso}T00:00:00`)
      .order('start_time', { ascending: false })
      .limit(10000);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const rows = castRows(data);

    const byWeek = new Map<
      string,
      { employees: Set<string>; totalHours: number }
    >();

    for (const row of rows) {
      const start = row.start_time as string | null;
      const stop = row.stop_time as string | null;
      const empId = row.hr_employee_id as string;

      const dateKey = extractDate(start);
      if (!dateKey) continue;

      const dow = dayOfWeekIndex(dateKey);
      if (dow < 0) continue;
      const weekStartKey = addDaysToDate(dateKey, -dow);

      const entry = byWeek.get(weekStartKey) ?? {
        employees: new Set<string>(),
        totalHours: 0,
      };

      entry.employees.add(empId);

      const hours = diffHours(start, stop);
      if (hours !== null) {
        entry.totalHours += hours;
      }

      byWeek.set(weekStartKey, entry);
    }

    const summary = Array.from(byWeek.entries())
      .map(([week_start, entry]) => ({
        week_start,
        employee_count: entry.employees.size,
        total_hours: Math.round(entry.totalHours),
      }))
      .sort((a, b) => b.week_start.localeCompare(a.week_start));

    return Response.json({ data: summary });
  }

  return new Response('Invalid mode', { status: 400 });
};
