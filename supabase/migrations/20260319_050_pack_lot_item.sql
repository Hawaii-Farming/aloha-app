CREATE TABLE IF NOT EXISTS pack_lot_item (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id),
    farm_id             TEXT NOT NULL REFERENCES org_farm(id),
    pack_lot_id         UUID NOT NULL REFERENCES pack_lot(id),
    sales_product_id    TEXT NOT NULL REFERENCES sales_product(id),

    best_by_date        DATE NOT NULL,
    uom                 TEXT NOT NULL REFERENCES sys_uom(code),
    quantity_packed     NUMERIC NOT NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,
    is_deleted           BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_pack_lot_item UNIQUE (pack_lot_id, sales_product_id)
);

COMMENT ON TABLE pack_lot_item IS 'Individual products packed within a lot. One row per product per lot.';

CREATE INDEX idx_pack_lot_item_org_id   ON pack_lot_item (org_id);
CREATE INDEX idx_pack_lot_item_lot      ON pack_lot_item (pack_lot_id);
CREATE INDEX idx_pack_lot_item_product  ON pack_lot_item (sales_product_id);

COMMENT ON COLUMN pack_lot_item.uom IS 'Defaults to the product sale unit (e.g. case)';
