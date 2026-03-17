CREATE TABLE IF NOT EXISTS invnt_po (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                TEXT REFERENCES farm(id),

    -- Request classification
    request_type           TEXT NOT NULL DEFAULT 'inventory_item' CHECK (request_type IN ('non_inventory_item', 'inventory_item')),
    urgency_level          TEXT,

    -- Item identification
    category_id            TEXT REFERENCES invnt_category(id),
    invnt_item_id                UUID REFERENCES invnt_item(id),
    item_name              TEXT NOT NULL,

    -- Order quantities & units (snapshots from item at order time)
    burn_uom               TEXT REFERENCES util_uom(code),
    order_uom              TEXT REFERENCES util_uom(code),
    order_quantity         NUMERIC NOT NULL,
    burn_per_order_uom    NUMERIC,

    -- Workflow
    status                 TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'ordered', 'partial', 'received', 'cancelled')),
    requested_by           UUID NOT NULL REFERENCES auth.users(id),
    requested_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by            UUID REFERENCES auth.users(id),
    reviewed_at            TIMESTAMPTZ,
    order_placed_by        UUID REFERENCES auth.users(id),
    order_placed_at        TIMESTAMPTZ,

    -- Vendor & cost
    vendor_po_number       TEXT,
    vendor_id              TEXT REFERENCES invnt_vendor(id),
    total_cost             NUMERIC,
    is_freight_included    BOOLEAN NOT NULL DEFAULT false,
    expected_delivery_date DATE,
    tracking_number        TEXT,

    -- Notes & photos
    order_notes            TEXT,
    rejected_reason        TEXT,
    request_photos         JSONB NOT NULL DEFAULT '[]',

    -- Status & audit
    is_active              BOOLEAN NOT NULL DEFAULT true,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             TEXT
);

CREATE INDEX idx_invnt_po_org_id ON invnt_po (org_id);
CREATE INDEX idx_invnt_po_status ON invnt_po (org_id, status);
CREATE INDEX idx_invnt_po_item ON invnt_po (invnt_item_id);

COMMENT ON TABLE invnt_po IS 'Purchase order requests with approval workflow (requested > approved > ordered > partial > received) and snapshot pricing at order time';
COMMENT ON COLUMN invnt_po.id IS 'Unique identifier for the purchase order';
COMMENT ON COLUMN invnt_po.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_po.farm_id IS 'Optional farm scope for the order';
COMMENT ON COLUMN invnt_po.request_type IS 'Whether this is a non-inventory purchase or an inventory item purchase: non_inventory_item, inventory_item';
COMMENT ON COLUMN invnt_po.urgency_level IS 'Number of days until the item is needed (e.g. 1, 2, 7)';
COMMENT ON COLUMN invnt_po.category_id IS 'Category for non_inventory_item requests (provides classification when there is no linked inventory item)';
COMMENT ON COLUMN invnt_po.invnt_item_id IS 'Linked inventory item; NULL for non_inventory_item requests';
COMMENT ON COLUMN invnt_po.item_name IS 'Snapshot of item name at order time; manually entered for non_inventory_item requests';
COMMENT ON COLUMN invnt_po.burn_uom IS 'Unit of measure for burn quantity (snapshot from item at order time)';
COMMENT ON COLUMN invnt_po.order_uom IS 'Unit of measure for the order quantity (snapshot from item at order time)';
COMMENT ON COLUMN invnt_po.order_quantity IS 'Quantity ordered in order units';
COMMENT ON COLUMN invnt_po.burn_per_order_uom IS 'Snapshot of burn units per order unit at order time';
COMMENT ON COLUMN invnt_po.status IS 'Workflow status: requested, approved, rejected, ordered, partial, received, cancelled';
COMMENT ON COLUMN invnt_po.requested_by IS 'User who submitted the order request';
COMMENT ON COLUMN invnt_po.requested_at IS 'Timestamp when the order was requested';
COMMENT ON COLUMN invnt_po.reviewed_by IS 'User who approved or rejected the order';
COMMENT ON COLUMN invnt_po.reviewed_at IS 'Timestamp when the order was reviewed';
COMMENT ON COLUMN invnt_po.order_placed_by IS 'User who placed the order with the vendor';
COMMENT ON COLUMN invnt_po.order_placed_at IS 'Timestamp when the order was placed with the vendor';
COMMENT ON COLUMN invnt_po.vendor_po_number IS 'PO number assigned by the vendor for this order';
COMMENT ON COLUMN invnt_po.vendor_id IS 'Vendor the order is placed with';
COMMENT ON COLUMN invnt_po.total_cost IS 'Total cost for the order';
COMMENT ON COLUMN invnt_po.is_freight_included IS 'Whether total_cost includes freight charges';
COMMENT ON COLUMN invnt_po.expected_delivery_date IS 'Expected delivery date from the vendor';
COMMENT ON COLUMN invnt_po.tracking_number IS 'Shipping or freight tracking number';
COMMENT ON COLUMN invnt_po.order_notes IS 'Free-text notes about the order';
COMMENT ON COLUMN invnt_po.rejected_reason IS 'Reason for rejection when status is rejected';
COMMENT ON COLUMN invnt_po.request_photos IS 'JSON array of photo URLs attached to the request';
COMMENT ON COLUMN invnt_po.is_active IS 'Soft delete flag; false hides the order from active use';
COMMENT ON COLUMN invnt_po.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_po.updated_by IS 'Email of the user who last updated the record';
