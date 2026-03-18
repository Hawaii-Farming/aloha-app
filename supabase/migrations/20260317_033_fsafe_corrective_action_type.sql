CREATE TABLE IF NOT EXISTS fsafe_corrective_action_type (
    id                  TEXT        PRIMARY KEY,
    org_id              TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,

    name                TEXT        NOT NULL,
    description         TEXT,

    is_active           BOOLEAN     NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,

    CONSTRAINT uq_fsafe_corrective_action_type UNIQUE (org_id, name)
);

CREATE INDEX idx_fsafe_corrective_action_type_org_id ON fsafe_corrective_action_type (org_id);

COMMENT ON TABLE fsafe_corrective_action_type IS 'Org-defined predefined corrective action types available for selection when logging a corrective action (e.g. Sanitize Surface, Replace Gloves, Notify Supervisor).';
COMMENT ON COLUMN fsafe_corrective_action_type.id IS 'Human-readable identifier derived from name (trimmed lowercase)';
COMMENT ON COLUMN fsafe_corrective_action_type.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_corrective_action_type.name IS 'Corrective action type name, unique within the org (e.g. Sanitize Surface, Replace Gloves)';
COMMENT ON COLUMN fsafe_corrective_action_type.description IS 'Optional description of what this corrective action entails';
COMMENT ON COLUMN fsafe_corrective_action_type.is_active IS 'Soft delete flag; false hides the type from active use';
COMMENT ON COLUMN fsafe_corrective_action_type.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_corrective_action_type.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_corrective_action_type.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_corrective_action_type.updated_by IS 'Email of the user who last updated the record';
