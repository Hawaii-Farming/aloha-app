CREATE TABLE IF NOT EXISTS hr_title (
    id          TEXT        PRIMARY KEY,
    org_id      TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    description TEXT,
    is_active   BOOLEAN     NOT NULL DEFAULT true,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,

    CONSTRAINT uq_hr_title UNIQUE (org_id, name)
);

CREATE INDEX idx_hr_title_org_id ON hr_title (org_id);
CREATE INDEX idx_hr_title_active ON hr_title (org_id, is_active);

COMMENT ON TABLE hr_title IS 'Org-specific job title lookup used to classify employees. Examples: Farm Manager, Supervisor, Grower. TEXT PK derived from name (trimmed lowercase), unique within the org.';
COMMENT ON COLUMN hr_title.id IS 'Human-readable identifier derived from name (trimmed lowercase, e.g. farm_manager, supervisor)';
COMMENT ON COLUMN hr_title.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_title.name IS 'Job title name, unique within the org (e.g. Farm Manager, Supervisor, Grower)';
COMMENT ON COLUMN hr_title.description IS 'Optional description of the title or role';
COMMENT ON COLUMN hr_title.is_active IS 'Soft delete flag; false hides the title from active use';
COMMENT ON COLUMN hr_title.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_title.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN hr_title.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_title.updated_by IS 'Email of the user who last updated the record';
