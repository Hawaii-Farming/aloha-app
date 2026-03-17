CREATE TABLE IF NOT EXISTS grow_variety (
    id         TEXT PRIMARY KEY,
    org_id     TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id    TEXT NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    code       TEXT NOT NULL,
    name       TEXT NOT NULL,
    description TEXT,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT,
    CONSTRAINT uq_grow_variety_code UNIQUE (farm_id, code),
    CONSTRAINT uq_grow_variety_name UNIQUE (farm_id, name)
);

COMMENT ON TABLE grow_variety IS 'Crop varieties grown on a farm, identified by short codes (e.g. K for Keiki cucumber)';
COMMENT ON COLUMN grow_variety.id IS 'Human-readable identifier derived from variety name (lowercase trimmed)';
COMMENT ON COLUMN grow_variety.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN grow_variety.farm_id IS 'Farm this variety belongs to';
COMMENT ON COLUMN grow_variety.code IS 'Short code for the variety, unique within the farm (e.g. K, J, GR)';
COMMENT ON COLUMN grow_variety.name IS 'Full display name of the variety, unique within the farm';
COMMENT ON COLUMN grow_variety.description IS 'Optional description or notes about the variety';
COMMENT ON COLUMN grow_variety.is_active IS 'Soft delete flag; false hides the variety from active use';
COMMENT ON COLUMN grow_variety.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN grow_variety.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN grow_variety.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN grow_variety.updated_by IS 'Email of the user who last updated the record';
