CREATE TABLE IF NOT EXISTS grow_grade (
    id         TEXT PRIMARY KEY,
    org_id     TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id    TEXT NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    code       TEXT NOT NULL,
    name       TEXT NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT,
    CONSTRAINT uq_grow_grade_code UNIQUE (farm_id, code),
    CONSTRAINT uq_grow_grade_name UNIQUE (farm_id, name)
);

COMMENT ON TABLE grow_grade IS 'Harvest quality grades for a farm, identified by short codes (e.g. A for Grade A)';
COMMENT ON COLUMN grow_grade.id IS 'Human-readable identifier derived from grade name (lowercase trimmed)';
COMMENT ON COLUMN grow_grade.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN grow_grade.farm_id IS 'Farm this grade belongs to';
COMMENT ON COLUMN grow_grade.code IS 'Short code for the grade, unique within the farm (e.g. A, B, C)';
COMMENT ON COLUMN grow_grade.name IS 'Full display name of the grade, unique within the farm';
COMMENT ON COLUMN grow_grade.is_active IS 'Soft delete flag; false hides the grade from active use';
COMMENT ON COLUMN grow_grade.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN grow_grade.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN grow_grade.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN grow_grade.updated_by IS 'Email of the user who last updated the record';
