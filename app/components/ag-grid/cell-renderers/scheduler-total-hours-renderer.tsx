import type { CustomCellRendererProps } from 'ag-grid-react';

import { cn } from '@aloha/ui/utils';

/**
 * AG Grid cell renderer for the scheduler weekly Total Hours column.
 * Red when over the weekly OT threshold, default text color otherwise.
 */
export function SchedulerTotalHoursRenderer(props: CustomCellRendererProps) {
  const total = props.value as number | null | undefined;
  const otStatus = props.data?.ot_status as
    | 'below'
    | 'at'
    | 'above'
    | null
    | undefined;

  const totalRounded =
    typeof total === 'number' ? Math.round(total * 100) / 100 : null;

  const isOver = otStatus === 'above';

  return (
    <div className="flex h-full items-center justify-end leading-tight">
      <span
        className={cn(
          'font-mono text-sm font-medium tabular-nums',
          isOver && 'text-red-600 dark:text-red-400',
        )}
      >
        {totalRounded ?? '—'}
      </span>
    </div>
  );
}
