CREATE TABLE IF NOT EXISTS sys_pest (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,
    is_deleted  BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_sys_pest UNIQUE (name)
);

COMMENT ON TABLE sys_pest IS 'System-wide pest catalog for scouting observations. Pests are biological facts shared across all organizations.';
