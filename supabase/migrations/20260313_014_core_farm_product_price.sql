CREATE TABLE IF NOT EXISTS farm_product_price (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id             UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    product_id         UUID NOT NULL REFERENCES farm_product(id) ON DELETE CASCADE,
    delivery_method_id UUID NOT NULL REFERENCES delivery_method(id),
    customer_id        UUID REFERENCES customer(id),
    customer_group_id  UUID REFERENCES customer_group(id),
    price              NUMERIC NOT NULL,
    effective_from     DATE NOT NULL,
    effective_to       DATE,
    is_active          BOOLEAN NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by         UUID REFERENCES profile(id),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by         UUID REFERENCES profile(id)
);

CREATE INDEX idx_farm_product_price_lookup ON farm_product_price (product_id, delivery_method_id, effective_from);

CREATE INDEX idx_farm_product_price_org_id ON farm_product_price (org_id);
