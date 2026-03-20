CREATE TABLE IF NOT EXISTS sales_product_price (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    sales_product_id     TEXT NOT NULL REFERENCES sales_product(id),
    sales_fob_id         TEXT NOT NULL REFERENCES sales_fob(id),
    sales_customeromer_group_id  TEXT REFERENCES sales_customeromer_group(id),
    sales_customer_id        TEXT REFERENCES sales_customer(id),
    price          NUMERIC NOT NULL,
    effective_from DATE NOT NULL,
    effective_to   DATE,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by     TEXT,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by     TEXT
);

CREATE INDEX idx_sales_product_price_lookup ON sales_product_price (sales_product_id, sales_fob_id);

CREATE INDEX idx_sales_product_price_org ON sales_product_price (org_id);

COMMENT ON TABLE sales_product_price IS 'Tiered pricing with three levels of specificity: customer-specific > group-level > default (product + FOB only); supports effective date ranges';
COMMENT ON COLUMN sales_product_price.id IS 'Unique identifier for the price record';
COMMENT ON COLUMN sales_product_price.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_product_price.sales_product_id IS 'Product this price applies to';
COMMENT ON COLUMN sales_product_price.sales_fob_id IS 'FOB delivery point this price applies to';
COMMENT ON COLUMN sales_product_price.sales_customer_id IS 'Specific customer for customer-level pricing; NULL for group or default pricing';
COMMENT ON COLUMN sales_product_price.sales_customeromer_group_id IS 'Customer group for group-level pricing; NULL for customer-specific or default pricing';
COMMENT ON COLUMN sales_product_price.price IS 'Price per sale unit';
COMMENT ON COLUMN sales_product_price.effective_from IS 'Start date when this price becomes active';
COMMENT ON COLUMN sales_product_price.effective_to IS 'End date when this price expires; NULL means no expiry';
COMMENT ON COLUMN sales_product_price.is_active IS 'Soft delete flag; false hides the price from active use';
COMMENT ON COLUMN sales_product_price.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_product_price.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_product_price.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_product_price.updated_by IS 'Email of the user who last updated the record';
