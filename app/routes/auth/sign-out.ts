import { redirect } from 'react-router';

import { parseCookieHeader } from '@supabase/ssr';

import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

export async function action({ request }: { request: Request }) {
  const client = getSupabaseServerClient(request);

  await client.auth.signOut();

  // Manually expire every Supabase auth cookie so the browser deletes them.
  // We cannot rely on the SDK's setAll() + getSetCookie() pipeline because
  // the appended Set-Cookie headers on request.headers are not reliably
  // propagated to the HTTP response on Cloud Run.
  const responseHeaders = new Headers();
  const cookies = parseCookieHeader(request.headers.get('Cookie') ?? '');

  for (const { name } of cookies) {
    if (name.startsWith('sb-')) {
      responseHeaders.append(
        'Set-Cookie',
        `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      );
    }
  }

  return redirect('/auth/sign-in', {
    headers: responseHeaders,
  });
}
