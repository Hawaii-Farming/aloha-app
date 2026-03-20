CREATE TABLE IF NOT EXISTS fsafe_test_hold_po (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id             TEXT NOT NULL REFERENCES farm(id),
    fsafe_test_hold_id  UUID NOT NULL REFERENCES fsafe_test_hold(id) ON DELETE CASCADE,
    sales_po_id         UUID NOT NULL REFERENCES sales_po(id),

    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          TEXT,

    CONSTRAINT uq_fsafe_test_hold_po UNIQUE (fsafe_test_hold_id, sales_po_id)
);

CREATE INDEX idx_fsafe_test_hold_po_org       ON fsafe_test_hold_po (org_id);
CREATE INDEX idx_fsafe_test_hold_po_test_hold ON fsafe_test_hold_po (fsafe_test_hold_id);
CREATE INDEX idx_fsafe_test_hold_po_sales_po  ON fsafe_test_hold_po (sales_po_id);

COMMENT ON TABLE fsafe_test_hold_po IS 'Links a test-and-hold record to one or more sales purchase orders that are on hold pending test results.';
COMMENT ON COLUMN fsafe_test_hold_po.id IS 'Unique identifier for the test-hold-to-PO link';
COMMENT ON COLUMN fsafe_test_hold_po.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_test_hold_po.farm_id IS 'Farm this record belongs to; inherited from parent test-and-hold';
COMMENT ON COLUMN fsafe_test_hold_po.fsafe_test_hold_id IS 'Parent test-and-hold record';
COMMENT ON COLUMN fsafe_test_hold_po.sales_po_id IS 'Sales purchase order that is on hold pending test results';
COMMENT ON COLUMN fsafe_test_hold_po.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN fsafe_test_hold_po.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_test_hold_po.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_test_hold_po.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_test_hold_po.updated_by IS 'Email of the user who last updated the record';
