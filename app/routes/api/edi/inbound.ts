/**
 * POST /api/edi/inbound
 *
 * Receives an SPS Commerce 850 (Purchase Order) XML payload, archives
 * it to sales_edi_inbound_message, and returns 202 with the inbound
 * message id. The full field-by-field parse + sales_po creation happens
 * in a downstream step (next iteration); this route's only job is to
 * accept fast and never lose a delivery.
 *
 * Auth: shared secret in the X-EDI-Secret header, compared against
 * EDI_INBOUND_SECRET env.
 *
 * Body: raw XML. Content-Type can be application/xml, text/xml, or
 * even text/plain -- we just read the request as text.
 *
 * Headers honoured (optional, used for traceability):
 *   X-SPS-Message-Id   -- SPS-side message identifier
 *   X-SPS-Filename     -- original SFTP filename
 *
 * Responses:
 *   202 { inboundMessageId, salesTradingPartnerId }   on success
 *   400                                               malformed XML / missing TradingPartnerId / unknown partner archived but flagged
 *   401                                               missing or wrong X-EDI-Secret
 *   500                                               server / DB error
 */
import {
  EdiAuthError,
  EdiBadRequestError,
  archiveInbound850,
  verifySecret,
} from '~/lib/edi/inbound-850-receiver.server';
import type { Route } from '~/types/app/routes/api/edi/+types/inbound';

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    verifySecret(request.headers.get('x-edi-secret'));

    const rawBody = await request.text();
    const result = await archiveInbound850({
      rawBody,
      spsMessageId: request.headers.get('x-sps-message-id'),
      sourceFilename: request.headers.get('x-sps-filename'),
    });

    return Response.json(
      {
        inboundMessageId: result.inboundMessageId,
        salesTradingPartnerId: result.salesTradingPartnerId,
        tradingPartnerId: result.tradingPartnerId,
        documentType: result.documentType,
        // The parser runs separately; this row is queued via parsed_at IS NULL.
        status: result.salesTradingPartnerId ? 'queued' : 'queued_unmapped',
      },
      { status: 202 },
    );
  } catch (err) {
    if (err instanceof EdiAuthError) {
      return new Response('Unauthorized', { status: 401 });
    }
    if (err instanceof EdiBadRequestError) {
      return new Response(err.message, { status: 400 });
    }
    console.error('[edi/inbound] unexpected error:', err);
    return new Response('Server error', { status: 500 });
  }
}
