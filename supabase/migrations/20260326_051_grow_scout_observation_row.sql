CREATE TABLE IF NOT EXISTS grow_scout_observation_row (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                          TEXT NOT NULL REFERENCES org(id),
    farm_id                         TEXT NOT NULL REFERENCES org_farm(id),
    grow_scout_observation_id    UUID NOT NULL REFERENCES grow_scout_observation(id),
    row_number                      INTEGER NOT NULL,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                      TEXT,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                      TEXT,
    is_deleted                      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_scout_observation_row UNIQUE (grow_scout_observation_id, row_number)
);

COMMENT ON TABLE grow_scout_observation_row IS 'Rows affected by a specific scouting observation. One row per affected growing row per observation.';

CREATE INDEX idx_grow_scout_observation_row_obs ON grow_scout_observation_row (grow_scout_observation_id);

COMMENT ON COLUMN grow_scout_observation_row.row_number IS 'The specific growing row within the site where this pest/disease was observed';
