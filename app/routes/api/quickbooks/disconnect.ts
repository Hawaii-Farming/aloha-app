/**
 * /api/quickbooks/disconnect?org=<org_id>
 *
 * Two ways the user lands here:
 *   a) From within aloha-app — user clicks "Disconnect QB" in settings.
 *      We have a session, so verify org membership, revoke the refresh
 *      token at Intuit, delete the local row, redirect to settings.
 *   b) From QuickBooks itself — Intuit opens this URL in the merchant's
 *      browser when they hit "Disconnect" inside QB. The merchant is
 *      logged into aloha-app in that browser, so the same flow works.
 *
 * Both GET (browser nav from QB) and POST (form submit from settings) hit
 * the same logic.
 */
import { redirect } from 'react-router';

import {
  deleteStoredToken,
  getStoredToken,
  revokeRefreshToken,
} from '~/lib/quickbooks/client.server';
import { requireUserLoader } from '~/lib/require-user-loader';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import type { Route } from '~/types/app/routes/api/quickbooks/+types/disconnect';

async function handle(request: Request) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get('org');
  if (!orgId) {
    throw new Response('Missing ?org=<org_id>', { status: 400 });
  }

  const user = await requireUserLoader(request);

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

  const stored = await getStoredToken(orgId);
  if (stored) {
    try {
      await revokeRefreshToken(stored.refresh_token);
    } catch (err) {
      // Best-effort revoke. If Intuit rejects it (e.g. already invalidated),
      // we still want to clear the local row so the UI shows "disconnected".
      console.warn('[quickbooks/disconnect] revoke failed:', err);
    }
    await deleteStoredToken(orgId);
  }

  return redirect(`/home/${orgId}/settings?qb=disconnected`);
}

export async function loader({ request }: Route.LoaderArgs) {
  return handle(request);
}

export async function action({ request }: Route.ActionArgs) {
  return handle(request);
}
