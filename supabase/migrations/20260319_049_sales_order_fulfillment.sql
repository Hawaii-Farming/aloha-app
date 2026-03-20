CREATE TABLE IF NOT EXISTS sales_order_fulfillment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    sales_order_line_id UUID NOT NULL REFERENCES sales_order_line(id) ON DELETE CASCADE,
    pack_lot_id         UUID REFERENCES pack_lot(id),

    quantity_fulfilled  NUMERIC NOT NULL,
    notes               TEXT,

    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT
);

CREATE INDEX idx_sales_order_fulfillment_org_id     ON sales_order_fulfillment (org_id);
CREATE INDEX idx_sales_order_fulfillment_order_line ON sales_order_fulfillment (sales_order_line_id);
CREATE INDEX idx_sales_order_fulfillment_lot        ON sales_order_fulfillment (pack_lot_id);

COMMENT ON TABLE sales_order_fulfillment IS 'Fulfillment records linking order lines to pack lots. One row per lot per order line, supporting partial fulfillment across multiple lots.';
COMMENT ON COLUMN sales_order_fulfillment.id IS 'Unique identifier for the fulfillment record';
COMMENT ON COLUMN sales_order_fulfillment.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_order_fulfillment.sales_order_line_id IS 'Order line being fulfilled';
COMMENT ON COLUMN sales_order_fulfillment.pack_lot_id IS 'Pack lot the fulfilled product was drawn from; null if lot tracking is not applicable';
COMMENT ON COLUMN sales_order_fulfillment.quantity_fulfilled IS 'Number of sale units fulfilled from this lot for this order line';
COMMENT ON COLUMN sales_order_fulfillment.notes IS 'Free-text notes about this fulfillment';
COMMENT ON COLUMN sales_order_fulfillment.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN sales_order_fulfillment.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_order_fulfillment.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_order_fulfillment.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_order_fulfillment.updated_by IS 'Email of the user who last updated the record';
