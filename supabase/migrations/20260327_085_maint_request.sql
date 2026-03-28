CREATE TABLE IF NOT EXISTS maint_request (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                    TEXT        NOT NULL REFERENCES org(id),
    farm_id                   TEXT        REFERENCES org_farm(id),
    site_id                   TEXT        REFERENCES org_site(id),
    equipment_id              TEXT        REFERENCES org_equipment(id),

    status                    TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'pending', 'priority', 'done')),
    request_description       TEXT,
    recurring_frequency       TEXT        CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    due_date                  DATE,
    completed_on              DATE,
    fixer_id                  TEXT        REFERENCES hr_employee(id),
    fixer_description         TEXT,

    before_photos             JSONB       NOT NULL DEFAULT '[]',
    after_photos              JSONB       NOT NULL DEFAULT '[]',

    is_preventive_maintenance BOOLEAN     NOT NULL DEFAULT false,

    requested_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    requested_by              TEXT        NOT NULL REFERENCES hr_employee(id),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                TEXT,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                TEXT,
    is_deleted                 BOOLEAN     NOT NULL DEFAULT false
);

COMMENT ON TABLE maint_request IS 'Standalone maintenance work order requests. Tracks site issues, preventive maintenance, urgency, scheduling, fixer assignment, completion details, and before/after photos.';

CREATE INDEX idx_maint_request_org_id  ON maint_request (org_id);
CREATE INDEX idx_maint_request_site    ON maint_request (site_id);
CREATE INDEX idx_maint_request_status  ON maint_request (org_id, status);
CREATE INDEX idx_maint_request_fixer   ON maint_request (fixer_id);
CREATE INDEX idx_maint_request_due     ON maint_request (org_id, due_date);

COMMENT ON COLUMN maint_request.site_id IS 'Any org_site regardless of category; nullable if request is equipment-only';
COMMENT ON COLUMN maint_request.equipment_id IS 'The equipment needing maintenance; nullable if request is site-only';
COMMENT ON COLUMN maint_request.status IS 'new, pending, priority, done';
COMMENT ON COLUMN maint_request.recurring_frequency IS 'daily, weekly, monthly, quarterly; null means not recurring; auto-creates a new request after status is marked done';
