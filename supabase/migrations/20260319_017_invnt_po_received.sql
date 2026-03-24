CREATE TABLE IF NOT EXISTS invnt_po_received (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 TEXT NOT NULL REFERENCES org(id),
    farm_id                TEXT REFERENCES org_farm(id),
    invnt_po_id            UUID NOT NULL REFERENCES invnt_po(id),
    received_date          DATE NOT NULL,
    received_uom           TEXT REFERENCES sys_uom(code),
    received_quantity      NUMERIC NOT NULL,
    burn_per_received      NUMERIC,

    -- Lot tracking
    lot_number             TEXT,
    lot_expiry_date        DATE,

    -- Delivery acceptance
    delivery_truck_clean   BOOLEAN,
    delivery_acceptable    BOOLEAN,
    notes                  TEXT,
    received_photos        JSONB NOT NULL DEFAULT '[]',

    received_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_by            TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             TEXT,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE invnt_po_received IS 'Individual deliveries received against a purchase order. One order can have multiple received records to handle partial deliveries. Each record captures its own lot number, expiry date, quantity, and acceptance details.';

CREATE INDEX idx_invnt_po_received_po  ON invnt_po_received (invnt_po_id);
CREATE INDEX idx_invnt_po_received_org ON invnt_po_received (org_id);

COMMENT ON COLUMN invnt_po_received.burn_per_received IS 'Conversion factor: burn units per received unit at time of delivery';
