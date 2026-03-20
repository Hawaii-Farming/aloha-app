CREATE TABLE IF NOT EXISTS hr_employee (

    -- =============================================
    -- IDENTITY
    -- =============================================
    id                           TEXT PRIMARY KEY,
    org_id                       TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,

    -- =============================================
    -- EMPLOYEE PROFILE
    -- =============================================
    first_name                   TEXT NOT NULL,
    last_name                    TEXT NOT NULL,
    preferred_name               TEXT,
    gender                       TEXT,
    date_of_birth                DATE,
    is_minority                  BOOLEAN NOT NULL DEFAULT false,
    profile_photo_url            TEXT,

    -- =============================================
    -- CONTACT
    -- =============================================
    phone                        TEXT,
    email                        TEXT,
    company_email                TEXT,
    user_id                      UUID REFERENCES auth.users(id),

    -- =============================================
    -- ORGANISATION & ROLE
    -- =============================================
    hr_department_id             TEXT REFERENCES hr_department(id),
    hr_title_id                  TEXT REFERENCES hr_title(id),
    access_level                 TEXT NOT NULL CHECK (access_level IN ('owner', 'manager', 'team_lead', 'employee')),
    team_lead_id                 TEXT REFERENCES hr_employee(id),
    compensation_manager_id      TEXT REFERENCES hr_employee(id),

    -- =============================================
    -- EMPLOYMENT
    -- =============================================
    hr_work_authorization_id     TEXT REFERENCES hr_work_authorization(id),
    start_date                   DATE,
    end_date                     DATE,

    -- =============================================
    -- PAYROLL & COMPENSATION
    -- =============================================
    payroll_id                   TEXT,
    pay_structure                TEXT CHECK (pay_structure IN ('hourly', 'salary')),
    overtime_threshold           NUMERIC,
    wc                           TEXT,
    payroll_admin                TEXT,
    payslip_delivery_method      TEXT,

    -- =============================================
    -- HOUSING
    -- =============================================
    site_id_housing              TEXT REFERENCES site(id),

    is_verifier                  BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,

    -- =============================================
    -- AUDIT
    -- =============================================
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                   TEXT,
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                   TEXT,

    CONSTRAINT uq_hr_employee_name UNIQUE (org_id, first_name, last_name)
);

CREATE INDEX idx_hr_employee_org_id     ON hr_employee (org_id);
CREATE INDEX idx_hr_employee_user_id    ON hr_employee (user_id);
CREATE INDEX idx_hr_employee_active     ON hr_employee (org_id, is_active);
CREATE INDEX idx_hr_employee_team_lead  ON hr_employee (team_lead_id);
CREATE INDEX idx_hr_employee_department ON hr_employee (hr_department_id);
CREATE INDEX idx_hr_employee_title      ON hr_employee (hr_title_id);

COMMENT ON TABLE hr_employee IS 'Unified employee register and org membership. Every user with org access has a row here. Tracks employment details, management hierarchy, compensation, and access level. A user can have rows in multiple orgs.';
COMMENT ON COLUMN hr_employee.id IS 'Human-readable identifier derived from employee name (e.g. john_smith)';
COMMENT ON COLUMN hr_employee.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_employee.first_name IS 'Employee first name';
COMMENT ON COLUMN hr_employee.last_name IS 'Employee last name';
COMMENT ON COLUMN hr_employee.preferred_name IS 'Preferred or nickname used in day-to-day communication';
COMMENT ON COLUMN hr_employee.gender IS 'Employee gender';
COMMENT ON COLUMN hr_employee.date_of_birth IS 'Employee date of birth';
COMMENT ON COLUMN hr_employee.is_minority IS 'Whether the employee is classified as a minority for compliance reporting';
COMMENT ON COLUMN hr_employee.profile_photo_url IS 'URL to employee profile photo';
COMMENT ON COLUMN hr_employee.phone IS 'Employee phone number';
COMMENT ON COLUMN hr_employee.email IS 'Employee email address';
COMMENT ON COLUMN hr_employee.company_email IS 'Company-issued email address';
COMMENT ON COLUMN hr_employee.user_id IS 'Link to Supabase auth user; nullable for employees without system access';
COMMENT ON COLUMN hr_employee.hr_department_id IS 'Department the employee belongs to; references hr_department';
COMMENT ON COLUMN hr_employee.hr_title_id IS 'Job title from the org title lookup; references hr_title';
COMMENT ON COLUMN hr_employee.access_level IS 'System access level: owner, manager, team_lead, or employee. Drives frontend permissions via dropdown selection.';
COMMENT ON COLUMN hr_employee.team_lead_id IS 'Self-referencing TEXT FK to direct team_lead; stores readable employee id (e.g. jane_doe)';
COMMENT ON COLUMN hr_employee.compensation_manager_id IS 'Self-referencing TEXT FK to compensation manager; stores readable employee id';
COMMENT ON COLUMN hr_employee.hr_work_authorization_id IS 'Visa/work authorization type; references hr_work_authorization (e.g. local, wfe, furte, h1b)';
COMMENT ON COLUMN hr_employee.start_date IS 'Employment start date';
COMMENT ON COLUMN hr_employee.end_date IS 'Employment end date; NULL if currently employed';
COMMENT ON COLUMN hr_employee.is_active IS 'Soft delete flag; false disables the employee without removing the record';
COMMENT ON COLUMN hr_employee.is_verifier IS 'Whether this employee is authorized to verify records';
COMMENT ON COLUMN hr_employee.payroll_id IS 'External payroll system identifier';
COMMENT ON COLUMN hr_employee.pay_structure IS 'Pay structure type: hourly or salary';
COMMENT ON COLUMN hr_employee.overtime_threshold IS 'Hours threshold before overtime kicks in';
COMMENT ON COLUMN hr_employee.wc IS 'Workers compensation code identifying the compensation plan or pay grade';
COMMENT ON COLUMN hr_employee.payroll_admin IS 'Payroll administrator responsible for employee compensation (e.g. HRB, HF)';
COMMENT ON COLUMN hr_employee.payslip_delivery_method IS 'How pay stubs are delivered (e.g. email, print, portal)';
COMMENT ON COLUMN hr_employee.site_id_housing IS 'Reference to the site record used as the employee housing assignment';
COMMENT ON COLUMN hr_employee.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_employee.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN hr_employee.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_employee.updated_by IS 'Email of the user who last updated the record';
