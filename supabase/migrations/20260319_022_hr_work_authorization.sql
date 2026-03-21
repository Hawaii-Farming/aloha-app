-- HR Work Authorization lookup table.
-- Org-specific work authorization types used to classify employees (e.g. Local, FURTE, WFE, H1B).
-- TEXT PK derived from name (trimmed lowercase), unique within the org.
CREATE TABLE IF NOT EXISTS hr_work_authorization (
    id          TEXT        PRIMARY KEY,
    org_id      TEXT        NOT NULL REFERENCES org(id),
    name        TEXT NOT NULL,
    description TEXT,
    is_deleted   BOOLEAN     NOT NULL DEFAULT false,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,

    CONSTRAINT uq_hr_work_authorization UNIQUE (org_id, name)
);

CREATE INDEX idx_hr_work_authorization_org_id ON hr_work_authorization (org_id);
CREATE INDEX idx_hr_work_authorization_active ON hr_work_authorization (org_id, is_deleted);

COMMENT ON TABLE hr_work_authorization IS 'Org-specific work authorization type lookup used to classify employees. Examples: Local, FURTE, WFE, H1B. TEXT PK derived from name (trimmed lowercase), unique within the org.';
COMMENT ON COLUMN hr_work_authorization.id IS 'Human-readable identifier derived from name (trimmed lowercase, e.g. h1b, wfe)';
COMMENT ON COLUMN hr_work_authorization.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_work_authorization.name IS 'Authorization type name, unique within the org (e.g. Local, FURTE, WFE, H1B)';
COMMENT ON COLUMN hr_work_authorization.description IS 'Optional description of the authorization type';
COMMENT ON COLUMN hr_work_authorization.is_deleted IS 'Soft delete flag; false hides the type from active use';
COMMENT ON COLUMN hr_work_authorization.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_work_authorization.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN hr_work_authorization.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_work_authorization.updated_by IS 'Email of the user who last updated the record';
