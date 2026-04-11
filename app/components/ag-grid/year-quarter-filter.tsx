import { useSearchParams } from 'react-router';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';

interface YearQuarterFilterProps {
  years: number[];
}

export function YearQuarterFilter({ years }: YearQuarterFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = searchParams.get('year') ?? '';
  const currentQuarter = searchParams.get('quarter') ?? '';

  const handleYearChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('year');
    } else {
      next.set('year', value);
    }
    setSearchParams(next, { preventScrollReset: true });
  };

  const handleQuarterChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('quarter');
    } else {
      next.set('quarter', value);
    }
    setSearchParams(next, { preventScrollReset: true });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentYear || 'all'} onValueChange={handleYearChange}>
        <SelectTrigger
          className="h-8 w-[120px] rounded-md px-3 py-1 text-xs"
          data-test="year-filter"
        >
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={currentQuarter || 'all'}
        onValueChange={handleQuarterChange}
      >
        <SelectTrigger
          className="h-8 w-[100px] rounded-md px-3 py-1 text-xs"
          data-test="quarter-filter"
        >
          <SelectValue placeholder="Quarter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Q</SelectItem>
          <SelectItem value="1">Q1</SelectItem>
          <SelectItem value="2">Q2</SelectItem>
          <SelectItem value="3">Q3</SelectItem>
          <SelectItem value="4">Q4</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
