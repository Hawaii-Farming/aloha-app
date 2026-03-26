CREATE TABLE IF NOT EXISTS pack_shelf_life_metric (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT REFERENCES org_farm(id),
    name            TEXT NOT NULL,
    description     TEXT,
    display_order   INTEGER NOT NULL DEFAULT 0,

    -- Response configuration
    response_type   TEXT NOT NULL CHECK (response_type IN ('boolean', 'numeric', 'enum')),
    enum_options    JSONB,

    -- Fail criteria (triggers trial termination when matched)
    fail_boolean        BOOLEAN,
    fail_enum_values    JSONB,
    fail_minimum_value        NUMERIC,
    fail_maximum_value        NUMERIC,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE pack_shelf_life_metric IS 'Defines what gets checked during a shelf life observation (e.g. color, texture, moisture). Each metric specifies a response type and optional fail criteria that trigger trial termination.';

CREATE INDEX idx_pack_shelf_life_metric_org_id ON pack_shelf_life_metric (org_id);

-- Partial unique indexes handle NULL farm_id correctly
CREATE UNIQUE INDEX uq_pack_shelf_life_metric_org_level  ON pack_shelf_life_metric (org_id, name) WHERE farm_id IS NULL;
CREATE UNIQUE INDEX uq_pack_shelf_life_metric_farm_level ON pack_shelf_life_metric (org_id, farm_id, name) WHERE farm_id IS NOT NULL;

COMMENT ON COLUMN pack_shelf_life_metric.response_type IS 'boolean, numeric, enum';
