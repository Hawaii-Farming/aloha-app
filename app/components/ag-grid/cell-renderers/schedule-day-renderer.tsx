import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * AG Grid cell renderer for day-of-week schedule columns.
 * Plain-text time range, no coloring.
 */
export function ScheduleDayRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;

  if (!value || value.trim() === '') {
    return (
      <span className="text-muted-foreground/40 flex h-full items-center">
        -
      </span>
    );
  }

  const compact = value.replace(/\s*-\s*/g, '-');

  return (
    <span className="flex h-full items-center font-mono text-sm">
      {compact}
    </span>
  );
}
