CREATE TABLE IF NOT EXISTS grow_monitoring_seeding (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    farm_id             TEXT NOT NULL REFERENCES org_farm(id),
    ops_task_tracker_id UUID NOT NULL REFERENCES ops_task_tracker(id),
    grow_seed_batch_id     UUID NOT NULL REFERENCES grow_seed_batch(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_monitoring_seeding UNIQUE (ops_task_tracker_id, grow_seed_batch_id)
);

COMMENT ON TABLE grow_monitoring_seeding IS 'Point-in-time snapshot of which seedings were present during a monitoring event. Linked to ops_task_tracker.';

CREATE INDEX idx_grow_monitoring_seeding_tracker ON grow_monitoring_seeding (ops_task_tracker_id);
CREATE INDEX idx_grow_monitoring_seeding_seeding ON grow_monitoring_seeding (grow_seed_batch_id);
