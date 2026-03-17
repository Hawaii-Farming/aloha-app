CREATE TABLE IF NOT EXISTS invnt_vendor (
    id             TEXT PRIMARY KEY,
    org_id         TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    name           VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email          VARCHAR(100),
    phone          VARCHAR(20),
    address        TEXT,
    payment_terms  VARCHAR(50),
    lead_time      NUMERIC,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by     UUID REFERENCES auth.users(id),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by     UUID REFERENCES auth.users(id),
    CONSTRAINT uq_invnt_vendor UNIQUE (org_id, name)
);

COMMENT ON TABLE invnt_vendor IS 'Org-level vendors for procurement; referenced by inventory items and orders for supplier tracking';
COMMENT ON COLUMN invnt_vendor.id IS 'Human-readable identifier derived from vendor name (lowercase trimmed)';
COMMENT ON COLUMN invnt_vendor.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_vendor.name IS 'Display name of the vendor, unique within the org';
COMMENT ON COLUMN invnt_vendor.contact_person IS 'Primary contact person at the vendor';
COMMENT ON COLUMN invnt_vendor.email IS 'Vendor email address';
COMMENT ON COLUMN invnt_vendor.phone IS 'Vendor phone number';
COMMENT ON COLUMN invnt_vendor.address IS 'Vendor physical address';
COMMENT ON COLUMN invnt_vendor.payment_terms IS 'Payment terms (e.g. Net 30, COD, Prepaid)';
COMMENT ON COLUMN invnt_vendor.lead_time IS 'Typical lead time in days from order to delivery';
COMMENT ON COLUMN invnt_vendor.is_active IS 'Soft delete flag; false hides the vendor from active use';
COMMENT ON COLUMN invnt_vendor.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN invnt_vendor.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN invnt_vendor.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_vendor.updated_by IS 'User who last updated the record, references auth.users(id)';
