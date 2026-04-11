import { useSearchParams } from 'react-router';

import { format, parseISO } from 'date-fns';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';

interface PayPeriodFilterProps {
  periods: Record<string, unknown>[];
}

export function PayPeriodFilter({ periods }: PayPeriodFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStart = searchParams.get('period_start') ?? '';
  const currentEnd = searchParams.get('period_end') ?? '';
  const currentValue =
    currentStart && currentEnd ? `${currentStart}|${currentEnd}` : '';

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('period_start');
      next.delete('period_end');
    } else {
      const [start, end] = value.split('|');
      if (start && end) {
        next.set('period_start', start);
        next.set('period_end', end);
      }
    }
    setSearchParams(next, { preventScrollReset: true });
  };

  const formatLabel = (start: string, end: string): string => {
    try {
      return `${format(parseISO(start), 'MM/dd/yyyy')} - ${format(parseISO(end), 'MM/dd/yyyy')}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  return (
    <Select value={currentValue || 'all'} onValueChange={handleChange}>
      <SelectTrigger
        className="h-8 w-full min-w-0 rounded-md px-3 py-1 text-xs sm:w-[260px]"
        data-test="pay-period-filter"
      >
        <SelectValue placeholder="Select pay period" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Pay Periods</SelectItem>
        {periods.map((p) => {
          const start = String(p.pay_period_start ?? '');
          const end = String(p.pay_period_end ?? '');
          const key = `${start}|${end}`;
          return (
            <SelectItem key={key} value={key}>
              {formatLabel(start, end)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
