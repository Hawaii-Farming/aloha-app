CREATE TABLE IF NOT EXISTS ops_task_tracker (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT REFERENCES org_farm(id),
    site_id         TEXT REFERENCES org_site(id),
    ops_task_id     TEXT NOT NULL REFERENCES ops_task(id),
    start_time      TIMESTAMPTZ NOT NULL,
    stop_time       TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    notes           TEXT,
    verified_at     TIMESTAMPTZ,
    verified_by     TEXT REFERENCES hr_employee(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE ops_task_tracker IS 'Header record for a task event. One record per task session — captures what task was done, where, when, and its verification status.';

CREATE INDEX idx_ops_task_tracker_org_id ON ops_task_tracker (org_id);
CREATE INDEX idx_ops_task_tracker_task   ON ops_task_tracker (ops_task_id);
CREATE INDEX idx_ops_task_tracker_status ON ops_task_tracker (org_id, status);
CREATE INDEX idx_ops_task_tracker_site   ON ops_task_tracker (site_id);

COMMENT ON COLUMN ops_task_tracker.status IS 'Workflow status: open, in_progress, completed';

