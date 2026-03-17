CREATE TABLE IF NOT EXISTS invnt_subcategory (
    id          TEXT PRIMARY KEY,
    org_id      TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES invnt_category(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  UUID REFERENCES auth.users(id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  UUID REFERENCES auth.users(id),
    CONSTRAINT uq_invnt_subcategory UNIQUE (category_id, name)
);

CREATE INDEX idx_invnt_subcategory_category_id ON invnt_subcategory (category_id);
CREATE INDEX idx_invnt_subcategory_org_id ON invnt_subcategory (org_id);

COMMENT ON TABLE invnt_subcategory IS 'Second-level categories under invnt_category for finer inventory item classification (e.g. Nitrogen Fertilizers under Fertilizers)';
COMMENT ON COLUMN invnt_subcategory.id IS 'Human-readable identifier derived from subcategory name (lowercase trimmed)';
COMMENT ON COLUMN invnt_subcategory.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_subcategory.category_id IS 'Parent main category this subcategory belongs to';
COMMENT ON COLUMN invnt_subcategory.name IS 'Display name of the subcategory, unique within its parent category';
COMMENT ON COLUMN invnt_subcategory.is_active IS 'Soft delete flag; false hides the subcategory from active use';
COMMENT ON COLUMN invnt_subcategory.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN invnt_subcategory.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN invnt_subcategory.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_subcategory.updated_by IS 'User who last updated the record, references auth.users(id)';
