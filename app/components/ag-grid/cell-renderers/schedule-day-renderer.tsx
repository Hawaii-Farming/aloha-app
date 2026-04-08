import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * Parse a time range string like "09:00 - 17:00" and return the
 * duration in hours. Returns null if the format is unexpected.
 */
function parseHours(value: string): number | null {
  const match = value.match(/^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/);
  if (!match) return null;

  const startMinutes = Number(match[1]) * 60 + Number(match[2]);
  const endMinutes = Number(match[3]) * 60 + Number(match[4]);

  // Handle overnight shifts (end < start)
  const diff =
    endMinutes >= startMinutes
      ? endMinutes - startMinutes
      : 1440 - startMinutes + endMinutes;

  return diff / 60;
}

/**
 * Returns Tailwind class names for the pill based on shift duration.
 * - >= 8 hours: primary (full shift)
 * - < 6 hours: amber (short shift)
 * - 6-7.99 hours: muted (mid shift)
 */
function pillClasses(hours: number | null): string {
  if (hours !== null && hours >= 8) {
    return 'bg-primary/10 text-primary';
  }
  if (hours !== null && hours < 6) {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }
  return 'bg-muted text-muted-foreground';
}

/**
 * AG Grid cell renderer for day-of-week schedule columns.
 * Renders time ranges as styled pills color-coded by shift length.
 */
export function ScheduleDayRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;

  if (!value || value.trim() === '') {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-muted-foreground/40">-</span>
      </div>
    );
  }

  const hours = parseHours(value);
  const classes = pillClasses(hours);

  return (
    <div className="flex h-full items-center justify-center">
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${classes}`}
      >
        {value}
      </span>
    </div>
  );
}
