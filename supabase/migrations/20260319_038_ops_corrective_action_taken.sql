CREATE TABLE IF NOT EXISTS ops_corrective_action_taken (
    id                                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                              TEXT        NOT NULL REFERENCES org(id),
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

    verified_at         TIMESTAMPTZ,
    verified_by         TEXT        REFERENCES hr_employee(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted           BOOLEAN     NOT NULL DEFAULT false
);

COMMENT ON TABLE ops_corrective_action_taken IS 'Corrective actions raised against a failing checklist response or EMP test result. Tracks the action required, who is responsible, and the resolution status.';

CREATE INDEX idx_ops_corrective_action_taken_org_id   ON ops_corrective_action_taken (org_id);
CREATE INDEX idx_ops_corrective_action_taken_response ON ops_corrective_action_taken (ops_response_id);
CREATE INDEX idx_ops_corrective_action_taken_result   ON ops_corrective_action_taken (fsafe_emp_result_id);
CREATE INDEX idx_ops_corrective_action_taken_assigned ON ops_corrective_action_taken (assigned_to);
CREATE INDEX idx_ops_corrective_action_taken_status   ON ops_corrective_action_taken (org_id, status);

COMMENT ON COLUMN ops_corrective_action_taken.ops_template_id IS 'Checklist template this corrective action belongs to; null when triggered by an EMP test result which has no associated template';
COMMENT ON COLUMN ops_corrective_action_taken.ops_response_id IS 'Failing checklist response that triggered this corrective action; null if triggered by an EMP test result';
COMMENT ON COLUMN ops_corrective_action_taken.fsafe_emp_result_id IS 'Failing EMP test result that triggered this corrective action; null if triggered by a checklist response; FK added via ALTER TABLE in fsafe_emp_result migration';
COMMENT ON COLUMN ops_corrective_action_taken.ops_corrective_action_choice_id IS 'Predefined corrective action choice selected from the org lookup; null if a custom description is provided instead';
COMMENT ON COLUMN ops_corrective_action_taken.other_action IS 'Free-text description of the corrective action when no predefined choice is selected';
COMMENT ON COLUMN ops_corrective_action_taken.assigned_to IS 'Employee responsible for completing the corrective action';
COMMENT ON COLUMN ops_corrective_action_taken.status IS 'Resolution status: open, completed';

