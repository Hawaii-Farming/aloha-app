CREATE TABLE IF NOT EXISTS invnt_usage (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 TEXT NOT NULL REFERENCES org(id),
    farm_id                TEXT REFERENCES farm(id),
    invnt_item_id          UUID NOT NULL REFERENCES invnt_item(id),
    reference_table        TEXT,
    reference_id           UUID,
    usage_date             DATE NOT NULL,
    burn_uom               TEXT REFERENCES util_uom(code),
    quantity_burn          NUMERIC NOT NULL,

    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             TEXT,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE invnt_usage IS 'Tracks inventory consumption linked back to the source module that triggered it. The reference_table and reference_id columns provide a generic FK to any table so usage can be traced to its origin.';

CREATE INDEX idx_invnt_usage_org_id ON invnt_usage (org_id);
CREATE INDEX idx_invnt_usage_item ON invnt_usage (invnt_item_id, usage_date);
CREATE INDEX idx_invnt_usage_ref ON invnt_usage (reference_table, reference_id);

COMMENT ON COLUMN invnt_usage.reference_table IS 'Source table that triggered the usage (e.g. grow_fertigation_schedule, harvest_batch)';
COMMENT ON COLUMN invnt_usage.reference_id IS 'Source record ID in the reference_table';
