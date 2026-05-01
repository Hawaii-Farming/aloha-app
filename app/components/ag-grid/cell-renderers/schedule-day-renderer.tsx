import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * AG Grid cell renderer for day-of-week schedule columns.
 * Renders the farm (ops_task.farm_id) muted on the first line and the
 * start-end time range below.
 */
export function ScheduleDayRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  const farm = (props.data?.farm_name as string | null | undefined) ?? '';

  if (!value || value.trim() === '') {
    return (
      <span className="text-muted-foreground/40 flex h-full items-center">
        -
      </span>
    );
  }

  const compact = value.replace(/\s*-\s*/g, '-');

  return (
    <div className="flex h-full flex-col justify-center leading-tight">
      {farm ? (
        <span className="text-muted-foreground text-xs">{farm}</span>
      ) : null}
      <span className="font-mono text-sm">{compact}</span>
    </div>
  );
}
