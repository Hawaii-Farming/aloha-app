CREATE TABLE IF NOT EXISTS invnt_onhand (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 TEXT NOT NULL REFERENCES org(id),
    farm_id                TEXT REFERENCES farm(id),
    invnt_item_id          UUID NOT NULL REFERENCES invnt_item(id),
    onhand_date            DATE NOT NULL,
    onhand_uom             TEXT REFERENCES util_uom(code),
    onhand_quantity        NUMERIC NOT NULL,
    burn_per_onhand   NUMERIC,

    -- Lot tracking
    lot_number             TEXT,
    lot_expiry_date        DATE,

    notes                  TEXT,

    -- Status & audit
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             TEXT,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE invnt_onhand IS 'Records on-hand inventory snapshots per item. Each record captures the quantity in onhand units with burn unit conversion and optional lot tracking. Source of truth for computed totals like current stock, burn-per-week, and weeks-on-hand.';

CREATE INDEX idx_invnt_onhand_org_id ON invnt_onhand (org_id);
CREATE INDEX idx_invnt_onhand_item ON invnt_onhand (invnt_item_id, onhand_date);

COMMENT ON COLUMN invnt_onhand.invnt_item_id IS 'Inventory item this record tracks';
COMMENT ON COLUMN invnt_onhand.onhand_uom IS 'Unit of measure for the on-hand quantity';
COMMENT ON COLUMN invnt_onhand.onhand_quantity IS 'Quantity on hand in onhand units';
COMMENT ON COLUMN invnt_onhand.burn_per_onhand IS 'Burn units per onhand unit at time of record';
