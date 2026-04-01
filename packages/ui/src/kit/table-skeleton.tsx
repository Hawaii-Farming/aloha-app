import { cn } from '../lib/utils/cn';
import { Skeleton } from '../shadcn/skeleton';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({
  columns = 5,
  rows = 10,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn('rounded-lg border', className)}
      data-test="table-skeleton"
    >
      <div className="flex items-center gap-4 border-b p-4">
        <Skeleton className="h-8 w-[250px]" />
      </div>

      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
