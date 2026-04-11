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
      className="flex items-center gap-2"
      data-test="payroll-data-filter-bar"
    >
      <PayPeriodFilter periods={payPeriods} />
      <Select
        value={currentEmployee || 'all'}
        onValueChange={handleEmployeeChange}
      >
        <SelectTrigger
          className="h-8 w-[200px] rounded-md px-3 py-1 text-xs"
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
