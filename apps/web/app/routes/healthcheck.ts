import { data } from 'react-router';

import { getSupabaseServerAdminClient } from '@aloha/supabase/server-admin-client';

export async function loader() {
  const isDbHealthy = await getSupabaseHealthCheck();

  return data({
    services: {
      database: isDbHealthy,
    },
  });
}

async function getSupabaseHealthCheck() {
  try {
    const client = getSupabaseServerAdminClient();

    // Simple auth health check -- verifies Supabase connection is alive
    const { error } = await client.auth.getSession();

    return !error;
  } catch {
    return false;
  }
}
