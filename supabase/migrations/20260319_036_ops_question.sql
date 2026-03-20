CREATE TABLE IF NOT EXISTS ops_question (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id             TEXT        REFERENCES farm(id),
    ops_template_id     TEXT        NOT NULL REFERENCES ops_template(id),

    display_order       INTEGER     NOT NULL DEFAULT 0,
    question_text       TEXT        NOT NULL,
    response_type       TEXT        NOT NULL CHECK (response_type IN ('boolean', 'numeric', 'enum')),
    is_required         BOOLEAN     NOT NULL DEFAULT true,

    -- Boolean response settings
    boolean_pass_value          BOOLEAN,

    -- Numeric response settings
    numeric_minimum_value       NUMERIC,
    numeric_maximum_value       NUMERIC,

    -- Enum response settings
    enum_options                JSONB,
    enum_pass_options           JSONB,

    warning_message                     TEXT,
    ops_corrective_action_choice_ids    JSONB,

    is_deleted           BOOLEAN     NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT
);

CREATE INDEX idx_ops_question_org_id   ON ops_question (org_id);
CREATE INDEX idx_ops_question_template ON ops_question (ops_template_id, display_order);

COMMENT ON TABLE ops_question IS 'Questions within a checklist template. Ordered by display_order within each template.';
COMMENT ON COLUMN ops_question.id IS 'Unique identifier for the question';
COMMENT ON COLUMN ops_question.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_question.farm_id IS 'Optional farm scope; null if the question applies to all farms';
COMMENT ON COLUMN ops_question.ops_template_id IS 'Checklist template this question belongs to';
COMMENT ON COLUMN ops_question.display_order IS 'Display order of this question within the template';
COMMENT ON COLUMN ops_question.question_text IS 'The question or checklist item text shown to the employee';
COMMENT ON COLUMN ops_question.response_type IS 'Expected response format: boolean, numeric, or enum';
COMMENT ON COLUMN ops_question.is_required IS 'Whether this question must be answered before the checklist can be submitted';
COMMENT ON COLUMN ops_question.boolean_pass_value IS 'The boolean value that constitutes a pass; used when response_type is boolean (e.g. true for Yes/Pass, false for No/Pass)';
COMMENT ON COLUMN ops_question.numeric_minimum_value IS 'Minimum acceptable numeric value; a response below this triggers a corrective action warning';
COMMENT ON COLUMN ops_question.numeric_maximum_value IS 'Maximum acceptable numeric value; a response above this triggers a corrective action warning';
COMMENT ON COLUMN ops_question.enum_options IS 'JSON array of all available options for this question; used when response_type is enum (e.g. ["Pass", "Fail", "N/A"])';
COMMENT ON COLUMN ops_question.enum_pass_options IS 'JSON array of enum options that constitute a pass; responses not in this list trigger a corrective action warning (e.g. ["Pass"])';
COMMENT ON COLUMN ops_question.warning_message IS 'Custom warning message displayed to the user when the response fails; if null the frontend generates a default message from the pass criteria';
COMMENT ON COLUMN ops_question.ops_corrective_action_choice_ids IS 'JSON array of ops_corrective_action_choice IDs suggested in the dropdown when this question fails (e.g. ["sanitize_surface", "replace_gloves"]); null shows all active org choices';
COMMENT ON COLUMN ops_question.is_deleted IS 'Soft delete flag; false hides the question from active checklists';
COMMENT ON COLUMN ops_question.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_question.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_question.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_question.updated_by IS 'Email of the user who last updated the record';
