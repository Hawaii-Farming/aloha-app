import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * AG Grid cell renderer — monospace plain text.
 * Used for IDs, codes, and other machine-readable values.
 */
export function CodeCellRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  return (
    <span className="flex h-full items-center font-mono text-sm">{value}</span>
  );
}
