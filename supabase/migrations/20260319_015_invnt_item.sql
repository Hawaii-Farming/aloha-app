CREATE TABLE IF NOT EXISTS invnt_item (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                   TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                  TEXT REFERENCES farm(id),
    invnt_category_id        TEXT REFERENCES invnt_category(id),
    invnt_subcategory_id     TEXT REFERENCES invnt_category(id),
    name                     TEXT NOT NULL,
    accounting_id            TEXT,
    description              TEXT,

    -- Three-unit system
    burn_uom                 TEXT REFERENCES util_uom(code),
    onhand_uom               TEXT REFERENCES util_uom(code),
    order_uom                TEXT REFERENCES util_uom(code),
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
    site_id_storage      TEXT REFERENCES site(id),
    maint_site_id_equipment  TEXT REFERENCES site(id),

    -- Item details
    invnt_vendor_id          TEXT REFERENCES invnt_vendor(id),
    manufacturer             TEXT,
    seed_variety_id          TEXT REFERENCES grow_variety(id),
    seed_is_pelleted         BOOLEAN NOT NULL DEFAULT false,
    maint_part_type          TEXT,
    maint_part_number        TEXT,

    photos                   JSONB NOT NULL DEFAULT '[]',

    -- Status & audit
    is_active                BOOLEAN NOT NULL DEFAULT true,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by               TEXT,
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by               TEXT,

    CONSTRAINT uq_invnt_item UNIQUE (org_id, name)
);

CREATE INDEX idx_invnt_item_org_id ON invnt_item (org_id);
CREATE INDEX idx_invnt_item_vendor      ON invnt_item (invnt_vendor_id);
CREATE INDEX idx_invnt_item_category    ON invnt_item (invnt_category_id);
CREATE INDEX idx_invnt_item_subcategory ON invnt_item (invnt_subcategory_id);
CREATE INDEX idx_invnt_item_site_storage ON invnt_item (site_id_storage);
CREATE INDEX idx_invnt_item_maint_site_equipment ON invnt_item (maint_site_id_equipment);

COMMENT ON TABLE invnt_item IS 'Inventory items with three-unit system (burn, onhand, order), burn rates, reorder settings, and item details';
COMMENT ON COLUMN invnt_item.id IS 'Unique identifier for the inventory item';
COMMENT ON COLUMN invnt_item.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_item.farm_id IS 'Optional farm scope; NULL if item is shared across farms';
COMMENT ON COLUMN invnt_item.invnt_category_id IS 'Top-level category for item classification; references invnt_category rows where sub_category_name IS NULL';
COMMENT ON COLUMN invnt_item.invnt_subcategory_id IS 'Subcategory for finer item classification; references invnt_category rows where sub_category_name IS NOT NULL';
COMMENT ON COLUMN invnt_item.name IS 'Display name of the item, unique within the org';
COMMENT ON COLUMN invnt_item.accounting_id IS 'Identifier used to link this item to the accounting system';
COMMENT ON COLUMN invnt_item.description IS 'Detailed description of the item';
COMMENT ON COLUMN invnt_item.burn_uom IS 'Smallest consumption unit used for burn rate tracking (e.g. ml, g, seed)';
COMMENT ON COLUMN invnt_item.onhand_uom IS 'Unit used for physical stock counts (e.g. bottle, bag, box)';
COMMENT ON COLUMN invnt_item.order_uom IS 'Unit used when placing orders with vendors (e.g. case, pallet)';
COMMENT ON COLUMN invnt_item.burn_per_onhand IS 'Number of burn units in one onhand unit';
COMMENT ON COLUMN invnt_item.burn_per_order IS 'Number of burn units in one order unit';
COMMENT ON COLUMN invnt_item.is_palletized IS 'Whether this item is received and stored on pallets';
COMMENT ON COLUMN invnt_item.order_per_pallet IS 'Number of order units per pallet';
COMMENT ON COLUMN invnt_item.pallet_per_truckload IS 'Number of pallets per truckload';
COMMENT ON COLUMN invnt_item.is_frequently_used IS 'Flag for items that appear frequently in ordering and usage dashboards';
COMMENT ON COLUMN invnt_item.burn_per_week IS 'Estimated weekly consumption in burn units for reorder calculations';
COMMENT ON COLUMN invnt_item.cushion_weeks IS 'Safety stock buffer in weeks used in next-order-date calculations';
COMMENT ON COLUMN invnt_item.is_auto_reorder IS 'Whether automatic reorder requests are generated when stock hits reorder point';
COMMENT ON COLUMN invnt_item.reorder_point_in_burn IS 'Stock level in burn units that triggers a reorder';
COMMENT ON COLUMN invnt_item.reorder_quantity_in_burn IS 'Quantity in burn units to reorder when reorder point is reached';
COMMENT ON COLUMN invnt_item.requires_lot_tracking IS 'Whether deliveries and transactions must include a lot number';
COMMENT ON COLUMN invnt_item.requires_expiry_date IS 'Whether deliveries must include an expiry date';
COMMENT ON COLUMN invnt_item.site_id_storage IS 'Storage site where this item is kept; references site';
COMMENT ON COLUMN invnt_item.maint_site_id_equipment IS 'Equipment site this part belongs to; references site';
COMMENT ON COLUMN invnt_item.invnt_vendor_id IS 'Primary vendor for procurement';
COMMENT ON COLUMN invnt_item.manufacturer IS 'Manufacturer or brand name';
COMMENT ON COLUMN invnt_item.seed_variety_id IS 'Linked crop variety for seed items';
COMMENT ON COLUMN invnt_item.seed_is_pelleted IS 'Whether seed item is pelleted for easier planting';
COMMENT ON COLUMN invnt_item.maint_part_type IS 'Type classification for parts (e.g. electrical, mechanical, plumbing)';
COMMENT ON COLUMN invnt_item.maint_part_number IS 'Manufacturer part number or catalog SKU';
COMMENT ON COLUMN invnt_item.photos IS 'JSON array of photo URLs for the item';
COMMENT ON COLUMN invnt_item.is_active IS 'Soft delete flag; false hides the item from active use';
COMMENT ON COLUMN invnt_item.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN invnt_item.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN invnt_item.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_item.updated_by IS 'Email of the user who last updated the record';
