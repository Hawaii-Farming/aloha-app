CREATE TABLE IF NOT EXISTS pack_shelf_life_trial (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                     TEXT REFERENCES farm(id),
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

    is_deleted                   BOOLEAN NOT NULL DEFAULT false,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT
);

CREATE INDEX idx_pack_shelf_life_trial_org_id   ON pack_shelf_life_trial (org_id);
CREATE INDEX idx_pack_shelf_life_trial_lot      ON pack_shelf_life_trial (pack_lot_id);
CREATE INDEX idx_pack_shelf_life_trial_product  ON pack_shelf_life_trial (sales_product_id);
CREATE INDEX idx_pack_shelf_life_trial_status   ON pack_shelf_life_trial (org_id, status);

COMMENT ON TABLE pack_shelf_life_trial IS 'Shelf life trial header. One row per trial. Tracks the product, lot, packaging type, target shelf life, and trial outcome.';
COMMENT ON COLUMN pack_shelf_life_trial.id IS 'Unique identifier for the shelf life trial';
COMMENT ON COLUMN pack_shelf_life_trial.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN pack_shelf_life_trial.farm_id IS 'Optional farm scope; null if the trial applies to all farms';
COMMENT ON COLUMN pack_shelf_life_trial.pack_lot_id IS 'Lot being tested; null if the trial is not tied to a specific lot';
COMMENT ON COLUMN pack_shelf_life_trial.sales_product_id IS 'Product being tested in this trial';
COMMENT ON COLUMN pack_shelf_life_trial.pack_packaging_type_id IS 'Packaging type used for this trial; null if same as the product default';
COMMENT ON COLUMN pack_shelf_life_trial.trial_number IS 'Sequential trial number for tracking and reference';
COMMENT ON COLUMN pack_shelf_life_trial.trial_purpose IS 'Reason for conducting this trial (e.g. new product validation, packaging change, seasonal check)';
COMMENT ON COLUMN pack_shelf_life_trial.target_shelf_life_days IS 'Expected number of shelf life days this trial is testing against';
COMMENT ON COLUMN pack_shelf_life_trial.final_shelf_life_days IS 'Actual shelf life days determined at the end of the trial';
COMMENT ON COLUMN pack_shelf_life_trial.sample_location IS 'Where the sample is stored during the trial (e.g. cold room, retail display)';
COMMENT ON COLUMN pack_shelf_life_trial.notes IS 'Free-text notes about the trial';
COMMENT ON COLUMN pack_shelf_life_trial.status IS 'Trial status: active (in progress) or terminated (ended early or completed)';
COMMENT ON COLUMN pack_shelf_life_trial.termination_reason IS 'Reason the trial was terminated; null while trial is active';
COMMENT ON COLUMN pack_shelf_life_trial.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN pack_shelf_life_trial.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN pack_shelf_life_trial.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN pack_shelf_life_trial.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN pack_shelf_life_trial.updated_by IS 'Email of the user who last updated the record';
