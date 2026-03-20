CREATE TABLE IF NOT EXISTS ops_task (
    id          TEXT PRIMARY KEY,
    org_id      TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id     TEXT REFERENCES farm(id),
    name        TEXT NOT NULL,
    description TEXT,
    is_deleted   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,

    CONSTRAINT uq_ops_task_name UNIQUE (org_id, name)
);

CREATE INDEX idx_ops_task_org_id ON ops_task (org_id);

COMMENT ON TABLE ops_task IS 'Flat task catalog for labor tracking; defines all tasks employees can perform at the org or farm level';
COMMENT ON COLUMN ops_task.id IS 'Human-readable identifier derived from task name (lowercase trimmed)';
COMMENT ON COLUMN ops_task.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_task.farm_id IS 'Optional farm scope; NULL if task applies to all farms';
COMMENT ON COLUMN ops_task.name IS 'Short name for the task, unique within the org (e.g. HARV, PICK)';
COMMENT ON COLUMN ops_task.description IS 'Description of the task';
COMMENT ON COLUMN ops_task.is_deleted IS 'Soft delete flag; false hides the task from active use';
COMMENT ON COLUMN ops_task.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_task.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_task.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_task.updated_by IS 'Email of the user who last updated the record';
