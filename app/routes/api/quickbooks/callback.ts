/**
 * GET /api/quickbooks/callback?code=...&state=...&realmId=...
 *
 * Intuit redirects here after the merchant authorizes. We:
 *   1. Verify the state cookie matches the returned state.
 *   2. Resolve org_id from the packed state and verify session membership.
 *   3. Exchange the auth code for access + refresh tokens.
 *   4. Upsert into org_quickbooks_token, recording connected_by = employee.id.
 *   5. Redirect back to the org settings page with a success flag.
 */
import { redirect } from 'react-router';

import {
  clearStateCookie,
  exchangeAuthCode,
  readStateCookie,
  upsertStoredToken,
} from '~/lib/quickbooks/client.server';
import { requireUserLoader } from '~/lib/require-user-loader';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import type { Route } from '~/types/app/routes/api/quickbooks/+types/callback';

function settingsRedirect(
  orgId: string,
  status: 'connected' | 'error',
  reason?: string,
) {
  const params = new URLSearchParams({ qb: status });
  if (reason) params.set('reason', reason);
  return `/home/${orgId}/settings?${params.toString()}`;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const realmId = url.searchParams.get('realmId');
  const oauthError = url.searchParams.get('error');

  if (oauthError) {
    // User declined or Intuit returned an error — recover org from state.
    const orgId = state?.split('.')[1];
    if (orgId) {
      throw redirect(settingsRedirect(orgId, 'error', oauthError), {
        headers: { 'Set-Cookie': clearStateCookie() },
      });
    }
    throw new Response(`OAuth error: ${oauthError}`, { status: 400 });
  }

  if (!code || !state || !realmId) {
    throw new Response('Missing code/state/realmId', { status: 400 });
  }

  const cookieState = readStateCookie(request);
  if (!cookieState || cookieState !== state) {
    throw new Response('Invalid OAuth state', {
      status: 400,
      headers: { 'Set-Cookie': clearStateCookie() },
    });
  }

  const orgId = state.split('.')[1];
  if (!orgId) {
    throw new Response('Malformed state', {
      status: 400,
      headers: { 'Set-Cookie': clearStateCookie() },
    });
  }

  const user = await requireUserLoader(request);

  // Find the employee row for this user in this org — used as connected_by.
  const supabase = getSupabaseServerClient(request);
  const { data: employee, error: empError } = await supabase
    .from('hr_employee')
    .select('id')
    .eq('user_id', user.sub)
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (empError || !employee) {
    throw new Response('Not a member of this org', {
      status: 403,
      headers: { 'Set-Cookie': clearStateCookie() },
    });
  }

  try {
    const tokens = await exchangeAuthCode(code);
    await upsertStoredToken({
      orgId,
      realmId,
      tokens,
      connectedBy: employee.id,
    });
  } catch (err) {
    console.error('[quickbooks/callback] token exchange failed:', err);
    throw redirect(settingsRedirect(orgId, 'error', 'token_exchange_failed'), {
      headers: { 'Set-Cookie': clearStateCookie() },
    });
  }

  return redirect(settingsRedirect(orgId, 'connected'), {
    headers: { 'Set-Cookie': clearStateCookie() },
  });
}
