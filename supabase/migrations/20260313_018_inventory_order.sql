CREATE TABLE IF NOT EXISTS inventory_order (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    farm_id                UUID REFERENCES farm(id),
    item_id                UUID REFERENCES inventory_item(id),
    supplier_id            UUID REFERENCES supplier(id),
    external_id            VARCHAR(50),
    item_name              VARCHAR(150) NOT NULL,
    status                 VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'ordered', 'partial', 'received', 'cancelled')),

    quantity_order         NUMERIC NOT NULL,
    order_unit_id          UUID REFERENCES unit_of_measure(id),
    quantity_burn          NUMERIC,
    burn_unit_id           UUID REFERENCES unit_of_measure(id),
    burn_per_order_unit    NUMERIC,

    total_cost             NUMERIC,
    burn_unit_cost         NUMERIC,

    requested_by           UUID NOT NULL REFERENCES profile(id),
    requested_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by            UUID REFERENCES profile(id),
    reviewed_at            TIMESTAMPTZ,
    order_placed_by        UUID REFERENCES profile(id),
    order_placed_at        TIMESTAMPTZ,
    delivery_expected_date DATE,

    metadata               JSONB NOT NULL DEFAULT '{}',

    is_active              BOOLEAN NOT NULL DEFAULT true,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             UUID REFERENCES profile(id),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             UUID REFERENCES profile(id)
);

CREATE INDEX idx_inventory_order_org_id ON inventory_order (org_id);
CREATE INDEX idx_inventory_order_status ON inventory_order (org_id, status);
CREATE INDEX idx_inventory_order_item ON inventory_order (item_id);
