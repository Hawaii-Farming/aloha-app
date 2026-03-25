CREATE TABLE IF NOT EXISTS fsafe_lab_test (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT REFERENCES org_farm(id),

    test_name       TEXT NOT NULL,
    test_methods    JSONB NOT NULL DEFAULT '[]',
    test_description TEXT,

    -- Result configuration
    result_type     TEXT NOT NULL CHECK (result_type IN ('enum', 'numeric')),
    enum_options         JSONB,
    enum_pass_options    JSONB,
    numeric_minimum_value NUMERIC,
    numeric_maximum_value NUMERIC,

    -- Retest & vector test thresholds
    required_retests        INTEGER NOT NULL DEFAULT 0,
    required_vector_tests   INTEGER NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_fsafe_lab_test UNIQUE (org_id, test_name)
);

COMMENT ON TABLE fsafe_lab_test IS 'Catalog of EMP test definitions and their result configuration. Defines how results are evaluated and how many retests or vector tests are required on a fail.';

CREATE INDEX idx_fsafe_lab_test_org ON fsafe_lab_test (org_id);

COMMENT ON COLUMN fsafe_lab_test.result_type IS 'enum, numeric';
