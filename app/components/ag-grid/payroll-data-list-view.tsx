import AgGridListView from '~/components/ag-grid/ag-grid-list-view';
import { RunPayrollButton } from '~/components/payroll/run-payroll-button';
import type { ListViewProps } from '~/lib/crud/types';

export default function PayrollDataListView(props: ListViewProps) {
  return (
    <>
      <RunPayrollButton accountSlug={props.accountSlug} />
      <AgGridListView {...props} />
    </>
  );
}
