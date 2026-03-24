CREATE TABLE IF NOT EXISTS grow_scouting_seeding (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    farm_id             TEXT NOT NULL REFERENCES org_farm(id),
    ops_task_tracker_id    UUID NOT NULL REFERENCES ops_task_tracker(id),
    grow_seeding_id     UUID NOT NULL REFERENCES grow_seeding(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_scouting_seeding UNIQUE (ops_task_tracker_id, grow_seeding_id)
);

COMMENT ON TABLE grow_scouting_seeding IS 'Join table linking a scouting activity (ops_task_tracker) to one or more seeding batches being inspected.';

CREATE INDEX idx_grow_scouting_seeding_scouting ON grow_scouting_seeding (ops_task_tracker_id);
CREATE INDEX idx_grow_scouting_seeding_seeding ON grow_scouting_seeding (grow_seeding_id);
