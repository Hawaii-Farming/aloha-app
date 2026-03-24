CREATE TABLE IF NOT EXISTS grow_monitoring_point (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT NOT NULL REFERENCES org_farm(id),
    site_category   TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    uom             TEXT REFERENCES sys_uom(code),
    minimum_value   NUMERIC,
    maximum_value   NUMERIC,
    display_order   INTEGER NOT NULL DEFAULT 0,

    -- Calculation
    point_type      TEXT NOT NULL DEFAULT 'direct' CHECK (point_type IN ('direct', 'calculated')),
    formula         TEXT,
    input_point_ids JSONB,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_monitoring_point UNIQUE (org_id, farm_id, site_category, name)
);

COMMENT ON TABLE grow_monitoring_point IS 'Defines what to measure per farm and site category. Direct points are entered manually; calculated points are derived from other points using a formula.';

COMMENT ON COLUMN grow_monitoring_point.site_category IS 'Matches org_site.category to scope which points apply (e.g. greenhouse, nursery, pond)';
COMMENT ON COLUMN grow_monitoring_point.minimum_value IS 'Below this value the reading is flagged as out of range';
COMMENT ON COLUMN grow_monitoring_point.maximum_value IS 'Above this value the reading is flagged as out of range';
COMMENT ON COLUMN grow_monitoring_point.point_type IS 'direct = manually entered; calculated = derived from formula';
COMMENT ON COLUMN grow_monitoring_point.formula IS 'Expression string for calculated points (e.g. (drain_ml / drip_ml) * 100); null for direct points';
COMMENT ON COLUMN grow_monitoring_point.input_point_ids IS 'JSON array of grow_monitoring_point IDs that feed into this calculation; null for direct points';

CREATE INDEX idx_grow_monitoring_point_farm ON grow_monitoring_point (org_id, farm_id, site_category);
