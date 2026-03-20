CREATE TABLE IF NOT EXISTS invnt_category (
    id                  TEXT PRIMARY KEY,
    org_id              TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    category_name       TEXT NOT NULL,
    sub_category_name   TEXT,
    is_deleted           BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT
);

CREATE INDEX idx_invnt_category_org_id ON invnt_category (org_id);

-- Partial unique indexes handle NULL sub_category_name correctly (NULL != NULL in standard UNIQUE constraints)
CREATE UNIQUE INDEX uq_invnt_category_top_level  ON invnt_category (org_id, category_name) WHERE sub_category_name IS NULL;
CREATE UNIQUE INDEX uq_invnt_category_sub_level   ON invnt_category (org_id, category_name, sub_category_name) WHERE sub_category_name IS NOT NULL;

COMMENT ON TABLE invnt_category IS 'Two-level category hierarchy for inventory items. A row with sub_category_name NULL is a top-level category. A row with sub_category_name set is a subcategory under that category_name. Query categories with WHERE sub_category_name IS NULL; query subcategories with WHERE category_name = :name AND sub_category_name IS NOT NULL.';
COMMENT ON COLUMN invnt_category.id IS 'Human-readable identifier derived from the name (lowercase trimmed)';
COMMENT ON COLUMN invnt_category.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_category.category_name IS 'Top-level category name (e.g. Fertilizers, Seeds, Packaging Materials)';
COMMENT ON COLUMN invnt_category.sub_category_name IS 'Subcategory name under the parent category; NULL when this row represents a top-level category';
COMMENT ON COLUMN invnt_category.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN invnt_category.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN invnt_category.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN invnt_category.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_category.updated_by IS 'Email of the user who last updated the record';
