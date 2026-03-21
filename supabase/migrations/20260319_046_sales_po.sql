CREATE TABLE IF NOT EXISTS sales_po (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                          TEXT NOT NULL REFERENCES org(id),
    farm_id                         TEXT NOT NULL REFERENCES farm(id),
    sales_customer_id               TEXT NOT NULL REFERENCES sales_customer(id),
    sales_customer_group_id         TEXT REFERENCES sales_customer_group(id),
    sales_donation_recipient_id     TEXT REFERENCES sales_donation_recipient(id),
    sales_fob_id                    TEXT REFERENCES sales_fob(id),

    po_number           TEXT,
    order_date                      DATE NOT NULL,
    invoice_date                    DATE,
    recurring_frequency             TEXT CHECK (recurring_frequency IN ('weekly', 'biweekly', 'monthly')),
    notes                           TEXT,

    status                          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'fulfilled')),

    approved_at                     TIMESTAMPTZ,
    approved_by                     TEXT REFERENCES hr_employee(id),
    uploaded_at                     TIMESTAMPTZ,
    uploaded_by                     TEXT REFERENCES hr_employee(id),
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                      TEXT,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                      TEXT,
    is_deleted                       BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE sales_po IS 'Customer order header. One row per order. Tracks customer, FOB, dates, approval workflow, and optional recurring frequency for standing orders.';

CREATE INDEX idx_sales_po_org_id   ON sales_po (org_id);
CREATE INDEX idx_sales_po_farm     ON sales_po (farm_id);
CREATE INDEX idx_sales_po_customer ON sales_po (sales_customer_id);
CREATE INDEX idx_sales_po_status   ON sales_po (org_id, status);

COMMENT ON COLUMN sales_po.sales_customer_id IS 'Customer placing the order';
COMMENT ON COLUMN sales_po.sales_customer_group_id IS 'Customer group for this order; null if using the customer default group';
COMMENT ON COLUMN sales_po.sales_donation_recipient_id IS 'Donation recipient if this order is a donation; null for regular sales orders';
COMMENT ON COLUMN sales_po.sales_fob_id IS 'FOB delivery point for this order; null if using the customer default';
COMMENT ON COLUMN sales_po.po_number IS 'Customer purchase order number for reference and cross-system matching';
COMMENT ON COLUMN sales_po.recurring_frequency IS 'Standing order frequency: weekly, biweekly, or monthly; null for one-time orders';
COMMENT ON COLUMN sales_po.status IS 'Order status: draft (new), approved (ready to fulfill), fulfilled (shipped)';
