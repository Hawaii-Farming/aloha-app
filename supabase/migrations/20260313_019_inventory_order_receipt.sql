CREATE TABLE IF NOT EXISTS inventory_order_receipt (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    order_id               UUID NOT NULL REFERENCES inventory_order(id) ON DELETE CASCADE,

    received_by            UUID NOT NULL REFERENCES profile(id),
    received_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_date          DATE NOT NULL,

    quantity_received      NUMERIC NOT NULL,
    received_unit_id       UUID REFERENCES unit_of_measure(id),
    burn_per_received_unit NUMERIC,

    lot_number             VARCHAR(50),
    lot_expiry_date        DATE,

    metadata               JSONB NOT NULL DEFAULT '{}',

    is_active              BOOLEAN NOT NULL DEFAULT true,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             UUID REFERENCES profile(id),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             UUID REFERENCES profile(id)
);

CREATE INDEX idx_inventory_order_receipt_order ON inventory_order_receipt (order_id);
CREATE INDEX idx_inventory_order_receipt_org ON inventory_order_receipt (org_id);
