import { useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function ReactQueryProvider(props: React.PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5 min staleTime — most React Query usage is reference data
            // (FK dropdowns, org lists) that rarely changes within a
            // session. Avoids unnecessary refetches on tab focus / nav.
            staleTime: 5 * 60 * 1000,
            // Don't refetch on window focus — disruptive for forms.
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
