CREATE TABLE IF NOT EXISTS org (
    id         TEXT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    slug       VARCHAR(100) NOT NULL,
    address    TEXT,
    currency   VARCHAR(10),
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT uq_org_name UNIQUE (name),
    CONSTRAINT uq_org_slug UNIQUE (slug)
);

COMMENT ON TABLE org IS 'Root entity for multi-organization support; every org-scoped table references org.id for RLS filtering';
COMMENT ON COLUMN org.id IS 'Human-readable identifier derived from org name (lowercase, spaces replaced with underscores)';
COMMENT ON COLUMN org.name IS 'Display name of the organization';
COMMENT ON COLUMN org.slug IS 'Short initials derived from the organization name (e.g. HF for Hawaii Farming)';
COMMENT ON COLUMN org.address IS 'Physical address of the organization';
COMMENT ON COLUMN org.currency IS 'Default currency code for the organization (e.g. USD, KES)';
COMMENT ON COLUMN org.is_active IS 'Soft delete flag; false hides the organization from active use';
COMMENT ON COLUMN org.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN org.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN org.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN org.updated_by IS 'User who last updated the record, references auth.users(id)';
