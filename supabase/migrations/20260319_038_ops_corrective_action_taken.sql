CREATE TABLE IF NOT EXISTS ops_corrective_action_taken (
    id                                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                              TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                             TEXT        REFERENCES farm(id),
    ops_template_id                     TEXT        REFERENCES ops_template(id),
    ops_response_id                     UUID        REFERENCES ops_response(id),
    fsafe_emp_result_id                 UUID,       -- FK to fsafe_emp_result(id) added via ALTER TABLE in fsafe_emp_result migration
    ops_corrective_action_choice_id     TEXT        REFERENCES ops_corrective_action_choice(id),

    other_action        TEXT,
    assigned_to         TEXT        REFERENCES hr_employee(id),
    due_date            DATE,
    completed_on        DATE,
    status              TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
    notes               TEXT,

    result_description  TEXT,

    is_active           BOOLEAN     NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    verified_at         TIMESTAMPTZ,
    verified_by         TEXT        REFERENCES hr_employee(id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT
);

CREATE INDEX idx_ops_corrective_action_taken_org_id   ON ops_corrective_action_taken (org_id);
CREATE INDEX idx_ops_corrective_action_taken_response ON ops_corrective_action_taken (ops_response_id);
CREATE INDEX idx_ops_corrective_action_taken_result   ON ops_corrective_action_taken (fsafe_emp_result_id);
CREATE INDEX idx_ops_corrective_action_taken_assigned ON ops_corrective_action_taken (assigned_to);
CREATE INDEX idx_ops_corrective_action_taken_status   ON ops_corrective_action_taken (org_id, status);

COMMENT ON TABLE ops_corrective_action_taken IS 'Corrective actions raised against a failing checklist response or EMP test result. Exactly one of ops_response_id or fsafe_emp_result_id will be set per row.';
COMMENT ON COLUMN ops_corrective_action_taken.id IS 'Unique identifier for the corrective action';
COMMENT ON COLUMN ops_corrective_action_taken.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_corrective_action_taken.farm_id IS 'Optional farm scope; null if the corrective action applies to all farms';
COMMENT ON COLUMN ops_corrective_action_taken.ops_template_id IS 'Checklist template this corrective action belongs to; null when triggered by an EMP test result which has no associated template';
COMMENT ON COLUMN ops_corrective_action_taken.ops_response_id IS 'Failing checklist response that triggered this corrective action; null if triggered by an EMP test result';
COMMENT ON COLUMN ops_corrective_action_taken.fsafe_emp_result_id IS 'Failing EMP test result that triggered this corrective action; null if triggered by a checklist response; FK added via ALTER TABLE in fsafe_emp_result migration';
COMMENT ON COLUMN ops_corrective_action_taken.ops_corrective_action_choice_id IS 'Predefined corrective action choice selected from the org lookup; null if a custom description is provided instead';
COMMENT ON COLUMN ops_corrective_action_taken.other_action IS 'Free-text description of the corrective action when no predefined choice is selected';
COMMENT ON COLUMN ops_corrective_action_taken.assigned_to IS 'Employee responsible for completing the corrective action';
COMMENT ON COLUMN ops_corrective_action_taken.due_date IS 'Date by which the corrective action must be completed';
COMMENT ON COLUMN ops_corrective_action_taken.completed_on IS 'Date when the corrective action was completed';
COMMENT ON COLUMN ops_corrective_action_taken.status IS 'Resolution status: open, completed';
COMMENT ON COLUMN ops_corrective_action_taken.notes IS 'Additional notes about the corrective action or its resolution';
COMMENT ON COLUMN ops_corrective_action_taken.result_description IS 'Description of the observed outcome after the corrective action was implemented';
COMMENT ON COLUMN ops_corrective_action_taken.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN ops_corrective_action_taken.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_corrective_action_taken.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_corrective_action_taken.verified_at IS 'Timestamp when the corrective action was verified as effective';
COMMENT ON COLUMN ops_corrective_action_taken.verified_by IS 'Employee who verified the corrective action was effective';
COMMENT ON COLUMN ops_corrective_action_taken.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_corrective_action_taken.updated_by IS 'Email of the user who last updated the record';
