CREATE TABLE IF NOT EXISTS fsafe_test_hold (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id         TEXT NOT NULL REFERENCES farm(id),
    pack_lot_id     UUID NOT NULL REFERENCES pack_lot(id),
    sales_customer_id       TEXT REFERENCES sales_customer(id),
    sales_customer_group_id TEXT REFERENCES sales_customer_group(id),
    fsafe_lab_id    TEXT REFERENCES fsafe_lab(id),
    lab_test_id     TEXT,

    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    notes           TEXT,

    is_deleted       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    sampled_on      DATE,
    sampled_by      TEXT REFERENCES hr_employee(id),
    delivered_to_lab_on DATE,
    test_started_on     DATE,
    completed_on        DATE,
    verified_at     TIMESTAMPTZ,
    verified_by     TEXT REFERENCES hr_employee(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT
);

CREATE INDEX idx_fsafe_test_hold_org      ON fsafe_test_hold (org_id);
CREATE INDEX idx_fsafe_test_hold_farm     ON fsafe_test_hold (farm_id);
CREATE INDEX idx_fsafe_test_hold_lot      ON fsafe_test_hold (pack_lot_id);
CREATE INDEX idx_fsafe_test_hold_customer ON fsafe_test_hold (sales_customer_id);
CREATE INDEX idx_fsafe_test_hold_status   ON fsafe_test_hold (org_id, status);

COMMENT ON TABLE fsafe_test_hold IS 'Test-and-hold header. One record per pack lot being tested. Tracks sample collection, lab submission, and test timeline. Results are stored per test type in fsafe_test_hold_result.';
COMMENT ON COLUMN fsafe_test_hold.id IS 'Unique identifier for the test-and-hold record';
COMMENT ON COLUMN fsafe_test_hold.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN fsafe_test_hold.farm_id IS 'Farm where the sample was collected';
COMMENT ON COLUMN fsafe_test_hold.pack_lot_id IS 'Pack lot being tested; one test-and-hold per lot';
COMMENT ON COLUMN fsafe_test_hold.sales_customer_id IS 'Customer requesting the test-and-hold; null if group-level or internal testing';
COMMENT ON COLUMN fsafe_test_hold.sales_customer_group_id IS 'Customer group requesting the test-and-hold; null if customer-specific or internal testing';
COMMENT ON COLUMN fsafe_test_hold.fsafe_lab_id IS 'Laboratory where the sample is submitted for testing';
COMMENT ON COLUMN fsafe_test_hold.lab_test_id IS 'External reference number assigned by the laboratory for tracking';
COMMENT ON COLUMN fsafe_test_hold.status IS 'Workflow status: pending (awaiting sample), in_progress (at lab), completed (results received)';
COMMENT ON COLUMN fsafe_test_hold.notes IS 'Free-text notes about this test-and-hold event';
COMMENT ON COLUMN fsafe_test_hold.is_deleted IS 'Soft delete flag; true means the record has been removed';
COMMENT ON COLUMN fsafe_test_hold.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN fsafe_test_hold.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN fsafe_test_hold.sampled_on IS 'Date when the sample was collected from the lot';
COMMENT ON COLUMN fsafe_test_hold.sampled_by IS 'Employee who collected the sample';
COMMENT ON COLUMN fsafe_test_hold.delivered_to_lab_on IS 'Date when the sample was delivered to the laboratory';
COMMENT ON COLUMN fsafe_test_hold.test_started_on IS 'Date when the laboratory started processing the sample';
COMMENT ON COLUMN fsafe_test_hold.completed_on IS 'Date when all test results were received from the laboratory';
COMMENT ON COLUMN fsafe_test_hold.verified_at IS 'Timestamp when the test-and-hold results were verified';
COMMENT ON COLUMN fsafe_test_hold.verified_by IS 'Employee who verified the test-and-hold results';
COMMENT ON COLUMN fsafe_test_hold.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN fsafe_test_hold.updated_by IS 'Email of the user who last updated the record';
