CREATE TABLE IF NOT EXISTS fsafe_test_hold_result (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    farm_id             TEXT NOT NULL REFERENCES farm(id),
    fsafe_test_hold_id  UUID NOT NULL REFERENCES fsafe_test_hold(id),
    fsafe_lab_test_id  TEXT NOT NULL REFERENCES fsafe_lab_test(id),

    response_enum       TEXT,
    response_numeric    NUMERIC,
    result_pass         BOOLEAN,
    notes               TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted           BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_fsafe_test_hold_result UNIQUE (fsafe_test_hold_id, fsafe_lab_test_id)
);

COMMENT ON TABLE fsafe_test_hold_result IS 'Individual test results for a test-and-hold record. One row per test type per test-and-hold event.';

CREATE INDEX idx_fsafe_test_hold_result_org       ON fsafe_test_hold_result (org_id);
CREATE INDEX idx_fsafe_test_hold_result_test_hold ON fsafe_test_hold_result (fsafe_test_hold_id);
CREATE INDEX idx_fsafe_test_hold_result_emp_test ON fsafe_test_hold_result (fsafe_lab_test_id);

COMMENT ON COLUMN fsafe_test_hold_result.fsafe_lab_test_id IS 'Defines how this result is recorded and evaluated';
COMMENT ON COLUMN fsafe_test_hold_result.response_enum IS 'Used when test result_type is enum (e.g. Positive, Negative)';
COMMENT ON COLUMN fsafe_test_hold_result.response_numeric IS 'Used when test result_type is numeric (e.g. CFU/g count)';
COMMENT ON COLUMN fsafe_test_hold_result.result_pass IS 'Null until result is entered';
