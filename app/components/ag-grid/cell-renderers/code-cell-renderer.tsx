import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * AG Grid cell renderer — monospace text in a dark badge.
 * Used for IDs, codes, and other machine-readable values.
 */
export function CodeCellRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  return (
    <div className="flex h-full items-center">
      <span className="bg-foreground/10 border-foreground/20 inline-flex items-center rounded-md border px-2 font-mono text-[11px] leading-[22px] font-medium">
        {value}
      </span>
    </div>
  );
}
