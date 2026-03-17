CREATE TABLE IF NOT EXISTS hr_employee (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                       TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                      TEXT REFERENCES farm(id),
    user_id                      UUID REFERENCES auth.users(id),
    external_id                  VARCHAR(50),
    code                         VARCHAR(10) NOT NULL,
    first_name                   VARCHAR(50) NOT NULL,
    last_name                    VARCHAR(50) NOT NULL,
    preferred_name               VARCHAR(50),
    title                        VARCHAR(100),
    department                   VARCHAR(50),
    gender                       VARCHAR(20),
    date_of_birth                DATE,
    is_minority                  BOOLEAN NOT NULL DEFAULT false,
    employment_status            VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'terminated', 'on_leave', 'suspended')),
    management_level             VARCHAR(20) CHECK (management_level IN ('owner', 'manager', 'supervisor', 'employee')),
    status                       VARCHAR(10),
    pay_structure                VARCHAR(30),
    bi_weekly_overtime_threshold NUMERIC,
    compensation_code            VARCHAR(30),
    compensation_funding_source  VARCHAR(100),
    payslip_delivery_method      VARCHAR(50),
    housing_unit_id              UUID,
    start_date                   DATE,
    end_date                     DATE,
    direct_supervisor_id         UUID REFERENCES hr_employee(id),
    compensation_manager_id      UUID REFERENCES hr_employee(id),
    primary_phone                VARCHAR(20),
    primary_email                VARCHAR(100),
    company_email                VARCHAR(100),
    profile_photo_url            TEXT,

    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                   UUID REFERENCES auth.users(id),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                   UUID REFERENCES auth.users(id),

    CONSTRAINT uq_hr_employee_code UNIQUE (org_id, code)
);

CREATE INDEX idx_hr_employee_org_id ON hr_employee (org_id);
CREATE INDEX idx_hr_employee_status ON hr_employee (org_id, employment_status);
CREATE INDEX idx_hr_employee_supervisor ON hr_employee (direct_supervisor_id);

COMMENT ON TABLE hr_employee IS 'Employee register with employment status tracking, management hierarchy, compensation details, and optional link to auth.users for system access';
COMMENT ON COLUMN hr_employee.id IS 'Unique identifier for the employee';
COMMENT ON COLUMN hr_employee.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_employee.farm_id IS 'Primary farm assignment; NULL if employee works across farms';
COMMENT ON COLUMN hr_employee.user_id IS 'Optional link to Supabase auth user for employees with system access';
COMMENT ON COLUMN hr_employee.external_id IS 'External payroll or HR system identifier';
COMMENT ON COLUMN hr_employee.code IS 'Short employee code, unique within the org';
COMMENT ON COLUMN hr_employee.first_name IS 'Employee first name';
COMMENT ON COLUMN hr_employee.last_name IS 'Employee last name';
COMMENT ON COLUMN hr_employee.preferred_name IS 'Preferred or nickname used in day-to-day communication';
COMMENT ON COLUMN hr_employee.title IS 'Job title or position';
COMMENT ON COLUMN hr_employee.department IS 'Department the employee belongs to';
COMMENT ON COLUMN hr_employee.gender IS 'Employee gender';
COMMENT ON COLUMN hr_employee.date_of_birth IS 'Employee date of birth';
COMMENT ON COLUMN hr_employee.is_minority IS 'Whether the employee is classified as a minority for compliance reporting';
COMMENT ON COLUMN hr_employee.employment_status IS 'Current employment status: active, terminated, on_leave, or suspended (used instead of is_active for employees)';
COMMENT ON COLUMN hr_employee.management_level IS 'Management classification: owner, manager, supervisor, or employee';
COMMENT ON COLUMN hr_employee.status IS 'Visa/work authorization status (e.g. H2A, H1B, WFE, LOCAL)';
COMMENT ON COLUMN hr_employee.pay_structure IS 'Pay structure type (e.g. hourly, salary, piece-rate)';
COMMENT ON COLUMN hr_employee.bi_weekly_overtime_threshold IS 'Hours threshold in a bi-weekly period before overtime kicks in';
COMMENT ON COLUMN hr_employee.compensation_code IS 'Code identifying the compensation plan or pay grade';
COMMENT ON COLUMN hr_employee.compensation_funding_source IS 'Funding source for employee compensation (e.g. grant, operating budget)';
COMMENT ON COLUMN hr_employee.payslip_delivery_method IS 'How pay stubs are delivered (e.g. email, print, portal)';
COMMENT ON COLUMN hr_employee.housing_unit_id IS 'Reference to assigned housing unit if employee lives on-site';
COMMENT ON COLUMN hr_employee.start_date IS 'Employment start date';
COMMENT ON COLUMN hr_employee.end_date IS 'Employment end date; NULL if currently employed';
COMMENT ON COLUMN hr_employee.direct_supervisor_id IS 'Self-referencing FK to the employee direct supervisor';
COMMENT ON COLUMN hr_employee.compensation_manager_id IS 'Self-referencing FK to the manager who approves compensation changes';
COMMENT ON COLUMN hr_employee.primary_phone IS 'Employee primary phone number';
COMMENT ON COLUMN hr_employee.primary_email IS 'Employee primary email address';
COMMENT ON COLUMN hr_employee.company_email IS 'Company-issued email address';
COMMENT ON COLUMN hr_employee.profile_photo_url IS 'URL to employee profile photo';
COMMENT ON COLUMN hr_employee.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_employee.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN hr_employee.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_employee.updated_by IS 'User who last updated the record, references auth.users(id)';
