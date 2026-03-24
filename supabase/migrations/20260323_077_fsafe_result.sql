CREATE TABLE IF NOT EXISTS fsafe_result (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT REFERENCES org_farm(id),
    site_id         TEXT REFERENCES org_site(id),
    fsafe_test_hold_id  UUID REFERENCES fsafe_test_hold(id),
    fsafe_lab_id    TEXT REFERENCES fsafe_lab(id),
    fsafe_lab_test_id   TEXT NOT NULL REFERENCES fsafe_lab_test(id),
    test_method             TEXT,
    initial_retest_vector   TEXT CHECK (initial_retest_vector IN ('initial', 'retest', 'vector')),
    status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),

    result_enum     TEXT,
    result_numeric  NUMERIC,
    result_pass     BOOLEAN,
    warning_message TEXT,
    fail_code       TEXT,

    fsafe_result_id_original UUID REFERENCES fsafe_result(id),

    notes           TEXT,

    sampled_at      TIMESTAMPTZ,
    sampled_by      TEXT REFERENCES hr_employee(id),
    started_at TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    verified_at     TIMESTAMPTZ,
    verified_by     TEXT REFERENCES hr_employee(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE fsafe_result IS 'Unified food safety test results table. Stores both EMP results (site_id set, fsafe_test_hold_id null) and test-and-hold results (fsafe_test_hold_id set). Retests and vector tests link back to the original via fsafe_result_id_original.';

CREATE INDEX idx_fsafe_result_org       ON fsafe_result (org_id);
CREATE INDEX idx_fsafe_result_lab       ON fsafe_result (fsafe_lab_id);
CREATE INDEX idx_fsafe_result_site      ON fsafe_result (site_id);
CREATE INDEX idx_fsafe_result_test      ON fsafe_result (fsafe_lab_test_id);
CREATE INDEX idx_fsafe_result_test_hold ON fsafe_result (fsafe_test_hold_id);
CREATE INDEX idx_fsafe_result_original  ON fsafe_result (fsafe_result_id_original);
CREATE INDEX idx_fsafe_result_status    ON fsafe_result (org_id, status);

COMMENT ON COLUMN fsafe_result.fsafe_test_hold_id IS 'Set for test-and-hold results; null for EMP results';
COMMENT ON COLUMN fsafe_result.site_id IS 'Zone classification is stored on the site record; set for EMP results';
COMMENT ON COLUMN fsafe_result.fsafe_lab_id IS 'Null if tested internally';
COMMENT ON COLUMN fsafe_result.test_method IS 'Selected from the test methods list on the test definition (e.g. PCR, Culture); null for test-and-hold';
COMMENT ON COLUMN fsafe_result.initial_retest_vector IS 'Type of test: initial (first run), retest (triggered by any fail), vector (triggered by any fail); null for test-and-hold';
COMMENT ON COLUMN fsafe_result.status IS 'Workflow status: pending, in_progress, completed';
COMMENT ON COLUMN fsafe_result.result_enum IS 'Selected from test enum_options when result_type is enum';
COMMENT ON COLUMN fsafe_result.result_numeric IS 'Numeric result value when result_type is numeric';
COMMENT ON COLUMN fsafe_result.result_pass IS 'Whether the result meets the pass criteria; null until result is entered';
COMMENT ON COLUMN fsafe_result.fail_code IS 'Human-readable failure code (e.g. LM-001)';
COMMENT ON COLUMN fsafe_result.fsafe_result_id_original IS 'Initial test that triggered this retest or vector test; null for initial tests';

-- Add FK from ops_corrective_action_taken now that fsafe_result exists
ALTER TABLE ops_corrective_action_taken
    ADD CONSTRAINT fk_ops_corrective_action_taken_fsafe_result
    FOREIGN KEY (fsafe_result_id) REFERENCES fsafe_result(id);
