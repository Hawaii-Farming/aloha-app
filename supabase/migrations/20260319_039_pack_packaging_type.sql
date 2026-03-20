CREATE TABLE IF NOT EXISTS pack_packaging_type (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id         TEXT REFERENCES farm(id),

    name            TEXT NOT NULL,
    description     TEXT,
    display_order   INTEGER NOT NULL DEFAULT 0,

    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT
);

CREATE INDEX idx_pack_packaging_type_org_id ON pack_packaging_type (org_id);

-- Partial unique indexes handle NULL farm_id correctly
CREATE UNIQUE INDEX uq_pack_packaging_type_org_level  ON pack_packaging_type (org_id, name) WHERE farm_id IS NULL;
CREATE UNIQUE INDEX uq_pack_packaging_type_farm_level ON pack_packaging_type (org_id, farm_id, name) WHERE farm_id IS NOT NULL;

COMMENT ON TABLE pack_packaging_type IS 'Org-defined packaging type lookup (e.g. clamshell, bag, sleeve, tray wrap). Referenced by both sales_product and pack_shelf_life_trial.';
COMMENT ON COLUMN pack_packaging_type.id IS 'Human-readable identifier derived from name (trimmed lowercase)';
COMMENT ON COLUMN pack_packaging_type.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN pack_packaging_type.farm_id IS 'Optional farm scope; null if the packaging type applies to all farms';
COMMENT ON COLUMN pack_packaging_type.name IS 'Packaging type name, unique per org and farm scope (e.g. Clamshell, Bag, Sleeve, Tray Wrap)';
COMMENT ON COLUMN pack_packaging_type.description IS 'Optional description of this packaging type';
COMMENT ON COLUMN pack_packaging_type.display_order IS 'Sort position for ordering packaging types in the UI';
COMMENT ON COLUMN pack_packaging_type.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN pack_packaging_type.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN pack_packaging_type.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN pack_packaging_type.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN pack_packaging_type.updated_by IS 'Email of the user who last updated the record';
