/**
 * Pure XML -> typed object parser for SPS Commerce 850 (Purchase Order).
 *
 * No database access here. The output is a normalized, typed structure
 * that the applier (apply-850.server.ts) maps onto sales_po +
 * sales_po_line. Keeping parsing pure makes it trivially testable
 * against the fixture XMLs in __fixtures__/.
 *
 * SPS XML quirks handled:
 *   * fast-xml-parser collapses repeated elements into either a single
 *     object (one occurrence) or an array (>= 2 occurrences). Header
 *     subsections like <Address> and <Notes> show up as either, so we
 *     normalize to arrays via toArray().
 *   * Numbers are parsed as strings (parseTagValue: false) so that
 *     leading zeros in PurchaseOrderNumber / UPCCaseCode survive.
 *   * Address/Date qualifier codes (ST/BT/VN, 001/002/010) are inside
 *     each repeated block, not as XML attributes.
 */
import { XMLParser } from 'fast-xml-parser';

export type Parsed850Address = {
  type: 'ST' | 'BT' | 'VN' | string;
  name: string | null;
  alternate_name: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  location_number: string | null;
};

export type Parsed850Line = {
  line_sequence_number: number | null;
  buyer_part_number: string | null;
  upc_case_code: string | null;
  order_qty: number | null;
  order_qty_uom: string | null;
  purchase_price: number | null;
  product_description: string | null;
};

export type Parsed850Document = {
  trading_partner_id: string;
  purchase_order_number: string | null;
  purchase_order_date: string | null; // YYYY-MM-DD
  primary_po_type_code: string | null;
  tset_purpose_code: string | null;
  buyer_department: string | null;
  buyer_division: string | null;

  // Buyer contact (BD = Buyer Department, AC = Account, etc. -- we keep
  // the first matching one as the canonical contact)
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;

  // Date qualifiers from <Dates>: 001 = requested delivery, 002 =
  // requested ship, 010 = ship-not-before. Most buyers use a subset.
  requested_delivery_date: string | null; // 001
  requested_ship_date: string | null; // 002
  ship_not_before_date: string | null; // 010

  // Addresses by type code.
  ship_to: Parsed850Address | null; // ST
  bill_to: Parsed850Address | null; // BT
  vendor: Parsed850Address | null; // VN

  fob_pay_code: string | null; // PP / CC / etc.
  carrier_routing: string | null;
  carrier_trans_method_code: string | null;

  payment_terms_net_days: number | null;

  notes: string[];

  total_quantity: number | null; // QuantityTotals[SQT].Quantity

  lines: Parsed850Line[];
};

function toArray<T = Record<string, unknown>>(v: unknown): T[] {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v as T[];
  return [v as T];
}

