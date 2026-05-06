import type { CustomCellRendererProps } from 'ag-grid-react';

import { cn } from '@aloha/ui/utils';

/**
 * AG Grid cell renderer for the scheduler weekly Total Hrs column.
 *
 * Top line: weekly OT threshold from the view, small + muted, left-aligned.
 * Bottom line: actual total hours, larger, right-aligned. Color follows the
 * view's `ot_status` (sum-of-tasks vs threshold at employee+week level):
 *   - below → emerald (healthy under)
 *   - at    → amber (at cap, no headroom)
 *   - above → red (overtime)
 */
export function SchedulerTotalHoursRenderer(props: CustomCellRendererProps) {
  const total = props.value as number | null | undefined;
  const otThresholdWeekly = props.data?.ot_threshold_weekly as
    | number
    | null
    | undefined;
  const otStatus = props.data?.ot_status as
    | 'below'
    | 'at'
    | 'above'
    | null
    | undefined;

  const totalRounded =
    typeof total === 'number' ? Math.round(total * 100) / 100 : null;

  const showThreshold =
    typeof otThresholdWeekly === 'number' && otThresholdWeekly > 0;

  const statusColor =
    otStatus === 'above'
      ? 'text-red-600 dark:text-red-400'
      : otStatus === 'at'
        ? 'text-amber-600 dark:text-amber-400'
        : otStatus === 'below'
          ? 'text-emerald-600 dark:text-emerald-400'
          : '';

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
          statusColor,
        )}
      >
        {totalRounded ?? '—'}
      </span>
    </div>
  );
}
