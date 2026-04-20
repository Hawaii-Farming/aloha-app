import type { CustomCellRendererProps } from 'ag-grid-react';

interface SchedulerRow {
  full_name?: string;
}

/**
 * Employee cell renderer for the scheduler grid. Single-line name — other
 * fields (department, work auth, farm, task) live in their own columns.
 */
export function SchedulerEmployeeRenderer(props: CustomCellRendererProps) {
  const data = props.data as SchedulerRow | undefined;
  if (!data) return null;

  return (
    <span className="flex h-full items-center truncate text-sm font-medium">
      {data.full_name}
    </span>
  );
}
