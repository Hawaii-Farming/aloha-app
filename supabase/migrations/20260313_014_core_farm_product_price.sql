CREATE TABLE IF NOT EXISTS sales_product_price (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    product_id     UUID NOT NULL REFERENCES sales_product(id),
    fob_id         UUID NOT NULL REFERENCES fob(id),
    cust_id        UUID REFERENCES sales_cust(id),
    cust_group_id  UUID REFERENCES sales_cust_group(id),
    price          NUMERIC NOT NULL,
    effective_from DATE NOT NULL,
    effective_to   DATE,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by     UUID REFERENCES auth.users(id),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by     UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_sales_product_price_lookup ON sales_product_price (product_id, fob_id);

CREATE INDEX idx_sales_product_price_org ON sales_product_price (org_id);
