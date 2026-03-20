CREATE TABLE IF NOT EXISTS sales_fob (
    id         TEXT PRIMARY KEY,
    org_id     TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT,
    CONSTRAINT uq_sales_fob UNIQUE (org_id, name)
);

COMMENT ON TABLE sales_fob IS 'Org-specific FOB (Freight On Board) delivery points that determine pricing and shipping responsibility (e.g. Farm Pick-up, Local Delivery)';
COMMENT ON COLUMN sales_fob.id IS 'Human-readable identifier derived from FOB name (lowercase trimmed)';
COMMENT ON COLUMN sales_fob.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_fob.name IS 'Display name of the FOB point, unique within the org';
COMMENT ON COLUMN sales_fob.is_active IS 'Soft delete flag; false hides the FOB point from active use';
COMMENT ON COLUMN sales_fob.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_fob.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_fob.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_fob.updated_by IS 'Email of the user who last updated the record';
