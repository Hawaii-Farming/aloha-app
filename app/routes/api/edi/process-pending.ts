/**
 * POST /api/edi/process-pending
 *
 * Replay handler for inbound 850 messages where the in-line apply step
 * during the inbound webhook hit a master-data gap. Walks every
 * sales_edi_inbound_message row where parsed_at IS NULL (regardless of
 * parse_error), re-runs parse + apply against the stored raw_body, and
 * updates parsed_at / parse_error / sales_po_id accordingly.
 *
 * Trigger this manually after adding sales_trading_partner or
 * sales_product_buyer_part rows that were missing on first delivery.
 * Safe to fire repeatedly -- the applier is idempotent on
 * (org_id, sales_trading_partner_id, po_number).
 *
 * Auth: same X-EDI-Secret shared header as POST /api/edi/inbound.
 */
import { EdiApplyError, apply850 } from '~/lib/edi/apply-850.server';
import {
  EdiAuthError,
  verifySecret,
} from '~/lib/edi/inbound-850-receiver.server';
import { parse850 } from '~/lib/edi/parse-850.server';
import { getSupabaseServerAdminClient } from '~/lib/supabase/clients/server-admin-client.server';
import type { Route } from '~/types/app/routes/api/edi/+types/process-pending';

const MAX_PER_RUN = 50;

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    verifySecret(request.headers.get('x-edi-secret'));
  } catch (err) {
    if (err instanceof EdiAuthError) {
      return new Response('Unauthorized', { status: 401 });
    }
    throw err;
  }

  const supabase = getSupabaseServerAdminClient();
  const { data: pending, error: fetchErr } = await supabase
    .from('sales_edi_inbound_message')
    .select('id, raw_body, document_type')
    .is('parsed_at', null)
    .eq('is_deleted', false)
    .order('received_at', { ascending: true })
    .limit(MAX_PER_RUN);

  if (fetchErr) {
    return Response.json(
      { error: `fetch_pending_failed: ${fetchErr.message}` },
      { status: 500 },
    );
  }

  const results: Array<{
    inboundMessageId: string;
    status: 'applied' | 'parse_error';
    salesPoId?: string;
    parseError?: string;
  }> = [];

  for (const row of pending ?? []) {
    if (row.document_type !== '850') continue; // skip 997s, 860s, etc. for now
    try {
      const parsed = parse850(row.raw_body as string);
      const applied = await apply850(parsed);
      await supabase
        .from('sales_edi_inbound_message')
        .update({
          parsed_at: new Date().toISOString(),
          sales_po_id: applied.sales_po_id,
          parse_error: null,
        })
        .eq('id', row.id);
      results.push({
        inboundMessageId: row.id as string,
        status: 'applied',
        salesPoId: applied.sales_po_id,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!(err instanceof EdiApplyError)) {
        console.error('[edi/process-pending] unexpected error:', err);
      }
      await supabase
        .from('sales_edi_inbound_message')
        .update({ parse_error: msg })
        .eq('id', row.id);
      results.push({
        inboundMessageId: row.id as string,
        status: 'parse_error',
        parseError: msg,
      });
    }
  }

  return Response.json({
    processed: results.length,
    applied: results.filter((r) => r.status === 'applied').length,
    failed: results.filter((r) => r.status === 'parse_error').length,
    results,
  });
}
