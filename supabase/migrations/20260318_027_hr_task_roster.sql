CREATE TABLE IF NOT EXISTS hr_task_roster (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id           TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    task_tracker_id  UUID NOT NULL REFERENCES hr_task_tracker(id) ON DELETE CASCADE,
    employee_id      TEXT NOT NULL REFERENCES hr_employee(id),

    -- Times default from task tracker but can be overridden per employee
    start_time       TIMESTAMPTZ NOT NULL,
    stop_time        TIMESTAMPTZ,

    units_completed  NUMERIC,

    is_active        BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by       TEXT,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by       TEXT,

    CONSTRAINT uq_hr_task_roster UNIQUE (task_tracker_id, employee_id)
);

CREATE INDEX idx_hr_task_roster_tracker ON hr_task_roster (task_tracker_id);
CREATE INDEX idx_hr_task_roster_employee ON hr_task_roster (employee_id);
CREATE INDEX idx_hr_task_roster_org_id ON hr_task_roster (org_id);

COMMENT ON TABLE hr_task_roster IS 'Lists the employees who participated in a task event. Each row links an employee to a task tracker record with their individual start/stop times and units completed.';
COMMENT ON COLUMN hr_task_roster.id IS 'Unique identifier for the roster entry';
COMMENT ON COLUMN hr_task_roster.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_task_roster.task_tracker_id IS 'Parent task event this roster entry belongs to';
COMMENT ON COLUMN hr_task_roster.employee_id IS 'Employee who performed the task';
COMMENT ON COLUMN hr_task_roster.start_time IS 'Time this employee started; pre-filled from task tracker, overridable if they started late';
COMMENT ON COLUMN hr_task_roster.stop_time IS 'Time this employee stopped; pre-filled from task tracker, overridable if they left early';
COMMENT ON COLUMN hr_task_roster.units_completed IS 'Generic output quantity for this employee (e.g. lbs picked, trays seeded, rows cleaned)';
COMMENT ON COLUMN hr_task_roster.is_active IS 'Soft delete flag; false removes the employee from the roster without deleting the record';
COMMENT ON COLUMN hr_task_roster.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_task_roster.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN hr_task_roster.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_task_roster.updated_by IS 'Email of the user who last updated the record';
