CREATE TABLE IF NOT EXISTS hr_training (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id         TEXT REFERENCES farm(id),

    training_type   TEXT,
    training_date   DATE,
    topics_covered  JSONB NOT NULL DEFAULT '[]',
    trainer_names   JSONB NOT NULL DEFAULT '[]',
    materials_url   TEXT,

    notes           TEXT,
    verified_by     TEXT REFERENCES hr_employee(id),
    verified_at     TIMESTAMPTZ,

    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT
);

CREATE INDEX idx_hr_training_org_id ON hr_training (org_id);
CREATE INDEX idx_hr_training_farm ON hr_training (farm_id);
CREATE INDEX idx_hr_training_date ON hr_training (org_id, training_date);

COMMENT ON TABLE hr_training IS 'Staff training session records. Each row is one training event covering a specific topic for a group of employees.';
COMMENT ON COLUMN hr_training.id IS 'Unique identifier for the training session';
COMMENT ON COLUMN hr_training.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN hr_training.farm_id IS 'Optional farm scope; null if training applies across the org';
COMMENT ON COLUMN hr_training.training_type IS 'Category of training conducted (e.g. GMP, Food Safety, Sanitation, Equipment Operation, GAPs, HACCP)';
COMMENT ON COLUMN hr_training.training_date IS 'Date the training was conducted';
COMMENT ON COLUMN hr_training.topics_covered IS 'JSON array of topic strings covered during the training session';
COMMENT ON COLUMN hr_training.trainer_names IS 'JSON array of trainer names; may include external trainers or internal employee names';
COMMENT ON COLUMN hr_training.materials_url IS 'URL or path to the training materials or presentation used';
COMMENT ON COLUMN hr_training.notes IS 'Free-text notes about the training session';
COMMENT ON COLUMN hr_training.verified_by IS 'Employee who verified the training session record';
COMMENT ON COLUMN hr_training.verified_at IS 'Timestamp when the training session was verified';
COMMENT ON COLUMN hr_training.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN hr_training.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN hr_training.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN hr_training.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN hr_training.updated_by IS 'Email of the user who last updated the record';
