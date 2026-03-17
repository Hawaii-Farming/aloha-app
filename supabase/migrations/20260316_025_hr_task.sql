CREATE TABLE IF NOT EXISTS hr_task (
    id          TEXT PRIMARY KEY,
    org_id      TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id     TEXT REFERENCES farm(id),
    code        VARCHAR(10) NOT NULL,
    description TEXT,
    external_id VARCHAR(50),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  UUID REFERENCES auth.users(id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  UUID REFERENCES auth.users(id),

    CONSTRAINT uq_hr_task_code UNIQUE (org_id, code)
);

CREATE INDEX idx_hr_task_org_id ON hr_task (org_id);

COMMENT ON TABLE hr_task IS 'Flat task catalog for labor tracking; defines all tasks employees can perform at the org or farm level';
COMMENT ON COLUMN hr_task.id IS 'Human-readable identifier derived from task code (lowercase trimmed)';
COMMENT ON COLUMN hr_task.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_task.farm_id IS 'Optional farm scope; NULL if task applies to all farms';
COMMENT ON COLUMN hr_task.code IS 'Short code for the task, unique within the org (e.g. HARV, PICK)';
COMMENT ON COLUMN hr_task.description IS 'Description of the task';
COMMENT ON COLUMN hr_task.external_id IS 'Links to external payroll/HR system';
COMMENT ON COLUMN hr_task.is_active IS 'Soft delete flag; false hides the task from active use';
COMMENT ON COLUMN hr_task.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_task.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN hr_task.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_task.updated_by IS 'User who last updated the record, references auth.users(id)';
