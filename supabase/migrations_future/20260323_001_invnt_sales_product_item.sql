CREATE TABLE IF NOT EXISTS invnt_sales_product_item (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            TEXT NOT NULL REFERENCES org(id),
    farm_id           TEXT REFERENCES org_farm(id),
    product_id        TEXT NOT NULL REFERENCES sales_product(id),
    invnt_item_id     TEXT NOT NULL REFERENCES invnt_item(id),
    packaging_level   TEXT NOT NULL CHECK (packaging_level IN ('pack', 'sale')),
    sale_uom          TEXT REFERENCES sys_uom(code),
    quantity_per_sale_uom NUMERIC,

    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        TEXT,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by        TEXT,
    is_deleted         BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_invnt_sales_product_item UNIQUE (product_id, invnt_item_id, packaging_level)
);

COMMENT ON TABLE invnt_sales_product_item IS 'Junction table linking sales products to inventory items at pack or sale packaging levels. When a product is packed or sold, this mapping determines which inventory items are consumed and in what quantity.';

CREATE INDEX idx_invnt_sales_product_item_product ON invnt_sales_product_item (product_id);
CREATE INDEX idx_invnt_sales_product_item_item ON invnt_sales_product_item (invnt_item_id);

COMMENT ON COLUMN invnt_sales_product_item.packaging_level IS 'Which packaging level consumes this item: pack or sale';
COMMENT ON COLUMN invnt_sales_product_item.quantity_per_sale_uom IS 'Quantity of the inventory item consumed per unit at the specified packaging level';
