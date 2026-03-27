CREATE TABLE IF NOT EXISTS grow_scout_observation (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT NOT NULL REFERENCES org(id),
    farm_id                 TEXT NOT NULL REFERENCES org_farm(id),
    ops_task_tracker_id        UUID NOT NULL REFERENCES ops_task_tracker(id),
    observation_type        TEXT NOT NULL CHECK (observation_type IN ('pest', 'disease')),
    grow_pest_id            TEXT REFERENCES grow_pest(id),
    grow_disease_id         TEXT REFERENCES grow_disease(id),
    disease_infection_stage TEXT CHECK (disease_infection_stage IN ('early', 'mid', 'late', 'advanced')),
    severity_level          TEXT NOT NULL CHECK (severity_level IN ('low', 'moderate', 'high', 'severe')),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT chk_grow_scout_observation_type CHECK (
        (observation_type = 'pest' AND grow_pest_id IS NOT NULL AND grow_disease_id IS NULL)
        OR (observation_type = 'disease' AND grow_disease_id IS NOT NULL AND grow_pest_id IS NULL)
    )
);

COMMENT ON TABLE grow_scout_observation IS 'Individual pest or disease finding within a scouting event. Either a pest or disease, enforced by CHECK constraint.';

COMMENT ON COLUMN grow_scout_observation.observation_type IS 'pest, disease';
COMMENT ON COLUMN grow_scout_observation.grow_pest_id IS 'Shown when observation_type is pest; null when disease';
COMMENT ON COLUMN grow_scout_observation.grow_disease_id IS 'Shown when observation_type is disease; null when pest';
COMMENT ON COLUMN grow_scout_observation.disease_infection_stage IS 'early, mid, late, advanced; shown when observation_type is disease; null when pest';
COMMENT ON COLUMN grow_scout_observation.severity_level IS 'low, moderate, high, severe';

CREATE INDEX idx_grow_scout_observation_scouting ON grow_scout_observation (ops_task_tracker_id);
