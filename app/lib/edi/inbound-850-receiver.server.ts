/**
 * SPS Commerce 850 (Purchase Order) inbound receiver.
 *
 * v1 scope: archive the raw XML payload to sales_edi_inbound_message,
 * resolve the trading partner so the row links back, return the inbound
 * message id. Full field-by-field parsing into sales_po + sales_po_line
 * lives in a sibling parser module (next iteration).
 *
 * Authentication is a shared secret in EDI_INBOUND_SECRET. The caller
 * (SPS push, an SFTP polling worker, manual curl) sets X-EDI-Secret to
 * that value. We compare in constant time.
 */
import { XMLParser } from 'fast-xml-parser';

import { EdiApplyError, apply850 } from '~/lib/edi/apply-850.server';
import { parse850 } from '~/lib/edi/parse-850.server';
import { getSupabaseServerAdminClient } from '~/lib/supabase/clients/server-admin-client.server';

const ALLOWED_DOC_TYPES = new Set(['850', '860']); // 850=PO, 860=PO change

export class EdiAuthError extends Error {
  constructor() {
    super('EDI_INBOUND_SECRET mismatch');
    this.name = 'EdiAuthError';
  }
}
export class EdiBadRequestError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'EdiBadRequestError';
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++)
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export function verifySecret(headerValue: string | null): void {
  const expected = process.env.EDI_INBOUND_SECRET;
  if (!expected) {
    throw new Error('EDI_INBOUND_SECRET is not configured on the server');
  }
  if (!headerValue || !constantTimeEqual(headerValue, expected)) {
    throw new EdiAuthError();
  }
}

/**
 * Lightweight XML pre-flight: confirm the body is parseable as XML and
 * extract just enough to (a) identify the trading partner and (b) tag
 * the document_type. Field-by-field extraction is the parser's job.
 */
