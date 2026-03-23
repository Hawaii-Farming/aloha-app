CREATE TABLE IF NOT EXISTS fsafe_emp_result (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT REFERENCES farm(id),
    site_id         TEXT NOT NULL REFERENCES site(id),
    -- Test configuration
    fsafe_lab_id    TEXT REFERENCES fsafe_lab(id),
    fsafe_lab_test_id   TEXT NOT NULL REFERENCES fsafe_lab_test(id),
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

    sampled_at      TIMESTAMPTZ,
    sampled_by      TEXT REFERENCES hr_employee(id),
    completed_at    TIMESTAMPTZ,
    verified_at     TIMESTAMPTZ,
    verified_by     TEXT REFERENCES hr_employee(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE fsafe_emp_result IS 'EMP test results. One row per test event. Retests and vector tests link back to the original failing test via original_fsafe_emp_result_id, forming a clear chain of why each test was created.';

CREATE INDEX idx_fsafe_emp_result_org      ON fsafe_emp_result (org_id);
CREATE INDEX idx_fsafe_emp_result_lab      ON fsafe_emp_result (fsafe_lab_id);
CREATE INDEX idx_fsafe_emp_result_site     ON fsafe_emp_result (site_id);
CREATE INDEX idx_fsafe_emp_result_test     ON fsafe_emp_result (fsafe_lab_test_id);
CREATE INDEX idx_fsafe_emp_result_original ON fsafe_emp_result (original_fsafe_emp_result_id);
CREATE INDEX idx_fsafe_emp_result_status   ON fsafe_emp_result (org_id, status);

COMMENT ON COLUMN fsafe_emp_result.site_id IS 'Zone classification is stored on the site record';
COMMENT ON COLUMN fsafe_emp_result.fsafe_lab_id IS 'Null if tested internally';
COMMENT ON COLUMN fsafe_emp_result.test_method IS 'Selected from the test methods list on the EMP test definition (e.g. PCR, Culture)';
COMMENT ON COLUMN fsafe_emp_result.initial_retest_vector IS 'Type of test: initial (first run), retest (triggered by any fail), vector (triggered by any fail)';
COMMENT ON COLUMN fsafe_emp_result.status IS 'Workflow status: pending, in_progress, completed';
COMMENT ON COLUMN fsafe_emp_result.result_enum IS 'Selected from test enum_options when result_type is enum';
COMMENT ON COLUMN fsafe_emp_result.result_numeric IS 'Frontend converts detection limit strings (e.g. <1, >2419) to numeric values before submission';
COMMENT ON COLUMN fsafe_emp_result.results_pass IS 'Whether the result meets the pass criteria defined on the EMP test definition';
COMMENT ON COLUMN fsafe_emp_result.fail_code IS 'Human-readable failure code (e.g. LM-001)';
COMMENT ON COLUMN fsafe_emp_result.original_fsafe_emp_result_id IS 'Initial test that triggered this retest or vector test; null for initial tests';

-- Add FK from ops_corrective_action_taken now that fsafe_emp_result exists
ALTER TABLE ops_corrective_action_taken
    ADD CONSTRAINT fk_ops_corrective_action_taken_emp_result
    FOREIGN KEY (fsafe_emp_result_id) REFERENCES fsafe_emp_result(id);
