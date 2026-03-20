CREATE TABLE IF NOT EXISTS pack_lot_item (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    pack_lot_id         UUID NOT NULL REFERENCES pack_lot(id) ON DELETE CASCADE,
    sales_product_id    TEXT NOT NULL REFERENCES sales_product(id),

    best_by_date        DATE NOT NULL,
    uom                 TEXT NOT NULL REFERENCES util_uom(code),
    quantity_packed     NUMERIC NOT NULL,

    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,

    CONSTRAINT uq_pack_lot_item UNIQUE (pack_lot_id, sales_product_id)
);

CREATE INDEX idx_pack_lot_item_org_id   ON pack_lot_item (org_id);
CREATE INDEX idx_pack_lot_item_lot      ON pack_lot_item (pack_lot_id);
CREATE INDEX idx_pack_lot_item_product  ON pack_lot_item (sales_product_id);

COMMENT ON TABLE pack_lot_item IS 'Individual products packed within a lot. One row per product per lot.';
COMMENT ON COLUMN pack_lot_item.id IS 'Unique identifier for the pack lot item';
COMMENT ON COLUMN pack_lot_item.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN pack_lot_item.pack_lot_id IS 'Parent lot this item belongs to';
COMMENT ON COLUMN pack_lot_item.sales_product_id IS 'Product that was packed in this lot';
COMMENT ON COLUMN pack_lot_item.best_by_date IS 'Best-by date for this product, derived from the lot pack date plus the product shelf life';
COMMENT ON COLUMN pack_lot_item.uom IS 'Unit of measure for quantity packed; defaults to the product sale unit (e.g. case)';
COMMENT ON COLUMN pack_lot_item.quantity_packed IS 'Number of units packed for this product in this lot';
COMMENT ON COLUMN pack_lot_item.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN pack_lot_item.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN pack_lot_item.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN pack_lot_item.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN pack_lot_item.updated_by IS 'Email of the user who last updated the record';
