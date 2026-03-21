CREATE TABLE IF NOT EXISTS sales_po_fulfillment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    farm_id             TEXT NOT NULL REFERENCES farm(id),
    sales_po_id         UUID NOT NULL REFERENCES sales_po(id),
    sales_po_line_id    UUID NOT NULL REFERENCES sales_po_line(id),
    pack_lot_id         UUID REFERENCES pack_lot(id),

    quantity_fulfilled  NUMERIC NOT NULL,
    notes               TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted           BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE sales_po_fulfillment IS 'Fulfillment records linking order lines to pack lots. One row per lot per order line, supporting partial fulfillment across multiple lots.';

CREATE INDEX idx_sales_po_fulfillment_org_id     ON sales_po_fulfillment (org_id);
CREATE INDEX idx_sales_po_fulfillment_order_line ON sales_po_fulfillment (sales_po_line_id);
CREATE INDEX idx_sales_po_fulfillment_lot        ON sales_po_fulfillment (pack_lot_id);

COMMENT ON COLUMN sales_po_fulfillment.sales_po_id IS 'Parent order this fulfillment belongs to; inherited from parent sales_po_line';
COMMENT ON COLUMN sales_po_fulfillment.sales_po_line_id IS 'Order line being fulfilled';
COMMENT ON COLUMN sales_po_fulfillment.pack_lot_id IS 'Pack lot the fulfilled product was drawn from; null if lot tracking is not applicable';
COMMENT ON COLUMN sales_po_fulfillment.quantity_fulfilled IS 'Number of sale units fulfilled from this lot for this order line';
