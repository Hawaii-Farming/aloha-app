CREATE TABLE IF NOT EXISTS ops_response (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                 TEXT        REFERENCES farm(id),
    ops_template_id         TEXT        REFERENCES ops_template(id),
    ops_task_tracker_id     UUID        NOT NULL REFERENCES ops_task_tracker(id),
    ops_question_id         UUID        NOT NULL REFERENCES ops_question(id),
    site_id                 TEXT        REFERENCES site(id),

    response_boolean        BOOLEAN,
    response_numeric        NUMERIC,
    response_enum           TEXT,
    response_text           TEXT,

    is_active               BOOLEAN     NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,

    CONSTRAINT uq_ops_response UNIQUE (ops_task_tracker_id, ops_question_id)
);

CREATE INDEX idx_ops_response_org_id      ON ops_response (org_id);
CREATE INDEX idx_ops_response_tracker     ON ops_response (ops_task_tracker_id);
CREATE INDEX idx_ops_response_question    ON ops_response (ops_question_id);

COMMENT ON TABLE ops_response IS 'Employee responses to checklist questions. One row per question per task tracker session.';
COMMENT ON COLUMN ops_response.id IS 'Unique identifier for the response';
COMMENT ON COLUMN ops_response.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_response.farm_id IS 'Optional farm scope; null if the response applies to all farms';
COMMENT ON COLUMN ops_response.ops_template_id IS 'Checklist template this response belongs to; denormalized for easier filtering and reporting';
COMMENT ON COLUMN ops_response.ops_task_tracker_id IS 'Task tracker session this response belongs to; acts as the checklist completion header';
COMMENT ON COLUMN ops_response.ops_question_id IS 'Checklist question being answered';
COMMENT ON COLUMN ops_response.site_id IS 'Site where the ATP test was conducted; null for standard checklist question responses';
COMMENT ON COLUMN ops_response.response_boolean IS 'Boolean response value; used when question response_type is boolean';
COMMENT ON COLUMN ops_response.response_numeric IS 'Numeric response value; used when question response_type is numeric';
COMMENT ON COLUMN ops_response.response_enum IS 'Selected enum option; used when question response_type is enum';
COMMENT ON COLUMN ops_response.response_text IS 'Free-text notes or observations for this response';
COMMENT ON COLUMN ops_response.is_active IS 'Soft delete flag; false hides the response from active use';
COMMENT ON COLUMN ops_response.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_response.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_response.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_response.updated_by IS 'Email of the user who last updated the record';
