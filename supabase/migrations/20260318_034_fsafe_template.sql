CREATE TABLE IF NOT EXISTS fsafe_template (
    id                  TEXT        PRIMARY KEY,
    org_id              TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id             TEXT        REFERENCES farm(id),

    name                TEXT        NOT NULL,
    template_type       TEXT,
    description         TEXT,

    is_active           BOOLEAN     NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,

    CONSTRAINT uq_fsafe_template_name UNIQUE (org_id, name)
);

CREATE INDEX idx_fsafe_template_org_id ON fsafe_template (org_id);

-- Add FK from hr_task_tracker now that fsafe_template exists
ALTER TABLE hr_task_tracker
    ADD CONSTRAINT fk_hr_task_tracker_fsafe_template
    FOREIGN KEY (fsafe_template_id) REFERENCES fsafe_template(id);

COMMENT ON TABLE fsafe_template IS 'Food safety checklist templates. Defines the checklist name, type, and the set of questions employees answer during a task event.';
COMMENT ON COLUMN fsafe_template.id IS 'Human-readable identifier derived from name (trimmed lowercase)';
COMMENT ON COLUMN fsafe_template.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_template.farm_id IS 'Optional farm scope; null if the template applies to all farms';
COMMENT ON COLUMN fsafe_template.name IS 'Checklist template name, unique within the org (e.g. Pre-Op GH, House Inspection)';
COMMENT ON COLUMN fsafe_template.template_type IS 'Module or purpose this checklist serves (e.g. food_safety, maintenance)';
COMMENT ON COLUMN fsafe_template.description IS 'Optional description of the checklist and its purpose';
COMMENT ON COLUMN fsafe_template.is_active IS 'Soft delete flag; false hides the template from active use';
COMMENT ON COLUMN fsafe_template.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_template.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_template.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_template.updated_by IS 'Email of the user who last updated the record';
