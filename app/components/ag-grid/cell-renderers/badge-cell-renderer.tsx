import type { CustomCellRendererProps } from 'ag-grid-react';

import { Badge } from '@aloha/ui/badge';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const VARIANTS: BadgeVariant[] = [
  'secondary',
  'default',
  'outline',
  'destructive',
];

/**
 * Simple hash to consistently map a string value to a badge variant.
 * Same value always gets the same color.
 */
function variantForValue(value: string): BadgeVariant {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return VARIANTS[Math.abs(hash) % VARIANTS.length]!;
}

/**
 * AG Grid cell renderer that displays cell values as colored badges.
 * Use for categorical/repeated values like pay structure, status, type, etc.
 * Badge color is determined by the value — same value always gets the same color.
 */
export function BadgeCellRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  const display = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

  return (
    <div className="flex h-full items-center">
      <Badge variant={variantForValue(value)} className="text-[11px]">
        {display}
      </Badge>
    </div>
  );
}
