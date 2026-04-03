import React, { forwardRef } from 'react';

import { cn } from '../../lib/utils';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../shadcn/card';

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  description: string;
  image?: React.ReactNode;
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  function FeatureCardComponent(
    { className, label, description, image, children, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn('bg-muted/50 rounded', className)}
        {...props}
      >
        <CardHeader className="py-4">
          <CardTitle className="text-lg font-medium">{label}</CardTitle>

          <CardDescription className="text-muted-foreground max-w-xs text-sm tracking-tight">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {image}
          {children}
        </CardContent>
      </div>
    );
  },
);
