import { redirect } from 'react-router';

import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

export async function action({ request }: { request: Request }) {
  const client = getSupabaseServerClient(request);

  await client.auth.signOut();

  // Build a clean response Headers with only Set-Cookie values.
  // Passing the full request.headers object leaks request-only headers
  // (Cookie, Host, etc.) into the response, which can confuse proxies
  // (e.g. Google Cloud Run load balancer) and prevent cookie clearing.
  const responseHeaders = new Headers();

  for (const cookie of request.headers.getSetCookie()) {
    responseHeaders.append('Set-Cookie', cookie);
  }

  return redirect('/auth/sign-in', {
    headers: responseHeaders,
  });
}
