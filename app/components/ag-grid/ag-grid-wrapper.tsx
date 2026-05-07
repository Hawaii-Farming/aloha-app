import { Suspense, lazy } from 'react';

import { ClientOnly } from '@aloha/ui/client-only';

import type { AgGridInnerProps } from '~/components/ag-grid/ag-grid-inner';

// Dynamic import keeps AG Grid (and AllCommunityModule) out of the SSR
// bundle and out of the initial client chunk. The grid module is fetched
// on-demand the first time a list view mounts.
const AgGridInner = lazy(() => import('~/components/ag-grid/ag-grid-inner'));

type AgGridWrapperProps = AgGridInnerProps;

export type { AgGridWrapperProps };

export function AgGridWrapper(props: AgGridWrapperProps) {
  return (
    <ClientOnly fallback={<GridSkeleton />}>
      <Suspense fallback={<GridSkeleton />}>
        <AgGridInner {...props} />
      </Suspense>
    </ClientOnly>
  );
}

function GridSkeleton() {
  return (
    <div className="animate-pulse" data-test="ag-grid-skeleton">
      <div className="bg-muted h-10 rounded" />
      <div className="bg-muted/50 mt-1 h-8 rounded" />
      <div className="bg-muted/50 mt-1 h-8 rounded" />
      <div className="bg-muted/50 mt-1 h-8 rounded" />
      <div className="bg-muted/50 mt-1 h-8 rounded" />
      <div className="bg-muted/50 mt-1 h-8 rounded" />
    </div>
  );
}
