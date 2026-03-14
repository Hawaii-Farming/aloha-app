CREATE TABLE IF NOT EXISTS inventory_transaction (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    farm_id                UUID REFERENCES farm(id),
    item_id                UUID NOT NULL REFERENCES inventory_item(id),
    type                   VARCHAR(20) NOT NULL CHECK (type IN ('receipt', 'count', 'usage')),
    transaction_date       DATE NOT NULL,

    quantity_onhand        NUMERIC NOT NULL,
    onhand_unit_id         UUID REFERENCES unit_of_measure(id),
    quantity_burn          NUMERIC NOT NULL,
    burn_unit_id           UUID REFERENCES unit_of_measure(id),
    burn_per_onhand_unit   NUMERIC,

    lot_number             VARCHAR(50),
    lot_expiry_date        DATE,

    reference_table        VARCHAR(50),
    reference_id           UUID,

    metadata               JSONB NOT NULL DEFAULT '{}',

    is_active              BOOLEAN NOT NULL DEFAULT true,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             UUID REFERENCES profile(id),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             UUID REFERENCES profile(id)
);

CREATE INDEX idx_inventory_transaction_org_id ON inventory_transaction (org_id);
CREATE INDEX idx_inventory_transaction_item ON inventory_transaction (item_id, transaction_date);
CREATE INDEX idx_inventory_transaction_type ON inventory_transaction (org_id, type);
CREATE INDEX idx_inventory_transaction_ref ON inventory_transaction (reference_table, reference_id);
