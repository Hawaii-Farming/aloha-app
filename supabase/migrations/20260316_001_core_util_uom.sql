CREATE TABLE IF NOT EXISTS util_uom (
    code         VARCHAR(10) PRIMARY KEY,
    name         VARCHAR(50) NOT NULL,
    category     VARCHAR(30) NOT NULL,
    CONSTRAINT uq_util_uom_name UNIQUE (name)
);

CREATE INDEX idx_util_uom_category ON util_uom (category);

COMMENT ON TABLE util_uom IS 'Global reference table for standardized measurement units used across the system (weight, volume, temperature, etc.)';
COMMENT ON COLUMN util_uom.code IS 'Short code used as primary key and referenced by all unit FK columns across the system (e.g. kg, L, ppm)';
COMMENT ON COLUMN util_uom.name IS 'Full display name of the unit (e.g. Kilogram, Liter, Parts Per Million)';
COMMENT ON COLUMN util_uom.category IS 'Grouping category for the unit (e.g. weight, volume, temperature, concentration)';
