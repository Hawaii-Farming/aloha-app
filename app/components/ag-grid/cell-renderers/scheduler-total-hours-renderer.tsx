import type { CustomCellRendererProps } from 'ag-grid-react';

import { cn } from '@aloha/ui/utils';

/**
 * AG Grid cell renderer for the scheduler weekly Total Hrs column.
 *
 * Top line: weekly OT threshold from the view, small + muted, left-aligned.
 * Bottom line: actual total hours, larger, right-aligned. Amber when the
 * view flags `is_over_ot_threshold`.
 */
export function SchedulerTotalHoursRenderer(props: CustomCellRendererProps) {
  const total = props.value as number | null | undefined;
  const otThresholdWeekly = props.data?.ot_threshold_weekly as
    | number
    | null
    | undefined;
  const isOverOt = props.data?.is_over_ot_threshold as
    | boolean
    | null
    | undefined;

  const totalRounded =
    typeof total === 'number' ? Math.round(total * 100) / 100 : null;

  const showThreshold =
    typeof otThresholdWeekly === 'number' && otThresholdWeekly > 0;

  return (
    <div className="flex h-full flex-col justify-center leading-tight">
      {showThreshold ? (
        <span className="text-muted-foreground text-left text-[10px]">
          OT {otThresholdWeekly}
        </span>
      ) : null}
      <span
        className={cn(
          'text-right font-mono text-sm font-medium tabular-nums',
          isOverOt === true && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {totalRounded ?? '—'}
      </span>
    </div>
  );
}
