CREATE TABLE IF NOT EXISTS grow_input_compliance (
    id                          TEXT PRIMARY KEY,
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    invnt_item_id               TEXT NOT NULL REFERENCES invnt_item(id),
    epa_registration            TEXT,
    phi_days                    INTEGER,
    rei_hours                   INTEGER,
    label_date                  DATE,
    application_method          TEXT,
    target_pest_disease         TEXT,
    maximum_quantity_per_acre   NUMERIC,
    application_uom             TEXT REFERENCES sys_uom(code),
    burn_uom                    TEXT REFERENCES sys_uom(code),
    application_per_burn_unit   NUMERIC,
    external_label_url          TEXT,
    effective_date              DATE,
    expiration_date             DATE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_input_compliance UNIQUE (org_id, farm_id, invnt_item_id)
);

COMMENT ON TABLE grow_input_compliance IS 'Chemical label registry storing regulatory information per product. One row per chemical/fertilizer item with REI, PHI, label rates, and application restrictions.';

COMMENT ON COLUMN grow_input_compliance.epa_registration IS 'EPA registration number for the chemical product';
COMMENT ON COLUMN grow_input_compliance.phi_days IS 'Pre-Harvest Interval in days — minimum days between last application and harvest';
COMMENT ON COLUMN grow_input_compliance.rei_hours IS 'Restricted Entry Interval in hours — minimum hours before workers can re-enter treated area';
COMMENT ON COLUMN grow_input_compliance.application_method IS 'How the product is applied (e.g. spray, drench, granular)';
COMMENT ON COLUMN grow_input_compliance.target_pest_disease IS 'The pest or disease this product is intended to treat';
COMMENT ON COLUMN grow_input_compliance.maximum_quantity_per_acre IS 'Maximum label rate per acre per application';
COMMENT ON COLUMN grow_input_compliance.application_uom IS 'Unit of measure for the application rate';
COMMENT ON COLUMN grow_input_compliance.burn_uom IS 'Smallest consumption unit for this product';
COMMENT ON COLUMN grow_input_compliance.application_per_burn_unit IS 'Application rate expressed in burn units';
COMMENT ON COLUMN grow_input_compliance.effective_date IS 'Date this compliance record becomes effective';
COMMENT ON COLUMN grow_input_compliance.expiration_date IS 'Date this compliance record expires and must be reviewed';

CREATE INDEX idx_grow_input_compliance_item ON grow_input_compliance (invnt_item_id);
