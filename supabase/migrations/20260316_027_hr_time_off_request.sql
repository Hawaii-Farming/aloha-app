CREATE TABLE IF NOT EXISTS hr_time_off_request (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    employee_id     TEXT NOT NULL REFERENCES hr_employee(id),

    -- Request details
    start_date      DATE NOT NULL,
    return_date     DATE,
    total_days      NUMERIC,
    pto_days        NUMERIC,
    sick_leave_days NUMERIC,
    request_reason  TEXT,

    -- Workflow
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    requested_by    UUID NOT NULL REFERENCES auth.users(id),
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by     TEXT REFERENCES hr_employee(id),
    reviewed_at     TIMESTAMPTZ,
    denial_reason   TEXT,
    notes           TEXT,

    is_active       BOOLEAN NOT NULL DEFAULT true,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT
);

CREATE INDEX idx_hr_time_off_request_org_id ON hr_time_off_request (org_id);
CREATE INDEX idx_hr_time_off_request_employee ON hr_time_off_request (employee_id);
CREATE INDEX idx_hr_time_off_request_status ON hr_time_off_request (org_id, status);
CREATE INDEX idx_hr_time_off_request_dates ON hr_time_off_request (employee_id, start_date);

COMMENT ON TABLE hr_time_off_request IS 'Employee time off requests with approval workflow (pending → approved/denied)';
COMMENT ON COLUMN hr_time_off_request.id IS 'Unique identifier for the time off request';
COMMENT ON COLUMN hr_time_off_request.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_time_off_request.employee_id IS 'Employee submitting the request';
COMMENT ON COLUMN hr_time_off_request.start_date IS 'First day of the requested time off';
COMMENT ON COLUMN hr_time_off_request.return_date IS 'First day the employee returns to work';
COMMENT ON COLUMN hr_time_off_request.total_days IS 'Total number of days off requested';
COMMENT ON COLUMN hr_time_off_request.pto_days IS 'Number of days charged to PTO balance';
COMMENT ON COLUMN hr_time_off_request.sick_leave_days IS 'Number of days charged to sick leave balance';
COMMENT ON COLUMN hr_time_off_request.request_reason IS 'Employee-provided reason for the time off';
COMMENT ON COLUMN hr_time_off_request.status IS 'Approval status: pending, approved, denied';
COMMENT ON COLUMN hr_time_off_request.requested_by IS 'Auth user who submitted the request';
COMMENT ON COLUMN hr_time_off_request.requested_at IS 'Timestamp when the request was submitted';
COMMENT ON COLUMN hr_time_off_request.reviewed_by IS 'Employee who approved or denied the request';
COMMENT ON COLUMN hr_time_off_request.reviewed_at IS 'Timestamp when the request was reviewed';
COMMENT ON COLUMN hr_time_off_request.denial_reason IS 'Reason provided when the request is denied';
COMMENT ON COLUMN hr_time_off_request.notes IS 'Additional notes about the request';
COMMENT ON COLUMN hr_time_off_request.is_active IS 'Soft delete flag; false hides the request from active use';
COMMENT ON COLUMN hr_time_off_request.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_time_off_request.updated_by IS 'Email of the user who last updated the record';
