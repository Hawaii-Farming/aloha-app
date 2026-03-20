CREATE TABLE IF NOT EXISTS invnt_sales_product_item (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id           TEXT REFERENCES farm(id),
    product_id        TEXT NOT NULL REFERENCES sales_product(id) ON DELETE CASCADE,
    invnt_item_id     UUID NOT NULL REFERENCES invnt_item(id) ON DELETE CASCADE,
    packaging_level   TEXT NOT NULL CHECK (packaging_level IN ('pack', 'sale')),
    sale_uom          TEXT REFERENCES util_uom(code),
    quantity_per_sale_uom NUMERIC,

    is_deleted         BOOLEAN NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        TEXT,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by        TEXT,

    CONSTRAINT uq_invnt_sales_product_item UNIQUE (product_id, invnt_item_id, packaging_level)
);

CREATE INDEX idx_invnt_sales_product_item_product ON invnt_sales_product_item (product_id);
CREATE INDEX idx_invnt_sales_product_item_item ON invnt_sales_product_item (invnt_item_id);

COMMENT ON TABLE invnt_sales_product_item IS 'Junction table linking sales products to inventory items at pack or sale packaging levels for inventory consumption tracking';
COMMENT ON COLUMN invnt_sales_product_item.id IS 'Unique identifier for the link record';
COMMENT ON COLUMN invnt_sales_product_item.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_sales_product_item.farm_id IS 'Optional farm scope';
COMMENT ON COLUMN invnt_sales_product_item.product_id IS 'Sales product that uses this inventory item';
COMMENT ON COLUMN invnt_sales_product_item.invnt_item_id IS 'Inventory item consumed by the product';
COMMENT ON COLUMN invnt_sales_product_item.packaging_level IS 'Which packaging level consumes this item: pack or sale';
COMMENT ON COLUMN invnt_sales_product_item.sale_uom IS 'Unit of measure for the sale quantity at this packaging level';
COMMENT ON COLUMN invnt_sales_product_item.quantity_per_sale_uom IS 'Quantity of the inventory item consumed per unit at the specified packaging level';
COMMENT ON COLUMN invnt_sales_product_item.is_deleted IS 'Soft delete flag; false hides the link from active use';
COMMENT ON COLUMN invnt_sales_product_item.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN invnt_sales_product_item.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN invnt_sales_product_item.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_sales_product_item.updated_by IS 'Email of the user who last updated the record';
