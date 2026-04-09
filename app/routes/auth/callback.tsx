import { redirect } from 'react-router';

import pathsConfig from '~/config/paths.config';
import { createAuthCallbackService } from '~/lib/supabase/auth';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import type { Route } from '~/types/app/routes/auth/+types/callback';

export async function loader({ request }: Route.LoaderArgs) {
  const service = createAuthCallbackService(getSupabaseServerClient(request));

  const { nextPath } = await service.exchangeCodeForSession(request, {
    redirectPath: pathsConfig.app.home,
  });

  // Extract only Set-Cookie headers for the response.
  // Passing request.headers directly leaks request-only headers (Cookie,
  // Host, etc.) into the response, which can confuse reverse proxies.
  const responseHeaders = new Headers();

  for (const cookie of request.headers.getSetCookie()) {
    responseHeaders.append('Set-Cookie', cookie);
  }

  return redirect(nextPath, {
    headers: responseHeaders,
  });
}
