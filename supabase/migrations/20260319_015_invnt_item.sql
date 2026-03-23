CREATE TABLE IF NOT EXISTS invnt_item (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                   TEXT NOT NULL REFERENCES org(id),
    farm_id                  TEXT REFERENCES org_farm(id),
    invnt_category_id        TEXT REFERENCES invnt_category(id),
    invnt_subcategory_id     TEXT REFERENCES invnt_category(id),
    name                     TEXT NOT NULL,
    accounting_id            TEXT,
    description              TEXT,

    -- Three-unit system
    burn_uom                 TEXT REFERENCES org_uom(code),
    onhand_uom               TEXT REFERENCES org_uom(code),
    order_uom                TEXT REFERENCES org_uom(code),
    burn_per_onhand     NUMERIC,
    burn_per_order      NUMERIC,

    -- Logistics
    is_palletized            BOOLEAN NOT NULL DEFAULT false,
    order_per_pallet    NUMERIC,
    pallet_per_truckload NUMERIC,

    -- Burn rates & forecasting
    is_frequently_used       BOOLEAN NOT NULL DEFAULT false,
    burn_per_week            NUMERIC,
    cushion_weeks            NUMERIC,

    -- Reorder settings
    is_auto_reorder          BOOLEAN NOT NULL DEFAULT false,
    reorder_point_in_burn       NUMERIC,
    reorder_quantity_in_burn    NUMERIC,

    -- Tracking flags
    requires_lot_tracking    BOOLEAN NOT NULL DEFAULT false,
    requires_expiry_date     BOOLEAN NOT NULL DEFAULT false,

    -- Site references
    site_id_storage      TEXT REFERENCES org_site(id),
    site_id_equipment  TEXT REFERENCES org_site(id),

    -- Item details
    invnt_vendor_id          TEXT REFERENCES invnt_vendor(id),
    manufacturer             TEXT,
    grow_variety_id          TEXT REFERENCES grow_variety(id),
    seed_is_pelleted         BOOLEAN NOT NULL DEFAULT false,
    maint_part_type          TEXT,
    maint_part_number        TEXT,

    photos                   JSONB NOT NULL DEFAULT '[]',

    is_active                BOOLEAN NOT NULL DEFAULT true,

    -- CRUD
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by               TEXT,
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by               TEXT,
    is_deleted                BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_invnt_item UNIQUE (org_id, name)
);

COMMENT ON TABLE invnt_item IS 'The main inventory record. Items belong to an organization and optionally to a specific farm. Classification is handled by the category/subcategory structure. All item details are proper columns grouped by logical sections. Seed-specific fields are prefixed seed_; maintenance part fields are prefixed maint_.';

CREATE INDEX idx_invnt_item_org_id ON invnt_item (org_id);
CREATE INDEX idx_invnt_item_vendor      ON invnt_item (invnt_vendor_id);
CREATE INDEX idx_invnt_item_category    ON invnt_item (invnt_category_id);
CREATE INDEX idx_invnt_item_subcategory ON invnt_item (invnt_subcategory_id);
CREATE INDEX idx_invnt_item_site_storage ON invnt_item (site_id_storage);
CREATE INDEX idx_invnt_item_site_equipment ON invnt_item (site_id_equipment);

COMMENT ON COLUMN invnt_item.invnt_category_id IS 'References invnt_category rows where sub_category_name IS NULL';
COMMENT ON COLUMN invnt_item.invnt_subcategory_id IS 'References invnt_category rows where sub_category_name IS NOT NULL';
COMMENT ON COLUMN invnt_item.burn_uom IS 'Smallest consumption unit used for burn rate tracking (e.g. ml, g, seed)';
COMMENT ON COLUMN invnt_item.onhand_uom IS 'Unit used for physical stock counts (e.g. bottle, bag, box)';
COMMENT ON COLUMN invnt_item.order_uom IS 'Unit used when placing orders with vendors (e.g. case, pallet)';
COMMENT ON COLUMN invnt_item.burn_per_onhand IS 'Number of burn units in one onhand unit';
COMMENT ON COLUMN invnt_item.burn_per_order IS 'Number of burn units in one order unit';
COMMENT ON COLUMN invnt_item.cushion_weeks IS 'Safety stock buffer in weeks used in next-order-date calculations';
COMMENT ON COLUMN invnt_item.is_active IS 'Whether this item is currently active for ordering and tracking; false means inactive but not deleted';
