import type { CustomCellRendererProps } from 'ag-grid-react';
import { format, parseISO } from 'date-fns';

const PALETTE = { base: '#47a8f8', light: '#1a6fbf', dark: '#6dc0ff' }; // blue

function isDarkMode(el: HTMLElement | null): boolean {
  if (!el) return false;
  const wrapper = el.closest('[data-ag-theme-mode]');
  return wrapper?.getAttribute('data-ag-theme-mode') === 'dark';
}

/**
 * AG Grid cell renderer for date columns — renders as a styled pill
 * matching the scheduler day-pill aesthetic.
 */
export function DatePillRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  let display: string;
  try {
    display = format(parseISO(value), 'MM/dd/yyyy');
  } catch {
    return null;
  }

  const dark = isDarkMode(props.eGridCell);
  const accent = dark ? PALETTE.dark : PALETTE.light;

  return (
    <div className="flex h-full items-center justify-center">
      <span
        className="inline-flex items-center rounded-md text-[11px] font-medium"
        style={{
          height: 22,
          paddingLeft: 8,
          paddingRight: 8,
          backgroundColor: `${PALETTE.base}1a`,
          border: `1px solid ${accent}50`,
          color: accent,
        }}
      >
        {display}
      </span>
    </div>
  );
}
