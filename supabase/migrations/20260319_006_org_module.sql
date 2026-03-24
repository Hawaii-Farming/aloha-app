CREATE TABLE IF NOT EXISTS org_module (
    id                TEXT PRIMARY KEY,
    org_id            TEXT NOT NULL REFERENCES org(id),
    sys_module_id  TEXT NOT NULL REFERENCES sys_module(id),
    display_name      TEXT NOT NULL,
    display_order     INTEGER NOT NULL DEFAULT 0,
    is_enabled        BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        TEXT,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by        TEXT,
    is_deleted        BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_org_module UNIQUE (org_id, sys_module_id)
);

COMMENT ON TABLE org_module IS 'Org-scoped copy of system modules. Seeded when a new org is created. Org admins toggle is_enabled to control which modules are available to their users.';

CREATE INDEX idx_org_module_org ON org_module (org_id);
