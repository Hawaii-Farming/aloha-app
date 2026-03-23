CREATE TABLE IF NOT EXISTS org_uom (
    code         TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by   TEXT,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by   TEXT,
    is_deleted    BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_org_uom_name UNIQUE (name)
);

COMMENT ON TABLE org_uom IS 'Standardized measurement units shared across all organizations for consistent data entry and calculations throughout the system.';

CREATE INDEX idx_org_uom_category ON org_uom (category);

COMMENT ON COLUMN org_uom.code IS 'Short code used as primary key and referenced by all unit FK columns across the system (e.g. kg, L, ppm)';
COMMENT ON COLUMN org_uom.category IS 'Grouping category for the unit (e.g. weight, volume, temperature, concentration)';
