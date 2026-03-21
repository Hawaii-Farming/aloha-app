CREATE TABLE IF NOT EXISTS sales_customer (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),
    sales_customer_group_id   TEXT REFERENCES sales_customer_group(id),
    sales_fob_id          TEXT REFERENCES sales_fob(id),
    accounting_id     TEXT,
    name            TEXT NOT NULL,
    email           TEXT,
    cc_emails       JSONB NOT NULL DEFAULT '[]',
    billing_address TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_sales_customer_org_name UNIQUE (org_id, name)
);

COMMENT ON TABLE sales_customer IS 'Stores an organization''s customers with their group classification, preferred delivery method, billing address, and a link to external accounting software via accounting_id. Additional contact emails are stored in cc_emails.';

CREATE INDEX idx_sales_customer_org_id ON sales_customer (org_id);

COMMENT ON COLUMN sales_customer.sales_customer_group_id IS 'Customer group for reporting and group-level pricing';
COMMENT ON COLUMN sales_customer.sales_fob_id IS 'Default FOB delivery point for this customer';
COMMENT ON COLUMN sales_customer.accounting_id IS 'External accounting system identifier for integration';
