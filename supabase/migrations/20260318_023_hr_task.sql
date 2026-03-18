CREATE TABLE IF NOT EXISTS hr_task (
    id          TEXT PRIMARY KEY,
    org_id      TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id     TEXT REFERENCES farm(id),
    name        TEXT NOT NULL,
    description TEXT,
    accounting_id TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,

    CONSTRAINT uq_hr_task_name UNIQUE (org_id, name)
);

CREATE INDEX idx_hr_task_org_id ON hr_task (org_id);

COMMENT ON TABLE hr_task IS 'Flat task catalog for labor tracking; defines all tasks employees can perform at the org or farm level';
COMMENT ON COLUMN hr_task.id IS 'Human-readable identifier derived from task name (lowercase trimmed)';
COMMENT ON COLUMN hr_task.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_task.farm_id IS 'Optional farm scope; NULL if task applies to all farms';
COMMENT ON COLUMN hr_task.name IS 'Short name for the task, unique within the org (e.g. HARV, PICK)';
COMMENT ON COLUMN hr_task.description IS 'Description of the task';
COMMENT ON COLUMN hr_task.accounting_id IS 'Identifier used to link this task to the accounting system';
COMMENT ON COLUMN hr_task.is_active IS 'Soft delete flag; false hides the task from active use';
COMMENT ON COLUMN hr_task.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_task.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN hr_task.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_task.updated_by IS 'Email of the user who last updated the record';
