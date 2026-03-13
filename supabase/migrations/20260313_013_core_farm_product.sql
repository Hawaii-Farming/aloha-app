-- ============================================
-- Migration: 20260313_013_core_farm_product
-- Description: Farm products with packaging hierarchy for inventory math
-- ============================================
-- TODO (Inventory Module): Replace pack_inventory_item_ids and sale_inventory_item_ids
-- with a junction table (farm_product_inventory_item) once the inventory module is built.
-- This will provide proper FKs and cleaner queries for inventory transactions.

CREATE TABLE IF NOT EXISTS farm_product (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    farm_id                     UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    grade_id                    UUID REFERENCES farm_grade(id),
    code                        VARCHAR(20) NOT NULL,
    name                        VARCHAR(100) NOT NULL,

    -- CONTENT LEVEL: What goes in the pack (fruits, pounds, pieces)
    weight_unit_id              UUID REFERENCES unit_of_measure(id),
    product_item_unit_id        UUID REFERENCES unit_of_measure(id),

    -- PACK LEVEL: Consumer unit (bag, tray, piece, bunch, clamshell)
    pack_unit_id                UUID REFERENCES unit_of_measure(id),
    product_item_per_pack_unit  NUMERIC,
    pack_unit_net_weight        NUMERIC,

    -- SALE LEVEL: Primary selling unit (case, tray, box, each, bunch)
    sale_unit_id                UUID REFERENCES unit_of_measure(id),
    pack_per_sale_unit          NUMERIC,
    sale_unit_net_weight        NUMERIC,
    minimum_order_quantity      NUMERIC,
    is_catch_weight             BOOLEAN NOT NULL DEFAULT false,

    -- SHIPPING LEVEL: Bulk distribution (pallet, crate, slip sheet)
    shipping_unit_id            UUID REFERENCES unit_of_measure(id),
    sale_per_shipping_unit_max  NUMERIC,
    shipping_unit_net_weight    NUMERIC,
    shipping_unit_ti            NUMERIC,
    shipping_unit_hi            NUMERIC,

    -- Flexible fields: description, segment, manufacturer, gtin, upc, packaging_type,
    -- dimensions, photos, spec sheet, shipping requirements, export tracking
    metadata                    JSONB NOT NULL DEFAULT '{}',

    display_order               INT,
    is_active                   BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT uq_farm_product_code UNIQUE (farm_id, code),
    CONSTRAINT uq_farm_product_name UNIQUE (farm_id, name)
);

-- Index for looking up products by farm
CREATE INDEX idx_farm_product_farm_id ON farm_product (farm_id);
