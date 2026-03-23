CREATE TABLE IF NOT EXISTS system_sub_module (
    id                TEXT PRIMARY KEY,
    system_module_id  TEXT NOT NULL REFERENCES system_module(id),
    name              TEXT NOT NULL,
    description       TEXT,
    system_access_level_id  TEXT NOT NULL REFERENCES system_access_level(id),
    display_order     INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        TEXT,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by        TEXT,
    is_deleted        BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_system_sub_module UNIQUE (system_module_id, name)
);

COMMENT ON TABLE system_sub_module IS 'System-level lookup defining sub-modules within each module. system_access_level_id determines the minimum employee access level required to see this sub-module.';

COMMENT ON COLUMN system_sub_module.system_access_level_id IS 'Minimum access level required to view this sub-module; references system_access_level';
