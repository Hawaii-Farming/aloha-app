CREATE TABLE IF NOT EXISTS invnt_po_received (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    farm_id                TEXT REFERENCES farm(id),
    invnt_po_id            UUID NOT NULL REFERENCES invnt_po(id) ON DELETE CASCADE,
    received_date          DATE NOT NULL,
    received_uom           TEXT REFERENCES util_uom(code),
    received_quantity      NUMERIC NOT NULL,
    burn_per_received      NUMERIC,

    -- Lot tracking
    lot_number             TEXT,
    lot_expiry_date        DATE,

    -- Delivery acceptance
    delivery_truck_clean   BOOLEAN,
    delivery_acceptable    BOOLEAN,
    notes                  TEXT,
    received_photos        JSONB NOT NULL DEFAULT '[]',

    is_active              BOOLEAN NOT NULL DEFAULT true,
    received_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_by            TEXT,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             TEXT
);

CREATE INDEX idx_invnt_po_received_po  ON invnt_po_received (invnt_po_id);
CREATE INDEX idx_invnt_po_received_org ON invnt_po_received (org_id);

COMMENT ON TABLE invnt_po_received IS 'Individual deliveries received against a purchase order; supports partial receipts with lot tracking';
COMMENT ON COLUMN invnt_po_received.id IS 'Unique identifier for the received delivery record';
COMMENT ON COLUMN invnt_po_received.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_po_received.farm_id IS 'Optional farm scope; inherited from parent invnt_po';
COMMENT ON COLUMN invnt_po_received.invnt_po_id IS 'Parent purchase order this delivery belongs to';
COMMENT ON COLUMN invnt_po_received.received_date IS 'Actual date the delivery arrived';
COMMENT ON COLUMN invnt_po_received.received_uom IS 'Unit of measure for the received quantity';
COMMENT ON COLUMN invnt_po_received.received_quantity IS 'Quantity received in the received unit';
COMMENT ON COLUMN invnt_po_received.burn_per_received IS 'Conversion factor: burn units per received unit at time of delivery';
COMMENT ON COLUMN invnt_po_received.lot_number IS 'Lot or batch number from the vendor';
COMMENT ON COLUMN invnt_po_received.lot_expiry_date IS 'Expiry date for this lot';
COMMENT ON COLUMN invnt_po_received.delivery_truck_clean IS 'Whether the delivery truck was clean upon arrival';
COMMENT ON COLUMN invnt_po_received.delivery_acceptable IS 'Whether the delivery was accepted in acceptable condition';
COMMENT ON COLUMN invnt_po_received.notes IS 'Free-text notes about the delivery';
COMMENT ON COLUMN invnt_po_received.received_photos IS 'JSON array of photo URLs documenting the delivery';
COMMENT ON COLUMN invnt_po_received.is_active IS 'Soft delete flag; false hides the record from active use';
COMMENT ON COLUMN invnt_po_received.received_at IS 'Timestamp when the delivery was recorded';
COMMENT ON COLUMN invnt_po_received.received_by IS 'Email of the user who recorded the delivery';
COMMENT ON COLUMN invnt_po_received.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_po_received.updated_by IS 'Email of the user who last updated the record';
