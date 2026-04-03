CREATE TABLE IF NOT EXISTS sales_crm_external_product (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_name       TEXT NOT NULL,
    farm_location   TEXT,
    variety         TEXT NOT NULL,
    size            TEXT,
    size_uom        TEXT REFERENCES sys_uom(code),
    packaging       TEXT,
    is_organic      BOOLEAN NOT NULL DEFAULT false,
    display_order   INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_sales_crm_external_product UNIQUE (org_id, farm_name, variety, size, packaging)
);

COMMENT ON TABLE sales_crm_external_product IS 'Competitor products observed during store visits. Combines farm/brand identity with product details for market intelligence tracking.';

COMMENT ON COLUMN sales_crm_external_product.farm_name IS 'Competitor brand or farm name (e.g. Sensei, Nalo, Earthbound Farm)';
COMMENT ON COLUMN sales_crm_external_product.farm_location IS 'Origin of the competitor farm (e.g. HI, CA, Mexico)';

CREATE INDEX idx_sales_crm_ext_product_org ON sales_crm_external_product (org_id);
