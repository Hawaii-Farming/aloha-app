CREATE TABLE IF NOT EXISTS fsafe_emp_result (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id         TEXT REFERENCES farm(id),
    site_id         TEXT NOT NULL REFERENCES site(id),
    -- Test configuration
    fsafe_lab_id    TEXT REFERENCES fsafe_lab(id),
    fsafe_emp_test_id   TEXT NOT NULL REFERENCES fsafe_emp_test(id),
    test_method             TEXT        NOT NULL,
    initial_retest_vector   TEXT NOT NULL CHECK (initial_retest_vector IN ('initial', 'retest', 'vector')),
    status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),

    -- Results
    result_enum     TEXT,
    result_numeric  NUMERIC,
    results_pass    BOOLEAN,
    warning_message TEXT,
    fail_code       TEXT,

    -- Retest / vector test linkage
    original_fsafe_emp_result_id UUID REFERENCES fsafe_emp_result(id),

    notes           TEXT,

    is_deleted       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    sampled_at      TIMESTAMPTZ,
    sampled_by      TEXT REFERENCES hr_employee(id),
    completed_at    TIMESTAMPTZ,
    verified_at     TIMESTAMPTZ,
    verified_by     TEXT REFERENCES hr_employee(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT
);

CREATE INDEX idx_fsafe_emp_result_org      ON fsafe_emp_result (org_id);
CREATE INDEX idx_fsafe_emp_result_lab      ON fsafe_emp_result (fsafe_lab_id);
CREATE INDEX idx_fsafe_emp_result_site     ON fsafe_emp_result (site_id);
CREATE INDEX idx_fsafe_emp_result_test     ON fsafe_emp_result (fsafe_emp_test_id);
CREATE INDEX idx_fsafe_emp_result_original ON fsafe_emp_result (original_fsafe_emp_result_id);
CREATE INDEX idx_fsafe_emp_result_status   ON fsafe_emp_result (org_id, status);

COMMENT ON TABLE fsafe_emp_result IS 'EMP test results. Each row is a single test event. Retests and vector tests link back to the original failing test via original_fsafe_emp_result_id.';
COMMENT ON COLUMN fsafe_emp_result.id IS 'Unique identifier for the test result record';
COMMENT ON COLUMN fsafe_emp_result.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_emp_result.farm_id IS 'Farm where the sample was collected';
COMMENT ON COLUMN fsafe_emp_result.site_id IS 'Site where the sample was collected; zone classification is stored on the site record';
COMMENT ON COLUMN fsafe_emp_result.fsafe_lab_id IS 'Laboratory where the sample is submitted for testing; null if tested internally';
COMMENT ON COLUMN fsafe_emp_result.fsafe_emp_test_id IS 'EMP test definition used for this test event';
COMMENT ON COLUMN fsafe_emp_result.test_method IS 'Test method used, selected from the test methods list on the EMP test definition (e.g. PCR, Culture)';
COMMENT ON COLUMN fsafe_emp_result.initial_retest_vector IS 'Type of test: initial (first run), retest (triggered by any fail), vector (triggered by any fail)';
COMMENT ON COLUMN fsafe_emp_result.status IS 'Workflow status: pending, in_progress, completed';
COMMENT ON COLUMN fsafe_emp_result.result_enum IS 'Enum result value selected from test enum_options when result_type is enum';
COMMENT ON COLUMN fsafe_emp_result.result_numeric IS 'Numeric result value when result_type is numeric; frontend converts detection limit strings (e.g. <1, >2419) to numeric values before submission';
COMMENT ON COLUMN fsafe_emp_result.results_pass IS 'Whether the result meets the pass criteria defined on the EMP test definition';
COMMENT ON COLUMN fsafe_emp_result.warning_message IS 'Warning message displayed when the result fails';
COMMENT ON COLUMN fsafe_emp_result.fail_code IS 'Human-readable failure code assigned to this test result (e.g. LM-001)';
COMMENT ON COLUMN fsafe_emp_result.original_fsafe_emp_result_id IS 'Reference to the initial test result that triggered this retest or vector test; null for initial tests';
COMMENT ON COLUMN fsafe_emp_result.notes IS 'Free-text notes about the test event';
COMMENT ON COLUMN fsafe_emp_result.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN fsafe_emp_result.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_emp_result.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_emp_result.sampled_at IS 'Timestamp when the sample was collected';
COMMENT ON COLUMN fsafe_emp_result.sampled_by IS 'Employee who collected the sample';
COMMENT ON COLUMN fsafe_emp_result.completed_at IS 'Timestamp when the lab completed processing the sample';
COMMENT ON COLUMN fsafe_emp_result.verified_at IS 'Timestamp when the test result was verified';
COMMENT ON COLUMN fsafe_emp_result.verified_by IS 'Employee who verified the test result';
COMMENT ON COLUMN fsafe_emp_result.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_emp_result.updated_by IS 'Email of the user who last updated the record';

-- Add FK from ops_corrective_action_taken now that fsafe_emp_result exists
ALTER TABLE ops_corrective_action_taken
    ADD CONSTRAINT fk_ops_corrective_action_taken_emp_result
    FOREIGN KEY (fsafe_emp_result_id) REFERENCES fsafe_emp_result(id);
