import type { CustomCellRendererProps } from 'ag-grid-react';

interface EmployeeRow {
  first_name?: string;
  last_name?: string;
}

export function EmployeeCellRenderer(props: CustomCellRendererProps) {
  const data = props.data as EmployeeRow | undefined;
  if (!data) return null;

  const { first_name, last_name } = data;
  const fullName = [first_name, last_name].filter(Boolean).join(' ');

  return (
    <span className="flex h-full items-center truncate text-sm font-medium">
      {fullName}
    </span>
  );
}
