CREATE TABLE IF NOT EXISTS invnt_usage (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                TEXT REFERENCES farm(id),
    invnt_item_id          UUID NOT NULL REFERENCES invnt_item(id),
    reference_table        VARCHAR(50),
    reference_id           UUID,
    usage_date             DATE NOT NULL,
    burn_uom               VARCHAR(10) REFERENCES util_uom(code),
    quantity_burn          NUMERIC NOT NULL,

    is_active              BOOLEAN NOT NULL DEFAULT true,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             UUID REFERENCES auth.users(id),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invnt_usage_org_id ON invnt_usage (org_id);
CREATE INDEX idx_invnt_usage_item ON invnt_usage (invnt_item_id, usage_date);
CREATE INDEX idx_invnt_usage_ref ON invnt_usage (reference_table, reference_id);

COMMENT ON TABLE invnt_usage IS 'Tracks inventory consumption linked back to the source module via reference_table and reference_id';
COMMENT ON COLUMN invnt_usage.id IS 'Unique identifier for the usage record';
COMMENT ON COLUMN invnt_usage.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_usage.farm_id IS 'Optional farm scope';
COMMENT ON COLUMN invnt_usage.invnt_item_id IS 'Inventory item that was consumed';
COMMENT ON COLUMN invnt_usage.reference_table IS 'Source table that triggered the usage (e.g. grow_fertigation_schedule, harvest_batch)';
COMMENT ON COLUMN invnt_usage.reference_id IS 'Source record ID in the reference_table';
COMMENT ON COLUMN invnt_usage.usage_date IS 'Date the consumption occurred';
COMMENT ON COLUMN invnt_usage.burn_uom IS 'Unit of measure for the burn quantity';
COMMENT ON COLUMN invnt_usage.quantity_burn IS 'Quantity consumed in burn units';
COMMENT ON COLUMN invnt_usage.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN invnt_usage.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN invnt_usage.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN invnt_usage.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_usage.updated_by IS 'User who last updated the record, references auth.users(id)';
