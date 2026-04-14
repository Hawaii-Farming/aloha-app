import type { CustomCellRendererProps } from 'ag-grid-react';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info';

/**
 * Kept for API compatibility with existing call sites; all statuses now
 * render as neutral plain text.
 */
export function getStatusVariant(_status: string): BadgeVariant {
  return 'secondary';
}

/**
 * AG Grid cell renderer — plain capitalized status text, no color.
 */
export function StatusBadgeRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  return (
    <span className="flex h-full items-center text-sm capitalize">{value}</span>
  );
}
