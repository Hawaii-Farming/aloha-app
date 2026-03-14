CREATE OR REPLACE VIEW inventory_lot_summary AS
WITH lot_transactions AS (
    SELECT
        item_id,
        org_id,
        lot_number,
        lot_expiry_date,
        type,
        quantity_burn,
        burn_unit_id,
        transaction_date
    FROM inventory_transaction
    WHERE is_active = true
      AND lot_number IS NOT NULL
)
SELECT
    lt.item_id,
    lt.org_id,
    lt.lot_number,
    lt.lot_expiry_date,
    lt.burn_unit_id,
    SUM(
        CASE
            WHEN lt.type IN ('receipt', 'count') THEN lt.quantity_burn
            WHEN lt.type = 'usage' THEN -ABS(lt.quantity_burn)
            ELSE 0
        END
    ) AS lot_onhand_burn,
    MIN(lt.transaction_date) AS first_transaction_date,
    MAX(lt.transaction_date) AS last_transaction_date,
    i.name AS item_name,
    i.type AS item_type
FROM lot_transactions lt
JOIN inventory_item i ON i.id = lt.item_id
GROUP BY lt.item_id, lt.org_id, lt.lot_number, lt.lot_expiry_date, lt.burn_unit_id, i.name, i.type
HAVING SUM(
    CASE
        WHEN lt.type IN ('receipt', 'count') THEN lt.quantity_burn
        WHEN lt.type = 'usage' THEN -ABS(lt.quantity_burn)
        ELSE 0
    END
) > 0;
