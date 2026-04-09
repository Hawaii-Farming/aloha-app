import type { CustomCellRendererProps } from 'ag-grid-react';
import { format, parseISO } from 'date-fns';

const PALETTES = {
  emerald: { base: '#3ecf8e', light: '#1a7f54', dark: '#3ecf8e' },
  violet: { base: '#7e80e7', light: '#4b4dba', dark: '#9b9df0' },
  amber: { base: '#f3a23a', light: '#b06e10', dark: '#f3a23a' },
  blue: { base: '#47a8f8', light: '#1a6fbf', dark: '#6dc0ff' },
  rose: { base: '#e879a0', light: '#b84469', dark: '#f09ab8' },
  lime: { base: '#87cf2b', light: '#4e7a10', dark: '#a3e048' },
  purple: { base: '#a855f7', light: '#7c3aed', dark: '#c084fc' },
  gray: { base: '#737373', light: '#525252', dark: '#a3a3a3' },
  red: { base: '#ef4444', light: '#dc2626', dark: '#f87171' },
} as const;

export type PillColor = keyof typeof PALETTES;

const PALETTE_LIST = [
  PALETTES.emerald,
  PALETTES.violet,
  PALETTES.amber,
  PALETTES.blue,
  PALETTES.rose,
  PALETTES.lime,
] as const;

function hashPalette(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return PALETTE_LIST[Math.abs(hash) % PALETTE_LIST.length]!;
}

function isDarkMode(el: HTMLElement | null): boolean {
  if (!el) return false;
  const wrapper = el.closest('[data-ag-theme-mode]');
  return wrapper?.getAttribute('data-ag-theme-mode') === 'dark';
}

interface PillOptions {
  truncate?: boolean;
  justify?: 'start' | 'center';
}

function renderPill(
  value: string,
  palette: (typeof PALETTES)[PillColor],
  el: HTMLElement | null,
  options?: PillOptions,
) {
  const dark = isDarkMode(el);
  const accent = dark ? palette.dark : palette.light;
  const justify = options?.justify ?? 'center';

  return (
    <div
      className={`flex h-full items-center ${justify === 'center' ? 'justify-center' : ''}`}
    >
      <span
        className={`inline-flex items-center rounded-md text-[11px] font-medium ${options?.truncate ? 'truncate' : ''}`}
        style={{
          height: 22,
          paddingLeft: 8,
          paddingRight: 8,
          ...(options?.truncate ? { maxWidth: '100%' } : {}),
          backgroundColor: `${palette.base}1a`,
          border: `1px solid ${accent}50`,
          color: accent,
        }}
        title={options?.truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Creates a pill cell renderer with a fixed color palette.
 */
export function makePillRenderer(color: PillColor, options?: PillOptions) {
  return function PillCellRenderer(props: CustomCellRendererProps) {
    const raw = props.value as string | number | null | undefined;
    if (raw == null || raw === '') return null;
    return renderPill(String(raw), PALETTES[color], props.eGridCell, options);
  };
}

/**
 * Pill renderer with hash-based color (consistent color per unique value).
 */
export function HashPillRenderer(props: CustomCellRendererProps) {
  const raw = props.value as string | number | null | undefined;
  if (raw == null || raw === '') return null;

  const value = String(raw);
  const display =
    typeof raw === 'number'
      ? value
      : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return renderPill(display, hashPalette(value), props.eGridCell);
}

/**
 * Date pill renderer — formats ISO date string and renders as blue pill.
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

  return renderPill(display, PALETTES.blue, props.eGridCell);
}

/**
 * Email pill renderer — violet pill with truncation.
 */
export function EmailPillRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;
  return renderPill(value.toLowerCase(), PALETTES.violet, props.eGridCell, {
    truncate: true,
  });
}
