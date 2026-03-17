CREATE TABLE IF NOT EXISTS invnt_category (
    id         TEXT PRIMARY KEY,
    org_id     TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT uq_invnt_category UNIQUE (org_id, name)
);

CREATE INDEX idx_invnt_category_org_id ON invnt_category (org_id);

COMMENT ON TABLE invnt_category IS 'Top-level categories for organizing inventory items (e.g. Fertilizers, Seeds, Packaging Materials)';
COMMENT ON COLUMN invnt_category.id IS 'Human-readable identifier derived from category name (lowercase trimmed)';
COMMENT ON COLUMN invnt_category.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_category.name IS 'Display name of the category, unique within the org';
COMMENT ON COLUMN invnt_category.is_active IS 'Soft delete flag; false hides the category from active use';
COMMENT ON COLUMN invnt_category.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN invnt_category.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN invnt_category.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_category.updated_by IS 'User who last updated the record, references auth.users(id)';
