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

    is_deleted           BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    requested_by        TEXT NOT NULL REFERENCES hr_employee(id),
    reviewed_at         TIMESTAMPTZ,
    reviewed_by         TEXT REFERENCES hr_employee(id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT
);

CREATE INDEX idx_hr_travel_request_org_id ON hr_travel_request (org_id);
CREATE INDEX idx_hr_travel_request_employee ON hr_travel_request (employee_id);
CREATE INDEX idx_hr_travel_request_status ON hr_travel_request (org_id, status);
CREATE INDEX idx_hr_travel_request_dates ON hr_travel_request (employee_id, travel_start_date);

COMMENT ON TABLE hr_travel_request IS 'Employee travel requests with approval workflow (pending → approved/denied/completed/cancelled)';
COMMENT ON COLUMN hr_travel_request.id IS 'Unique identifier for the travel request';
COMMENT ON COLUMN hr_travel_request.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_travel_request.employee_id IS 'Employee submitting the travel request';
COMMENT ON COLUMN hr_travel_request.request_type IS 'Type of travel (e.g. Business Trip, Training, Conference, Site Visit)';
COMMENT ON COLUMN hr_travel_request.travel_purpose IS 'Description of the purpose for the trip';
COMMENT ON COLUMN hr_travel_request.travel_from IS 'Departure location';
COMMENT ON COLUMN hr_travel_request.travel_to IS 'Destination location';
COMMENT ON COLUMN hr_travel_request.travel_start_date IS 'First day of travel';
COMMENT ON COLUMN hr_travel_request.travel_return_date IS 'First day the employee returns';
COMMENT ON COLUMN hr_travel_request.status IS 'Approval status: pending, approved, denied';
COMMENT ON COLUMN hr_travel_request.denial_reason IS 'Reason provided when the request is denied';
COMMENT ON COLUMN hr_travel_request.notes IS 'Additional notes about the request';
COMMENT ON COLUMN hr_travel_request.requested_by IS 'Auth user who submitted the request';
COMMENT ON COLUMN hr_travel_request.requested_at IS 'Timestamp when the request was submitted';
COMMENT ON COLUMN hr_travel_request.reviewed_by IS 'Employee who approved or denied the request';
COMMENT ON COLUMN hr_travel_request.reviewed_at IS 'Timestamp when the request was reviewed';
COMMENT ON COLUMN hr_travel_request.is_deleted IS 'Soft delete flag; false hides the request from active use';
COMMENT ON COLUMN hr_travel_request.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_travel_request.updated_by IS 'Email of the user who last updated the record';
