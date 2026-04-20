import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * AG Grid cell renderer for hours values — plain numeric text.
 */
export function HoursHeatmapRenderer(props: CustomCellRendererProps) {
  const value = props.value as number | null | undefined;
  if (value === null || value === undefined) return null;

  return (
    <span className="flex h-full items-center font-mono text-sm">{value}</span>
  );
}
