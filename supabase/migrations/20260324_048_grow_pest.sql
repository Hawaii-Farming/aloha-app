CREATE TABLE IF NOT EXISTS grow_pest (
    id          TEXT PRIMARY KEY,
    org_id      TEXT NOT NULL REFERENCES org(id),
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,
    is_deleted  BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_grow_pest UNIQUE (org_id, name)
);

COMMENT ON TABLE grow_pest IS 'Standardized pest names for scouting observations. Org-scoped.';
