CREATE TABLE IF NOT EXISTS grow_monitoring_metric (
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

    -- Response & Calculation
    response_type       TEXT NOT NULL DEFAULT 'numeric' CHECK (response_type IN ('numeric', 'boolean', 'text')),
    point_type          TEXT NOT NULL DEFAULT 'direct' CHECK (point_type IN ('direct', 'calculated')),
    formula             TEXT,
    input_point_ids     JSONB,

    -- Corrective Actions
    corrective_actions  JSONB NOT NULL DEFAULT '[]',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_monitoring_metric UNIQUE (org_id, farm_id, site_category, name)
);

COMMENT ON TABLE grow_monitoring_metric IS 'Defines what to measure per farm and site category. Direct points are entered manually; calculated points are derived from other points using a formula.';

COMMENT ON COLUMN grow_monitoring_metric.response_type IS 'numeric, boolean, text';
COMMENT ON COLUMN grow_monitoring_metric.point_type IS 'direct, calculated';

CREATE INDEX idx_grow_monitoring_metric_farm ON grow_monitoring_metric (org_id, farm_id, site_category);
