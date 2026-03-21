CREATE TABLE IF NOT EXISTS ops_template_category (
    id          TEXT        PRIMARY KEY,
    org_id      TEXT        NOT NULL REFERENCES org(id),

    name        TEXT        NOT NULL,
    description TEXT,

    is_deleted   BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,

    CONSTRAINT uq_ops_template_category UNIQUE (org_id, name)
);

CREATE INDEX idx_ops_template_category_org_id ON ops_template_category (org_id);

COMMENT ON TABLE ops_template_category IS 'Org-defined categories for grouping checklist templates by module or purpose (e.g. pre_op, post_op, house_inspection).';
COMMENT ON COLUMN ops_template_category.id IS 'Human-readable identifier derived from name (trimmed lowercase)';
COMMENT ON COLUMN ops_template_category.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_template_category.name IS 'Category name, unique within the org (e.g. Pre-Op, Post-Op, House Inspection)';
COMMENT ON COLUMN ops_template_category.description IS 'Optional description of what this category covers';
COMMENT ON COLUMN ops_template_category.is_deleted IS 'Soft delete flag; false hides the category from active use';
COMMENT ON COLUMN ops_template_category.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_template_category.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_template_category.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_template_category.updated_by IS 'Email of the user who last updated the record';
