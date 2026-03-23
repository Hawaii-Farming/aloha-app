CREATE TABLE IF NOT EXISTS ops_task_schedule (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT NOT NULL REFERENCES org(id),
    farm_id                 TEXT REFERENCES org_farm(id),
    ops_task_tracker_id     UUID NOT NULL REFERENCES ops_task_tracker(id),
    hr_employee_id          TEXT NOT NULL REFERENCES hr_employee(id),

    -- Times default from task tracker but can be overridden per employee
    start_time              TIMESTAMPTZ NOT NULL,
    stop_time               TIMESTAMPTZ,

    units_completed         NUMERIC,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,
    is_deleted               BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_ops_task_schedule UNIQUE (ops_task_tracker_id, hr_employee_id)
);

COMMENT ON TABLE ops_task_schedule IS 'One row per employee per task event. Times are pre-filled from the task tracker but can be overridden if an employee started late or left early.';

CREATE INDEX idx_ops_task_schedule_tracker  ON ops_task_schedule (ops_task_tracker_id);
CREATE INDEX idx_ops_task_schedule_employee ON ops_task_schedule (hr_employee_id);
CREATE INDEX idx_ops_task_schedule_org_id   ON ops_task_schedule (org_id);

COMMENT ON COLUMN ops_task_schedule.units_completed IS 'Generic output quantity for this employee (e.g. lbs picked, trays seeded, rows cleaned)';
