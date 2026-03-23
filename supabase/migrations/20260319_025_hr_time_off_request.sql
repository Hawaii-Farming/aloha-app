CREATE TABLE IF NOT EXISTS hr_time_off_request (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id),
    hr_employee_id  TEXT NOT NULL REFERENCES hr_employee(id),

    start_date      DATE NOT NULL,
    return_date     DATE,
    non_pto_days      NUMERIC,
    pto_days        NUMERIC,
    sick_leave_days NUMERIC,
    request_reason  TEXT,
    denial_reason   TEXT,
    notes           TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),

    requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    requested_by    TEXT NOT NULL REFERENCES hr_employee(id),
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     TEXT REFERENCES hr_employee(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE hr_time_off_request IS 'Employee time off requests with PTO and sick leave breakdown and a simple approval workflow.';

CREATE INDEX idx_hr_time_off_request_org_id ON hr_time_off_request (org_id);
CREATE INDEX idx_hr_time_off_request_employee ON hr_time_off_request (hr_employee_id);
CREATE INDEX idx_hr_time_off_request_status ON hr_time_off_request (org_id, status);
CREATE INDEX idx_hr_time_off_request_dates ON hr_time_off_request (hr_employee_id, start_date);

COMMENT ON COLUMN hr_time_off_request.non_pto_days IS 'Days not charged to PTO or sick leave (e.g. unpaid leave, personal days)';
COMMENT ON COLUMN hr_time_off_request.status IS 'Approval status: pending, approved, denied';
