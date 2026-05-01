import { useLoaderData, useSearchParams } from 'react-router';

import { NavbarFilterButton } from '~/components/navbar-filter-button';
import { formatPayPeriodLabel } from '~/lib/format/pay-period';

export function PayrollDataFilterBar() {
  const loaderData = useLoaderData() as Record<string, unknown>;
  const payPeriods = (loaderData.payPeriods ?? []) as Record<string, unknown>[];

  const [searchParams, setSearchParams] = useSearchParams();
  const periodStart = searchParams.get('period_start') ?? '';
  const periodEnd = searchParams.get('period_end') ?? '';
  const periodValue =
    periodStart && periodEnd ? `${periodStart}|${periodEnd}` : '';

  return (
    <NavbarFilterButton
      testKey="payroll-data-filter"
      filters={[
        {
          key: 'period',
          label: 'Pay Period',
          allLabel: 'All Pay Periods',
          value: periodValue,
          onChange: (v) => {
            const next = new URLSearchParams(searchParams);
            if (v === '') {
              next.delete('period_start');
              next.delete('period_end');
            } else {
              const [start, end] = v.split('|');
              if (start && end) {
                next.set('period_start', start);
                next.set('period_end', end);
              }
            }
            setSearchParams(next, { preventScrollReset: true });
          },
          options: payPeriods.map((p) => {
            const start = String(p.pay_period_start ?? '');
            const end = String(p.pay_period_end ?? '');
            return {
              value: `${start}|${end}`,
              label: formatPayPeriodLabel(start, end),
            };
          }),
        },
      ]}
    />
  );
}
