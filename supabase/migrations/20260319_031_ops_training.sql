CREATE TABLE IF NOT EXISTS ops_training (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT NOT NULL REFERENCES org(id),
    farm_id                 TEXT REFERENCES farm(id),

    ops_training_type_id    TEXT REFERENCES ops_training_type(id),
    training_date           DATE,
    topics_covered          JSONB NOT NULL DEFAULT '[]',
    trainer_names           JSONB NOT NULL DEFAULT '[]',
    materials_url           TEXT,

    notes                   TEXT,

    is_deleted               BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    verified_at             TIMESTAMPTZ,
    verified_by             TEXT REFERENCES hr_employee(id),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT
);

CREATE INDEX idx_ops_training_org_id ON ops_training (org_id);
CREATE INDEX idx_ops_training_farm   ON ops_training (farm_id);
CREATE INDEX idx_ops_training_date   ON ops_training (org_id, training_date);
CREATE INDEX idx_ops_training_type   ON ops_training (ops_training_type_id);

COMMENT ON TABLE ops_training IS 'Staff training session records. Each row is one training event covering a specific topic for a group of employees.';
COMMENT ON COLUMN ops_training.id IS 'Unique identifier for the training session';
COMMENT ON COLUMN ops_training.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_training.farm_id IS 'Optional farm scope; null if training applies across the org';
COMMENT ON COLUMN ops_training.ops_training_type_id IS 'Training type from the org lookup; references ops_training_type';
COMMENT ON COLUMN ops_training.training_date IS 'Date the training was conducted';
COMMENT ON COLUMN ops_training.topics_covered IS 'JSON array of topic strings covered during the training session';
COMMENT ON COLUMN ops_training.trainer_names IS 'JSON array of trainer names; may include external trainers or internal employee names';
COMMENT ON COLUMN ops_training.materials_url IS 'URL or path to the training materials or presentation used';
COMMENT ON COLUMN ops_training.notes IS 'Free-text notes about the training session';
COMMENT ON COLUMN ops_training.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN ops_training.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_training.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_training.verified_at IS 'Timestamp when the training session was verified';
COMMENT ON COLUMN ops_training.verified_by IS 'Employee who verified the training session record';
COMMENT ON COLUMN ops_training.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_training.updated_by IS 'Email of the user who last updated the record';
