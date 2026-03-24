CREATE TABLE IF NOT EXISTS grow_scout_photo (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    farm_id             TEXT NOT NULL REFERENCES org_farm(id),
    ops_task_tracker_id    UUID NOT NULL REFERENCES ops_task_tracker(id),
    photo_url           TEXT NOT NULL,
    caption             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_scout_photo IS 'Photos taken during a scouting event. One row per photo with optional caption.';

CREATE INDEX idx_grow_scout_photo_scouting ON grow_scout_photo (ops_task_tracker_id);
