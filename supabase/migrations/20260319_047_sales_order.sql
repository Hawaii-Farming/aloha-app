CREATE TABLE IF NOT EXISTS sales_order (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                         TEXT NOT NULL REFERENCES farm(id),
    sales_cust_id                   TEXT NOT NULL REFERENCES sales_cust(id),
    sales_fob_id                    TEXT REFERENCES sales_fob(id),
    sales_donation_recipient_id     TEXT REFERENCES sales_donation_recipient(id),

    external_order_number           TEXT,
    order_date                      DATE NOT NULL,
    invoice_date                    DATE,
    recurring_frequency             TEXT CHECK (recurring_frequency IN ('weekly', 'biweekly', 'monthly')),
    notes                           TEXT,

    status                          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'fulfilled')),

    is_active                       BOOLEAN NOT NULL DEFAULT true,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                      TEXT,
    approved_at                     TIMESTAMPTZ,
    approved_by                     TEXT REFERENCES hr_employee(id),
    uploaded_at                     TIMESTAMPTZ,
    uploaded_by                     TEXT REFERENCES hr_employee(id),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by                      TEXT
);

CREATE INDEX idx_sales_order_org_id   ON sales_order (org_id);
CREATE INDEX idx_sales_order_farm     ON sales_order (farm_id);
CREATE INDEX idx_sales_order_customer ON sales_order (sales_cust_id);
CREATE INDEX idx_sales_order_status   ON sales_order (org_id, status);

COMMENT ON TABLE sales_order IS 'Customer order header. One row per order. Tracks customer, FOB, dates, approval workflow, and optional recurring frequency for standing orders.';
COMMENT ON COLUMN sales_order.id IS 'Unique identifier for the order';
COMMENT ON COLUMN sales_order.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_order.farm_id IS 'Farm (crop line) this order belongs to';
COMMENT ON COLUMN sales_order.sales_cust_id IS 'Customer placing the order';
COMMENT ON COLUMN sales_order.sales_fob_id IS 'FOB delivery point for this order; null if using the customer default';
COMMENT ON COLUMN sales_order.sales_donation_recipient_id IS 'Donation recipient if this order is a donation; null for regular sales orders';
COMMENT ON COLUMN sales_order.external_order_number IS 'Order number from an external system (e.g. customer PO number)';
COMMENT ON COLUMN sales_order.order_date IS 'Date the order was placed';
COMMENT ON COLUMN sales_order.invoice_date IS 'Date the invoice was issued; null until invoiced';
COMMENT ON COLUMN sales_order.recurring_frequency IS 'Standing order frequency: weekly, biweekly, or monthly; null for one-time orders';
COMMENT ON COLUMN sales_order.notes IS 'Free-text notes about the order';
COMMENT ON COLUMN sales_order.status IS 'Order status: draft (new), approved (ready to fulfill), fulfilled (shipped)';
COMMENT ON COLUMN sales_order.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN sales_order.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_order.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_order.approved_at IS 'Timestamp when the order was approved';
COMMENT ON COLUMN sales_order.approved_by IS 'Employee who approved the order';
COMMENT ON COLUMN sales_order.uploaded_at IS 'Timestamp when the order was uploaded to the accounting system';
COMMENT ON COLUMN sales_order.uploaded_by IS 'Employee who uploaded the order to the accounting system';
COMMENT ON COLUMN sales_order.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_order.updated_by IS 'Email of the user who last updated the record';
