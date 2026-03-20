CREATE TABLE IF NOT EXISTS maint_request (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                    TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                   TEXT        REFERENCES farm(id),
    site_id                   TEXT        NOT NULL REFERENCES site(id),

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
    is_active                 BOOLEAN     NOT NULL DEFAULT true,

    requested_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    requested_by              TEXT        NOT NULL REFERENCES hr_employee(id),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                TEXT
);

CREATE INDEX idx_maint_request_org_id  ON maint_request (org_id);
CREATE INDEX idx_maint_request_site    ON maint_request (site_id);
CREATE INDEX idx_maint_request_status  ON maint_request (org_id, status);
CREATE INDEX idx_maint_request_fixer   ON maint_request (fixer_id);
CREATE INDEX idx_maint_request_due     ON maint_request (org_id, due_date);

COMMENT ON TABLE maint_request IS 'Standalone maintenance work order requests. Tracks site issues, preventive maintenance, urgency, scheduling, fixer assignment, completion details, and before/after photos.';
COMMENT ON COLUMN maint_request.id IS 'Unique identifier for the maintenance request';
COMMENT ON COLUMN maint_request.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN maint_request.farm_id IS 'Optional farm scope for the request';
COMMENT ON COLUMN maint_request.site_id IS 'Site where the maintenance is required';
COMMENT ON COLUMN maint_request.status IS 'Workflow status: new, pending, priority, done';
COMMENT ON COLUMN maint_request.request_description IS 'Description of the maintenance work required';
COMMENT ON COLUMN maint_request.recurring_frequency IS 'How often this task recurs: daily, weekly, monthly, quarterly; NULL if not recurring';
COMMENT ON COLUMN maint_request.due_date IS 'Date by which the maintenance should be completed';
COMMENT ON COLUMN maint_request.completed_on IS 'Date when the maintenance was marked as completed';
COMMENT ON COLUMN maint_request.fixer_id IS 'Employee assigned to carry out the maintenance';
COMMENT ON COLUMN maint_request.fixer_description IS 'Comments or notes left by the fixer upon completion';
COMMENT ON COLUMN maint_request.before_photos IS 'JSON array of photo URLs taken before the maintenance work';
COMMENT ON COLUMN maint_request.after_photos IS 'JSON array of photo URLs taken after the maintenance work';
COMMENT ON COLUMN maint_request.is_preventive_maintenance IS 'Whether this is a scheduled preventive maintenance task rather than a reactive repair';
COMMENT ON COLUMN maint_request.is_active IS 'Soft delete flag; false hides the request from active use';
COMMENT ON COLUMN maint_request.requested_at IS 'Timestamp when the request was submitted';
COMMENT ON COLUMN maint_request.requested_by IS 'Employee who submitted the maintenance request';
COMMENT ON COLUMN maint_request.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN maint_request.updated_by IS 'Email of the user who last updated the record';
