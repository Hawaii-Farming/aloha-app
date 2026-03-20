CREATE TABLE IF NOT EXISTS ops_training_type (
    id          TEXT        PRIMARY KEY,
    org_id      TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    description TEXT,
    is_deleted   BOOLEAN     NOT NULL DEFAULT false,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,

    CONSTRAINT uq_ops_training_type UNIQUE (org_id, name)
);

CREATE INDEX idx_ops_training_type_org_id ON ops_training_type (org_id);
CREATE INDEX idx_ops_training_type_active ON ops_training_type (org_id, is_deleted);

COMMENT ON TABLE ops_training_type IS 'Org-specific training type lookup used to classify training sessions. Examples: GMP, Food Safety, Sanitation, Equipment Operation, GAPs, HACCP. TEXT PK derived from name (trimmed lowercase), unique within the org.';
COMMENT ON COLUMN ops_training_type.id IS 'Human-readable identifier derived from name (trimmed lowercase, e.g. gmp, food_safety, haccp)';
COMMENT ON COLUMN ops_training_type.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_training_type.name IS 'Training type name, unique within the org (e.g. GMP, Food Safety, HACCP)';
COMMENT ON COLUMN ops_training_type.description IS 'Optional description of the training type and its purpose';
COMMENT ON COLUMN ops_training_type.is_deleted IS 'Soft delete flag; false hides the type from active use';
COMMENT ON COLUMN ops_training_type.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_training_type.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_training_type.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_training_type.updated_by IS 'Email of the user who last updated the record';
