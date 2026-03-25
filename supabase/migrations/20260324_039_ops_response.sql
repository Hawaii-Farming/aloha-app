CREATE TABLE IF NOT EXISTS ops_response (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  TEXT        NOT NULL REFERENCES org(id),
    farm_id                 TEXT        REFERENCES org_farm(id),
    ops_task_tracker_id     UUID        NOT NULL REFERENCES ops_task_tracker(id),
    ops_template_id         TEXT        NOT NULL REFERENCES ops_template(id),
    ops_question_id         UUID        REFERENCES ops_question(id),
    site_id                 TEXT        REFERENCES org_site(id),

    response_boolean        BOOLEAN,
    response_numeric        NUMERIC,
    response_enum           TEXT,
    response_text           TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by              TEXT,
    is_deleted               BOOLEAN     NOT NULL DEFAULT false
);

COMMENT ON TABLE ops_response IS 'Employee responses to checklist questions. One row per question per task tracker session. The linked ops_task_tracker record acts as the header (who completed the checklist, when, and at which site).';

CREATE INDEX idx_ops_response_org_id      ON ops_response (org_id);
CREATE INDEX idx_ops_response_tracker     ON ops_response (ops_task_tracker_id);
CREATE INDEX idx_ops_response_question    ON ops_response (ops_question_id);

-- Partial unique indexes: checklist responses are unique per tracker+question; ATP results are unique per tracker+site
CREATE UNIQUE INDEX uq_ops_response_checklist ON ops_response (ops_task_tracker_id, ops_question_id) WHERE ops_question_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ops_response_atp      ON ops_response (ops_task_tracker_id, site_id) WHERE ops_question_id IS NULL AND site_id IS NOT NULL;

COMMENT ON COLUMN ops_response.ops_question_id IS 'Null for ATP surface test results';
COMMENT ON COLUMN ops_response.site_id IS 'Null for standard checklist responses';
