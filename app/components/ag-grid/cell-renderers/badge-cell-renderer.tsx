import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * Color palettes: [dotColor, borderColor]
 * Matching the AG Grid HR demo style — colored dot + subtle border.
 */
const PALETTES = [
  ['#3ecf8e', '#3ecf8e50'], // emerald
  ['#7e80e7', '#7e80e751'], // violet
  ['#f3a23a', '#f3a33a53'], // amber
  ['#47a8f8', '#47a8f86c'], // blue
  ['#e879a0', '#e879a060'], // rose
  ['#87cf2b', '#88cf2b55'], // lime
] as const;

function paletteForValue(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length]!;
}

/**
 * AG Grid cell renderer — compact tag with colored dot and subtle border.
 * Matches the AG Grid HR demo tag style. Consistent color per value.
 */
export function BadgeCellRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  const display = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  const [dot, border] = paletteForValue(value);

  return (
    <div className="flex h-full items-center">
      <span
        className="inline-flex items-center rounded-md text-[12px] font-medium"
        style={{
          height: 24,
          paddingLeft: 4,
          paddingRight: 8,
          border: `1px solid ${border}`,
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
        }}
      >
        <span
          className="shrink-0 rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: dot,
            marginRight: 6,
            marginLeft: 2,
          }}
        />
        {display}
      </span>
    </div>
  );
}
