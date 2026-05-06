/**
 * Apply a parsed 850 document to sales_po + sales_po_line.
 *
 * Idempotent on (org_id, sales_trading_partner_id, po_number): re-receiving
 * the same PO updates the existing row rather than inserting a duplicate.
 * Lines on a re-received PO are wiped + reinserted so removed lines drop
 * out and edits flow through cleanly.
 *
 * On parse / mapping failure we throw EdiApplyError. The caller is
 * responsible for setting parse_error on the inbound message and
 * leaving parsed_at = NULL so an operator can fix master data and
 * replay.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '~/lib/database.types';
import type {
  Parsed850Document,
  Parsed850Line,
} from '~/lib/edi/parse-850.server';
import { getSupabaseServerAdminClient } from '~/lib/supabase/clients/server-admin-client.server';

type SalesPoInsert = Database['public']['Tables']['sales_po']['Insert'];
type SalesPoLineInsert =
  Database['public']['Tables']['sales_po_line']['Insert'];

type Supabase = SupabaseClient<Database>;

export class EdiApplyError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'EdiApplyError';
  }
}

type TradingPartnerRow = {
  id: string;
  org_id: string;
  sales_customer_id: string;
};

type BuyerPartLookup = Map<
  string, // buyer_part_number
  {
    sales_product_id: string;
    farm_id: string;
    buyer_description: string | null;
    buyer_uom: string | null;
    gtin_case: string | null;
  }
>;

async function loadTradingPartner(
  supabase: Supabase,
  spsPartnerId: string,
): Promise<TradingPartnerRow> {
  const { data, error } = await supabase
    .from('sales_trading_partner')
    .select('id, org_id, sales_customer_id')
    .eq('sps_partner_id', spsPartnerId)
    .eq('is_deleted', false)
    .maybeSingle();
  if (error)
    throw new EdiApplyError(`Trading partner lookup failed: ${error.message}`);
  if (!data) {
    throw new EdiApplyError(
      `No sales_trading_partner row for sps_partner_id='${spsPartnerId}'. ` +
        `Add the partner config and replay.`,
    );
  }
  return data as TradingPartnerRow;
}

async function loadBuyerParts(
  supabase: Supabase,
  org_id: string,
  sales_customer_id: string,
  buyerPartNumbers: string[],
): Promise<BuyerPartLookup> {
  if (buyerPartNumbers.length === 0) return new Map();
  const { data, error } = await supabase
    .from('sales_product_buyer_part')
    .select(
      'buyer_part_number, sales_product_id, buyer_description, buyer_uom, gtin_case, sales_product:sales_product_id(farm_id)',
    )
    .eq('org_id', org_id)
    .eq('sales_customer_id', sales_customer_id)
    .eq('is_deleted', false)
    .in('buyer_part_number', buyerPartNumbers);
  if (error)
    throw new EdiApplyError(`Buyer-part lookup failed: ${error.message}`);

  const map: BuyerPartLookup = new Map();
  for (const row of (data ?? []) as Array<{
    buyer_part_number: string;
    sales_product_id: string;
    buyer_description: string | null;
    buyer_uom: string | null;
    gtin_case: string | null;
    sales_product: { farm_id: string } | { farm_id: string }[] | null;
  }>) {
    // PostgREST returns nested embeds either as object (one-to-one) or
    // array (one-to-many) depending on FK shape. Normalize.
    const sp = Array.isArray(row.sales_product)
      ? row.sales_product[0]
      : row.sales_product;
    if (!sp?.farm_id) continue;
    map.set(row.buyer_part_number, {
      sales_product_id: row.sales_product_id,
      farm_id: sp.farm_id,
      buyer_description: row.buyer_description,
      buyer_uom: row.buyer_uom,
      gtin_case: row.gtin_case,
    });
  }
  return map;
}

function buildSalesPoFields(
  doc: Parsed850Document,
  partner: TradingPartnerRow,
): SalesPoInsert {
  // Caller (apply850) has already validated these are present.
  if (!doc.purchase_order_date) {
    throw new EdiApplyError('Missing PurchaseOrderDate on the 850.');
  }
  return {
    org_id: partner.org_id,
    sales_customer_id: partner.sales_customer_id,
    sales_trading_partner_id: partner.id,
    po_number: doc.purchase_order_number,
    order_date: doc.purchase_order_date,
    requested_ship_date: doc.requested_ship_date,
    requested_delivery_date: doc.requested_delivery_date,
    buyer_department: doc.buyer_department,
    buyer_division: doc.buyer_division,
    buyer_contact_name: doc.contact_name,
    buyer_contact_phone: doc.contact_phone,
    buyer_contact_email: doc.contact_email,
    ship_to_name: doc.ship_to?.name ?? null,
    ship_to_address1: doc.ship_to?.address1 ?? null,
    ship_to_address2: doc.ship_to?.address2 ?? null,
    ship_to_city: doc.ship_to?.city ?? null,
    ship_to_state: doc.ship_to?.state ?? null,
    ship_to_zip: doc.ship_to?.postal_code ?? null,
    ship_to_country: doc.ship_to?.country ?? null,
    bill_to_name: doc.bill_to?.name ?? null,
    bill_to_address1: doc.bill_to?.address1 ?? null,
    bill_to_address2: doc.bill_to?.address2 ?? null,
    bill_to_city: doc.bill_to?.city ?? null,
    bill_to_state: doc.bill_to?.state ?? null,
    bill_to_zip: doc.bill_to?.postal_code ?? null,
    bill_to_country: doc.bill_to?.country ?? null,
    carrier_routing: doc.carrier_routing,
    payment_terms_net_days: doc.payment_terms_net_days,
    notes: doc.notes.length > 0 ? doc.notes.join('\n') : null,
    status: 'Received' as const,
  };
}

function buildLineRow(
  line: Parsed850Line,
  doc: Parsed850Document,
  parts: BuyerPartLookup,
  org_id: string,
  sales_po_id: string,
): SalesPoLineInsert {
  const buyerPart = line.buyer_part_number;
  if (!buyerPart) {
    throw new EdiApplyError(
      `Line ${line.line_sequence_number ?? '?'} on PO ${doc.purchase_order_number} ` +
        `is missing BuyerPartNumber.`,
    );
  }
  const lookup = parts.get(buyerPart);
  if (!lookup) {
    throw new EdiApplyError(
      `No sales_product_buyer_part for buyer_part_number='${buyerPart}' on PO ` +
        `${doc.purchase_order_number}. Add the cross-reference and replay.`,
    );
  }
  if (line.order_qty === null || line.order_qty <= 0) {
    throw new EdiApplyError(
      `Line ${line.line_sequence_number ?? '?'} on PO ${doc.purchase_order_number} ` +
        `has invalid OrderQty: ${line.order_qty}.`,
    );
  }
  if (line.purchase_price === null) {
    throw new EdiApplyError(
      `Line ${line.line_sequence_number ?? '?'} on PO ${doc.purchase_order_number} ` +
        `is missing PurchasePrice. We snapshot the buyer's price on EDI orders.`,
    );
  }
  return {
    org_id,
    farm_id: lookup.farm_id,
    sales_po_id,
    sales_product_id: lookup.sales_product_id,
    order_quantity: line.order_qty,
    price_per_case: line.purchase_price,
    buyer_part_number: buyerPart,
    buyer_description:
      line.product_description ?? lookup.buyer_description ?? null,
    buyer_uom: line.order_qty_uom ?? lookup.buyer_uom ?? null,
    buyer_line_sequence: line.line_sequence_number,
    gtin_case: line.upc_case_code ?? lookup.gtin_case ?? null,
  };
}

export type Apply850Result = {
  sales_po_id: string;
  inserted: boolean; // true if a new sales_po row was created
  line_count: number;
};

/**
 * Idempotent apply: upsert the sales_po by (org_id, sales_trading_partner_id, po_number),
 * then DELETE + bulk INSERT all lines for that PO.
 */
