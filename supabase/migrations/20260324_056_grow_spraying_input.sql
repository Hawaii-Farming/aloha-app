CREATE TABLE IF NOT EXISTS grow_spraying_input (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    ops_task_tracker_id            UUID NOT NULL REFERENCES ops_task_tracker(id),
    invnt_item_id               TEXT NOT NULL REFERENCES invnt_item(id),
    grow_spraying_compliance_id    UUID REFERENCES grow_spraying_compliance(id),
    target_pest_disease         TEXT,
    application_uom             TEXT NOT NULL REFERENCES sys_uom(code),
    quantity_applied            NUMERIC NOT NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_spraying_input IS 'Individual chemical or fertilizer applied during a spraying event. One row per input product. Links to compliance record for PHI/REI lookup.';

COMMENT ON COLUMN grow_spraying_input.grow_spraying_compliance_id IS 'Active compliance record for this product; used to derive PHI/REI safety intervals';
COMMENT ON COLUMN grow_spraying_input.target_pest_disease IS 'Specific pest or disease being targeted with this input';

CREATE INDEX idx_grow_spraying_input_spraying ON grow_spraying_input (ops_task_tracker_id);
CREATE INDEX idx_grow_spraying_input_item ON grow_spraying_input (invnt_item_id);
