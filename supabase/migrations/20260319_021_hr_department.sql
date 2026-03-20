-- HR Department lookup table.
-- Org-specific departments used to classify employees (e.g. GH, PH, Lettuce).
-- TEXT PK derived from name (trimmed lowercase), unique within the org.
CREATE TABLE IF NOT EXISTS hr_department (
    id          TEXT        PRIMARY KEY,
    org_id      TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    is_deleted   BOOLEAN     NOT NULL DEFAULT false,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,

    CONSTRAINT uq_hr_department UNIQUE (org_id, name)
);

CREATE INDEX idx_hr_department_org_id ON hr_department (org_id);
CREATE INDEX idx_hr_department_active ON hr_department (org_id, is_deleted);

COMMENT ON TABLE hr_department IS 'Org-specific department lookup used to classify employees. Examples: GH, PH, Lettuce. TEXT PK derived from name (trimmed lowercase), unique within the org.';
COMMENT ON COLUMN hr_department.id IS 'Human-readable identifier derived from name (trimmed lowercase, e.g. gh, ph)';
COMMENT ON COLUMN hr_department.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_department.name IS 'Department name, unique within the org (e.g. GH, PH, Lettuce)';
COMMENT ON COLUMN hr_department.description IS 'Optional description of the department';
COMMENT ON COLUMN hr_department.is_deleted IS 'Soft delete flag; false hides the department from active use';
COMMENT ON COLUMN hr_department.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_department.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN hr_department.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_department.updated_by IS 'Email of the user who last updated the record';
