CREATE OR REPLACE VIEW inventory_item_summary AS
WITH latest_transaction AS (
    SELECT DISTINCT ON (item_id)
        item_id,
        quantity_onhand,
        onhand_unit_id,
        burn_per_onhand_unit,
        transaction_date
    FROM inventory_transaction
    WHERE is_active = true
    ORDER BY item_id, transaction_date DESC, created_at DESC
),
on_order AS (
    SELECT
        item_id,
        COALESCE(SUM(quantity_burn), 0) AS on_order_burn
    FROM inventory_order
    WHERE is_active = true
      AND item_id IS NOT NULL
      AND status IN ('approved', 'ordered', 'partial')
    GROUP BY item_id
)
SELECT
    i.id AS item_id,
    i.org_id,
    i.farm_id,
    i.name,
    i.type,
    i.category_id,
    i.supplier_id,
    i.is_frequently_used,
    i.auto_order_enabled,
    i.burn_per_week,
    i.cushion_weeks,
    i.reorder_point_burn,
    i.reorder_quantity_burn,

    COALESCE(lt.quantity_onhand, 0) AS current_onhand_units,
    COALESCE(lt.quantity_onhand * lt.burn_per_onhand_unit, 0) AS current_onhand_burn,
    lt.transaction_date AS last_transaction_date,
    CURRENT_DATE - lt.transaction_date AS days_since_last_transaction,

    COALESCE(oo.on_order_burn, 0) AS on_order_burn,

    CASE
        WHEN COALESCE(i.burn_per_week, 0) > 0
        THEN COALESCE(lt.quantity_onhand * lt.burn_per_onhand_unit, 0) / i.burn_per_week
        ELSE NULL
    END AS weeks_on_hand,

    CASE
        WHEN COALESCE(i.burn_per_week, 0) > 0 AND lt.transaction_date IS NOT NULL
        THEN lt.transaction_date + (
            COALESCE(lt.quantity_onhand * lt.burn_per_onhand_unit, 0) / i.burn_per_week * 7
            - COALESCE(i.cushion_weeks, 0) * 7
        )::INT
        ELSE NULL
    END AS next_order_date

FROM inventory_item i
LEFT JOIN latest_transaction lt ON lt.item_id = i.id
LEFT JOIN on_order oo ON oo.item_id = i.id
WHERE i.is_active = true;
