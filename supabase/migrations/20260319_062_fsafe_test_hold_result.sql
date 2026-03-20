CREATE TABLE IF NOT EXISTS fsafe_test_hold_result (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id             TEXT NOT NULL REFERENCES farm(id),
    fsafe_test_hold_id  UUID NOT NULL REFERENCES fsafe_test_hold(id) ON DELETE CASCADE,
    fsafe_emp_test_id  TEXT NOT NULL REFERENCES fsafe_emp_test(id),

    response_enum       TEXT,
    response_numeric    NUMERIC,
    result_pass         BOOLEAN,
    notes               TEXT,

    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,

    CONSTRAINT uq_fsafe_test_hold_result UNIQUE (fsafe_test_hold_id, fsafe_emp_test_id)
);

CREATE INDEX idx_fsafe_test_hold_result_org       ON fsafe_test_hold_result (org_id);
CREATE INDEX idx_fsafe_test_hold_result_test_hold ON fsafe_test_hold_result (fsafe_test_hold_id);
CREATE INDEX idx_fsafe_test_hold_result_emp_test ON fsafe_test_hold_result (fsafe_emp_test_id);

COMMENT ON TABLE fsafe_test_hold_result IS 'Individual test results for a test-and-hold record. One row per test type per test-and-hold event.';
COMMENT ON COLUMN fsafe_test_hold_result.id IS 'Unique identifier for the test result';
COMMENT ON COLUMN fsafe_test_hold_result.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_test_hold_result.farm_id IS 'Farm this result belongs to; inherited from parent test-and-hold';
COMMENT ON COLUMN fsafe_test_hold_result.fsafe_test_hold_id IS 'Parent test-and-hold record this result belongs to';
COMMENT ON COLUMN fsafe_test_hold_result.fsafe_emp_test_id IS 'Test type definition that defines how this result is recorded and evaluated';
COMMENT ON COLUMN fsafe_test_hold_result.response_enum IS 'Enum result value when test type response_type is enum (e.g. Positive, Negative)';
COMMENT ON COLUMN fsafe_test_hold_result.response_numeric IS 'Numeric result value when test type response_type is numeric (e.g. CFU/g count)';
COMMENT ON COLUMN fsafe_test_hold_result.result_pass IS 'Whether this result meets the pass criteria; null until result is entered';
COMMENT ON COLUMN fsafe_test_hold_result.notes IS 'Free-text notes about this specific test result';
COMMENT ON COLUMN fsafe_test_hold_result.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN fsafe_test_hold_result.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_test_hold_result.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_test_hold_result.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_test_hold_result.updated_by IS 'Email of the user who last updated the record';
