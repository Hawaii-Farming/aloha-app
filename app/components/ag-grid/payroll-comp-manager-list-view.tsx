import type { ListViewProps } from '~/lib/crud/types';

// Stub component — replaced by Plan 04-03 with full comp manager grid
export default function PayrollCompManagerListView(props: ListViewProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-muted-foreground text-sm">
        Payroll Comp Manager view ({props.tableData.totalCount} records)
      </p>
    </div>
  );
}
