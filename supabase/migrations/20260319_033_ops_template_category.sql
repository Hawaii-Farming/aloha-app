CREATE TABLE IF NOT EXISTS ops_template_category (
    id          TEXT        PRIMARY KEY,
    org_id      TEXT        NOT NULL REFERENCES org(id),

    name        TEXT        NOT NULL,
    description TEXT,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,
    is_deleted   BOOLEAN     NOT NULL DEFAULT false,

    CONSTRAINT uq_ops_template_category UNIQUE (org_id, name)
);

COMMENT ON TABLE ops_template_category IS 'Org-defined categories for grouping checklist templates by module or purpose. Users create categories like Pre-Op, Post-Op, or House Inspection and assign them to templates.';

CREATE INDEX idx_ops_template_category_org_id ON ops_template_category (org_id);

