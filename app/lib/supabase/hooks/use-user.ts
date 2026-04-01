import { JwtPayload } from '@supabase/supabase-js';

import { useQuery } from '@tanstack/react-query';

import { requireUser } from '../require-user';
import { useSupabase } from './use-supabase';

const queryKey = ['supabase:user'];

export function useUser(initialData?: JwtPayload | null) {
  const client = useSupabase();

  const queryFn = async () => {
    const response = await requireUser(client);

    if (response.error) {
      return undefined;
    }

    return response.data;
  };

  return useQuery({
    queryFn,
    queryKey,
    initialData,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
