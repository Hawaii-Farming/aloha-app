CREATE TABLE IF NOT EXISTS hr_task_tracker (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id         TEXT REFERENCES farm(id),
    site_id         TEXT REFERENCES site(id),
    task_id         TEXT NOT NULL REFERENCES hr_task(id),

    date            DATE NOT NULL,
    start_time      TIMESTAMPTZ NOT NULL,
    stop_time       TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
    notes           TEXT,

    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT
);

CREATE INDEX idx_hr_task_tracker_org_id ON hr_task_tracker (org_id);
CREATE INDEX idx_hr_task_tracker_task ON hr_task_tracker (task_id);
CREATE INDEX idx_hr_task_tracker_date ON hr_task_tracker (org_id, date);
CREATE INDEX idx_hr_task_tracker_status ON hr_task_tracker (org_id, status);

COMMENT ON TABLE hr_task_tracker IS 'Header record for a task event. Captures the task, location, date, start/stop times, and verification status.';
COMMENT ON COLUMN hr_task_tracker.id IS 'Unique identifier for the task event';
COMMENT ON COLUMN hr_task_tracker.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_task_tracker.farm_id IS 'Farm where the task was performed';
COMMENT ON COLUMN hr_task_tracker.site_id IS 'Specific site where the task was performed';
COMMENT ON COLUMN hr_task_tracker.task_id IS 'Task performed, references hr_task catalog';
COMMENT ON COLUMN hr_task_tracker.date IS 'Date the task was performed';
COMMENT ON COLUMN hr_task_tracker.start_time IS 'Time the task started; used as the default for roster entries';
COMMENT ON COLUMN hr_task_tracker.stop_time IS 'Time the task ended; used as the default for roster entries';
COMMENT ON COLUMN hr_task_tracker.status IS 'Workflow status: open, in_progress, completed';
COMMENT ON COLUMN hr_task_tracker.notes IS 'Free-text notes about the task event';
COMMENT ON COLUMN hr_task_tracker.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN hr_task_tracker.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_task_tracker.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN hr_task_tracker.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_task_tracker.updated_by IS 'Email of the user who last updated the record';
