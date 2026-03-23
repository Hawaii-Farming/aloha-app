CREATE TABLE IF NOT EXISTS sales_product (
    id                         TEXT PRIMARY KEY,
    org_id                     TEXT NOT NULL REFERENCES org(id),
    farm_id                    TEXT NOT NULL REFERENCES org_farm(id),
    grow_grade_id                   TEXT REFERENCES grow_grade(id),
    code                       TEXT NOT NULL,
    name                       TEXT NOT NULL,
    segment                    TEXT CHECK (segment IN ('wholesale', 'retail', 'food_service')),
    description                TEXT,
    pack_packaging_type_id     TEXT REFERENCES pack_packaging_type(id),

    -- Packaging hierarchy: item -> pack -> sale -> shipping
    item_uom                   TEXT REFERENCES org_uom(code),

    pack_uom                   TEXT REFERENCES org_uom(code),
    item_per_pack_uom         NUMERIC,

    sale_uom                   TEXT REFERENCES org_uom(code),
    pack_per_sale_uom         NUMERIC,

    shipping_uom               TEXT REFERENCES org_uom(code),
    max_sale_per_shipping_uom     NUMERIC,

    -- Net weights (all in weight_uom)
    pack_net_weight            NUMERIC,
    sale_net_weight            NUMERIC,
    shipping_net_weight        NUMERIC,
    weight_uom                 TEXT REFERENCES org_uom(code),

    -- Sale unit dimensions (all in dimension_uom)
    sale_uom_length            NUMERIC,
    sale_uom_width             NUMERIC,
    sale_uom_height            NUMERIC,
    dimension_uom              TEXT REFERENCES org_uom(code),

    -- Storage & shelf life
    manufacture_storage_method TEXT,
    minimum_storage_temperature NUMERIC,
    maximum_storage_temperature NUMERIC,
    temperature_uom            TEXT REFERENCES org_uom(code),
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

    -- Audit
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                 TEXT,
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                 TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT uq_sales_product_code UNIQUE (farm_id, code),
    CONSTRAINT uq_sales_product_name UNIQUE (farm_id, name)
);

COMMENT ON TABLE sales_product IS 'The sellable products from each farm. Combines a grade with a full packaging hierarchy (item, pack, sale, shipping) that drives inventory calculations.';

CREATE INDEX idx_sales_product_farm_id ON sales_product (farm_id);

COMMENT ON COLUMN sales_product.segment IS 'Market segment: wholesale, retail, or food_service';
COMMENT ON COLUMN sales_product.max_sale_per_shipping_uom IS 'Maximum sale units the shipping unit can hold beyond the standard TI x HI configuration';
COMMENT ON COLUMN sales_product.shipping_ti IS 'TI — number of sale units per layer on the shipping unit';
COMMENT ON COLUMN sales_product.shipping_hi IS 'HI — number of layers stacked on the shipping unit';
COMMENT ON COLUMN sales_product.is_catch_weight IS 'Whether this product is sold by actual weight rather than fixed weight';
COMMENT ON COLUMN sales_product.is_fsma_traceable IS 'Whether this product is on the FDA FSMA 204 Food Traceability List';
COMMENT ON COLUMN sales_product.display_order IS 'Sort order for UI display within the farm';
