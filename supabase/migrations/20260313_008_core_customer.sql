CREATE TABLE IF NOT EXISTS sales_cust (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    cust_group_id   UUID REFERENCES sales_cust_group(id),
    fob_id          UUID REFERENCES fob(id),
    external_id     VARCHAR(50),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(100),
    cc_emails       JSONB NOT NULL DEFAULT '[]',
    billing_address TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES auth.users(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID REFERENCES auth.users(id),
    CONSTRAINT uq_sales_cust_org_name UNIQUE (org_id, name)
);

CREATE INDEX idx_sales_cust_org_id ON sales_cust (org_id);
