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
    sys_access_level_id       TEXT NOT NULL REFERENCES sys_access_level(id),
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

COMMENT ON TABLE hr_employee IS 'Unified employee register and org membership table. Every employee gets a row here with a required sys_access_level_id that defines their role (owner, manager, team_lead, employee). Employees without app access have a null user_id. A user can belong to multiple orgs by having one row per org. Tracks employment details, management hierarchy, and compensation.';

CREATE INDEX idx_hr_employee_org_id     ON hr_employee (org_id);
CREATE INDEX idx_hr_employee_user_id    ON hr_employee (user_id);
CREATE INDEX idx_hr_employee_active     ON hr_employee (org_id, is_deleted);
CREATE INDEX idx_hr_employee_team_lead  ON hr_employee (team_lead_id);
CREATE INDEX idx_hr_employee_department ON hr_employee (hr_department_id);
CREATE INDEX idx_hr_employee_title      ON hr_employee (hr_title_id);

COMMENT ON COLUMN hr_employee.pay_structure IS 'hourly, salary';
COMMENT ON COLUMN hr_employee.wc IS 'Workers compensation code identifying the compensation plan or pay grade';
