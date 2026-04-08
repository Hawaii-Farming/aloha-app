import type { CustomCellRendererProps } from 'ag-grid-react';

import { Badge } from '@aloha/ui/badge';

interface SchedulerRow {
  full_name?: string;
  department_name?: string;
  work_authorization_name?: string;
  task?: string;
}

/**
 * Employee cell renderer for the scheduler grid.
 * Shows full name on top, dept + stat + task as badges below.
 */
export function SchedulerEmployeeRenderer(props: CustomCellRendererProps) {
  const data = props.data as SchedulerRow | undefined;
  if (!data) return null;

  const { full_name, department_name, work_authorization_name, task } = data;

  return (
    <div className="flex h-full flex-col justify-center gap-0.5 py-1">
      <span className="text-sm leading-tight font-medium">{full_name}</span>
      <div className="flex items-center gap-1">
        {department_name && (
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] leading-none"
          >
            {department_name}
          </Badge>
        )}
        {work_authorization_name && (
          <Badge
            variant="outline"
            className="h-4 px-1.5 text-[10px] leading-none"
          >
            {work_authorization_name}
          </Badge>
        )}
        {task && (
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] leading-none"
          >
            {task}
          </Badge>
        )}
      </div>
    </div>
  );
}
