CREATE TABLE IF NOT EXISTS maint_request_invnt_item (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT        NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    maint_request_id    UUID        NOT NULL REFERENCES maint_request(id) ON DELETE CASCADE,
    invnt_item_id       UUID        NOT NULL REFERENCES invnt_item(id),
    quantity_used       NUMERIC,

    is_active           BOOLEAN     NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,

    CONSTRAINT uq_maint_request_invnt_item UNIQUE (maint_request_id, invnt_item_id)
);

CREATE INDEX idx_maint_request_invnt_item_request ON maint_request_invnt_item (maint_request_id);
CREATE INDEX idx_maint_request_invnt_item_item    ON maint_request_invnt_item (invnt_item_id);

COMMENT ON TABLE maint_request_invnt_item IS 'Inventory items consumed during a maintenance request. One row per item per request.';
COMMENT ON COLUMN maint_request_invnt_item.id IS 'Unique identifier for the record';
COMMENT ON COLUMN maint_request_invnt_item.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN maint_request_invnt_item.maint_request_id IS 'Maintenance request this inventory item usage belongs to';
COMMENT ON COLUMN maint_request_invnt_item.invnt_item_id IS 'Inventory item used during the maintenance';
COMMENT ON COLUMN maint_request_invnt_item.quantity_used IS 'Quantity of the item consumed during the maintenance';
COMMENT ON COLUMN maint_request_invnt_item.is_active IS 'Soft delete flag; false removes the entry without deleting the record';
COMMENT ON COLUMN maint_request_invnt_item.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN maint_request_invnt_item.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN maint_request_invnt_item.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN maint_request_invnt_item.updated_by IS 'Email of the user who last updated the record';
