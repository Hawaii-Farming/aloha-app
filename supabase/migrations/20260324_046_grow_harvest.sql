CREATE TABLE IF NOT EXISTS grow_harvest (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT NOT NULL REFERENCES org(id),
    farm_id                 TEXT NOT NULL REFERENCES org_farm(id),
    site_id                 TEXT REFERENCES org_site(id),
    ops_task_tracker_id     UUID REFERENCES ops_task_tracker(id),
    grow_seed_batch_id         UUID NOT NULL REFERENCES grow_seed_batch(id),
    grow_grade_id           TEXT REFERENCES grow_grade(id),
    harvest_date            DATE NOT NULL,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_harvest IS 'Harvest header linked to a seeding batch for full traceability. Individual weigh-ins are recorded in grow_harvest_weight.';

CREATE INDEX idx_grow_harvest_org ON grow_harvest (org_id);
CREATE INDEX idx_grow_harvest_seeding ON grow_harvest (grow_seed_batch_id);
CREATE INDEX idx_grow_harvest_tracker ON grow_harvest (ops_task_tracker_id);
