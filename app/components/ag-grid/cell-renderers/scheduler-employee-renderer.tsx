import type { CustomCellRendererProps } from 'ag-grid-react';

interface SchedulerRow {
  full_name?: string;
  subject_preferred_name?: string;
  preferred_name?: string;
}

/**
 * Employee cell renderer for the scheduler grid. Single-line name — other
 * fields (department, work auth, farm, task) live in their own columns.
 * Reads colDef value first (set via `field`), then falls back to common
 * row keys so the same renderer works across Scheduler (full_name from
 * view), Time Off / Employee Review (flattened embed: subject_preferred_name).
 */
export function SchedulerEmployeeRenderer(props: CustomCellRendererProps) {
  if (props.value) {
    return (
      <span className="flex h-full items-center truncate text-sm font-medium">
        {props.value as string}
      </span>
    );
  }

  const data = props.data as SchedulerRow | undefined;
  const name =
    data?.full_name ?? data?.subject_preferred_name ?? data?.preferred_name;
  if (!name) return null;

  return (
    <span className="flex h-full items-center truncate text-sm font-medium">
      {name}
    </span>
  );
}
