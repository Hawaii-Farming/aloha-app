CREATE TABLE IF NOT EXISTS ops_task_schedule (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                 TEXT REFERENCES farm(id),
    ops_task_tracker_id     UUID NOT NULL REFERENCES ops_task_tracker(id) ON DELETE CASCADE,
    hr_employee_id          TEXT NOT NULL REFERENCES hr_employee(id),

    -- Times default from task tracker but can be overridden per employee
    start_time              TIMESTAMPTZ NOT NULL,
    stop_time               TIMESTAMPTZ,

    units_completed         NUMERIC,

    is_active               BOOLEAN NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,

    CONSTRAINT uq_ops_task_schedule UNIQUE (ops_task_tracker_id, hr_employee_id)
);

CREATE INDEX idx_ops_task_schedule_tracker  ON ops_task_schedule (ops_task_tracker_id);
CREATE INDEX idx_ops_task_schedule_employee ON ops_task_schedule (hr_employee_id);
CREATE INDEX idx_ops_task_schedule_org_id   ON ops_task_schedule (org_id);

COMMENT ON TABLE ops_task_schedule IS 'Lists the employees scheduled for a task event. Each row links an employee to a task tracker record with their individual start/stop times and units completed.';
COMMENT ON COLUMN ops_task_schedule.id IS 'Unique identifier for the schedule entry';
COMMENT ON COLUMN ops_task_schedule.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_task_schedule.farm_id IS 'Optional farm scope; inherited from parent ops_task_tracker';
COMMENT ON COLUMN ops_task_schedule.ops_task_tracker_id IS 'Parent task event this schedule entry belongs to';
COMMENT ON COLUMN ops_task_schedule.hr_employee_id IS 'Employee scheduled for the task';
COMMENT ON COLUMN ops_task_schedule.start_time IS 'Time this employee started; pre-filled from task tracker, overridable if they started late';
COMMENT ON COLUMN ops_task_schedule.stop_time IS 'Time this employee stopped; pre-filled from task tracker, overridable if they left early';
COMMENT ON COLUMN ops_task_schedule.units_completed IS 'Generic output quantity for this employee (e.g. lbs picked, trays seeded, rows cleaned)';
COMMENT ON COLUMN ops_task_schedule.is_active IS 'Soft delete flag; false removes the employee from the schedule without deleting the record';
COMMENT ON COLUMN ops_task_schedule.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_task_schedule.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_task_schedule.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_task_schedule.updated_by IS 'Email of the user who last updated the record';
