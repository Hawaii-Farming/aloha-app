CREATE TABLE IF NOT EXISTS sales_product (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                     UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    grade_id                    UUID REFERENCES grow_grade(id),
    code                        VARCHAR(20) NOT NULL,
    name                        VARCHAR(100) NOT NULL,

    weight_unit_id              VARCHAR(10) REFERENCES unit_of_measure(code),
    product_item_unit_id        VARCHAR(10) REFERENCES unit_of_measure(code),

    pack_unit_id                VARCHAR(10) REFERENCES unit_of_measure(code),
    product_item_per_pack_unit  NUMERIC,
    pack_unit_net_weight        NUMERIC,

    sale_unit_id                VARCHAR(10) REFERENCES unit_of_measure(code),
    pack_per_sale_unit          NUMERIC,
    sale_unit_net_weight        NUMERIC,
    minimum_order_quantity      NUMERIC,
    is_catch_weight             BOOLEAN NOT NULL DEFAULT false,

    shipping_unit_id            VARCHAR(10) REFERENCES unit_of_measure(code),
    sale_per_shipping_unit_max  NUMERIC,
    shipping_unit_net_weight    NUMERIC,
    shipping_unit_ti            NUMERIC,
    shipping_unit_hi            NUMERIC,

    metadata                    JSONB NOT NULL DEFAULT '{}',

    display_order               INT,
    is_active                   BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  UUID REFERENCES auth.users(id),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  UUID REFERENCES auth.users(id),

    CONSTRAINT uq_sales_product_code UNIQUE (farm_id, code),
    CONSTRAINT uq_sales_product_name UNIQUE (farm_id, name)
);

CREATE INDEX idx_sales_product_farm_id ON sales_product (farm_id);
