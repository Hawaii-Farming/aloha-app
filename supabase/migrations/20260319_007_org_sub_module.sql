CREATE TABLE IF NOT EXISTS org_sub_module (
    id                    TEXT PRIMARY KEY,
    org_id                TEXT NOT NULL REFERENCES org(id),
    system_module_id         TEXT NOT NULL REFERENCES system_module(id),
    system_sub_module_id  TEXT NOT NULL REFERENCES system_sub_module(id),
    system_access_level_id TEXT NOT NULL REFERENCES system_access_level(id),
    display_name          TEXT NOT NULL,
    display_order         INTEGER NOT NULL DEFAULT 0,
    is_enabled            BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by            TEXT,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by            TEXT,
    is_deleted            BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_org_sub_module UNIQUE (org_id, system_module_id, system_sub_module_id)
);

COMMENT ON TABLE org_sub_module IS 'Org-scoped copy of system sub-modules. Seeded when a new org is created. Org admins toggle is_enabled to control which sub-modules are available within each enabled module.';

CREATE INDEX idx_org_sub_module_org ON org_sub_module (org_id);
CREATE INDEX idx_org_sub_module_module ON org_sub_module (system_module_id);
