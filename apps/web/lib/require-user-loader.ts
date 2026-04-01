import { redirect } from 'react-router';

import { requireUser } from '@aloha/supabase/require-user';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';

/**
 * @name requireUserLoader
 * @description Shortcut to require a user and redirect if not authenticated. To be used mostly in loaders or actions.
 * @param request
 */
export async function requireUserLoader(request: Request) {
  const client = getSupabaseServerClient(request);
  const auth = await requireUser(client);

  if (!auth.data || auth.error) {
    const nextPath = new URL(request.url).pathname;

    const redirectPath =
      auth.redirectTo + (nextPath ? `?next=${nextPath}` : '');

    throw redirect(redirectPath);
  }

  return auth.data;
}
