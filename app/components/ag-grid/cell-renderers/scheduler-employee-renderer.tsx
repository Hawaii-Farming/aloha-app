import type { CustomCellRendererProps } from 'ag-grid-react';

import { Badge } from '@aloha/ui/badge';

interface SchedulerRow {
  full_name?: string;
  department_name?: string;
  work_authorization_name?: string;
  task?: string;
  farm_name?: string;
}

/**
 * Employee cell renderer for the scheduler grid.
 * Shows full name on top, dept + stat + task as badges below.
 */
export function SchedulerEmployeeRenderer(props: CustomCellRendererProps) {
  const data = props.data as SchedulerRow | undefined;
  if (!data) return null;

  const { full_name, department_name, work_authorization_name, task, farm_name } =
    data;

  return (
    <div className="flex h-full flex-col justify-center gap-0.5 overflow-hidden py-1">
      <span className="truncate text-sm leading-tight font-medium">
        {full_name}
      </span>
      <div className="flex items-center gap-1 overflow-hidden">
        {farm_name && (
          <Badge
            variant="outline"
            className="h-4 shrink-0 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] leading-none text-emerald-600 dark:text-emerald-400"
          >
            {farm_name}
          </Badge>
        )}
        {department_name && (
          <Badge
            variant="secondary"
            className="h-4 shrink-0 px-1.5 text-[10px] leading-none"
          >
            {department_name}
          </Badge>
        )}
        {work_authorization_name && (
          <Badge
            variant="outline"
            className="h-4 max-w-[80px] truncate px-1.5 text-[10px] leading-none"
          >
            {work_authorization_name}
          </Badge>
        )}
        {task && (
          <Badge
            variant="secondary"
            className="h-4 shrink-0 px-1.5 text-[10px] leading-none"
          >
            {task}
          </Badge>
        )}
      </div>
    </div>
  );
}
