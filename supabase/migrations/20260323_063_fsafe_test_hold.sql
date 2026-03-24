CREATE TABLE IF NOT EXISTS fsafe_test_hold (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          TEXT NOT NULL REFERENCES org(id),
    farm_id         TEXT NOT NULL REFERENCES org_farm(id),
    pack_lot_id     UUID NOT NULL REFERENCES pack_lot(id),
    sales_customer_id       TEXT REFERENCES sales_customer(id),
    sales_customer_group_id TEXT REFERENCES sales_customer_group(id),
    fsafe_lab_id    TEXT REFERENCES fsafe_lab(id),
    lab_test_id     TEXT,

    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    notes           TEXT,

    sampled_on      DATE,
    sampled_by      TEXT REFERENCES hr_employee(id),
    delivered_to_lab_on DATE,
    test_started_on     DATE,
    completed_on        DATE,
    verified_at     TIMESTAMPTZ,
    verified_by     TEXT REFERENCES hr_employee(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      TEXT,
    is_deleted       BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE fsafe_test_hold IS 'Test-and-hold header. One record per pack lot per lab. If the same lot is sent to a different lab, a separate entry is created. Tracks sample collection, lab submission, and test timeline.';

CREATE INDEX idx_fsafe_test_hold_org      ON fsafe_test_hold (org_id);
CREATE INDEX idx_fsafe_test_hold_farm     ON fsafe_test_hold (farm_id);
CREATE INDEX idx_fsafe_test_hold_lot      ON fsafe_test_hold (pack_lot_id);
CREATE INDEX idx_fsafe_test_hold_customer ON fsafe_test_hold (sales_customer_id);
CREATE INDEX idx_fsafe_test_hold_status   ON fsafe_test_hold (org_id, status);

COMMENT ON COLUMN fsafe_test_hold.pack_lot_id IS 'One record per lot per lab — submit a separate entry for the same lot if sent to a different lab';
COMMENT ON COLUMN fsafe_test_hold.sales_customer_id IS 'Null if group-level or internal testing';
COMMENT ON COLUMN fsafe_test_hold.sales_customer_group_id IS 'Null if customer-specific or internal testing';
COMMENT ON COLUMN fsafe_test_hold.lab_test_id IS 'External reference number assigned by the laboratory for tracking';
COMMENT ON COLUMN fsafe_test_hold.status IS 'Workflow status: pending (awaiting sample), in_progress (at lab), completed (results received)';
