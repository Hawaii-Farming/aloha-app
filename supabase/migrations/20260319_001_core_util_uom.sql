CREATE TABLE IF NOT EXISTS util_uom (
    code         TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL,
    is_deleted    BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by   TEXT,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by   TEXT,
    CONSTRAINT uq_util_uom_name UNIQUE (name)
);

CREATE INDEX idx_util_uom_category ON util_uom (category);

COMMENT ON TABLE util_uom IS 'Global reference table for standardized measurement units used across the system (weight, volume, temperature, etc.)';
COMMENT ON COLUMN util_uom.code IS 'Short code used as primary key and referenced by all unit FK columns across the system (e.g. kg, L, ppm)';
COMMENT ON COLUMN util_uom.name IS 'Full display name of the unit (e.g. Kilogram, Liter, Parts Per Million)';
COMMENT ON COLUMN util_uom.category IS 'Grouping category for the unit (e.g. weight, volume, temperature, concentration)';
COMMENT ON COLUMN util_uom.is_deleted IS 'Soft delete flag; false hides the unit from active use';
COMMENT ON COLUMN util_uom.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN util_uom.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN util_uom.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN util_uom.updated_by IS 'Email of the user who last updated the record';
