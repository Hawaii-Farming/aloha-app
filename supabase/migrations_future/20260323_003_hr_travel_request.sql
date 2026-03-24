CREATE TABLE IF NOT EXISTS hr_travel_request (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    employee_id         TEXT NOT NULL REFERENCES hr_employee(id),

    -- Travel details
    request_type        TEXT,
    travel_purpose      TEXT,
    travel_from         TEXT,
    travel_to           TEXT,
    travel_start_date   DATE,
    travel_return_date  DATE,

    denial_reason       TEXT,
    notes               TEXT,
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),

    requested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    requested_by        TEXT NOT NULL REFERENCES hr_employee(id),
    reviewed_at         TIMESTAMPTZ,
    reviewed_by         TEXT REFERENCES hr_employee(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted           BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE hr_travel_request IS 'Employee travel requests with a simple approval workflow. Captures trip details, purpose, and dates alongside a pending, approved, or denied status flow.';

CREATE INDEX idx_hr_travel_request_org_id ON hr_travel_request (org_id);
CREATE INDEX idx_hr_travel_request_employee ON hr_travel_request (employee_id);
CREATE INDEX idx_hr_travel_request_status ON hr_travel_request (org_id, status);
CREATE INDEX idx_hr_travel_request_dates ON hr_travel_request (employee_id, travel_start_date);

COMMENT ON COLUMN hr_travel_request.travel_return_date IS 'First day the employee returns (not last day of travel)';
COMMENT ON COLUMN hr_travel_request.status IS 'Approval status: pending, approved, denied';
