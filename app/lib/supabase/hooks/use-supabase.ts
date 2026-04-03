import { useMemo } from 'react';

import type { Database } from '~/lib/database.types';

import { getSupabaseBrowserClient } from '../clients/browser-client';

export function useSupabase<Db = Database>() {
  return useMemo(() => getSupabaseBrowserClient<Db>(), []);
}
