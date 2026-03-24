CREATE TABLE IF NOT EXISTS grow_cycle_pattern (
    id                  TEXT PRIMARY KEY,
    org_id              TEXT NOT NULL REFERENCES org(id),
    farm_id             TEXT NOT NULL REFERENCES org_farm(id),
    name                TEXT NOT NULL,
    description         TEXT,
    days_to_transplant  INTEGER,
    days_to_harvest     INTEGER,
    total_cycle_days    INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_cycle_pattern UNIQUE (org_id, farm_id, name)
);

COMMENT ON TABLE grow_cycle_pattern IS 'Defines growing cycle patterns per farm (e.g. 14-Day Lettuce, 42-Day Cucumber). Used to auto-calculate transplant and harvest dates on seeding batches.';

COMMENT ON COLUMN grow_cycle_pattern.days_to_transplant IS 'Days from seeding date to transplant date';
COMMENT ON COLUMN grow_cycle_pattern.days_to_harvest IS 'Days from transplant date to estimated harvest date';
COMMENT ON COLUMN grow_cycle_pattern.total_cycle_days IS 'Total days from seeding to harvest; can be derived from days_to_transplant + days_to_harvest or set independently';
