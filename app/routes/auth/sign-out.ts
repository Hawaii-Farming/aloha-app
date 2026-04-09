import { redirect } from 'react-router';

import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

export async function action({ request }: { request: Request }) {
  const client = getSupabaseServerClient(request);

  await client.auth.signOut();

  return redirect('/auth/sign-in');
}
