CREATE TABLE IF NOT EXISTS grow_spray_input (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                      TEXT NOT NULL REFERENCES org(id),
    farm_id                     TEXT NOT NULL REFERENCES org_farm(id),
    ops_task_tracker_id            UUID NOT NULL REFERENCES ops_task_tracker(id),
    grow_spray_compliance_id    UUID NOT NULL REFERENCES grow_spray_compliance(id),
    invnt_item_id                  TEXT NOT NULL REFERENCES invnt_item(id),
    target_pest_disease         JSONB NOT NULL DEFAULT '[]',
    application_uom             TEXT NOT NULL REFERENCES sys_uom(code),
    application_quantity            NUMERIC NOT NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  TEXT,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                  TEXT,
    is_deleted                  BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE grow_spray_input IS 'Individual chemical or fertilizer applied during a spraying event. One row per input product. The compliance record is the source of truth — only compliant products can be sprayed, and the app enforces label rate limits via maximum_quantity_per_acre.';

COMMENT ON COLUMN grow_spray_input.grow_spray_compliance_id IS 'Compliance record — source of truth; invnt_item_id is pre-filled from this record';
COMMENT ON COLUMN grow_spray_input.invnt_item_id IS 'Pre-filled from the compliance record for convenience; not independently selected';
COMMENT ON COLUMN grow_spray_input.target_pest_disease IS 'Specific pest or disease being targeted with this input';

CREATE INDEX idx_grow_spray_input_spraying ON grow_spray_input (ops_task_tracker_id);
CREATE INDEX idx_grow_spray_input_compliance ON grow_spray_input (grow_spray_compliance_id);
