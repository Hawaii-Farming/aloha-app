CREATE TABLE IF NOT EXISTS ops_corrective_action_choice (
    id          TEXT        PRIMARY KEY,
    org_id      TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,

    name        TEXT        NOT NULL,
    description TEXT,

    is_deleted   BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,

    CONSTRAINT uq_ops_corrective_action_choice UNIQUE (org_id, name)
);

CREATE INDEX idx_ops_corrective_action_choice_org_id ON ops_corrective_action_choice (org_id);

COMMENT ON TABLE ops_corrective_action_choice IS 'Org-defined reusable corrective action options available for selection when logging a corrective action (e.g. Sanitize Surface, Replace Gloves, Notify Supervisor).';
COMMENT ON COLUMN ops_corrective_action_choice.id IS 'Human-readable identifier derived from name (trimmed lowercase)';
COMMENT ON COLUMN ops_corrective_action_choice.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_corrective_action_choice.name IS 'Corrective action choice name, unique within the org (e.g. Sanitize Surface, Replace Gloves)';
COMMENT ON COLUMN ops_corrective_action_choice.description IS 'Optional description of what this corrective action entails';
COMMENT ON COLUMN ops_corrective_action_choice.is_deleted IS 'Soft delete flag; false hides the choice from active use';
COMMENT ON COLUMN ops_corrective_action_choice.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_corrective_action_choice.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_corrective_action_choice.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_corrective_action_choice.updated_by IS 'Email of the user who last updated the record';
