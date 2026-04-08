import type { CustomCellRendererProps } from 'ag-grid-react';

import { Badge } from '@aloha/ui/badge';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info';

const statusVariantMap: Record<string, BadgeVariant> = {
  approved: 'success',
  active: 'success',
  pending: 'warning',
  denied: 'destructive',
  rejected: 'destructive',
  inactive: 'outline',
};

/**
 * Maps a status string to the corresponding Shadcn Badge variant.
 * Exported for unit testing.
 */
export function getStatusVariant(status: string): BadgeVariant {
  return statusVariantMap[status.toLowerCase()] ?? 'secondary';
}

/**
 * AG Grid cell renderer that displays a status value as a styled Shadcn Badge.
 * Returns null for falsy values to render an empty cell.
 */
export function StatusBadgeRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  return (
    <Badge variant={getStatusVariant(value)} className="capitalize">
      {value}
    </Badge>
  );
}
