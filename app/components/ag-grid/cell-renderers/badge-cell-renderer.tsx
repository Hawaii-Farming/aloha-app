import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * Pill color palettes using theme-compatible semantic colors.
 * Each palette: [bg, border, text] as Tailwind classes.
 */
const PALETTES = [
  // Emerald (accent)
  [
    'bg-emerald-50 dark:bg-emerald-950/40',
    'border-emerald-200 dark:border-emerald-800',
    'text-emerald-700 dark:text-emerald-300',
  ],
  // Slate (neutral)
  [
    'bg-slate-50 dark:bg-slate-900/40',
    'border-slate-200 dark:border-slate-700',
    'text-slate-600 dark:text-slate-300',
  ],
  // Blue
  [
    'bg-blue-50 dark:bg-blue-950/40',
    'border-blue-200 dark:border-blue-800',
    'text-blue-700 dark:text-blue-300',
  ],
  // Amber
  [
    'bg-amber-50 dark:bg-amber-950/40',
    'border-amber-200 dark:border-amber-800',
    'text-amber-700 dark:text-amber-300',
  ],
  // Violet
  [
    'bg-violet-50 dark:bg-violet-950/40',
    'border-violet-200 dark:border-violet-800',
    'text-violet-700 dark:text-violet-300',
  ],
  // Rose
  [
    'bg-rose-50 dark:bg-rose-950/40',
    'border-rose-200 dark:border-rose-800',
    'text-rose-700 dark:text-rose-300',
  ],
] as const;

function paletteForValue(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length]!;
}

/**
 * AG Grid cell renderer that displays categorical values as styled pills.
 * Consistent color per value (hash-based). Theme-aware light/dark.
 */
export function BadgeCellRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  const display = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  const [bg, border, text] = paletteForValue(value);

  return (
    <div className="flex h-full items-center">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${bg} ${border} ${text}`}
      >
        {display}
      </span>
    </div>
  );
}
