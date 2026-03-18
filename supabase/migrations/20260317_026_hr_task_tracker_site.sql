CREATE TABLE IF NOT EXISTS hr_task_tracker_site (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    task_tracker_id     UUID        NOT NULL REFERENCES hr_task_tracker(id) ON DELETE CASCADE,
    site_id             TEXT        NOT NULL REFERENCES site(id),

    is_active           BOOLEAN     NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,

    CONSTRAINT uq_hr_task_tracker_site UNIQUE (task_tracker_id, site_id)
);

CREATE INDEX idx_hr_task_tracker_site_tracker ON hr_task_tracker_site (task_tracker_id);
CREATE INDEX idx_hr_task_tracker_site_site    ON hr_task_tracker_site (site_id);
CREATE INDEX idx_hr_task_tracker_site_org_id  ON hr_task_tracker_site (org_id);

COMMENT ON TABLE hr_task_tracker_site IS 'Sites where a task event was performed. One row per site per task tracker record; supports tasks carried out across multiple sites.';
COMMENT ON COLUMN hr_task_tracker_site.id IS 'Unique identifier for the record';
COMMENT ON COLUMN hr_task_tracker_site.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_task_tracker_site.task_tracker_id IS 'Task tracker event this site belongs to';
COMMENT ON COLUMN hr_task_tracker_site.site_id IS 'Site where the task was performed';
COMMENT ON COLUMN hr_task_tracker_site.is_active IS 'Soft delete flag; false removes the site from the task without deleting the record';
COMMENT ON COLUMN hr_task_tracker_site.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_task_tracker_site.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN hr_task_tracker_site.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_task_tracker_site.updated_by IS 'Email of the user who last updated the record';
