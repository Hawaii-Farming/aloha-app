CREATE TABLE IF NOT EXISTS farm_product (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    farm_id                     UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    grade_id                    UUID REFERENCES farm_grade(id),
    code                        VARCHAR(20) NOT NULL,
    name                        VARCHAR(100) NOT NULL,

    weight_unit_id              UUID REFERENCES unit_of_measure(id),
    product_item_unit_id        UUID REFERENCES unit_of_measure(id),

    pack_unit_id                UUID REFERENCES unit_of_measure(id),
    product_item_per_pack_unit  NUMERIC,
    pack_unit_net_weight        NUMERIC,

    sale_unit_id                UUID REFERENCES unit_of_measure(id),
    pack_per_sale_unit          NUMERIC,
    sale_unit_net_weight        NUMERIC,
    minimum_order_quantity      NUMERIC,
    is_catch_weight             BOOLEAN NOT NULL DEFAULT false,

    shipping_unit_id            UUID REFERENCES unit_of_measure(id),
    sale_per_shipping_unit_max  NUMERIC,
    shipping_unit_net_weight    NUMERIC,
    shipping_unit_ti            NUMERIC,
    shipping_unit_hi            NUMERIC,

    metadata                    JSONB NOT NULL DEFAULT '{}',

    display_order               INT,
    is_active                   BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  UUID REFERENCES profile(id),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  UUID REFERENCES profile(id),

    CONSTRAINT uq_farm_product_code UNIQUE (farm_id, code),
    CONSTRAINT uq_farm_product_name UNIQUE (farm_id, name)
);

CREATE INDEX idx_farm_product_farm_id ON farm_product (farm_id);
