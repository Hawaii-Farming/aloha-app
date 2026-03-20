CREATE TABLE IF NOT EXISTS pack_shelf_life_photo (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                     TEXT REFERENCES farm(id),
    pack_shelf_life_trial_id    UUID NOT NULL REFERENCES pack_shelf_life_trial(id) ON DELETE CASCADE,

    observation_date            DATE NOT NULL,
    shelf_life_day              INTEGER NOT NULL,
    photo_url                   TEXT NOT NULL,
    caption                     TEXT,

    is_deleted                   BOOLEAN NOT NULL DEFAULT false,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT
);

CREATE INDEX idx_pack_shelf_life_photo_org_id ON pack_shelf_life_photo (org_id);
CREATE INDEX idx_pack_shelf_life_photo_trial  ON pack_shelf_life_photo (pack_shelf_life_trial_id);

COMMENT ON TABLE pack_shelf_life_photo IS 'Photos taken during a shelf life trial observation. Multiple photos per observation date per trial.';
COMMENT ON COLUMN pack_shelf_life_photo.id IS 'Unique identifier for the photo';
COMMENT ON COLUMN pack_shelf_life_photo.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN pack_shelf_life_photo.farm_id IS 'Optional farm scope; inherited from parent pack_shelf_life_trial';
COMMENT ON COLUMN pack_shelf_life_photo.pack_shelf_life_trial_id IS 'Trial this photo belongs to';
COMMENT ON COLUMN pack_shelf_life_photo.observation_date IS 'Date the photo was taken';
COMMENT ON COLUMN pack_shelf_life_photo.shelf_life_day IS 'Number of days since the pack date (e.g. day 0, day 1, day 7)';
COMMENT ON COLUMN pack_shelf_life_photo.photo_url IS 'URL or path to the photo';
COMMENT ON COLUMN pack_shelf_life_photo.caption IS 'Optional caption describing what the photo shows';
COMMENT ON COLUMN pack_shelf_life_photo.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN pack_shelf_life_photo.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN pack_shelf_life_photo.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN pack_shelf_life_photo.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN pack_shelf_life_photo.updated_by IS 'Email of the user who last updated the record';
