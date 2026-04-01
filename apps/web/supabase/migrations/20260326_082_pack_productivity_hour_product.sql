CREATE TABLE IF NOT EXISTS pack_productivity_hour_product (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                          TEXT NOT NULL REFERENCES org(id),
    farm_id                         TEXT NOT NULL REFERENCES org_farm(id),
    pack_productivity_hour_id       TEXT NOT NULL REFERENCES pack_productivity_hour(id),
    sales_product_id                TEXT NOT NULL REFERENCES sales_product(id),
    cases_packed                    INTEGER NOT NULL DEFAULT 0,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                      TEXT,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                      TEXT,
    is_deleted                      BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE pack_productivity_hour_product IS 'Cases packed per product per hour (delta, not cumulative). Derived metrics: trays = cases_packed × sales_product.pack_per_case, pounds = cases_packed × sales_product.case_net_weight.';

COMMENT ON COLUMN pack_productivity_hour_product.cases_packed IS 'Number of cases packed THIS hour for this product (delta, not cumulative)';

CREATE INDEX idx_pack_prod_hour_product_hour ON pack_productivity_hour_product (pack_productivity_hour_id);
CREATE INDEX idx_pack_prod_hour_product_product ON pack_productivity_hour_product (sales_product_id);
CREATE UNIQUE INDEX uq_pack_prod_hour_product ON pack_productivity_hour_product (pack_productivity_hour_id, sales_product_id);
