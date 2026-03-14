CREATE TABLE IF NOT EXISTS farm_product_inventory_item (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    product_id        UUID NOT NULL REFERENCES farm_product(id) ON DELETE CASCADE,
    item_id           UUID NOT NULL REFERENCES inventory_item(id) ON DELETE CASCADE,
    packaging_level   VARCHAR(10) NOT NULL CHECK (packaging_level IN ('pack', 'sale')),
    quantity_per_unit NUMERIC,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        UUID REFERENCES profile(id),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by        UUID REFERENCES profile(id),

    CONSTRAINT uq_farm_product_inventory_item UNIQUE (product_id, item_id, packaging_level)
);

CREATE INDEX idx_farm_product_inventory_item_product ON farm_product_inventory_item (product_id);
CREATE INDEX idx_farm_product_inventory_item_item ON farm_product_inventory_item (item_id);
