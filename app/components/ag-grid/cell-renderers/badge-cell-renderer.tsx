import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * Color palettes: [bg, text]
 * Solid filled pills like the Create button style.
 */
const PALETTES = [
  ['#3ecf8e', '#ffffff'], // emerald
  ['#7e80e7', '#ffffff'], // violet
  ['#f3a23a', '#ffffff'], // amber
  ['#47a8f8', '#ffffff'], // blue
  ['#e879a0', '#ffffff'], // rose
  ['#87cf2b', '#ffffff'], // lime
] as const;

function paletteForValue(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length]!;
}

/**
 * AG Grid cell renderer — solid filled pill with white text.
 * Same visual weight as the Create button. Consistent color per value.
 */
export function BadgeCellRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  const display = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  const [bg, text] = paletteForValue(value);

  return (
    <div className="flex h-full items-center">
      <span
        className="inline-flex items-center rounded-md text-[11px] font-medium"
        style={{
          height: 22,
          paddingLeft: 8,
          paddingRight: 8,
          backgroundColor: bg,
          color: text,
        }}
      >
        {display}
      </span>
    </div>
  );
}
