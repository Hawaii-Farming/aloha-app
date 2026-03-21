CREATE TABLE IF NOT EXISTS ops_template (
    id                          TEXT        PRIMARY KEY,
    org_id                      TEXT        NOT NULL REFERENCES org(id),
    farm_id                     TEXT        REFERENCES farm(id),

    name                        TEXT        NOT NULL,
    ops_template_category_id    TEXT        REFERENCES ops_template_category(id),
    description                 TEXT,
    display_order               INTEGER     NOT NULL DEFAULT 0,

    atp_site_count              INTEGER,
    numeric_minimum_rlu_value   NUMERIC,
    numeric_maximum_rlu_value   NUMERIC,

    is_deleted                   BOOLEAN     NOT NULL DEFAULT false,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT
);

CREATE INDEX idx_ops_template_org_id ON ops_template (org_id);

-- Partial unique indexes handle NULL farm_id correctly (NULL != NULL in standard UNIQUE constraints)
CREATE UNIQUE INDEX uq_ops_template_org_level  ON ops_template (org_id, name) WHERE farm_id IS NULL;
CREATE UNIQUE INDEX uq_ops_template_farm_level ON ops_template (org_id, farm_id, name) WHERE farm_id IS NOT NULL;

-- Add FK from ops_task_tracker now that ops_template exists
ALTER TABLE ops_task_tracker
    ADD CONSTRAINT fk_ops_task_tracker_ops_template
    FOREIGN KEY (ops_template_id) REFERENCES ops_template(id);

COMMENT ON TABLE ops_template IS 'Checklist templates. Defines the checklist name, category, and the set of questions employees answer during a task event.';
COMMENT ON COLUMN ops_template.id IS 'Human-readable identifier derived from name (trimmed lowercase)';
COMMENT ON COLUMN ops_template.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN ops_template.farm_id IS 'Optional farm scope; null if the template applies to all farms';
COMMENT ON COLUMN ops_template.name IS 'Checklist template name, unique per org and farm scope (e.g. Pre-Op GH, House Inspection)';
COMMENT ON COLUMN ops_template.ops_template_category_id IS 'Category grouping this template by module or purpose; FK to org-defined ops_template_category lookup';
COMMENT ON COLUMN ops_template.description IS 'Optional description of the checklist and its purpose';
COMMENT ON COLUMN ops_template.display_order IS 'Sort position for ordering templates in the UI';
COMMENT ON COLUMN ops_template.atp_site_count IS 'Number of sites to randomly select for ATP testing; null means no ATP testing for this template';
COMMENT ON COLUMN ops_template.numeric_minimum_rlu_value IS 'Minimum acceptable RLU value for ATP tests on this template; results below this are a fail';
COMMENT ON COLUMN ops_template.numeric_maximum_rlu_value IS 'Maximum acceptable RLU value for ATP tests on this template; results above this are a fail';
COMMENT ON COLUMN ops_template.is_deleted IS 'Soft delete flag; false hides the template from active use';
COMMENT ON COLUMN ops_template.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN ops_template.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN ops_template.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN ops_template.updated_by IS 'Email of the user who last updated the record';