function asString(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

function asNumber(v: unknown): number | null {
  const s = asString(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function asInt(v: unknown): number | null {
  const n = asNumber(v);
  return n === null ? null : Math.trunc(n);
}

function parseAddress(raw: Record<string, unknown>): Parsed850Address {
  return {
    type: asString(raw['AddressTypeCode']) ?? 'UN',
    name: asString(raw['AddressName']),
    alternate_name: asString(raw['AddressAlternateName']),
    address1: asString(raw['Address1']),
    address2: asString(raw['Address2']),
    city: asString(raw['City']),
    state: asString(raw['State']),
    postal_code: asString(raw['PostalCode']),
    country: asString(raw['Country']),
    location_number: asString(raw['AddressLocationNumber']),
  };
}

function parseLine(raw: Record<string, unknown>): Parsed850Line {
  const orderLine =
    (raw['OrderLine'] as Record<string, unknown> | undefined) ?? {};
  const desc =
    (raw['ProductOrItemDescription'] as Record<string, unknown> | undefined) ??
    {};
  return {
    line_sequence_number: asInt(orderLine['LineSequenceNumber']),
    buyer_part_number: asString(orderLine['BuyerPartNumber']),
    upc_case_code: asString(orderLine['UPCCaseCode']),
    order_qty: asNumber(orderLine['OrderQty']),
    order_qty_uom: asString(orderLine['OrderQtyUOM']),
    purchase_price: asNumber(orderLine['PurchasePrice']),
    product_description: asString(desc['ProductDescription']),
  };
}

export function parse850(xmlBody: string): Parsed850Document {
  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });
  const root = parser.parse(xmlBody) as Record<string, unknown>;
  const order = (root['Order'] as Record<string, unknown> | undefined) ?? {};
  const header = (order['Header'] as Record<string, unknown> | undefined) ?? {};
  const orderHeader =
    (header['OrderHeader'] as Record<string, unknown> | undefined) ?? {};
  const paymentTerms =
    (header['PaymentTerms'] as Record<string, unknown> | undefined) ?? {};
  const fob =
    (header['FOBRelatedInstruction'] as Record<string, unknown> | undefined) ??
    {};
  const carrier =
    (header['CarrierInformation'] as Record<string, unknown> | undefined) ?? {};

  const tradingPartnerId = asString(orderHeader['TradingPartnerId']);
  if (!tradingPartnerId) {
    throw new Error('Missing Order/Header/OrderHeader/TradingPartnerId');
  }

  // Contacts: take the first one that has a name. Real PO XMLs ship 0-2.
  const contacts = toArray(header['Contacts']);
  const firstContact = contacts.find((c) => asString(c['ContactName']));
  const contact_name = asString(firstContact?.['ContactName']);
  const contact_phone = asString(firstContact?.['PrimaryPhone']);
  const contact_email = asString(firstContact?.['PrimaryEmail']);

  // Dates: index by qualifier (001/002/010)
  const dates = toArray(header['Dates']);
  const dateByQual = new Map<string, string>();
  for (const d of dates) {
    const q = asString(d['DateTimeQualifier']);
    const v = asString(d['Date']);
    if (q && v) dateByQual.set(q, v);
  }

  // Addresses: index by type code
  const addresses = toArray(header['Address']);
  let ship_to: Parsed850Address | null = null;
  let bill_to: Parsed850Address | null = null;
  let vendor: Parsed850Address | null = null;
  for (const raw of addresses) {
    const parsed = parseAddress(raw);
    if (parsed.type === 'ST') ship_to = parsed;
    else if (parsed.type === 'BT') bill_to = parsed;
    else if (parsed.type === 'VN') vendor = parsed;
  }

  // Notes: flatten <Notes><Note>...</Note></Notes> blocks (each block can
  // hold one Note in our fixtures; some senders ship multiple per block).
  const notesBlocks = toArray(header['Notes']);
  const notes: string[] = [];
  for (const block of notesBlocks) {
    for (const note of toArray(block['Note'])) {
      const s = asString(note);
      if (s) notes.push(s);
    }
  }

  // QuantityTotals: SQT = Sum of Quantity (header-level total cases)
  let total_quantity: number | null = null;
  for (const qt of toArray(header['QuantityTotals'])) {
    if (asString(qt['QuantityTotalsQualifier']) === 'SQT') {
      total_quantity = asNumber(qt['Quantity']);
    }
  }

  // Lines
  const lines = toArray(order['LineItem']).map(parseLine);

  return {
    trading_partner_id: tradingPartnerId,
    purchase_order_number: asString(orderHeader['PurchaseOrderNumber']),
    purchase_order_date: asString(orderHeader['PurchaseOrderDate']),
    primary_po_type_code: asString(orderHeader['PrimaryPOTypeCode']),
    tset_purpose_code: asString(orderHeader['TsetPurposeCode']),
    buyer_department:
      asString(orderHeader['Department']) ??
      asString(orderHeader['DepartmentDescription']),
    buyer_division: asString(orderHeader['Division']),
    contact_name,
    contact_phone,
    contact_email,
    requested_delivery_date: dateByQual.get('001') ?? null,
    requested_ship_date: dateByQual.get('002') ?? null,
    ship_not_before_date: dateByQual.get('010') ?? null,
    ship_to,
    bill_to,
    vendor,
    fob_pay_code: asString(fob['FOBPayCode']),
    carrier_routing: asString(carrier['CarrierRouting']),
    carrier_trans_method_code: asString(carrier['CarrierTransMethodCode']),
    payment_terms_net_days: asInt(paymentTerms['TermsNetDueDays']),
    notes,
    total_quantity,
    lines,
  };
}
