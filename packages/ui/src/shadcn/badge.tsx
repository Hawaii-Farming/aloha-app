import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '../lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border-transparent px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        secondary: 'bg-muted text-muted-foreground',
        destructive: 'bg-semantic-red-bg text-semantic-red-fg',
        outline: 'bg-background text-foreground border border-border',
        success: 'bg-semantic-green-bg text-semantic-green-fg',
        warning: 'bg-semantic-amber-bg text-semantic-amber-fg',
        info: 'bg-semantic-blue-bg text-semantic-blue-fg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
