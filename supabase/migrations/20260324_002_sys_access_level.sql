CREATE TABLE IF NOT EXISTS sys_access_level (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    level         INTEGER NOT NULL UNIQUE,
    description   TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    TEXT,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by    TEXT,
    is_deleted    BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_sys_access_level_name UNIQUE (name)
);

COMMENT ON TABLE sys_access_level IS 'System-level lookup defining the access levels available for employee roles. The level integer is used to compare against sys_sub_module.min_access_level for visibility control.';

COMMENT ON COLUMN sys_access_level.level IS 'Numeric rank used for access comparisons: higher number = more access (e.g. employee=1, team_lead=2, manager=3, owner=5)';
