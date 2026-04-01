import { SupabaseClient } from '@supabase/supabase-js';

import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@aloha/supabase/hooks/use-supabase';
import { LoadingOverlay } from '@aloha/ui/loading-overlay';

export function RolesDataProvider(props: {
  maxRoleHierarchy: number;
  children: (roles: string[]) => React.ReactNode;
}) {
  const rolesQuery = useFetchRoles(props);

  if (rolesQuery.isLoading) {
    return <LoadingOverlay fullPage={false} />;
  }

  if (rolesQuery.isError) {
    return null;
  }

  return <>{props.children(rolesQuery.data ?? [])}</>;
}

function useFetchRoles(props: { maxRoleHierarchy: number }) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['roles', props.maxRoleHierarchy],
    queryFn: async () => {
      // Phase 2 will replace with consumer schema types.
      const untypedClient = supabase as unknown as SupabaseClient;

      const { error, data } = await untypedClient
        .from('roles')
        .select('name')
        .gte('hierarchy_level', props.maxRoleHierarchy)
        .order('hierarchy_level', { ascending: true });

      if (error) {
        throw error;
      }

      return (data as Array<{ name: string }>).map((item) => item.name);
    },
  });
}
