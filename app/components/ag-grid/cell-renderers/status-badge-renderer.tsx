import type { CustomCellRendererProps } from 'ag-grid-react';

/**
 * AG Grid cell renderer — plain capitalized status text, no color.
 * Per UI-RULES.md "Tables": status badges render as neutral plain text.
 */
export function StatusBadgeRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  return (
    <span className="flex h-full items-center text-sm capitalize">{value}</span>
  );
}
