CREATE TABLE IF NOT EXISTS sales_po_fulfillment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id             TEXT NOT NULL REFERENCES farm(id),
    sales_po_id         UUID NOT NULL REFERENCES sales_po(id),
    sales_po_line_id    UUID NOT NULL REFERENCES sales_po_line(id) ON DELETE CASCADE,
    pack_lot_id         UUID REFERENCES pack_lot(id),

    quantity_fulfilled  NUMERIC NOT NULL,
    notes               TEXT,

    is_deleted           BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT
);

CREATE INDEX idx_sales_po_fulfillment_org_id     ON sales_po_fulfillment (org_id);
CREATE INDEX idx_sales_po_fulfillment_order_line ON sales_po_fulfillment (sales_po_line_id);
CREATE INDEX idx_sales_po_fulfillment_lot        ON sales_po_fulfillment (pack_lot_id);

COMMENT ON TABLE sales_po_fulfillment IS 'Fulfillment records linking order lines to pack lots. One row per lot per order line, supporting partial fulfillment across multiple lots.';
COMMENT ON COLUMN sales_po_fulfillment.id IS 'Unique identifier for the fulfillment record';
COMMENT ON COLUMN sales_po_fulfillment.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_po_fulfillment.farm_id IS 'Farm (crop line) this fulfillment belongs to; inherited from parent sales_po_line';
COMMENT ON COLUMN sales_po_fulfillment.sales_po_id IS 'Parent order this fulfillment belongs to; inherited from parent sales_po_line';
COMMENT ON COLUMN sales_po_fulfillment.sales_po_line_id IS 'Order line being fulfilled';
COMMENT ON COLUMN sales_po_fulfillment.pack_lot_id IS 'Pack lot the fulfilled product was drawn from; null if lot tracking is not applicable';
COMMENT ON COLUMN sales_po_fulfillment.quantity_fulfilled IS 'Number of sale units fulfilled from this lot for this order line';
COMMENT ON COLUMN sales_po_fulfillment.notes IS 'Free-text notes about this fulfillment';
COMMENT ON COLUMN sales_po_fulfillment.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN sales_po_fulfillment.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_po_fulfillment.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_po_fulfillment.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_po_fulfillment.updated_by IS 'Email of the user who last updated the record';
