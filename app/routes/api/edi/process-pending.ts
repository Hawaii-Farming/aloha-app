/**
 * POST /api/edi/process-pending
 *
 * Replay handler for inbound 850 messages where the in-line apply step
 * during initial receipt hit a master-data gap. Walks every
 * sales_edi_inbound_message row in the caller's org where parsed_at IS
 * NULL, re-runs parse + apply against the stored raw_body, and updates
 * parsed_at / parse_error / sales_po_id accordingly.
 *
 * Trigger this manually after adding sales_trading_partner or
 * sales_product_buyer_part rows that were missing on first delivery.
 * Safe to fire repeatedly -- the applier is idempotent on
 * (org_id, sales_trading_partner_id, po_number).
 *
 * Auth: Supabase user session, Owner or Admin level.
 */
import { EdiApplyError, apply850 } from '~/lib/edi/apply-850.server';
import { parse850 } from '~/lib/edi/parse-850.server';
import { requireEdiAdmin } from '~/lib/edi/require-edi-admin.server';
import { getSupabaseServerAdminClient } from '~/lib/supabase/clients/server-admin-client.server';
import type { Route } from '~/types/app/routes/api/edi/+types/process-pending';

const MAX_PER_RUN = 50;

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const ctx = await requireEdiAdmin(request);

  const supabase = getSupabaseServerAdminClient();
  const { data: pending, error: fetchErr } = await supabase
    .from('sales_edi_inbound_message')
    .select('id, raw_body, document_type')
    .eq('org_id', ctx.orgId)
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
    orgId: ctx.orgId,
    processed: results.length,
    applied: results.filter((r) => r.status === 'applied').length,
    failed: results.filter((r) => r.status === 'parse_error').length,
    results,
  });
}
