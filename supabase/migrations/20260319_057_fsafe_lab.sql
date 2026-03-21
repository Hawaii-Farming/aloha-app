CREATE TABLE IF NOT EXISTS fsafe_lab (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES org(id),

    name            TEXT NOT NULL,
    description     TEXT,

    is_deleted       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,

    CONSTRAINT uq_fsafe_lab UNIQUE (org_id, name)
);

CREATE INDEX idx_fsafe_lab_org ON fsafe_lab (org_id);

COMMENT ON TABLE fsafe_lab IS 'Catalog of laboratories used for food safety test submissions (e.g. test-and-hold pathogen testing).';
COMMENT ON COLUMN fsafe_lab.id IS 'Human-readable unique identifier derived from org and lab name';
COMMENT ON COLUMN fsafe_lab.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_lab.name IS 'Display name of the laboratory';
COMMENT ON COLUMN fsafe_lab.description IS 'Optional description of the laboratory and services offered';
COMMENT ON COLUMN fsafe_lab.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN fsafe_lab.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_lab.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_lab.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_lab.updated_by IS 'Email of the user who last updated the record';
