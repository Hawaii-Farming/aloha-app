CREATE TABLE IF NOT EXISTS grow_spraying_compliance (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    invnt_item_id               TEXT NOT NULL REFERENCES invnt_item(id),

    -- Regulatory Information
    epa_registration            TEXT,
    phi_days                    INTEGER,
    rei_hours                   INTEGER,

    -- Application & Usage
    application_method          TEXT,
    target_pest_disease         JSONB NOT NULL DEFAULT '[]',
    application_uom             TEXT REFERENCES sys_uom(code),
    maximum_quantity_per_acre   NUMERIC,
    burn_uom                    TEXT REFERENCES sys_uom(code),
    application_per_burn_unit   NUMERIC,

    -- Label & Compliance
    label_date                  DATE,
    effective_date              DATE,
    expiration_date             DATE,
    external_label_url          TEXT,

    -- CRUD
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false,

);

COMMENT ON TABLE grow_spraying_compliance IS 'Chemical label registry storing regulatory information per product. One row per chemical/fertilizer item with REI, PHI, label rates, and application restrictions.';

COMMENT ON COLUMN grow_spraying_compliance.epa_registration IS 'EPA registration number for the chemical product';
COMMENT ON COLUMN grow_spraying_compliance.phi_days IS 'Pre-Harvest Interval in days — minimum days between last application and harvest';
COMMENT ON COLUMN grow_spraying_compliance.rei_hours IS 'Restricted Entry Interval in hours — minimum hours before workers can re-enter treated area';
COMMENT ON COLUMN grow_spraying_compliance.application_method IS 'How the product is applied (e.g. spray, drench, granular)';
COMMENT ON COLUMN grow_spraying_compliance.target_pest_disease IS 'JSON array of pests and diseases this product is intended to treat';
COMMENT ON COLUMN grow_spraying_compliance.application_uom IS 'Unit of measure for the application rate';
COMMENT ON COLUMN grow_spraying_compliance.maximum_quantity_per_acre IS 'Maximum label rate per acre per application';
COMMENT ON COLUMN grow_spraying_compliance.burn_uom IS 'Smallest consumption unit for this product';
COMMENT ON COLUMN grow_spraying_compliance.application_per_burn_unit IS 'Application rate expressed in burn units';

CREATE INDEX idx_grow_spraying_compliance_item ON grow_spraying_compliance (invnt_item_id);