export async function apply850(
  doc: Parsed850Document,
): Promise<Apply850Result> {
  if (!doc.purchase_order_number) {
    throw new EdiApplyError('Missing PurchaseOrderNumber on the 850.');
  }
  if (doc.lines.length === 0) {
    throw new EdiApplyError('850 has no LineItems.');
  }
  if (!doc.purchase_order_date) {
    throw new EdiApplyError('Missing PurchaseOrderDate on the 850.');
  }

  const supabase = getSupabaseServerAdminClient();
  const partner = await loadTradingPartner(supabase, doc.trading_partner_id);

  // Resolve every buyer_part_number on the PO before touching the DB so
  // we fail fast and atomically. If any line has no mapping we abort
  // BEFORE creating the sales_po row -- prevents half-applied orders.
  const buyerParts = doc.lines
    .map((l) => l.buyer_part_number)
    .filter((n): n is string => !!n);
  const parts = await loadBuyerParts(
    supabase,
    partner.org_id,
    partner.sales_customer_id,
    buyerParts,
  );
  const missing = buyerParts.filter((p) => !parts.has(p));
  if (missing.length > 0) {
    throw new EdiApplyError(
      `Missing sales_product_buyer_part for buyer_part_numbers: ${missing.join(', ')}. ` +
        `Add the cross-references for sales_customer_id='${partner.sales_customer_id}' and replay.`,
    );
  }

  // Look for an existing sales_po with the same (partner, po_number) -- this
  // is how we deduplicate SPS retries / re-deliveries.
  const { data: existing, error: existingErr } = await supabase
    .from('sales_po')
    .select('id')
    .eq('org_id', partner.org_id)
    .eq('sales_trading_partner_id', partner.id)
    .eq('po_number', doc.purchase_order_number)
    .eq('is_deleted', false)
    .maybeSingle();
  if (existingErr) {
    throw new EdiApplyError(`sales_po lookup failed: ${existingErr.message}`);
  }

  const fields = buildSalesPoFields(doc, partner);
  let salesPoId: string;
  let inserted: boolean;

  if (existing) {
    // Re-received PO: update header fields, keep id, lines below get
    // wiped + reinserted.
    const { data, error } = await supabase
      .from('sales_po')
      .update(fields)
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error)
      throw new EdiApplyError(`sales_po update failed: ${error.message}`);
    salesPoId = (data as { id: string }).id;
    inserted = false;
  } else {
    const { data, error } = await supabase
      .from('sales_po')
      .insert(fields)
      .select('id')
      .single();
    if (error)
      throw new EdiApplyError(`sales_po insert failed: ${error.message}`);
    salesPoId = (data as { id: string }).id;
    inserted = true;
  }

  // Build line rows BEFORE wiping existing lines -- if any throw on
  // construction we don't want to leave a header with no lines.
  const lineRows = doc.lines.map((l) =>
    buildLineRow(l, doc, parts, partner.org_id, salesPoId),
  );

  // Wipe old lines (no-op on a fresh insert) and bulk-insert the new set.
  const { error: delErr } = await supabase
    .from('sales_po_line')
    .delete()
    .eq('sales_po_id', salesPoId);
  if (delErr)
    throw new EdiApplyError(`sales_po_line wipe failed: ${delErr.message}`);

  const { error: insErr } = await supabase
    .from('sales_po_line')
    .insert(lineRows);
  if (insErr)
    throw new EdiApplyError(`sales_po_line insert failed: ${insErr.message}`);

  return {
    sales_po_id: salesPoId,
    inserted,
    line_count: lineRows.length,
  };
}
