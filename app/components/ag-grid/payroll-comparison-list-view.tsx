import type { ListViewProps } from '~/lib/crud/types';

// Stub component — replaced by Plan 04-02 with full payroll comparison grid
export default function PayrollComparisonListView(props: ListViewProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-muted-foreground text-sm">
        Payroll Comparison view ({props.tableData.totalCount} records)
      </p>
    </div>
  );
}
