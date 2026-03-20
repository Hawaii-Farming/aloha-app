CREATE TABLE IF NOT EXISTS sales_customer (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    sales_customer_group_id   TEXT REFERENCES sales_customer_group(id),
    sales_fob_id          TEXT REFERENCES sales_fob(id),
    accounting_id     TEXT,
    name            TEXT NOT NULL,
    email           TEXT,
    cc_emails       JSONB NOT NULL DEFAULT '[]',
    billing_address TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    CONSTRAINT uq_sales_customer_org_name UNIQUE (org_id, name)
);

CREATE INDEX idx_sales_customer_org_id ON sales_customer (org_id);

COMMENT ON TABLE sales_customer IS 'Org customers with group classification, FOB preference, billing details, and external accounting link';
COMMENT ON COLUMN sales_customer.id IS 'Human-readable identifier derived from customer name (lowercase trimmed)';
COMMENT ON COLUMN sales_customer.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_customer.sales_customer_group_id IS 'Customer group for reporting and group-level pricing';
COMMENT ON COLUMN sales_customer.sales_fob_id IS 'Default FOB delivery point for this customer';
COMMENT ON COLUMN sales_customer.accounting_id IS 'External accounting system identifier for integration';
COMMENT ON COLUMN sales_customer.name IS 'Display name of the customer, unique within the org';
COMMENT ON COLUMN sales_customer.email IS 'Primary email address for the customer';
COMMENT ON COLUMN sales_customer.cc_emails IS 'JSON array of additional email addresses to CC on communications';
COMMENT ON COLUMN sales_customer.billing_address IS 'Billing address for invoicing';
COMMENT ON COLUMN sales_customer.is_active IS 'Soft delete flag; false hides the customer from active use';
COMMENT ON COLUMN sales_customer.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_customer.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_customer.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_customer.updated_by IS 'Email of the user who last updated the record';
