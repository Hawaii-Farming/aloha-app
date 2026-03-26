CREATE TABLE IF NOT EXISTS pack_shelf_life (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT REFERENCES org_farm(id),
    pack_lot_id                 UUID REFERENCES pack_lot(id),
    sales_product_id            TEXT NOT NULL REFERENCES sales_product(id),
    invnt_item_id               TEXT REFERENCES invnt_item(id),

    trial_number                INTEGER,
    trial_purpose               TEXT,
    target_shelf_life_days      INTEGER,
    site_id_storage             TEXT REFERENCES org_site(id),
    notes                       TEXT,

    is_terminated               BOOLEAN NOT NULL DEFAULT false,
    termination_reason          TEXT,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE pack_shelf_life IS 'Shelf life trial header. One row per trial. Tracks the product, lot, packaging type, target shelf life, and trial outcome.';

CREATE INDEX idx_pack_shelf_life_org_id   ON pack_shelf_life (org_id);
CREATE INDEX idx_pack_shelf_life_lot      ON pack_shelf_life (pack_lot_id);
CREATE INDEX idx_pack_shelf_life_product  ON pack_shelf_life (sales_product_id);

