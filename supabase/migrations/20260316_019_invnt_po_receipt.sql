CREATE TABLE IF NOT EXISTS invnt_po_receipt (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    invnt_po_id            UUID NOT NULL REFERENCES invnt_po(id) ON DELETE CASCADE,
    receipt_date           DATE NOT NULL,
    receipt_uom            VARCHAR(10) REFERENCES util_uom(code),
    receipt_quantity       NUMERIC NOT NULL,
    receipt_burn_quantity  NUMERIC,

    -- Lot tracking
    lot_number             VARCHAR(50),
    lot_expiry_date        DATE,

    -- Delivery acceptance
    delivery_truck_clean   BOOLEAN,
    delivery_acceptable    BOOLEAN,
    receipt_notes          TEXT,
    receipt_photos         JSONB NOT NULL DEFAULT '[]',

    is_active              BOOLEAN NOT NULL DEFAULT true,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by             UUID REFERENCES auth.users(id),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by             UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invnt_po_receipt_po ON invnt_po_receipt (invnt_po_id);
CREATE INDEX idx_invnt_po_receipt_org ON invnt_po_receipt (org_id);

COMMENT ON TABLE invnt_po_receipt IS 'Individual deliveries against a purchase order; supports partial receipts with lot tracking';
COMMENT ON COLUMN invnt_po_receipt.id IS 'Unique identifier for the receipt';
COMMENT ON COLUMN invnt_po_receipt.org_id IS 'Owning organization for RLS filtering';
COMMENT ON COLUMN invnt_po_receipt.invnt_po_id IS 'Parent purchase order this receipt belongs to';
COMMENT ON COLUMN invnt_po_receipt.receipt_date IS 'Actual date the delivery arrived';
COMMENT ON COLUMN invnt_po_receipt.receipt_uom IS 'Unit of measure for the received quantity';
COMMENT ON COLUMN invnt_po_receipt.receipt_quantity IS 'Quantity received in the receipt unit';
COMMENT ON COLUMN invnt_po_receipt.receipt_burn_quantity IS 'Conversion factor: burn units per receipt unit at time of receipt';
COMMENT ON COLUMN invnt_po_receipt.lot_number IS 'Lot or batch number from the vendor';
COMMENT ON COLUMN invnt_po_receipt.lot_expiry_date IS 'Expiry date for this lot';
COMMENT ON COLUMN invnt_po_receipt.delivery_truck_clean IS 'Whether the delivery truck was clean upon arrival';
COMMENT ON COLUMN invnt_po_receipt.delivery_acceptable IS 'Whether the delivery was accepted in acceptable condition';
COMMENT ON COLUMN invnt_po_receipt.receipt_notes IS 'Free-text notes about the receipt or delivery';
COMMENT ON COLUMN invnt_po_receipt.receipt_photos IS 'JSON array of photo URLs documenting the delivery';
COMMENT ON COLUMN invnt_po_receipt.is_active IS 'Soft delete flag; false hides the receipt from active use';
COMMENT ON COLUMN invnt_po_receipt.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN invnt_po_receipt.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN invnt_po_receipt.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN invnt_po_receipt.updated_by IS 'User who last updated the record, references auth.users(id)';
