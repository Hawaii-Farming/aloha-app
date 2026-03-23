CREATE TABLE IF NOT EXISTS ops_template (
    id                          TEXT        PRIMARY KEY,
    org_id                      TEXT        NOT NULL REFERENCES org(id),
    farm_id                     TEXT        REFERENCES org_farm(id),

    name                        TEXT        NOT NULL,
    ops_template_category_id    TEXT        REFERENCES ops_template_category(id),
    description                 TEXT,
    display_order               INTEGER     NOT NULL DEFAULT 0,

    atp_site_count              INTEGER,
    numeric_minimum_rlu_value   NUMERIC,
    numeric_maximum_rlu_value   NUMERIC,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                   BOOLEAN     NOT NULL DEFAULT false
);

COMMENT ON TABLE ops_template IS 'Master checklist template. Defines the checklist and the questions employees answer during a task event.';

CREATE INDEX idx_ops_template_org_id ON ops_template (org_id);

-- Partial unique indexes handle NULL farm_id correctly (NULL != NULL in standard UNIQUE constraints)
CREATE UNIQUE INDEX uq_ops_template_org_level  ON ops_template (org_id, name) WHERE farm_id IS NULL;
CREATE UNIQUE INDEX uq_ops_template_farm_level ON ops_template (org_id, farm_id, name) WHERE farm_id IS NOT NULL;

-- Add FK from ops_task_tracker now that ops_template exists
ALTER TABLE ops_task_tracker
    ADD CONSTRAINT fk_ops_task_tracker_ops_template
    FOREIGN KEY (ops_template_id) REFERENCES ops_template(id);

COMMENT ON COLUMN ops_template.display_order IS 'Sort position for ordering templates in the UI';
COMMENT ON COLUMN ops_template.atp_site_count IS 'Number of sites to randomly select for ATP testing; null means no ATP testing for this template';
COMMENT ON COLUMN ops_template.numeric_minimum_rlu_value IS 'Minimum acceptable RLU value for ATP tests on this template; results below this are a fail';
COMMENT ON COLUMN ops_template.numeric_maximum_rlu_value IS 'Maximum acceptable RLU value for ATP tests on this template; results above this are a fail';
