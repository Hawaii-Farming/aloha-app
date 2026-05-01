import type { CustomCellRendererProps } from 'ag-grid-react';

import { cn } from '@aloha/ui/utils';

/**
 * AG Grid cell renderer for the scheduler weekly Total Hrs column.
 *
 * Top line: expected value (OT threshold / 2 — biweekly half), small + muted, left-aligned.
 * Bottom line: actual total hours, larger, right-aligned. Amber when total
 * deviates from the expected value (soft warning).
 */
export function SchedulerTotalHoursRenderer(props: CustomCellRendererProps) {
  const total = props.value as number | null | undefined;
  const otThresholdWeekly = props.data?.ot_threshold_weekly as
    | number
    | null
    | undefined;

  const expected =
    typeof otThresholdWeekly === 'number' && otThresholdWeekly > 0
      ? otThresholdWeekly / 2
      : null;

  const totalRounded =
    typeof total === 'number' ? Math.round(total * 100) / 100 : null;

  const offTarget =
    expected !== null && totalRounded !== null && totalRounded !== expected;

  return (
    <div className="flex h-full flex-col justify-center leading-tight">
      {expected !== null ? (
        <span className="text-muted-foreground text-left text-[10px]">
          exp {expected}
        </span>
      ) : null}
      <span
        className={cn(
          'text-right font-mono text-sm font-medium tabular-nums',
          offTarget && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {totalRounded ?? '—'}
      </span>
    </div>
  );
}
