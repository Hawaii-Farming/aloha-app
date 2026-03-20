CREATE TABLE IF NOT EXISTS sales_order_line (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    sales_order_id      UUID NOT NULL REFERENCES sales_order(id) ON DELETE CASCADE,
    sales_product_id    TEXT NOT NULL REFERENCES sales_product(id),

    uom                 TEXT NOT NULL REFERENCES util_uom(code),
    quantity_ordered    NUMERIC NOT NULL,
    price_per_sale_unit NUMERIC NOT NULL,
    notes               TEXT,

    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,

    CONSTRAINT uq_sales_order_line UNIQUE (sales_order_id, sales_product_id)
);

CREATE INDEX idx_sales_order_line_org_id  ON sales_order_line (org_id);
CREATE INDEX idx_sales_order_line_order   ON sales_order_line (sales_order_id);
CREATE INDEX idx_sales_order_line_product ON sales_order_line (sales_product_id);

COMMENT ON TABLE sales_order_line IS 'Individual products within an order. One row per product per order with snapshot pricing at time of order.';
COMMENT ON COLUMN sales_order_line.id IS 'Unique identifier for the order line';
COMMENT ON COLUMN sales_order_line.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_order_line.sales_order_id IS 'Parent order this line belongs to';
COMMENT ON COLUMN sales_order_line.sales_product_id IS 'Product being ordered';
COMMENT ON COLUMN sales_order_line.uom IS 'Unit of measure for the quantity ordered (e.g. case, box)';
COMMENT ON COLUMN sales_order_line.quantity_ordered IS 'Number of sale units ordered';
COMMENT ON COLUMN sales_order_line.price_per_sale_unit IS 'Snapshot price per sale unit at time of order';
COMMENT ON COLUMN sales_order_line.notes IS 'Free-text notes about this order line';
COMMENT ON COLUMN sales_order_line.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN sales_order_line.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_order_line.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_order_line.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_order_line.updated_by IS 'Email of the user who last updated the record';
