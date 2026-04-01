-- Add security_invoker = true to views that were missing it.
-- Without security_invoker, views bypass RLS of their underlying tables.

-- invnt_item_summary: recreate with security_invoker
CREATE OR REPLACE VIEW invnt_item_summary
WITH (security_invoker = true)
AS
WITH latest_onhand AS (
    SELECT DISTINCT ON (invnt_item_id)
        invnt_item_id,
        onhand_quantity,
        onhand_uom,
        burn_per_onhand,
        onhand_date
    FROM invnt_onhand
    WHERE is_deleted = false
    ORDER BY invnt_item_id, onhand_date DESC, created_at DESC
),
open_orders AS (
    SELECT
        po.invnt_item_id,
        COALESCE(SUM(po.order_quantity * po.burn_per_order), 0) AS ordered_quantity_in_burn,
        COALESCE(SUM(r.received_quantity_in_burn), 0) AS received_quantity_in_burn
    FROM invnt_po po
    LEFT JOIN (
        SELECT
            invnt_po_id,
            SUM(received_quantity * burn_per_received) AS received_quantity_in_burn
        FROM invnt_po_received
        WHERE is_deleted = false
        GROUP BY invnt_po_id
    ) r ON r.invnt_po_id = po.id
    WHERE po.is_deleted = false
      AND po.invnt_item_id IS NOT NULL
      AND po.status IN ('approved', 'ordered', 'partial')
    GROUP BY po.invnt_item_id
)
SELECT
    i.org_id,
    i.farm_id,
    i.id AS invnt_item_id,
    i.invnt_category_id,
    i.invnt_subcategory_id,
    i.invnt_vendor_id,
    i.burn_uom,
    i.onhand_uom,
    i.order_uom,
    i.burn_per_onhand,
    i.burn_per_order,
    i.is_frequently_used,
    i.burn_per_week,
    i.cushion_weeks,
    i.is_auto_reorder,
    i.reorder_point_in_burn,
    i.reorder_quantity_in_burn,
    COALESCE(lo.onhand_quantity, 0) AS onhand_quantity,
    COALESCE(lo.onhand_quantity * lo.burn_per_onhand, 0) AS onhand_quantity_in_burn,
    lo.onhand_date,
    CURRENT_DATE - lo.onhand_date AS days_since_onhand,
    COALESCE(oo.ordered_quantity_in_burn, 0) AS ordered_quantity_in_burn,
    COALESCE(oo.received_quantity_in_burn, 0) AS received_quantity_in_burn,
    COALESCE(oo.ordered_quantity_in_burn, 0) - COALESCE(oo.received_quantity_in_burn, 0) AS remaining_quantity_in_burn,
    CASE
        WHEN COALESCE(i.burn_per_week, 0) > 0
        THEN COALESCE(lo.onhand_quantity * lo.burn_per_onhand, 0) / i.burn_per_week
        ELSE NULL
    END AS weeks_on_hand,
    CASE
        WHEN COALESCE(i.burn_per_week, 0) > 0 AND lo.onhand_date IS NOT NULL
        THEN lo.onhand_date + (
            COALESCE(lo.onhand_quantity * lo.burn_per_onhand, 0) / i.burn_per_week * 7
            - COALESCE(i.cushion_weeks, 0) * 7
        )::INT
        ELSE NULL
    END AS next_order_date
FROM invnt_item i
LEFT JOIN latest_onhand lo ON lo.invnt_item_id = i.id
LEFT JOIN open_orders oo ON oo.invnt_item_id = i.id
WHERE i.is_deleted = false;

-- ops_weekly_schedule: recreate with security_invoker
CREATE OR REPLACE VIEW ops_weekly_schedule
WITH (security_invoker = true)
AS
WITH schedule_base AS (
    SELECT
        s.hr_employee_id,
        s.ops_task_id,
        s.org_id,
        s.farm_id,
        s.start_time AS schedule_start,
        s.stop_time AS schedule_stop,
        s.start_time::DATE AS task_date,
        EXTRACT(DOW FROM s.start_time)::INTEGER AS day_of_week,
        (s.start_time::DATE - EXTRACT(DOW FROM s.start_time)::INTEGER) AS week_start_date
    FROM ops_task_schedule s
    WHERE s.ops_task_tracker_id IS NULL
      AND s.start_time IS NOT NULL
      AND s.is_deleted = false
)
SELECT
    sb.week_start_date,
    e.first_name || ' ' || e.last_name AS full_name,
    e.id AS hr_employee_id,
    sb.org_id,
    e.hr_department_id,
    e.hr_work_authorization_id,
    t.name AS task,
    MAX(CASE WHEN sb.day_of_week = 0 THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI') || CASE WHEN sb.schedule_stop IS NOT NULL THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI') ELSE '' END END) AS sunday,
    MAX(CASE WHEN sb.day_of_week = 1 THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI') || CASE WHEN sb.schedule_stop IS NOT NULL THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI') ELSE '' END END) AS monday,
    MAX(CASE WHEN sb.day_of_week = 2 THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI') || CASE WHEN sb.schedule_stop IS NOT NULL THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI') ELSE '' END END) AS tuesday,
    MAX(CASE WHEN sb.day_of_week = 3 THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI') || CASE WHEN sb.schedule_stop IS NOT NULL THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI') ELSE '' END END) AS wednesday,
    MAX(CASE WHEN sb.day_of_week = 4 THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI') || CASE WHEN sb.schedule_stop IS NOT NULL THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI') ELSE '' END END) AS thursday,
    MAX(CASE WHEN sb.day_of_week = 5 THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI') || CASE WHEN sb.schedule_stop IS NOT NULL THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI') ELSE '' END END) AS friday,
    MAX(CASE WHEN sb.day_of_week = 6 THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI') || CASE WHEN sb.schedule_stop IS NOT NULL THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI') ELSE '' END END) AS saturday,
    ROUND(
        SUM(
            CASE WHEN sb.schedule_stop IS NOT NULL
                 THEN EXTRACT(EPOCH FROM (sb.schedule_stop - sb.schedule_start)) / 3600.0
                 ELSE 0 END
        )::NUMERIC, 2
    ) AS total_hours,
    CASE WHEN e.overtime_threshold IS NOT NULL
         THEN ROUND((e.overtime_threshold / 2.0)::NUMERIC, 2)
         ELSE NULL END AS ot_threshold_weekly,
    CASE WHEN e.overtime_threshold IS NOT NULL
         THEN ROUND(
                  SUM(CASE WHEN sb.schedule_stop IS NOT NULL
                           THEN EXTRACT(EPOCH FROM (sb.schedule_stop - sb.schedule_start)) / 3600.0
                           ELSE 0 END
                  )::NUMERIC, 2
              ) > ROUND((e.overtime_threshold / 2.0)::NUMERIC, 2)
         ELSE false END AS is_over_ot_threshold
FROM schedule_base sb
JOIN hr_employee e ON e.id = sb.hr_employee_id
JOIN ops_task t ON t.id = sb.ops_task_id
WHERE e.is_deleted = false
GROUP BY
    sb.week_start_date,
    sb.org_id,
    sb.farm_id,
    e.id,
    e.first_name,
    e.last_name,
    e.hr_department_id,
    e.hr_work_authorization_id,
    e.overtime_threshold,
    t.name
ORDER BY
    sb.week_start_date,
    e.last_name,
    e.first_name;
