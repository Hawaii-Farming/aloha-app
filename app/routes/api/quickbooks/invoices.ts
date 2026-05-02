/**
 * GET /api/quickbooks/invoices?org=<org_id>
 *     [&from=YYYY-MM-DD][&to=YYYY-MM-DD]
 *
 * Pulls every QuickBooks Online invoice for the connected company. Returns
 * the raw Intuit Invoice objects (line items, customer ref, etc.) wrapped
 * with a count and the realm id used.
 *
 * Optional query params:
 *   from -- inclusive lower bound on TxnDate
 *   to   -- inclusive upper bound on TxnDate
 */
import {
  QuickbooksNotConnectedError,
  queryQuickbooks,
} from '~/lib/quickbooks/client.server';
import { requireUserLoader } from '~/lib/require-user-loader';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import type { Route } from '~/types/app/routes/api/quickbooks/+types/invoices';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get('org');
  if (!orgId) {
    throw new Response('Missing ?org=<org_id>', { status: 400 });
  }

  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (from && !ISO_DATE.test(from)) {
    throw new Response('from must be YYYY-MM-DD', { status: 400 });
  }
  if (to && !ISO_DATE.test(to)) {
    throw new Response('to must be YYYY-MM-DD', { status: 400 });
  }

  const user = await requireUserLoader(request);

  const supabase = getSupabaseServerClient(request);
  const { data: employee, error: empError } = await supabase
    .from('hr_employee')
    .select('id')
    .eq('user_id', user.sub)
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (empError || !employee) {
    throw new Response('Not a member of this org', { status: 403 });
  }

  const filters: string[] = [];
  if (from) filters.push(`TxnDate >= '${from}'`);
  if (to) filters.push(`TxnDate <= '${to}'`);
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const invoices = await queryQuickbooks<Record<string, unknown>>(
      orgId,
      'Invoice',
      whereClause,
    );
    return Response.json({ count: invoices.length, invoices });
  } catch (err) {
    if (err instanceof QuickbooksNotConnectedError) {
      return Response.json(
        { error: 'quickbooks_not_connected' },
        { status: 409 },
      );
    }
    console.error('[quickbooks/invoices] query failed:', err);
    throw new Response('QuickBooks query failed', { status: 502 });
  }
}
