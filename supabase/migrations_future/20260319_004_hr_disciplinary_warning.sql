CREATE TABLE IF NOT EXISTS hr_disciplinary_warning (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    employee_id                     TEXT NOT NULL REFERENCES hr_employee(id),

    -- Warning details
    warning_date                    DATE,
    warning_type                    TEXT CHECK (warning_type IN ('verbal_warning', 'written_warning', 'final_warning', 'suspension', 'termination')),
    offense_type                    TEXT,
    offense_description             TEXT,

    -- Action plan
    plan_for_improvement            TEXT,
    further_infraction_consequences TEXT,
    notes                           TEXT,

    -- Acknowledgment
    is_acknowledged                 BOOLEAN NOT NULL DEFAULT false,
    acknowledged_at                 TIMESTAMPTZ,
    employee_signature_url          TEXT,

    -- Workflow
    status                          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
    reported_by                     TEXT REFERENCES hr_employee(id),
    reported_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by                     TEXT REFERENCES hr_employee(id),
    reviewed_at                     TIMESTAMPTZ,

    is_active                       BOOLEAN NOT NULL DEFAULT true,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                      TEXT
);

CREATE INDEX idx_hr_disciplinary_warning_org_id ON hr_disciplinary_warning (org_id);
CREATE INDEX idx_hr_disciplinary_warning_employee ON hr_disciplinary_warning (employee_id);
CREATE INDEX idx_hr_disciplinary_warning_status ON hr_disciplinary_warning (org_id, status);
CREATE INDEX idx_hr_disciplinary_warning_date ON hr_disciplinary_warning (employee_id, warning_date);

COMMENT ON TABLE hr_disciplinary_warning IS 'Employee disciplinary warning records with acknowledgment tracking and review workflow';
COMMENT ON COLUMN hr_disciplinary_warning.id IS 'Unique identifier for the disciplinary warning';
COMMENT ON COLUMN hr_disciplinary_warning.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_disciplinary_warning.employee_id IS 'Employee receiving the warning';
COMMENT ON COLUMN hr_disciplinary_warning.warning_date IS 'Date the warning was issued';
COMMENT ON COLUMN hr_disciplinary_warning.warning_type IS 'Severity level: verbal_warning, written_warning, final_warning, suspension, termination';
COMMENT ON COLUMN hr_disciplinary_warning.offense_type IS 'Category of offense (e.g. Attendance, Performance, Conduct, Safety, Policy Violation)';
COMMENT ON COLUMN hr_disciplinary_warning.offense_description IS 'Detailed description of the offense or incident';
COMMENT ON COLUMN hr_disciplinary_warning.plan_for_improvement IS 'Agreed steps or plan for the employee to improve';
COMMENT ON COLUMN hr_disciplinary_warning.further_infraction_consequences IS 'Stated consequences if further infractions occur';
COMMENT ON COLUMN hr_disciplinary_warning.notes IS 'Additional notes about the warning';
COMMENT ON COLUMN hr_disciplinary_warning.is_acknowledged IS 'Whether the employee has acknowledged receipt of the warning';
COMMENT ON COLUMN hr_disciplinary_warning.acknowledged_at IS 'Timestamp when the employee acknowledged the warning';
COMMENT ON COLUMN hr_disciplinary_warning.employee_signature_url IS 'URL to the employee signature image stored in Supabase Storage';
COMMENT ON COLUMN hr_disciplinary_warning.status IS 'Review status: pending, reviewed';
COMMENT ON COLUMN hr_disciplinary_warning.reported_by IS 'Employee (manager/HR) who filed the warning';
COMMENT ON COLUMN hr_disciplinary_warning.reported_at IS 'Timestamp when the warning was filed';
COMMENT ON COLUMN hr_disciplinary_warning.reviewed_by IS 'Employee who reviewed and finalized the warning';
COMMENT ON COLUMN hr_disciplinary_warning.reviewed_at IS 'Timestamp when the warning was reviewed';
COMMENT ON COLUMN hr_disciplinary_warning.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN hr_disciplinary_warning.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_disciplinary_warning.updated_by IS 'Email of the user who last updated the record';
