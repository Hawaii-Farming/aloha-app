CREATE TABLE IF NOT EXISTS farm (
    id               TEXT PRIMARY KEY,
    org_id           TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    weighing_uom  TEXT REFERENCES util_uom(code),
    growing_uom   TEXT REFERENCES util_uom(code),
    is_deleted        BOOLEAN NOT NULL DEFAULT false,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by       TEXT,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by       TEXT,
    CONSTRAINT uq_farm UNIQUE (org_id, name)
);

COMMENT ON TABLE farm IS 'Crop or product line within an org (e.g. Cuke Farm, Lettuce Farm); represents a logical grouping, not a physical location';
COMMENT ON COLUMN farm.id IS 'Human-readable identifier derived from farm name (lowercase trimmed string)';
COMMENT ON COLUMN farm.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN farm.name IS 'Display name of the farm, unique within the org';
COMMENT ON COLUMN farm.weighing_uom IS 'Default unit of measure for weighing operations on this farm (e.g. lb, kg)';
COMMENT ON COLUMN farm.growing_uom IS 'Default unit of measure for growing/harvest tracking on this farm';
COMMENT ON COLUMN farm.is_deleted IS 'Soft delete flag; false hides the farm from active use';
COMMENT ON COLUMN farm.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN farm.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN farm.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN farm.updated_by IS 'Email of the user who last updated the record';
