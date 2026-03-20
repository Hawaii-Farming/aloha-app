CREATE TABLE IF NOT EXISTS sales_po (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                          TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                         TEXT NOT NULL REFERENCES farm(id),
    sales_customer_id                   TEXT NOT NULL REFERENCES sales_customer(id),
    sales_fob_id                    TEXT REFERENCES sales_fob(id),
    sales_donation_recipient_id     TEXT REFERENCES sales_donation_recipient(id),

    po_number           TEXT,
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

CREATE INDEX idx_sales_po_org_id   ON sales_po (org_id);
CREATE INDEX idx_sales_po_farm     ON sales_po (farm_id);
CREATE INDEX idx_sales_po_customer ON sales_po (sales_customer_id);
CREATE INDEX idx_sales_po_status   ON sales_po (org_id, status);

COMMENT ON TABLE sales_po IS 'Customer order header. One row per order. Tracks customer, FOB, dates, approval workflow, and optional recurring frequency for standing orders.';
COMMENT ON COLUMN sales_po.id IS 'Unique identifier for the order';
COMMENT ON COLUMN sales_po.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN sales_po.farm_id IS 'Farm (crop line) this order belongs to';
COMMENT ON COLUMN sales_po.sales_customer_id IS 'Customer placing the order';
COMMENT ON COLUMN sales_po.sales_fob_id IS 'FOB delivery point for this order; null if using the customer default';
COMMENT ON COLUMN sales_po.sales_donation_recipient_id IS 'Donation recipient if this order is a donation; null for regular sales orders';
COMMENT ON COLUMN sales_po.po_number IS 'Customer purchase order number for reference and cross-system matching';
COMMENT ON COLUMN sales_po.order_date IS 'Date the order was placed';
COMMENT ON COLUMN sales_po.invoice_date IS 'Date the invoice was issued; null until invoiced';
COMMENT ON COLUMN sales_po.recurring_frequency IS 'Standing order frequency: weekly, biweekly, or monthly; null for one-time orders';
COMMENT ON COLUMN sales_po.notes IS 'Free-text notes about the order';
COMMENT ON COLUMN sales_po.status IS 'Order status: draft (new), approved (ready to fulfill), fulfilled (shipped)';
COMMENT ON COLUMN sales_po.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN sales_po.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN sales_po.created_by IS 'Email of the user who created the record';
COMMENT ON COLUMN sales_po.approved_at IS 'Timestamp when the order was approved';
COMMENT ON COLUMN sales_po.approved_by IS 'Employee who approved the order';
COMMENT ON COLUMN sales_po.uploaded_at IS 'Timestamp when the order was uploaded to the accounting system';
COMMENT ON COLUMN sales_po.uploaded_by IS 'Employee who uploaded the order to the accounting system';
COMMENT ON COLUMN sales_po.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN sales_po.updated_by IS 'Email of the user who last updated the record';
