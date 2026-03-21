CREATE TABLE IF NOT EXISTS org (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    slug       TEXT NOT NULL,
    address    TEXT,
    currency   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT,
    is_deleted  BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_org_name UNIQUE (name),
    CONSTRAINT uq_org_slug UNIQUE (slug)
);

COMMENT ON TABLE org IS 'Root entity for multi-org support. Every org-scoped table references this. Stores org-level settings such as default currency.';

COMMENT ON COLUMN org.slug IS 'Short initials derived from the organization name (e.g. HF for Hawaii Farming)';
COMMENT ON COLUMN org.currency IS 'Default currency code for the organization (e.g. USD, KES)';
