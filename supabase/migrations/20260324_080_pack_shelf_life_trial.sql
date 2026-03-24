CREATE TABLE IF NOT EXISTS pack_shelf_life_trial (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT REFERENCES org_farm(id),
    pack_lot_id                 UUID REFERENCES pack_lot(id),
    sales_product_id            TEXT NOT NULL REFERENCES sales_product(id),
    pack_packaging_type_id      TEXT REFERENCES pack_packaging_type(id),

    trial_number                INTEGER,
    trial_purpose               TEXT,
    target_shelf_life_days      INTEGER,
    final_shelf_life_days       INTEGER,
    sample_location             TEXT,
    notes                       TEXT,

    status                      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'terminated')),
    termination_reason          TEXT,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE pack_shelf_life_trial IS 'Shelf life trial header. One row per trial. Tracks the product, lot, packaging type, target shelf life, and trial outcome.';

CREATE INDEX idx_pack_shelf_life_trial_org_id   ON pack_shelf_life_trial (org_id);
CREATE INDEX idx_pack_shelf_life_trial_lot      ON pack_shelf_life_trial (pack_lot_id);
CREATE INDEX idx_pack_shelf_life_trial_product  ON pack_shelf_life_trial (sales_product_id);
CREATE INDEX idx_pack_shelf_life_trial_status   ON pack_shelf_life_trial (org_id, status);

COMMENT ON COLUMN pack_shelf_life_trial.pack_lot_id IS 'Null if the trial is not tied to a specific lot';
COMMENT ON COLUMN pack_shelf_life_trial.pack_packaging_type_id IS 'Null if same as the product default';
COMMENT ON COLUMN pack_shelf_life_trial.status IS 'Trial status: active (in progress) or terminated (ended early or completed)';
