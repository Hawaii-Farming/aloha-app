CREATE TABLE IF NOT EXISTS grow_fertigation_seed_batch (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    ops_task_tracker_id         UUID NOT NULL REFERENCES ops_task_tracker(id),
    grow_fertigation_recipe_id  TEXT NOT NULL REFERENCES grow_fertigation_recipe(id),
    grow_seed_batch_id             UUID NOT NULL REFERENCES grow_seed_batch(id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_fertigation_seed_batch UNIQUE (ops_task_tracker_id, grow_seed_batch_id)
);

COMMENT ON TABLE grow_fertigation_seed_batch IS 'Point-in-time snapshot of which seedings were fertigated during an event. The recipe ID is stored here rather than on a header table to keep ops_task_tracker module-agnostic.';

CREATE INDEX idx_grow_fertigation_seed_batch_tracker ON grow_fertigation_seed_batch (ops_task_tracker_id);
CREATE INDEX idx_grow_fertigation_seed_batch_recipe ON grow_fertigation_seed_batch (grow_fertigation_recipe_id);
CREATE INDEX idx_grow_fertigation_seed_batch_seeding ON grow_fertigation_seed_batch (grow_seed_batch_id);
