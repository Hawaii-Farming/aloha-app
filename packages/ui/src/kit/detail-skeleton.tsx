import { cn } from '../lib/utils/cn';
import { Skeleton } from '../shadcn/skeleton';

interface DetailSkeletonProps {
  fields?: number;
  className?: string;
}

export function DetailSkeleton({ fields = 6, className }: DetailSkeletonProps) {
  return (
    <div className={cn('space-y-6 p-6', className)} data-test="detail-skeleton">
      <Skeleton className="h-6 w-1/3" />

      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}
