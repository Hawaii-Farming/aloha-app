import { redirect } from 'react-router';

import { createAuthCallbackService } from '@aloha/supabase/auth';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';

import pathsConfig from '~/config/paths.config';
import type { Route } from '~/types/app/routes/auth/+types/callback';

export async function loader({ request }: Route.LoaderArgs) {
  const service = createAuthCallbackService(getSupabaseServerClient(request));

  const { nextPath } = await service.exchangeCodeForSession(request, {
    redirectPath: pathsConfig.app.home,
  });

  return redirect(nextPath, {
    headers: request.headers,
  });
}
