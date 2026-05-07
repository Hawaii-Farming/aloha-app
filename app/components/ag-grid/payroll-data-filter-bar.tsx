import { useLoaderData, useSearchParams } from 'react-router';

import { NavbarFilterButton } from '~/components/navbar-filter-button';
import { formatPayPeriodLabel } from '~/lib/format/pay-period';

export function PayrollDataFilterBar() {
  const loaderData = useLoaderData() as Record<string, unknown>;
  const payPeriods = (loaderData.payPeriods ?? []) as Record<string, unknown>[];

  const [searchParams, setSearchParams] = useSearchParams();
  const periodStart = searchParams.get('period_start') ?? '';
  const periodEnd = searchParams.get('period_end') ?? '';
  const showAll = searchParams.get('period') === 'all';

  // Mirror the loader's default-to-most-recent behaviour so the filter
  // chip reflects what's actually being queried.
  const defaultPeriod = (payPeriods[0] ?? {}) as Record<string, unknown>;
  const defaultStart = String(defaultPeriod.pay_period_start ?? '');
  const defaultEnd = String(defaultPeriod.pay_period_end ?? '');
  const effectiveStart = periodStart || (showAll ? '' : defaultStart);
  const effectiveEnd = periodEnd || (showAll ? '' : defaultEnd);
  const periodValue = showAll
    ? 'all'
    : effectiveStart && effectiveEnd
      ? `${effectiveStart}|${effectiveEnd}`
      : '';

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
            if (v === '' || v === 'all') {
              // Explicit "All" — opt out of the recent-period default.
              next.delete('period_start');
              next.delete('period_end');
              next.set('period', 'all');
            } else {
              const [start, end] = v.split('|');
              if (start && end) {
                next.set('period_start', start);
                next.set('period_end', end);
                next.delete('period');
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
