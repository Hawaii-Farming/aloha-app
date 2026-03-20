CREATE TABLE IF NOT EXISTS sales_po_line (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id             TEXT NOT NULL REFERENCES farm(id),
    sales_po_id         UUID NOT NULL REFERENCES sales_po(id) ON DELETE CASCADE,
    sales_product_id    TEXT NOT NULL REFERENCES sales_product(id),

    sale_uom            TEXT NOT NULL REFERENCES util_uom(code),
    quantity_ordered    NUMERIC NOT NULL,
    price_per_unit NUMERIC NOT NULL,
    notes               TEXT,

    is_deleted           BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,

    CONSTRAINT uq_sales_po_line UNIQUE (sales_po_id, sales_product_id)
);

CREATE INDEX idx_sales_po_line_org_id  ON sales_po_line (org_id);
CREATE INDEX idx_sales_po_line_order   ON sales_po_line (sales_po_id);
CREATE INDEX idx_sales_po_line_product ON sales_po_line (sales_product_id);

COMMENT ON TABLE sales_po_line IS 'Individual products within an order. One row per product per order with snapshot pricing at time of order.';
COMMENT ON COLUMN sales_po_line.id IS 'Unique identifier for the order line';
COMMENT ON COLUMN sales_po_line.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_po_line.farm_id IS 'Farm (crop line) this order line belongs to; inherited from parent sales_po';
COMMENT ON COLUMN sales_po_line.sales_po_id IS 'Parent order this line belongs to';
COMMENT ON COLUMN sales_po_line.sales_product_id IS 'Product being ordered';
COMMENT ON COLUMN sales_po_line.sale_uom IS 'Unit of measure for the quantity ordered (e.g. case, box)';
COMMENT ON COLUMN sales_po_line.quantity_ordered IS 'Number of sale units ordered';
COMMENT ON COLUMN sales_po_line.price_per_unit IS 'Snapshot price per unit at time of order';
COMMENT ON COLUMN sales_po_line.notes IS 'Free-text notes about this order line';
COMMENT ON COLUMN sales_po_line.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN sales_po_line.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_po_line.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_po_line.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_po_line.updated_by IS 'Email of the user who last updated the record';
