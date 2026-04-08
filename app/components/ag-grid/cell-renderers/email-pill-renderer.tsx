import type { CustomCellRendererProps } from 'ag-grid-react';

const PALETTE = { base: '#7e80e7', light: '#4b4dba', dark: '#9b9df0' }; // violet

function isDarkMode(el: HTMLElement | null): boolean {
  if (!el) return false;
  const wrapper = el.closest('[data-ag-theme-mode]');
  return wrapper?.getAttribute('data-ag-theme-mode') === 'dark';
}

/**
 * AG Grid cell renderer for email columns — renders as a styled pill
 * matching the scheduler day-pill aesthetic.
 */
export function EmailPillRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  const display = value.toLowerCase();
  const dark = isDarkMode(props.eGridCell);
  const accent = dark ? PALETTE.dark : PALETTE.light;

  return (
    <div className="flex h-full items-center">
      <span
        className="inline-flex items-center truncate rounded-md text-[11px] font-medium"
        style={{
          height: 22,
          paddingLeft: 8,
          paddingRight: 8,
          maxWidth: '100%',
          backgroundColor: `${PALETTE.base}1a`,
          border: `1px solid ${accent}50`,
          color: accent,
        }}
        title={display}
      >
        {display}
      </span>
    </div>
  );
}
