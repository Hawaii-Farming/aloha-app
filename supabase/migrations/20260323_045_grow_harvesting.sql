CREATE TABLE IF NOT EXISTS grow_harvesting (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT NOT NULL REFERENCES org(id),
    farm_id                 TEXT NOT NULL REFERENCES org_farm(id),
    site_id                 TEXT REFERENCES org_site(id),
    ops_task_tracker_id     UUID REFERENCES ops_task_tracker(id),
    grow_seeding_id         UUID NOT NULL REFERENCES grow_seeding(id),
    grow_grade_id           TEXT REFERENCES grow_grade(id),
    harvest_date            DATE NOT NULL,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_harvesting IS 'Harvest header linked to a seeding batch for full traceability. Individual weigh-ins are recorded in grow_harvesting_weight.';

CREATE INDEX idx_grow_harvesting_org ON grow_harvesting (org_id);
CREATE INDEX idx_grow_harvesting_seeding ON grow_harvesting (grow_seeding_id);
CREATE INDEX idx_grow_harvesting_tracker ON grow_harvesting (ops_task_tracker_id);
