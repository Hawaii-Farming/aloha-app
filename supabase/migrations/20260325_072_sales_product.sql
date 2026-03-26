CREATE TABLE IF NOT EXISTS sales_product (
    id                         TEXT PRIMARY KEY,
    org_id                     TEXT NOT NULL REFERENCES org(id),
    farm_id                    TEXT NOT NULL REFERENCES org_farm(id),
    grow_grade_id                   TEXT REFERENCES grow_grade(id),
    code                       TEXT NOT NULL,
    name                       TEXT NOT NULL,
    segment                    TEXT CHECK (segment IN ('wholesale', 'retail', 'food_service')),
    description                TEXT,
    invnt_item_id              TEXT REFERENCES invnt_item(id),

    -- Packaging hierarchy: item -> pack -> sale -> shipping
    item_uom                   TEXT REFERENCES sys_uom(code),

    pack_uom                   TEXT REFERENCES sys_uom(code),
    item_per_pack         NUMERIC,

    pack_per_case              NUMERIC,

    maximum_case_per_pallet        NUMERIC,

    -- Net weights (all in weight_uom)
    pack_net_weight            NUMERIC,
    case_net_weight            NUMERIC,
    pallet_net_weight          NUMERIC,
    weight_uom                 TEXT REFERENCES sys_uom(code),

    -- Case dimensions (all in dimension_uom)
    case_length                NUMERIC,
    case_width                 NUMERIC,
    case_height                NUMERIC,
    dimension_uom              TEXT REFERENCES sys_uom(code),

    -- Storage & shelf life
    manufacturer_storage_method TEXT,
    minimum_storage_temperature NUMERIC,
    maximum_storage_temperature NUMERIC,
    temperature_uom            TEXT REFERENCES sys_uom(code),
    shelf_life_days            INT,

    -- Pallet
    pallet_ti                  NUMERIC,
    pallet_hi                  NUMERIC,
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

COMMENT ON TABLE sales_product IS 'The sellable products from each farm. Combines a grade with a full packaging hierarchy (item → pack → case → pallet). The sale unit is always a case; the shipping unit is always a pallet.';

CREATE INDEX idx_sales_product_farm_id ON sales_product (farm_id);

COMMENT ON COLUMN sales_product.segment IS 'wholesale, retail, food_service';
