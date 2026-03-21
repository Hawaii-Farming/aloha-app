CREATE TABLE IF NOT EXISTS pack_shelf_life_photo (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT REFERENCES farm(id),
    pack_shelf_life_trial_id    UUID NOT NULL REFERENCES pack_shelf_life_trial(id),

    observation_date            DATE NOT NULL,
    shelf_life_day              INTEGER NOT NULL,
    photo_url                   TEXT NOT NULL,
    caption                     TEXT,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE pack_shelf_life_photo IS 'Photos taken during a shelf life trial observation. Multiple photos per observation date per trial.';

CREATE INDEX idx_pack_shelf_life_photo_org_id ON pack_shelf_life_photo (org_id);
CREATE INDEX idx_pack_shelf_life_photo_trial  ON pack_shelf_life_photo (pack_shelf_life_trial_id);

COMMENT ON COLUMN pack_shelf_life_photo.pack_shelf_life_trial_id IS 'Trial this photo belongs to';
COMMENT ON COLUMN pack_shelf_life_photo.shelf_life_day IS 'Number of days since the pack date (e.g. day 0, day 1, day 7)';
