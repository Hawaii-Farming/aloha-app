CREATE TABLE IF NOT EXISTS sales_customer_group (
    id         TEXT PRIMARY KEY,
    org_id     TEXT NOT NULL REFERENCES org(id),
    name       TEXT NOT NULL,
    is_deleted  BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT,
    CONSTRAINT uq_sales_customer_group UNIQUE (org_id, name)
);

COMMENT ON TABLE sales_customer_group IS 'Org-specific customer classifications used for group pricing and reporting (e.g. Costco, AP, Sams)';
COMMENT ON COLUMN sales_customer_group.id IS 'Human-readable identifier derived from group name (lowercase trimmed)';
COMMENT ON COLUMN sales_customer_group.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_customer_group.name IS 'Display name of the customer group, unique within the org';
COMMENT ON COLUMN sales_customer_group.is_deleted IS 'Soft delete flag; false hides the customer group from active use';
COMMENT ON COLUMN sales_customer_group.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_customer_group.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_customer_group.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_customer_group.updated_by IS 'Email of the user who last updated the record';
