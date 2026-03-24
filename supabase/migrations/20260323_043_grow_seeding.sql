CREATE TABLE IF NOT EXISTS grow_seeding (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    farm_id             TEXT NOT NULL REFERENCES org_farm(id),
    site_id             TEXT REFERENCES org_site(id),
    ops_task_tracker_id UUID REFERENCES ops_task_tracker(id),
    batch_code          TEXT NOT NULL,
    grow_trial_type_id  TEXT REFERENCES grow_trial_type(id),
    grow_seed_mix_id    TEXT REFERENCES grow_seed_mix(id),
    invnt_item_id       TEXT REFERENCES invnt_item(id),
    lot_number          TEXT,
    seeding_uom         TEXT NOT NULL REFERENCES sys_uom(code),
    number_of_units     INTEGER NOT NULL,
    seeds_per_unit      INTEGER NOT NULL,
    number_of_rows      INTEGER NOT NULL,
    seeding_date        DATE NOT NULL,
    transplant_date     DATE NOT NULL,
    estimated_harvest_date DATE NOT NULL,
    status              TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'seeded', 'transplanted', 'harvesting', 'harvested')),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_seeding UNIQUE (org_id, batch_code),
    CONSTRAINT chk_grow_seeding_source CHECK (
        (invnt_item_id IS NOT NULL AND grow_seed_mix_id IS NULL)
        OR (invnt_item_id IS NULL AND grow_seed_mix_id IS NOT NULL)
    )
);

COMMENT ON TABLE grow_seeding IS 'Individual seeding batch linked to an ops activity. Either a single seed item or a seed mix, never both.';

COMMENT ON COLUMN grow_seeding.batch_code IS 'System-generated traceability code that carries through to transplanting and harvest; editable by user';
COMMENT ON COLUMN grow_seeding.lot_number IS 'Supplier seed lot number for single-variety batches; populated from frontend dropdown';
COMMENT ON COLUMN grow_seeding.seeding_uom IS 'Unit used for seeding (e.g. board, flat, tray)';
COMMENT ON COLUMN grow_seeding.status IS 'Lifecycle status: planned, seeded, transplanted, harvesting, harvested';

CREATE INDEX idx_grow_seeding_org ON grow_seeding (org_id);
CREATE INDEX idx_grow_seeding_tracker ON grow_seeding (ops_task_tracker_id);
CREATE INDEX idx_grow_seeding_item ON grow_seeding (invnt_item_id);
CREATE INDEX idx_grow_seeding_mix ON grow_seeding (grow_seed_mix_id);
