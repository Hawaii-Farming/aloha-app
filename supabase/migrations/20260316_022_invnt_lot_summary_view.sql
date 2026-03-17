CREATE OR REPLACE VIEW invnt_lot_summary AS
SELECT DISTINCT ON (invnt_item_id, lot_number)
    org_id,
    invnt_item_id,
    lot_number,
    lot_expiry_date,
    onhand_uom,
    onhand_quantity,
    onhand_burn_quantity,
    onhand_date,
    created_at,
    created_by,
    updated_at,
    updated_by
FROM invnt_onhand
WHERE is_active = true
  AND lot_number IS NOT NULL
  AND onhand_quantity > 0
ORDER BY invnt_item_id, lot_number, onhand_date DESC, created_at DESC;

COMMENT ON VIEW invnt_lot_summary IS 'Latest on-hand snapshot per item and lot number combination; only includes lots with positive stock';
