import { useLoaderData, useSearchParams } from 'react-router';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';

import { PayPeriodFilter } from '~/components/ag-grid/pay-period-filter';

export function PayrollDataFilterBar() {
  const loaderData = useLoaderData() as Record<string, unknown>;
  const payPeriods = (loaderData.payPeriods ?? []) as Record<string, unknown>[];
  const employees = (loaderData.employees ?? []) as Array<{
    value: string;
    label: string;
  }>;

  const [searchParams, setSearchParams] = useSearchParams();
  const currentEmployee = searchParams.get('employee') ?? '';

  const handleEmployeeChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('employee');
    } else {
      next.set('employee', value);
    }
    setSearchParams(next, { preventScrollReset: true });
  };

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2"
      data-test="payroll-data-filter-bar"
    >
      <div className="min-w-0 flex-1">
        <PayPeriodFilter periods={payPeriods} />
      </div>
      <Select
        value={currentEmployee || 'all'}
        onValueChange={handleEmployeeChange}
      >
        <SelectTrigger
          className="h-8 min-w-0 flex-1 rounded-md px-3 py-1 text-xs sm:w-[200px] sm:flex-initial"
          data-test="employee-filter"
        >
          <SelectValue placeholder="All employees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Employees</SelectItem>
          {employees.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
