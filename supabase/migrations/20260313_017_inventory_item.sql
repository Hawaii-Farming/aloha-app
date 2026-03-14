CREATE TABLE IF NOT EXISTS inventory_item (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    farm_id                UUID REFERENCES farm(id),
    category_id            UUID REFERENCES inventory_category(id),
    supplier_id            UUID REFERENCES supplier(id),
    external_id            VARCHAR(50),
    name                   VARCHAR(150) NOT NULL,
    type                   VARCHAR(20) NOT NULL CHECK (type IN ('seed', 'chemical', 'packaging', 'part', 'supply')),

    burn_unit_id           UUID REFERENCES unit_of_measure(id),
    onhand_unit_id         UUID REFERENCES unit_of_measure(id),
    order_unit_id          UUID REFERENCES unit_of_measure(id),

    burn_per_onhand_unit   NUMERIC,
    burn_per_order_unit    NUMERIC,
    order_per_pallet       NUMERIC,
    pallets_per_truckload  NUMERIC,

    is_frequently_used     BOOLEAN NOT NULL DEFAULT false,
    burn_per_week          NUMERIC,
    burn_per_year          NUMERIC,
    cushion_weeks          NUMERIC,

    auto_order_enabled     BOOLEAN NOT NULL DEFAULT false,
    reorder_point_burn     NUMERIC,
    reorder_quantity_burn  NUMERIC,
    requires_lot_tracking  BOOLEAN NOT NULL DEFAULT false,
    requires_expiry_date   BOOLEAN NOT NULL DEFAULT false,

    metadata               JSONB NOT NULL DEFAULT '{}',

    is_active              BOOLEAN NOT NULL DEFAULT true,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             UUID REFERENCES profile(id),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             UUID REFERENCES profile(id),

    CONSTRAINT uq_inventory_item UNIQUE (org_id, name)
);

CREATE INDEX idx_inventory_item_org_id ON inventory_item (org_id);
CREATE INDEX idx_inventory_item_type ON inventory_item (org_id, type);
CREATE INDEX idx_inventory_item_supplier ON inventory_item (supplier_id);
CREATE INDEX idx_inventory_item_category ON inventory_item (category_id);
