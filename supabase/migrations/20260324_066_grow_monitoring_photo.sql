CREATE TABLE IF NOT EXISTS grow_monitoring_photo (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    farm_id             TEXT NOT NULL REFERENCES org_farm(id),
    ops_task_tracker_id UUID NOT NULL REFERENCES ops_task_tracker(id),
    photo_url           TEXT NOT NULL,
    caption             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_monitoring_photo IS 'Photos taken during a monitoring event. One row per photo with optional caption.';

CREATE INDEX idx_grow_monitoring_photo_tracker ON grow_monitoring_photo (ops_task_tracker_id);
