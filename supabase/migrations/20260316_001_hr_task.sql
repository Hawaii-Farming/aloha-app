CREATE TABLE IF NOT EXISTS hr_task (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id    UUID REFERENCES farm(id),
    parent_id  UUID REFERENCES hr_task(id),
    name       VARCHAR(100) NOT NULL,
    code       VARCHAR(10) NOT NULL,
    level      INT NOT NULL DEFAULT 0,
    metadata   JSONB NOT NULL DEFAULT '{}',
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT uq_hr_task_code UNIQUE (org_id, code),
    CONSTRAINT uq_hr_task_name UNIQUE (org_id, parent_id, name)
);

CREATE INDEX idx_hr_task_parent ON hr_task (parent_id);
CREATE INDEX idx_hr_task_org_id ON hr_task (org_id);
