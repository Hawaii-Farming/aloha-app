'use client';

import { useAuthChangeListener } from '~/lib/supabase/hooks/use-auth-change-listener';

export function AuthProvider(props: React.PropsWithChildren) {
  useAuthChangeListener({ onEvent: () => {} });

  return props.children;
}
