import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * Color palettes matching the brand button pattern:
 * - bg: base color at ~10% opacity (translucent fill)
 * - light: darker accent for border+text in light mode
 * - dark: brighter/fluo accent for border+text in dark mode
 */
const PALETTES = [
  { base: '#3ecf8e', light: '#1a7f54', dark: '#3ecf8e' }, // emerald
  { base: '#7e80e7', light: '#4b4dba', dark: '#9b9df0' }, // violet
  { base: '#f3a23a', light: '#b06e10', dark: '#f3a23a' }, // amber
  { base: '#47a8f8', light: '#1a6fbf', dark: '#6dc0ff' }, // blue
  { base: '#e879a0', light: '#b84469', dark: '#f09ab8' }, // rose
  { base: '#87cf2b', light: '#4e7a10', dark: '#a3e048' }, // lime
] as const;

function paletteForValue(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length]!;
}

function isDarkMode(el: HTMLElement | null): boolean {
  if (!el) return false;
  const wrapper = el.closest('[data-ag-theme-mode]');
  return wrapper?.getAttribute('data-ag-theme-mode') === 'dark';
}

/**
 * AG Grid cell renderer — brand-style pill with translucent fill,
 * colored border and text. Same aesthetic as the "+ Create" button.
 * Consistent color per value (hash-based).
 */
export function BadgeCellRenderer(props: CustomCellRendererProps) {
  const raw = props.value as string | number | null | undefined;
  if (raw == null || raw === '') return null;

  const value = String(raw);
  const display =
    typeof raw === 'number'
      ? value
      : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  const palette = paletteForValue(value);
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
        {display}
      </span>
    </div>
  );
}
