CREATE TABLE IF NOT EXISTS hr_employee (

    -- =============================================
    -- IDENTITY
    -- =============================================
    id                           TEXT PRIMARY KEY,
    org_id                       TEXT NOT NULL REFERENCES org(id),

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
    payroll_processor                TEXT,
    pay_delivery_method      TEXT,

    -- =============================================
    -- HOUSING
    -- =============================================
    site_id_housing              TEXT REFERENCES org_site(id),

    is_verifier                  BOOLEAN NOT NULL DEFAULT false,

    -- =============================================
    -- AUDIT
    -- =============================================
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                   TEXT,
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                   TEXT,
    is_deleted                    BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_hr_employee_name UNIQUE (org_id, first_name, last_name)
);

COMMENT ON TABLE hr_employee IS 'Unified employee register and org membership table. Every employee gets a row here with a required access_level that defines their role (owner, manager, team_lead, employee). Employees without app access have a null user_id. A user can belong to multiple orgs by having one row per org. Tracks employment details, management hierarchy, and compensation.';

CREATE INDEX idx_hr_employee_org_id     ON hr_employee (org_id);
CREATE INDEX idx_hr_employee_user_id    ON hr_employee (user_id);
CREATE INDEX idx_hr_employee_active     ON hr_employee (org_id, is_deleted);
CREATE INDEX idx_hr_employee_team_lead  ON hr_employee (team_lead_id);
CREATE INDEX idx_hr_employee_department ON hr_employee (hr_department_id);
CREATE INDEX idx_hr_employee_title      ON hr_employee (hr_title_id);

COMMENT ON COLUMN hr_employee.is_minority IS 'Whether the employee is classified as a minority for compliance reporting';
COMMENT ON COLUMN hr_employee.user_id IS 'Link to Supabase auth user; nullable for employees without system access';
COMMENT ON COLUMN hr_employee.access_level IS 'System access level: owner, manager, team_lead, or employee. Drives frontend permissions via dropdown selection.';
COMMENT ON COLUMN hr_employee.hr_work_authorization_id IS 'Visa/work authorization type; references hr_work_authorization (e.g. local, wfe, furte, h1b)';
COMMENT ON COLUMN hr_employee.is_verifier IS 'Whether this employee is authorized to verify records';
COMMENT ON COLUMN hr_employee.pay_structure IS 'Pay structure type: hourly or salary';
COMMENT ON COLUMN hr_employee.wc IS 'Workers compensation code identifying the compensation plan or pay grade';
COMMENT ON COLUMN hr_employee.payroll_processor IS 'Payroll administrator responsible for employee compensation (e.g. HRB, HF)';
COMMENT ON COLUMN hr_employee.pay_delivery_method IS 'How pay stubs are delivered (e.g. email, print, portal)';
