CREATE TABLE IF NOT EXISTS pack_shelf_life_observation (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                     TEXT REFERENCES farm(id),
    pack_shelf_life_trial_id    UUID NOT NULL REFERENCES pack_shelf_life_trial(id) ON DELETE CASCADE,
    pack_shelf_life_check_id    TEXT NOT NULL REFERENCES pack_shelf_life_check(id),

    observation_date            DATE NOT NULL,
    shelf_life_day              INTEGER NOT NULL,

    response_boolean            BOOLEAN,
    response_numeric            NUMERIC,
    response_enum               TEXT,
    response_text               TEXT,

    notes                       TEXT,

    is_deleted                   BOOLEAN NOT NULL DEFAULT false,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,

    CONSTRAINT uq_pack_shelf_life_observation UNIQUE (pack_shelf_life_trial_id, pack_shelf_life_check_id, observation_date)
);

CREATE INDEX idx_pack_shelf_life_observation_org_id ON pack_shelf_life_observation (org_id);
CREATE INDEX idx_pack_shelf_life_observation_trial  ON pack_shelf_life_observation (pack_shelf_life_trial_id);
CREATE INDEX idx_pack_shelf_life_observation_check  ON pack_shelf_life_observation (pack_shelf_life_check_id);

COMMENT ON TABLE pack_shelf_life_observation IS 'Individual observation responses for a shelf life trial. One row per check per observation date per trial.';
COMMENT ON COLUMN pack_shelf_life_observation.id IS 'Unique identifier for the observation';
COMMENT ON COLUMN pack_shelf_life_observation.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN pack_shelf_life_observation.farm_id IS 'Optional farm scope; inherited from parent pack_shelf_life_trial';
COMMENT ON COLUMN pack_shelf_life_observation.pack_shelf_life_trial_id IS 'Trial this observation belongs to';
COMMENT ON COLUMN pack_shelf_life_observation.pack_shelf_life_check_id IS 'Check being recorded in this observation';
COMMENT ON COLUMN pack_shelf_life_observation.observation_date IS 'Date the observation was made';
COMMENT ON COLUMN pack_shelf_life_observation.shelf_life_day IS 'Number of days since the pack date (e.g. day 0, day 1, day 7)';
COMMENT ON COLUMN pack_shelf_life_observation.response_boolean IS 'Boolean response value; used when check response_type is boolean';
COMMENT ON COLUMN pack_shelf_life_observation.response_numeric IS 'Numeric response value; used when check response_type is numeric';
COMMENT ON COLUMN pack_shelf_life_observation.response_enum IS 'Selected enum option; used when check response_type is enum';
COMMENT ON COLUMN pack_shelf_life_observation.response_text IS 'Free-text response; used when check response_type is text';
COMMENT ON COLUMN pack_shelf_life_observation.notes IS 'Free-text notes about this observation';
COMMENT ON COLUMN pack_shelf_life_observation.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN pack_shelf_life_observation.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN pack_shelf_life_observation.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN pack_shelf_life_observation.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN pack_shelf_life_observation.updated_by IS 'Email of the user who last updated the record';
