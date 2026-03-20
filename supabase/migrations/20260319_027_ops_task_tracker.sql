CREATE TABLE IF NOT EXISTS ops_task_tracker (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id         TEXT REFERENCES farm(id),
    site_id         TEXT REFERENCES site(id),
    ops_task_id     TEXT NOT NULL REFERENCES ops_task(id),
    ops_template_id TEXT,

    start_time      TIMESTAMPTZ NOT NULL,
    stop_time       TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
    notes           TEXT,
    photos          JSONB NOT NULL DEFAULT '[]',

    is_deleted       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    verified_at     TIMESTAMPTZ,
    verified_by     TEXT REFERENCES hr_employee(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT
);

CREATE INDEX idx_ops_task_tracker_org_id ON ops_task_tracker (org_id);
CREATE INDEX idx_ops_task_tracker_task   ON ops_task_tracker (ops_task_id);
CREATE INDEX idx_ops_task_tracker_status ON ops_task_tracker (org_id, status);
CREATE INDEX idx_ops_task_tracker_site   ON ops_task_tracker (site_id);

COMMENT ON TABLE ops_task_tracker IS 'Header record for a task event. Captures the task, farm, site, date, start/stop times, and verification status.';
COMMENT ON COLUMN ops_task_tracker.id IS 'Unique identifier for the task event';
COMMENT ON COLUMN ops_task_tracker.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_task_tracker.farm_id IS 'Farm where the task was performed';
COMMENT ON COLUMN ops_task_tracker.site_id IS 'Site where the task was performed; replaces the separate ops_task_site junction table';
COMMENT ON COLUMN ops_task_tracker.ops_task_id IS 'Task performed, references ops_task catalog';
COMMENT ON COLUMN ops_task_tracker.ops_template_id IS 'Checklist template used for this task event; null if not a food safety task; FK added via ALTER TABLE in ops_template migration';
COMMENT ON COLUMN ops_task_tracker.start_time IS 'Timestamp when the task started; used as the default for schedule entries; date is derived from this field';
COMMENT ON COLUMN ops_task_tracker.stop_time IS 'Time the task ended; used as the default for schedule entries';
COMMENT ON COLUMN ops_task_tracker.status IS 'Workflow status: open, in_progress, completed';
COMMENT ON COLUMN ops_task_tracker.notes IS 'Free-text notes about the task event';
COMMENT ON COLUMN ops_task_tracker.photos IS 'JSON array of photo URLs taken during the task';
COMMENT ON COLUMN ops_task_tracker.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN ops_task_tracker.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_task_tracker.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_task_tracker.verified_at IS 'Timestamp when the task event was verified';
COMMENT ON COLUMN ops_task_tracker.verified_by IS 'Employee who verified the task event record';
COMMENT ON COLUMN ops_task_tracker.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_task_tracker.updated_by IS 'Email of the user who last updated the record';
