CREATE TABLE IF NOT EXISTS sales_product (
    id                         TEXT PRIMARY KEY,
    org_id                     TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                    TEXT NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    grade_id                   TEXT REFERENCES grow_grade(id),
    code                       TEXT NOT NULL,
    name                       TEXT NOT NULL,
    segment                    TEXT CHECK (segment IN ('wholesale', 'retail', 'food_service')),
    description                TEXT,
    pack_packaging_type_id     TEXT,    -- FK added via ALTER TABLE in pack_packaging_type migration

    -- Packaging hierarchy: item -> pack -> sale -> shipping
    item_uom                   TEXT REFERENCES util_uom(code),

    pack_uom                   TEXT REFERENCES util_uom(code),
    item_per_pack_uom         NUMERIC,

    sale_uom                   TEXT REFERENCES util_uom(code),
    pack_per_sale_uom         NUMERIC,

    shipping_uom               TEXT REFERENCES util_uom(code),
    max_sale_per_shipping_uom     NUMERIC,

    -- Net weights (all in weight_uom)
    pack_net_weight            NUMERIC,
    sale_net_weight            NUMERIC,
    shipping_net_weight        NUMERIC,
    weight_uom                 TEXT REFERENCES util_uom(code),

    -- Sale unit dimensions (all in dimension_uom)
    sale_uom_length            NUMERIC,
    sale_uom_width             NUMERIC,
    sale_uom_height            NUMERIC,
    dimension_uom              TEXT REFERENCES util_uom(code),

    -- Storage & shelf life
    manufacture_storage_method TEXT,
    minimum_storage_temperature NUMERIC,
    maximum_storage_temperature NUMERIC,
    temperature_uom            TEXT REFERENCES util_uom(code),
    shelf_life_days            INT,

    -- Shipping
    shipping_ti                NUMERIC,
    shipping_hi                NUMERIC,
    shipping_requirements      TEXT,

    -- Flags
    is_catch_weight            BOOLEAN NOT NULL DEFAULT false,
    is_hazardous               BOOLEAN NOT NULL DEFAULT false,
    is_fsma_traceable          BOOLEAN NOT NULL DEFAULT false,

    -- Identification
    gtin                       TEXT,
    upc                        TEXT,

    -- Display & status
    photos                     JSONB NOT NULL DEFAULT '[]',
    display_order              INT         NOT NULL DEFAULT 0,
    is_active                  BOOLEAN NOT NULL DEFAULT true,

    -- Audit
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                 TEXT,
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                 TEXT,

    CONSTRAINT uq_sales_product_code UNIQUE (farm_id, code),
    CONSTRAINT uq_sales_product_name UNIQUE (farm_id, name)
);

CREATE INDEX idx_sales_product_farm_id ON sales_product (farm_id);

COMMENT ON TABLE sales_product IS 'Sellable products with full packaging hierarchy (item -> pack -> sale -> shipping), unit conversions, weights, storage requirements, and product identification';
COMMENT ON COLUMN sales_product.id IS 'Human-readable identifier derived from product name (lowercase trimmed)';
COMMENT ON COLUMN sales_product.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_product.farm_id IS 'Farm (crop line) this product belongs to';
COMMENT ON COLUMN sales_product.grade_id IS 'Harvest quality grade for this product';
COMMENT ON COLUMN sales_product.code IS 'Short product code, unique within the farm';
COMMENT ON COLUMN sales_product.name IS 'Full display name of the product, unique within the farm';
COMMENT ON COLUMN sales_product.segment IS 'Market segment: wholesale, retail, or food_service';
COMMENT ON COLUMN sales_product.description IS 'Product description for catalogs and labels';
COMMENT ON COLUMN sales_product.pack_packaging_type_id IS 'Packaging type for this product; FK to org-defined pack_packaging_type lookup; FK added via ALTER TABLE in pack_packaging_type migration';
COMMENT ON COLUMN sales_product.item_uom IS 'Unit of measure for the individual product item (e.g. each, head)';
COMMENT ON COLUMN sales_product.pack_uom IS 'Unit of measure for the consumer pack level (e.g. bag, clamshell)';
COMMENT ON COLUMN sales_product.item_per_pack_uom IS 'Number of items per pack';
COMMENT ON COLUMN sales_product.sale_uom IS 'Unit of measure for the sale level (e.g. case, box)';
COMMENT ON COLUMN sales_product.pack_per_sale_uom IS 'Number of packs per sale unit';
COMMENT ON COLUMN sales_product.shipping_uom IS 'Unit of measure for the shipping level (e.g. pallet)';
COMMENT ON COLUMN sales_product.max_sale_per_shipping_uom IS 'Maximum number of sale units the shipping unit can physically hold beyond the standard TI x HI configuration';
COMMENT ON COLUMN sales_product.pack_net_weight IS 'Net weight of one pack in weight_uom';
COMMENT ON COLUMN sales_product.sale_net_weight IS 'Net weight of one sale unit in weight_uom';
COMMENT ON COLUMN sales_product.shipping_net_weight IS 'Net weight of one full shipping unit in weight_uom';
COMMENT ON COLUMN sales_product.weight_uom IS 'Unit of measure for all net weight values on this product (e.g. lb, kg)';
COMMENT ON COLUMN sales_product.sale_uom_length IS 'Length of the sale unit in dimension_uom';
COMMENT ON COLUMN sales_product.sale_uom_width IS 'Width of the sale unit in dimension_uom';
COMMENT ON COLUMN sales_product.sale_uom_height IS 'Height of the sale unit in dimension_uom';
COMMENT ON COLUMN sales_product.dimension_uom IS 'Unit of measure for all dimension values on this product (e.g. in, cm)';
COMMENT ON COLUMN sales_product.manufacture_storage_method IS 'How the product should be stored (e.g. refrigerated, frozen, ambient)';
COMMENT ON COLUMN sales_product.minimum_storage_temperature IS 'Minimum storage temperature in temperature_uom';
COMMENT ON COLUMN sales_product.maximum_storage_temperature IS 'Maximum storage temperature in temperature_uom';
COMMENT ON COLUMN sales_product.temperature_uom IS 'Unit of measure for storage temperature values (e.g. F, C)';
COMMENT ON COLUMN sales_product.shelf_life_days IS 'Product shelf life in days from date of manufacture';
COMMENT ON COLUMN sales_product.shipping_ti IS 'TI — number of sale units per layer on the shipping unit';
COMMENT ON COLUMN sales_product.shipping_hi IS 'HI — number of layers stacked on the shipping unit';
COMMENT ON COLUMN sales_product.shipping_requirements IS 'Special shipping instructions (e.g. temperature range, handling notes)';
COMMENT ON COLUMN sales_product.is_catch_weight IS 'Whether this product is sold by actual weight rather than fixed weight';
COMMENT ON COLUMN sales_product.is_hazardous IS 'Whether this product is classified as hazardous material';
COMMENT ON COLUMN sales_product.is_fsma_traceable IS 'Whether this product is on the FDA FSMA 204 Food Traceability List';
COMMENT ON COLUMN sales_product.gtin IS 'Global Trade Item Number (up to 14 digits)';
COMMENT ON COLUMN sales_product.upc IS 'Universal Product Code (up to 12 digits)';
COMMENT ON COLUMN sales_product.photos IS 'JSON array of photo URLs for the product';
COMMENT ON COLUMN sales_product.display_order IS 'Sort order for UI display within the farm';
COMMENT ON COLUMN sales_product.is_active IS 'Soft delete flag; false hides the product from active use';
COMMENT ON COLUMN sales_product.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_product.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_product.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_product.updated_by IS 'Email of the user who last updated the record';
