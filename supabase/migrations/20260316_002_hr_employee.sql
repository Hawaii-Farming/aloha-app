CREATE TABLE IF NOT EXISTS hr_employee (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                       UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                      UUID REFERENCES farm(id),
    user_id                      UUID REFERENCES auth.users(id),
    external_id                  VARCHAR(50),
    code                         VARCHAR(10) NOT NULL,
    first_name                   VARCHAR(50) NOT NULL,
    last_name                    VARCHAR(50) NOT NULL,
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
    housing_unit_id              UUID,
    start_date                   DATE,
    end_date                     DATE,
    direct_supervisor_id         UUID REFERENCES hr_employee(id),
    compensation_manager_id      UUID REFERENCES hr_employee(id),
    primary_phone                VARCHAR(20),
    primary_email                VARCHAR(100),
    metadata                     JSONB NOT NULL DEFAULT '{}',
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                   UUID REFERENCES auth.users(id),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                   UUID REFERENCES auth.users(id),

    CONSTRAINT uq_hr_employee_code UNIQUE (org_id, code)
);

CREATE INDEX idx_hr_employee_org_id ON hr_employee (org_id);
CREATE INDEX idx_hr_employee_status ON hr_employee (org_id, employment_status);
CREATE INDEX idx_hr_employee_supervisor ON hr_employee (direct_supervisor_id);
