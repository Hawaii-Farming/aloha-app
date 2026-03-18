CREATE TABLE IF NOT EXISTS fsafe_response (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id             TEXT        REFERENCES farm(id),
    template_id         TEXT        REFERENCES fsafe_template(id),
    task_tracker_id     UUID        NOT NULL REFERENCES hr_task_tracker(id),
    question_id         UUID        NOT NULL REFERENCES fsafe_question(id),

    response_boolean    BOOLEAN,
    response_numeric    NUMERIC,
    response_enum       TEXT,
    response_text       TEXT,

    is_active           BOOLEAN     NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,

    CONSTRAINT uq_fsafe_response UNIQUE (task_tracker_id, question_id)
);

CREATE INDEX idx_fsafe_response_org_id      ON fsafe_response (org_id);
CREATE INDEX idx_fsafe_response_tracker     ON fsafe_response (task_tracker_id);
CREATE INDEX idx_fsafe_response_question    ON fsafe_response (question_id);

COMMENT ON TABLE fsafe_response IS 'Employee responses to food safety checklist questions. One row per question per task tracker session.';
COMMENT ON COLUMN fsafe_response.id IS 'Unique identifier for the response';
COMMENT ON COLUMN fsafe_response.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_response.farm_id IS 'Optional farm scope; null if the response applies to all farms';
COMMENT ON COLUMN fsafe_response.template_id IS 'Checklist template this response belongs to; denormalized for easier filtering and reporting';
COMMENT ON COLUMN fsafe_response.task_tracker_id IS 'Task tracker session this response belongs to; acts as the checklist completion header';
COMMENT ON COLUMN fsafe_response.question_id IS 'Checklist question being answered';
COMMENT ON COLUMN fsafe_response.response_boolean IS 'Boolean response value; used when question response_type is boolean';
COMMENT ON COLUMN fsafe_response.response_numeric IS 'Numeric response value; used when question response_type is numeric';
COMMENT ON COLUMN fsafe_response.response_enum IS 'Selected enum option; used when question response_type is enum';
COMMENT ON COLUMN fsafe_response.response_text IS 'Free-text notes or observations for this response';
COMMENT ON COLUMN fsafe_response.is_active IS 'Soft delete flag; false hides the response from active use';
COMMENT ON COLUMN fsafe_response.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_response.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_response.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_response.updated_by IS 'Email of the user who last updated the record';
