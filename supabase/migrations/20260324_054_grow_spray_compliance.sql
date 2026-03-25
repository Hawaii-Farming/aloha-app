CREATE TABLE IF NOT EXISTS grow_spray_compliance (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    invnt_item_id               TEXT NOT NULL REFERENCES invnt_item(id),

    -- Regulatory Information
    epa_registration            TEXT NOT NULL,
    phi_days                    INTEGER NOT NULL,
    rei_hours                   INTEGER NOT NULL,

    -- Application & Usage
    application_method          JSONB NOT NULL DEFAULT '[]',
    target_pest_disease         JSONB NOT NULL DEFAULT '[]',
    application_uom             TEXT NOT NULL REFERENCES sys_uom(code),
    maximum_quantity_per_acre   NUMERIC NOT NULL,
    burn_uom                    TEXT NOT NULL REFERENCES sys_uom(code),
    application_per_burn   NUMERIC NOT NULL,

    -- Label & Compliance
    label_date                  DATE NOT NULL,
    effective_date              DATE NOT NULL,
    expiration_date             DATE,
    external_label_url          TEXT NOT NULL,

    -- CRUD
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_spray_compliance IS 'Chemical label registry storing regulatory information per product. One row per chemical/fertilizer item with REI, PHI, label rates, and application restrictions.';


CREATE INDEX idx_grow_spray_compliance_item ON grow_spray_compliance (invnt_item_id);
