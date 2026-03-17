CREATE TABLE IF NOT EXISTS invnt_onhand (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                TEXT REFERENCES farm(id),
    invnt_item_id          UUID NOT NULL REFERENCES invnt_item(id),
    onhand_date            DATE NOT NULL,
    onhand_uom             VARCHAR(10) REFERENCES util_uom(code),
    onhand_quantity        NUMERIC NOT NULL,
    onhand_burn_quantity   NUMERIC,

    -- Lot tracking
    lot_number             VARCHAR(50),
    lot_expiry_date        DATE,

    additional_notes       TEXT,

    -- Status & audit
    is_active              BOOLEAN NOT NULL DEFAULT true,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             UUID REFERENCES auth.users(id),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invnt_onhand_org_id ON invnt_onhand (org_id);
CREATE INDEX idx_invnt_onhand_item ON invnt_onhand (invnt_item_id, onhand_date);

COMMENT ON TABLE invnt_onhand IS 'Records on-hand inventory snapshots per item with lot tracking and burn unit conversion';
COMMENT ON COLUMN invnt_onhand.id IS 'Unique identifier for the on-hand record';
COMMENT ON COLUMN invnt_onhand.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_onhand.farm_id IS 'Optional farm scope';
COMMENT ON COLUMN invnt_onhand.invnt_item_id IS 'Inventory item this record tracks';
COMMENT ON COLUMN invnt_onhand.onhand_date IS 'Date of the on-hand snapshot';
COMMENT ON COLUMN invnt_onhand.onhand_uom IS 'Unit of measure for the on-hand quantity';
COMMENT ON COLUMN invnt_onhand.onhand_quantity IS 'Quantity on hand in onhand units';
COMMENT ON COLUMN invnt_onhand.onhand_burn_quantity IS 'Burn units per onhand unit at time of record';
COMMENT ON COLUMN invnt_onhand.lot_number IS 'Lot or batch number for lot-tracked items';
COMMENT ON COLUMN invnt_onhand.lot_expiry_date IS 'Expiry date for this lot';
COMMENT ON COLUMN invnt_onhand.additional_notes IS 'Free-text notes about this on-hand record';
COMMENT ON COLUMN invnt_onhand.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN invnt_onhand.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN invnt_onhand.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN invnt_onhand.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_onhand.updated_by IS 'User who last updated the record, references auth.users(id)';
