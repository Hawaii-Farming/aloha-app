CREATE TABLE IF NOT EXISTS hr_module_access (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id),
    hr_employee_id  TEXT NOT NULL REFERENCES hr_employee(id),
    org_module_id   TEXT NOT NULL REFERENCES org_module(id),
    is_enabled      BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_hr_module_access UNIQUE (hr_employee_id, org_module_id)
);

COMMENT ON TABLE hr_module_access IS 'Controls which modules each employee can access. One row per employee per module; is_enabled toggles access without deleting the record.';

CREATE INDEX idx_hr_module_access_employee ON hr_module_access (hr_employee_id);
CREATE INDEX idx_hr_module_access_module ON hr_module_access (org_module_id);
