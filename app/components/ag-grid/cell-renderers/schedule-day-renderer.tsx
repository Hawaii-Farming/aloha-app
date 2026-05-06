import type { CustomCellRendererProps } from 'ag-grid-react';

function to12h(hhmm: string): string {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hhmm;
  const h24 = Number(m[1]);
  const minutes = m[2]!;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return minutes === '00' ? `${h12}${period}` : `${h12}:${minutes}${period}`;
}

function formatRange(value: string): string {
  const parts = value.split(/\s*-\s*/);
  if (parts.length !== 2) return value;
  return `${to12h(parts[0]!)}-${to12h(parts[1]!)}`;
}

/**
 * AG Grid cell renderer for day-of-week schedule columns.
 * Renders the start-end time range as 12-hour AM/PM (e.g. "9a-5p").
 * Task is shown in a separate "Task" column since it's the same for the row.
 */
export function ScheduleDayRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;

  if (!value || value.trim() === '') {
    return (
      <span className="text-muted-foreground/40 flex h-full items-center justify-center">
        -
      </span>
    );
  }

  return (
    <span className="flex h-full items-center justify-center font-mono text-xs">
      {formatRange(value)}
    </span>
  );
}
