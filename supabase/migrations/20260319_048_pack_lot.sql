CREATE TABLE IF NOT EXISTS pack_lot (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT NOT NULL REFERENCES farm(id),

    lot_number      TEXT NOT NULL,
    harvest_date    DATE,
    pack_date       DATE NOT NULL,

    is_deleted       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,

    CONSTRAINT uq_pack_lot UNIQUE (org_id, lot_number)
);

CREATE INDEX idx_pack_lot_org_id  ON pack_lot (org_id);
CREATE INDEX idx_pack_lot_farm_id ON pack_lot (farm_id);

COMMENT ON TABLE pack_lot IS 'Production lot header. One row per lot. Lot numbers are system-generated from the pack date but can be overridden by the user. The same lot number is shared across all products packed on the same day.';
COMMENT ON COLUMN pack_lot.id IS 'Unique identifier for the pack lot';
COMMENT ON COLUMN pack_lot.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN pack_lot.farm_id IS 'Farm (crop line) this pack lot belongs to';
COMMENT ON COLUMN pack_lot.lot_number IS 'Lot identifier, system-generated from pack date but editable by the user; unique per org';
COMMENT ON COLUMN pack_lot.harvest_date IS 'Date the product in this lot was harvested; null if not applicable or unknown';
COMMENT ON COLUMN pack_lot.pack_date IS 'Date the products in this lot were packed';
COMMENT ON COLUMN pack_lot.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN pack_lot.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN pack_lot.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN pack_lot.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN pack_lot.updated_by IS 'Email of the user who last updated the record';
