CREATE TABLE IF NOT EXISTS invnt_po (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 TEXT NOT NULL REFERENCES org(id),
    farm_id                TEXT REFERENCES org_farm(id),

    -- Request classification
    request_type           TEXT NOT NULL DEFAULT 'inventory_item' CHECK (request_type IN ('non_inventory_item', 'inventory_item')),
    urgency_level          TEXT CHECK (urgency_level IN ('today', '2_days', '7_days', 'not_urgent')),

    -- Item identification
    invnt_category_id      TEXT REFERENCES invnt_category(id),
    invnt_item_id          TEXT REFERENCES invnt_item(id),
    item_name              TEXT NOT NULL,

    -- Order quantities & units (snapshots from item at order time)
    burn_uom               TEXT REFERENCES sys_uom(code),
    order_uom              TEXT REFERENCES sys_uom(code),
    order_quantity         NUMERIC NOT NULL,
    burn_per_order         NUMERIC,

    -- Vendor & cost
    vendor_po_number       TEXT,
    invnt_vendor_id        TEXT REFERENCES invnt_vendor(id),
    total_cost             NUMERIC,
    is_freight_included    BOOLEAN NOT NULL DEFAULT false,
    expected_delivery_date DATE,
    tracking_number        TEXT,

    -- Notes & photos
    notes                  TEXT,
    rejected_reason        TEXT,
    request_photos         JSONB NOT NULL DEFAULT '[]',

    -- Status & audit
    status                 TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'ordered', 'partial', 'received', 'cancelled')),
    requested_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    requested_by           TEXT NOT NULL REFERENCES hr_employee(id),
    reviewed_at            TIMESTAMPTZ,
    reviewed_by            TEXT REFERENCES hr_employee(id),
    ordered_at             TIMESTAMPTZ,
    ordered_by             TEXT REFERENCES hr_employee(id),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             TEXT,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE invnt_po IS 'Tracks purchase order requests through a workflow from request to receipt. Each order snapshots the item name, units, and cost at order time so the record stays accurate even if the item changes later.';

CREATE INDEX idx_invnt_po_org_id ON invnt_po (org_id);
CREATE INDEX idx_invnt_po_status ON invnt_po (org_id, status);
CREATE INDEX idx_invnt_po_item   ON invnt_po (invnt_item_id);

COMMENT ON COLUMN invnt_po.request_type IS 'Whether this is a non-inventory purchase or an inventory item purchase: non_inventory_item, inventory_item';
COMMENT ON COLUMN invnt_po.urgency_level IS 'How urgently the item is needed: today, 2_days, 7_days, not_urgent';
COMMENT ON COLUMN invnt_po.invnt_category_id IS 'Category for non_inventory_item requests; references invnt_category rows where sub_category_name IS NULL';
COMMENT ON COLUMN invnt_po.invnt_item_id IS 'Linked inventory item; NULL for non_inventory_item requests';
COMMENT ON COLUMN invnt_po.item_name IS 'Snapshot of item name at order time; manually entered for non_inventory_item requests';
COMMENT ON COLUMN invnt_po.burn_uom IS 'Snapshot from item at order time';
COMMENT ON COLUMN invnt_po.order_uom IS 'Snapshot from item at order time';
COMMENT ON COLUMN invnt_po.burn_per_order IS 'Snapshot of burn units per order unit at order time';
COMMENT ON COLUMN invnt_po.is_freight_included IS 'Whether total_cost includes freight charges';
COMMENT ON COLUMN invnt_po.status IS 'Workflow status: requested, approved, rejected, ordered, partial, received, cancelled';
