import type { CustomCellRendererProps } from 'ag-grid-react';

import { Badge } from '@aloha/ui/badge';

interface EmployeeRow {
  first_name?: string;
  last_name?: string;
  preferred_name?: string;
  gender?: string;
  wc?: string;
  hr_department_name?: string;
  hr_work_authorization_name?: string;
}

export function EmployeeCellRenderer(props: CustomCellRendererProps) {
  const data = props.data as EmployeeRow | undefined;
  if (!data) return null;

  const {
    first_name,
    last_name,
    preferred_name,
    gender,
    wc,
    hr_department_name,
    hr_work_authorization_name,
  } = data;

  const fullName = [first_name, last_name].filter(Boolean).join(' ');

  return (
    <div className="flex h-full flex-col justify-center gap-0.5 py-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm leading-tight font-medium">{fullName}</span>
        {preferred_name && (
          <span className="text-muted-foreground text-xs leading-tight italic">
            {preferred_name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {hr_department_name && (
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] leading-none"
          >
            {hr_department_name}
          </Badge>
        )}
        {hr_work_authorization_name && (
          <Badge
            variant="outline"
            className="h-4 px-1.5 text-[10px] leading-none"
          >
            {hr_work_authorization_name}
          </Badge>
        )}
        {wc && (
          <span className="text-muted-foreground text-[10px] leading-none">
            WC:{wc}
          </span>
        )}
        {gender && (
          <span className="text-muted-foreground text-[10px] leading-none capitalize">
            {gender}
          </span>
        )}
      </div>
    </div>
  );
}
