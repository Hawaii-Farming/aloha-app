CREATE TABLE IF NOT EXISTS fsafe_emp_test (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,

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

    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,

    CONSTRAINT uq_fsafe_emp_test UNIQUE (org_id, test_name)
);

CREATE INDEX idx_fsafe_emp_test_org ON fsafe_emp_test (org_id);

COMMENT ON TABLE fsafe_emp_test IS 'Catalog of EMP test definitions and their result configuration. Defines how results are evaluated and how many retests or vector tests are required on a fail.';
COMMENT ON COLUMN fsafe_emp_test.id IS 'Human-readable unique identifier derived from org and test name';
COMMENT ON COLUMN fsafe_emp_test.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_emp_test.test_name IS 'Name of the test or pathogen being tested for (e.g. Listeria, Salmonella)';
COMMENT ON COLUMN fsafe_emp_test.test_methods IS 'JSON array of available test methods users can select when recording a result (e.g. ["PCR", "Culture", "ELISA"])';
COMMENT ON COLUMN fsafe_emp_test.test_description IS 'Optional description of the test and its purpose';
COMMENT ON COLUMN fsafe_emp_test.result_type IS 'How results are recorded and evaluated: enum (select from list) or numeric (measured value)';
COMMENT ON COLUMN fsafe_emp_test.enum_options IS 'JSON array of all selectable result options when result_type is enum (e.g. ["Detected", "Not Detected"])';
COMMENT ON COLUMN fsafe_emp_test.enum_pass_options IS 'JSON array of enum values that constitute a passing result (e.g. ["Not Detected"])';
COMMENT ON COLUMN fsafe_emp_test.numeric_minimum_value IS 'Minimum acceptable numeric value; results below this are a fail';
COMMENT ON COLUMN fsafe_emp_test.numeric_maximum_value IS 'Maximum acceptable numeric value; results above this are a fail';
COMMENT ON COLUMN fsafe_emp_test.required_retests IS 'Number of retest records to auto-generate when any test of this type fails';
COMMENT ON COLUMN fsafe_emp_test.required_vector_tests IS 'Number of vector test records to auto-generate when any test of this type fails';
COMMENT ON COLUMN fsafe_emp_test.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN fsafe_emp_test.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_emp_test.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_emp_test.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_emp_test.updated_by IS 'Email of the user who last updated the record';
