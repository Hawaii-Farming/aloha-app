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
 * Color palettes matching BadgeCellRenderer's brand style:
 * translucent fill, colored border + text.
 */
const FULL_SHIFT = { base: '#3ecf8e', light: '#1a7f54', dark: '#3ecf8e' }; // emerald (>= 8h)
const MID_SHIFT = { base: '#47a8f8', light: '#1a6fbf', dark: '#6dc0ff' }; // blue (6-8h)
const SHORT_SHIFT = { base: '#f3a23a', light: '#b06e10', dark: '#f3a23a' }; // amber (< 6h)

function getPalette(hours: number | null) {
  if (hours !== null && hours >= 8) return FULL_SHIFT;
  if (hours !== null && hours < 6) return SHORT_SHIFT;
  return MID_SHIFT;
}

function isDarkMode(el: HTMLElement | null): boolean {
  if (!el) return false;
  const wrapper = el.closest('[data-ag-theme-mode]');
  return wrapper?.getAttribute('data-ag-theme-mode') === 'dark';
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
  const palette = getPalette(hours);
  const dark = isDarkMode(props.eGridCell);
  const accent = dark ? palette.dark : palette.light;

  return (
    <div className="flex h-full items-center justify-center">
      <span
        className="inline-flex items-center rounded-md text-[11px] font-medium"
        style={{
          height: 22,
          paddingLeft: 8,
          paddingRight: 8,
          backgroundColor: `${palette.base}1a`,
          border: `1px solid ${accent}50`,
          color: accent,
        }}
      >
        {value}
      </span>
    </div>
  );
}
