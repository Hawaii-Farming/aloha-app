/**
 * POST /api/edi/inbound
 *
 * Manual / admin upload path for an SPS Commerce 850 (Purchase Order)
 * XML payload. Archives to sales_edi_inbound_message, runs parse +
 * apply in-line, returns 202 with the inbound message id and the
 * resulting sales_po id when the parse succeeds.
 *
 * Auth: Supabase user session. Caller must be signed in with Owner or
 * Admin in at least one org. The bulk-delivery path will eventually
 * be the SFTP poller worker, which calls the same archive helper
 * directly without going through this HTTP route.
 *
 * Body: raw XML. Content-Type can be application/xml, text/xml, or
 * text/plain -- we just read the request as text.
 *
 * Optional headers (used for traceability if present):
 *   X-SPS-Message-Id   -- SPS-side message identifier
 *   X-SPS-Filename     -- original SFTP filename
 *
 * Responses:
 *   202 { inboundMessageId, salesPoId, status, parseError } on success
 *   400                                  malformed XML / missing required fields
 *   403                                  not Owner/Admin (via require-edi-admin)
 *   500                                  unexpected server / DB error
 */
import {
  EdiBadRequestError,
  archiveInbound850,
} from '~/lib/edi/inbound-850-receiver.server';
import { requireEdiAdmin } from '~/lib/edi/require-edi-admin.server';
import type { Route } from '~/types/app/routes/api/edi/+types/inbound';

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // requireEdiAdmin throws a redirect if not signed in, or a 403 Response
  // if signed in but not Owner/Admin. Both bubble up as the route response.
  const ctx = await requireEdiAdmin(request);

  try {
    const rawBody = await request.text();
    const result = await archiveInbound850({
      rawBody,
      orgId: ctx.orgId,
      spsMessageId: request.headers.get('x-sps-message-id'),
      sourceFilename: request.headers.get('x-sps-filename'),
    });

    let status: 'applied' | 'queued_unmapped' | 'parse_error';
    if (result.salesPoId) status = 'applied';
    else if (!result.salesTradingPartnerId) status = 'queued_unmapped';
    else status = 'parse_error';

    return Response.json(
      {
        inboundMessageId: result.inboundMessageId,
        salesTradingPartnerId: result.salesTradingPartnerId,
        tradingPartnerId: result.tradingPartnerId,
        documentType: result.documentType,
        salesPoId: result.salesPoId ?? null,
        parseError: result.parseError ?? null,
        status,
      },
      { status: 202 },
    );
  } catch (err) {
    if (err instanceof EdiBadRequestError) {
      return new Response(err.message, { status: 400 });
    }
    console.error('[edi/inbound] unexpected error:', err);
    return new Response('Server error', { status: 500 });
  }
}
