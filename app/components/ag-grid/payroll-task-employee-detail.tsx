import { useEffect, useState } from 'react';

import { useSupabase } from '~/lib/supabase/hooks/use-supabase';

type RowData = Record<string, unknown>;

interface Props {
  data: RowData; // parent task_comparison row
  accountSlug: string;
  isTeamLead: boolean;
}

const usdFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function fmtHours(v: unknown): string {
  if (v == null || v === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  if (n === 0) return '—';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

function fmtCurrency(v: unknown): string {
  if (v == null || v === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  if (n === 0) return '—';
  return usdFormat.format(n);
}

export function PayrollTaskEmployeeDetail({
  data,
  accountSlug,
  isTeamLead,
}: Props) {
  const supabase = useSupabase();
  const [rows, setRows] = useState<RowData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const task = data.task as string | undefined;
  const status = data.status as string | undefined;
  const checkDate = data.check_date as string | undefined;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!task || !checkDate) {
        setRows([]);
        return;
      }
      let query = supabase
        .from('hr_payroll_employee_comparison')
        .select('*')
        .eq('org_id', accountSlug)
        .eq('task', task)
        .eq('check_date', checkDate);
      if (status) query = query.eq('status', status);
      const { data: empRows, error: err } = await query;
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setRows([]);
        return;
      }
      const list = (empRows ?? []) as RowData[];
      const ids = Array.from(
        new Set(
          list
            .map((r) => r.hr_employee_id)
            .filter((id): id is string => typeof id === 'string' && !!id),
        ),
      );
      let enriched = list;
      if (ids.length > 0) {
        const { data: emps } = await supabase
          .from('hr_employee')
          .select('id, preferred_name, profile_photo_url')
          .in('id', ids);
        const empMap = new Map<string, RowData>();
        for (const e of (emps ?? []) as RowData[]) {
          empMap.set(String(e.id), e);
        }
        enriched = list.map((r) => {
          const emp = empMap.get(String(r.hr_employee_id ?? ''));
          if (!emp) return r;
          return {
            ...r,
            hr_employee_preferred_name: emp.preferred_name,
            hr_employee_profile_photo_url: emp.profile_photo_url,
          };
        });
      }
      enriched.sort((a, b) => {
        const an = String(a.hr_employee_preferred_name ?? '');
        const bn = String(b.hr_employee_preferred_name ?? '');
        return an.localeCompare(bn);
      });
      setRows(enriched);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, accountSlug, task, status, checkDate]);

  if (error) {
    return (
      <div className="text-destructive px-4 py-3 text-sm">
        Failed to load employee breakdown: {error}
      </div>
    );
  }
  if (rows === null) {
    return (
      <div className="text-muted-foreground px-4 py-3 text-sm">
        Loading employee breakdown…
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground px-4 py-3 text-sm">
        No employees logged hours on this task in the current period.
      </div>
    );
  }

  return (
    <div
      className="bg-muted/30 h-full overflow-auto px-3 py-2"
      data-test="payroll-task-employee-detail"
    >
      <table className="w-full text-sm">
        <thead className="text-muted-foreground border-border border-b text-xs uppercase">
          <tr>
            <th className="px-2 py-1.5 text-left font-medium">Employee</th>
            <th className="px-2 py-1.5 text-right font-medium">Total Hours</th>
            <th className="px-2 py-1.5 text-right font-medium">Scheduled</th>
            <th className="px-2 py-1.5 text-right font-medium">OT Hours</th>
            {!isTeamLead && (
              <>
                <th className="px-2 py-1.5 text-right font-medium">
                  Regular Pay
                </th>
                <th className="px-2 py-1.5 text-right font-medium">OT Pay</th>
                <th className="px-2 py-1.5 text-right font-medium">
                  Total Cost
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const name = String(
              r.hr_employee_preferred_name ?? r.hr_employee_id ?? '—',
            );
            return (
              <tr
                key={String(r.hr_employee_id ?? i)}
                className="border-border/60 hover:bg-muted/40 border-b last:border-b-0"
              >
                <td className="px-2 py-1.5 font-medium">{name}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {fmtHours(r.total_hours)}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {fmtHours(r.scheduled_hours)}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {fmtHours(r.discretionary_overtime_hours)}
                </td>
                {!isTeamLead && (
                  <>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {fmtCurrency(r.regular_pay)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {fmtCurrency(r.discretionary_overtime_pay)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {fmtCurrency(r.total_cost)}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
