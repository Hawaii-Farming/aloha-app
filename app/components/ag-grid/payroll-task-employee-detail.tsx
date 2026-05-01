import { useEffect, useMemo, useRef, useState } from 'react';

import type { ColDef, GridApi } from 'ag-grid-community';
import type { AgGridReact } from 'ag-grid-react';

import { AgGridWrapper } from '~/components/ag-grid/ag-grid-wrapper';
import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import {
  CurrencyRenderer,
  hoursFormatter,
} from '~/components/ag-grid/payroll-formatters';
import { useSupabase } from '~/lib/supabase/hooks/use-supabase';

type RowData = Record<string, unknown>;

interface Props {
  data: RowData; // parent task_comparison row
  accountSlug: string;
  isTeamLead: boolean;
  parentGridRef: React.RefObject<AgGridReact | null>;
  detailRowId: string; // AG Grid row id of the full-width detail row
}

const HOURS_COLS: ColDef[] = [
  {
    headerName: '',
    field: 'hr_employee_profile_photo_url',
    cellRenderer: AvatarRenderer,
    maxWidth: 56,
    minWidth: 56,
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
    pinned: 'left',
  },
  {
    field: 'hr_employee_preferred_name',
    headerName: 'Employee',
    minWidth: 200,
    pinned: 'left',
  },
  {
    field: 'total_hours',
    headerName: 'Total Hours',
    type: 'numericColumn',
    minWidth: 110,
    valueFormatter: hoursFormatter,
  },
  {
    field: 'scheduled_hours',
    headerName: 'Scheduled',
    type: 'numericColumn',
    minWidth: 110,
    valueFormatter: hoursFormatter,
  },
  {
    field: 'discretionary_overtime_hours',
    headerName: 'OT Hours',
    type: 'numericColumn',
    minWidth: 110,
    valueFormatter: hoursFormatter,
  },
];

const DOLLAR_COLS: ColDef[] = [
  {
    field: 'regular_pay',
    headerName: 'Regular Pay',
    type: 'numericColumn',
    minWidth: 120,
    cellRenderer: CurrencyRenderer,
  },
  {
    field: 'discretionary_overtime_pay',
    headerName: 'OT Pay',
    type: 'numericColumn',
    minWidth: 120,
    cellRenderer: CurrencyRenderer,
  },
  {
    field: 'total_cost',
    headerName: 'Total Cost',
    type: 'numericColumn',
    minWidth: 120,
    cellRenderer: CurrencyRenderer,
  },
];

// Header (~40) + per-row (~36) + a little padding. Cap the auto-grow so
// huge breakdowns stay scrollable inside the detail rather than pushing
// the parent row off-screen.
const HEADER_PX = 48;
const ROW_PX = 36;
const MAX_DETAIL_HEIGHT = 360;
const MIN_DETAIL_HEIGHT = 80; // fits "Loading…" / "No employees…" copy

function measureDetailHeight(rowCount: number): number {
  if (rowCount === 0) return MIN_DETAIL_HEIGHT;
  return Math.min(HEADER_PX + rowCount * ROW_PX + 12, MAX_DETAIL_HEIGHT);
}

export function PayrollTaskEmployeeDetail({
  data,
  accountSlug,
  isTeamLead,
  parentGridRef,
  detailRowId,
}: Props) {
  const supabase = useSupabase();
  const gridRef = useRef<AgGridReact>(null);
  const [rows, setRows] = useState<RowData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resize the parent's full-width row to fit the detail content. Runs
  // whenever the row count changes (initial load, RBAC re-fetch, etc.).
  useEffect(() => {
    if (rows === null) return;
    const api = parentGridRef.current?.api as GridApi | undefined;
    if (!api) return;
    const node = api.getRowNode(detailRowId);
    if (!node) return;
    node.setRowHeight(measureDetailHeight(rows.length));
    api.onRowHeightChanged();
  }, [rows, parentGridRef, detailRowId]);

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

  const colDefs = useMemo(
    () => (isTeamLead ? HOURS_COLS : [...HOURS_COLS, ...DOLLAR_COLS]),
    [isTeamLead],
  );

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

  // Inner div needs an explicit pixel height — the h-full chain doesn't
  // propagate through AG Grid's full-width row cell wrapper. Same
  // formula as measureDetailHeight() used to resize the parent row, so
  // the two stay in sync.
  const innerHeight = measureDetailHeight(rows.length);

  return (
    <div
      className="bg-muted/30 px-2 py-2"
      style={{ height: innerHeight }}
      data-test="payroll-task-employee-detail"
    >
      <AgGridWrapper
        gridRef={gridRef}
        colDefs={colDefs}
        rowData={rows}
        pagination={false}
      />
    </div>
  );
}
