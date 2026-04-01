import { cn } from '../lib/utils/cn';
import { Skeleton } from '../shadcn/skeleton';

interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export function FormSkeleton({ fields = 5, className }: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)} data-test="form-skeleton">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      <Skeleton className="h-10 w-24" />
    </div>
  );
}
