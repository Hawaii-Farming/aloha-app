CREATE TABLE IF NOT EXISTS grow_scouting_observation (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT NOT NULL REFERENCES org(id),
    farm_id                 TEXT NOT NULL REFERENCES org_farm(id),
    grow_scouting_id        UUID NOT NULL REFERENCES grow_scouting(id),
    observation_type        TEXT NOT NULL CHECK (observation_type IN ('pest', 'disease')),
    grow_pest_id            TEXT REFERENCES grow_pest(id),
    grow_disease_id         TEXT REFERENCES grow_disease(id),
    severity_level          TEXT NOT NULL CHECK (severity_level IN ('low', 'moderate', 'high', 'severe')),
    disease_infection_stage TEXT CHECK (disease_infection_stage IN ('early', 'mid', 'late', 'advanced')),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT chk_grow_scouting_observation_type CHECK (
        (observation_type = 'pest' AND grow_pest_id IS NOT NULL AND grow_disease_id IS NULL)
        OR (observation_type = 'disease' AND grow_disease_id IS NOT NULL AND grow_pest_id IS NULL)
    )
);

COMMENT ON TABLE grow_scouting_observation IS 'Individual pest or disease finding within a scouting event. Either a pest or disease, enforced by CHECK constraint.';

COMMENT ON COLUMN grow_scouting_observation.observation_type IS 'Type of finding: pest or disease';
COMMENT ON COLUMN grow_scouting_observation.severity_level IS 'Severity: low, moderate, high, severe';
COMMENT ON COLUMN grow_scouting_observation.disease_infection_stage IS 'Stage of infection for disease observations: early, mid, late, advanced; null for pest observations';

CREATE INDEX idx_grow_scouting_observation_scouting ON grow_scouting_observation (grow_scouting_id);
