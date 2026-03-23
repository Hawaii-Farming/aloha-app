CREATE TABLE IF NOT EXISTS sales_po_line (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    farm_id             TEXT NOT NULL REFERENCES org_farm(id),
    sales_po_id         UUID NOT NULL REFERENCES sales_po(id),
    sales_product_id    TEXT NOT NULL REFERENCES sales_product(id),

    sale_uom            TEXT NOT NULL REFERENCES org_uom(code),
    quantity_ordered    NUMERIC NOT NULL,
    price_per_unit NUMERIC NOT NULL,
    notes               TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted           BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_sales_po_line UNIQUE (sales_po_id, sales_product_id)
);

COMMENT ON TABLE sales_po_line IS 'Individual products within an order. One row per product per order with snapshot pricing at time of order.';

CREATE INDEX idx_sales_po_line_org_id  ON sales_po_line (org_id);
CREATE INDEX idx_sales_po_line_order   ON sales_po_line (sales_po_id);
CREATE INDEX idx_sales_po_line_product ON sales_po_line (sales_product_id);

COMMENT ON COLUMN sales_po_line.price_per_unit IS 'Snapshot price per unit at time of order';
