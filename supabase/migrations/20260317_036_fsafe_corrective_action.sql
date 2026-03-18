CREATE TABLE IF NOT EXISTS fsafe_corrective_action (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id             TEXT        REFERENCES farm(id),
    template_id         TEXT        REFERENCES fsafe_template(id),
    response_id         UUID        NOT NULL REFERENCES fsafe_response(id),
    action_type_id      TEXT        REFERENCES fsafe_corrective_action_type(id),

    other_action        TEXT,
    assigned_to         TEXT        REFERENCES hr_employee(id),
    due_date            DATE,
    completed_on        DATE,
    status              TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
    notes               TEXT,

    result_description  TEXT,
    verified_by         TEXT        REFERENCES hr_employee(id),
    verified_at         TIMESTAMPTZ,

    is_active           BOOLEAN     NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT
);

CREATE INDEX idx_fsafe_corrective_action_org_id   ON fsafe_corrective_action (org_id);
CREATE INDEX idx_fsafe_corrective_action_response ON fsafe_corrective_action (response_id);
CREATE INDEX idx_fsafe_corrective_action_assigned ON fsafe_corrective_action (assigned_to);
CREATE INDEX idx_fsafe_corrective_action_status   ON fsafe_corrective_action (org_id, status);

COMMENT ON TABLE fsafe_corrective_action IS 'Corrective actions raised against a failing food safety checklist response. Tracks the action, assignment, and resolution status.';
COMMENT ON COLUMN fsafe_corrective_action.id IS 'Unique identifier for the corrective action';
COMMENT ON COLUMN fsafe_corrective_action.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_corrective_action.farm_id IS 'Optional farm scope; null if the corrective action applies to all farms';
COMMENT ON COLUMN fsafe_corrective_action.template_id IS 'Checklist template this corrective action belongs to; denormalized for easier filtering and reporting';
COMMENT ON COLUMN fsafe_corrective_action.response_id IS 'Failing checklist response that triggered this corrective action';
COMMENT ON COLUMN fsafe_corrective_action.action_type_id IS 'Predefined corrective action type selected from the org lookup; null if a custom description is provided instead';
COMMENT ON COLUMN fsafe_corrective_action.other_action IS 'Free-text description of the corrective action when no predefined action type is selected';
COMMENT ON COLUMN fsafe_corrective_action.assigned_to IS 'Employee responsible for completing the corrective action';
COMMENT ON COLUMN fsafe_corrective_action.due_date IS 'Date by which the corrective action must be completed';
COMMENT ON COLUMN fsafe_corrective_action.completed_on IS 'Date when the corrective action was completed';
COMMENT ON COLUMN fsafe_corrective_action.status IS 'Resolution status: open, completed';
COMMENT ON COLUMN fsafe_corrective_action.notes IS 'Additional notes about the corrective action or its resolution';
COMMENT ON COLUMN fsafe_corrective_action.result_description IS 'Description of the observed outcome after the corrective action was implemented';
COMMENT ON COLUMN fsafe_corrective_action.verified_by IS 'Employee who verified the corrective action was effective';
COMMENT ON COLUMN fsafe_corrective_action.verified_at IS 'Timestamp when the corrective action was verified as effective';
COMMENT ON COLUMN fsafe_corrective_action.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN fsafe_corrective_action.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_corrective_action.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_corrective_action.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_corrective_action.updated_by IS 'Email of the user who last updated the record';
