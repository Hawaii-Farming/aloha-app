CREATE TABLE IF NOT EXISTS pack_shelf_life_check (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT REFERENCES org_farm(id),

    name            TEXT NOT NULL,
    description     TEXT,
    response_type   TEXT NOT NULL CHECK (response_type IN ('boolean', 'numeric', 'enum', 'text')),
    enum_options    JSONB,
    display_order   INTEGER NOT NULL DEFAULT 0,

    termination_boolean             BOOLEAN,
    termination_enum_values         JSONB,
    termination_numeric_minimum     NUMERIC,
    termination_numeric_maximum     NUMERIC,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE pack_shelf_life_check IS 'Defines what gets checked during a shelf life trial observation (e.g. color, texture, moisture, physical damage). Each check specifies a response type and optional termination criteria.';

CREATE INDEX idx_pack_shelf_life_check_org_id ON pack_shelf_life_check (org_id);

-- Partial unique indexes handle NULL farm_id correctly
CREATE UNIQUE INDEX uq_pack_shelf_life_check_org_level  ON pack_shelf_life_check (org_id, name) WHERE farm_id IS NULL;
CREATE UNIQUE INDEX uq_pack_shelf_life_check_farm_level ON pack_shelf_life_check (org_id, farm_id, name) WHERE farm_id IS NOT NULL;

COMMENT ON COLUMN pack_shelf_life_check.response_type IS 'Expected response type: boolean, numeric, enum, or text';
COMMENT ON COLUMN pack_shelf_life_check.enum_options IS 'JSON array of allowed enum values when response_type is enum (e.g. ["green", "yellow", "brown"])';
COMMENT ON COLUMN pack_shelf_life_check.display_order IS 'Sort position for ordering checks in the observation form';
COMMENT ON COLUMN pack_shelf_life_check.termination_boolean IS 'Boolean value that triggers trial termination when matched; null if not applicable';
COMMENT ON COLUMN pack_shelf_life_check.termination_enum_values IS 'JSON array of enum values that trigger trial termination when matched; null if not applicable';
COMMENT ON COLUMN pack_shelf_life_check.termination_numeric_minimum IS 'Numeric value below which the response triggers trial termination; null if not applicable';
COMMENT ON COLUMN pack_shelf_life_check.termination_numeric_maximum IS 'Numeric value above which the response triggers trial termination; null if not applicable';