function preflight(rawBody: string): {
  tradingPartnerId: string;
  documentType: string;
} {
  let parsed: unknown;
  try {
    const parser = new XMLParser({
      ignoreAttributes: true,
      parseTagValue: false, // keep numbers as strings
    });
    parsed = parser.parse(rawBody);
  } catch (err) {
    throw new EdiBadRequestError(
      `Invalid XML: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const orderHeader = (parsed as Record<string, unknown> | null)?.['Order'] as
    | Record<string, unknown>
    | undefined;
  const header = orderHeader?.['Header'] as Record<string, unknown> | undefined;
  const oh = header?.['OrderHeader'] as Record<string, unknown> | undefined;
  const tradingPartnerId =
    typeof oh?.['TradingPartnerId'] === 'string'
      ? (oh['TradingPartnerId'] as string).trim()
      : '';
  if (!tradingPartnerId) {
    throw new EdiBadRequestError(
      'Missing Order/Header/OrderHeader/TradingPartnerId',
    );
  }

  // SPS XML for an 850 always has OrderHeader; an 860 (PO change) shares
  // the same shape with TsetPurposeCode=04. The X12 transaction set is
  // not directly in the XML, so we infer from PrimaryPOTypeCode/PurposeCode.
  // For v1 we treat every Order document as 850 -- PO change handling is
  // a follow-up.
  const documentType = '850';

  return { tradingPartnerId, documentType };
}

export type ArchiveOptions = {
  rawBody: string;
  /** SPS-side message id, if delivered in HTTP headers / a wrapper. */
  spsMessageId?: string | null;
  /** Original SFTP filename if applicable. */
  sourceFilename?: string | null;
};

export type ArchiveResult = {
  inboundMessageId: string;
  orgId: string;
  tradingPartnerId: string;
  salesTradingPartnerId: string | null;
  documentType: string;
  /** Set when the parser ran successfully and a sales_po was upserted. */
  salesPoId?: string;
  /** Set when the parser ran but failed; the inbound row's parse_error
   *  is populated for replay. */
  parseError?: string;
};

/**
 * Persist the raw XML to sales_edi_inbound_message. Resolves the
 * trading partner so the audit row points back at our local
 * sales_trading_partner record. Marks parsed_at = NULL so the parser
 * (next iteration) picks it up.
 */
export async function archiveInbound850(
  opts: ArchiveOptions,
): Promise<ArchiveResult> {
  const { rawBody, spsMessageId = null, sourceFilename = null } = opts;
  if (!rawBody || rawBody.trim().length === 0) {
    throw new EdiBadRequestError('Empty body');
  }

  const { tradingPartnerId, documentType } = preflight(rawBody);
  if (!ALLOWED_DOC_TYPES.has(documentType)) {
    throw new EdiBadRequestError(`Unsupported document_type ${documentType}`);
  }

  const supabase = getSupabaseServerAdminClient();

  // Look up our local trading partner row to (a) resolve the org_id and
  // (b) link the audit message back. SPS delivers the same partner id
  // across all orgs they trade with, so the (org_id, sps_partner_id)
  // pair is what uniquely identifies a relationship.
  const { data: partner, error: partnerErr } = await supabase
    .from('sales_trading_partner')
    .select('id, org_id')
    .eq('sps_partner_id', tradingPartnerId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (partnerErr) {
    throw new Error(
      `Failed to look up trading partner ${tradingPartnerId}: ${partnerErr.message}`,
    );
  }
  if (!partner) {
    // Don't reject -- archive the message anyway with NULL
    // sales_trading_partner_id and a parse_error placeholder so the
    // operator can fix the partner config and replay. SPS keeps
    // re-delivering until they get a 2xx, so dropping the message
    // here would create an outage.
    const { data, error } = await supabase
      .from('sales_edi_inbound_message')
      .insert({
        org_id: process.env.EDI_DEFAULT_ORG_ID ?? 'hawaii_farming',
        sales_trading_partner_id: null,
        document_type: documentType,
        sps_message_id: spsMessageId,
        source_filename: sourceFilename,
        raw_body: rawBody,
        parse_error: `No sales_trading_partner row found for sps_partner_id='${tradingPartnerId}'`,
      })
      .select('id, org_id')
      .single();
    if (error) throw new Error(`Insert failed: ${error.message}`);
    return {
      inboundMessageId: data.id,
      orgId: data.org_id,
      tradingPartnerId,
      salesTradingPartnerId: null,
      documentType,
    };
  }

  const { data, error } = await supabase
    .from('sales_edi_inbound_message')
    .insert({
      org_id: partner.org_id,
      sales_trading_partner_id: partner.id,
      document_type: documentType,
      sps_message_id: spsMessageId,
      source_filename: sourceFilename,
      raw_body: rawBody,
    })
    .select('id, org_id')
    .single();
  if (error) throw new Error(`Insert failed: ${error.message}`);

  // Archive succeeded; now run the field-level parser + applier in the
  // same request so the sales_po lands immediately. Wrapped in try/catch
  // so a parser failure doesn't bubble up as a 5xx -- we record
  // parse_error on the inbound row and the operator replays via
  // /api/edi/process-pending after fixing master data.
  let salesPoId: string | undefined;
  let parseError: string | undefined;
  try {
    const parsed = parse850(rawBody);
    const applied = await apply850(parsed);
    await supabase
      .from('sales_edi_inbound_message')
      .update({
        parsed_at: new Date().toISOString(),
        sales_po_id: applied.sales_po_id,
        parse_error: null,
      })
      .eq('id', data.id);
    salesPoId = applied.sales_po_id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    parseError = msg;
    if (!(err instanceof EdiApplyError)) {
      console.error('[edi/inbound-850] unexpected parse failure:', err);
    }
    await supabase
      .from('sales_edi_inbound_message')
      .update({ parse_error: msg })
      .eq('id', data.id);
  }

  return {
    inboundMessageId: data.id,
    orgId: data.org_id,
    tradingPartnerId,
    salesTradingPartnerId: partner.id,
    documentType,
    salesPoId,
    parseError,
  };
}
