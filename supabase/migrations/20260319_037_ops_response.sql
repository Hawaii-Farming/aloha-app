CREATE TABLE IF NOT EXISTS ops_response (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                 TEXT        REFERENCES farm(id),
    ops_task_tracker_id     UUID        NOT NULL REFERENCES ops_task_tracker(id),
    ops_template_id         TEXT        NOT NULL REFERENCES ops_template(id),
    ops_question_id         UUID        REFERENCES ops_question(id),
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

);

CREATE INDEX idx_ops_response_org_id      ON ops_response (org_id);
CREATE INDEX idx_ops_response_tracker     ON ops_response (ops_task_tracker_id);
CREATE INDEX idx_ops_response_question    ON ops_response (ops_question_id);

-- Partial unique indexes: checklist responses are unique per tracker+question; ATP results are unique per tracker+site
CREATE UNIQUE INDEX uq_ops_response_checklist ON ops_response (ops_task_tracker_id, ops_question_id) WHERE ops_question_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ops_response_atp      ON ops_response (ops_task_tracker_id, site_id) WHERE ops_question_id IS NULL AND site_id IS NOT NULL;

COMMENT ON TABLE ops_response IS 'Employee responses to checklist questions. One row per question per task tracker session.';
COMMENT ON COLUMN ops_response.id IS 'Unique identifier for the response';
COMMENT ON COLUMN ops_response.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_response.farm_id IS 'Optional farm scope; null if the response applies to all farms';
COMMENT ON COLUMN ops_response.ops_task_tracker_id IS 'Task tracker session this response belongs to; acts as the checklist completion header';
COMMENT ON COLUMN ops_response.ops_template_id IS 'Checklist template this response belongs to; every response — checklist or ATP — belongs to a template';
COMMENT ON COLUMN ops_response.ops_question_id IS 'Checklist question being answered; null for ATP surface test results which have no associated question';
COMMENT ON COLUMN ops_response.site_id IS 'Site where the ATP test was conducted; null for standard checklist responses which are not site-specific';
COMMENT ON COLUMN ops_response.response_boolean IS 'Boolean response value; used when question response_type is boolean';
COMMENT ON COLUMN ops_response.response_numeric IS 'Numeric response value; used when question response_type is numeric';
COMMENT ON COLUMN ops_response.response_enum IS 'Selected enum option; used when question response_type is enum';
COMMENT ON COLUMN ops_response.response_text IS 'Free-text notes or observations for this response';
COMMENT ON COLUMN ops_response.is_active IS 'Soft delete flag; false hides the response from active use';
COMMENT ON COLUMN ops_response.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_response.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_response.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_response.updated_by IS 'Email of the user who last updated the record';
