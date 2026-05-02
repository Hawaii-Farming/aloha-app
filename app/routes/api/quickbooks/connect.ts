/**
 * GET /api/quickbooks/connect?org=<org_id>
 *
 * Starts the Intuit OAuth handshake. Verifies the signed-in user is an
 * employee of <org_id>, sets a short-lived CSRF state cookie, and 302s
 * to Intuit's authorize URL.
 */
import { redirect } from 'react-router';

import {
  buildStateCookie,
  generateState,
} from '~/lib/quickbooks/client.server';
import { getQuickbooksConfig } from '~/lib/quickbooks/config.server';
import { requireUserLoader } from '~/lib/require-user-loader';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import type { Route } from '~/types/app/routes/api/quickbooks/+types/connect';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get('org');
  if (!orgId) {
    throw new Response('Missing ?org=<org_id>', { status: 400 });
  }

  const user = await requireUserLoader(request);

  // Confirm the user actually belongs to the requested org. RLS would also
  // hide the row, but checking here gives a clean 403 instead of redirect-loop.
  const supabase = getSupabaseServerClient(request);
  const { data: employee, error } = await supabase
    .from('hr_employee')
    .select('id')
    .eq('user_id', user.sub)
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error || !employee) {
    throw new Response('Not a member of this org', { status: 403 });
  }

  const config = getQuickbooksConfig();
  const state = generateState();
  // Pack org_id into state so callback can find it without another cookie.
  const fullState = `${state}.${orgId}`;

  const authorizeUrl = new URL(config.authorizeUrl);
  authorizeUrl.searchParams.set('client_id', config.clientId);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', config.scope);
  authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
  authorizeUrl.searchParams.set('state', fullState);

  return redirect(authorizeUrl.toString(), {
    headers: { 'Set-Cookie': buildStateCookie(fullState) },
  });
}
