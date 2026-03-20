CREATE OR REPLACE VIEW ops_weekly_schedule AS
WITH schedule_base AS (
    -- Flatten schedule + tracker into one row per employee per task per day,
    -- and derive the Sunday-anchored week start date
    SELECT
        s.hr_employee_id,
        s.start_time                                                    AS schedule_start,
        s.stop_time                                                     AS schedule_stop,
        tt.start_time::DATE                                             AS task_date,
        tt.ops_task_id,
        tt.org_id,
        tt.farm_id,
        EXTRACT(DOW FROM tt.start_time)::INTEGER                       AS day_of_week,
        (tt.start_time::DATE - EXTRACT(DOW FROM tt.start_time)::INTEGER) AS week_start_date
    FROM ops_task_schedule s
    JOIN ops_task_tracker tt ON tt.id = s.ops_task_tracker_id
    WHERE s.is_deleted  = false
      AND tt.is_deleted = false
)
SELECT
    sb.week_start_date,
    e.first_name || ' ' || e.last_name                                  AS full_name,
    e.id                                                                AS hr_employee_id,
    sb.org_id,
    e.hr_department_id,
    e.hr_work_authorization_id,
    t.name                                                              AS task,

    -- Day columns — formatted as "HH:MM - HH:MM"; null when employee did not work that day
    MAX(CASE WHEN sb.day_of_week = 0
        THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN sb.schedule_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS sunday,
    MAX(CASE WHEN sb.day_of_week = 1
        THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN sb.schedule_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS monday,
    MAX(CASE WHEN sb.day_of_week = 2
        THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN sb.schedule_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS tuesday,
    MAX(CASE WHEN sb.day_of_week = 3
        THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN sb.schedule_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS wednesday,
    MAX(CASE WHEN sb.day_of_week = 4
        THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN sb.schedule_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS thursday,
    MAX(CASE WHEN sb.day_of_week = 5
        THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN sb.schedule_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS friday,
    MAX(CASE WHEN sb.day_of_week = 6
        THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN sb.schedule_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS saturday,

    -- Total hours worked for the week (only counts entries with a stop_time)
    ROUND(
        SUM(
            CASE WHEN sb.schedule_stop IS NOT NULL
                 THEN EXTRACT(EPOCH FROM (sb.schedule_stop - sb.schedule_start)) / 3600.0
                 ELSE 0 END
        )::NUMERIC, 2
    )                                                                   AS total_hours,

    -- Weekly OT threshold — the bi-weekly threshold halved; null if not set on employee
    CASE WHEN e.overtime_threshold IS NOT NULL
         THEN ROUND((e.overtime_threshold / 2.0)::NUMERIC, 2)
         ELSE NULL END                                                  AS ot_threshold_weekly,

    -- OT flag — true when total weekly hours exceed the weekly threshold
    CASE WHEN e.overtime_threshold IS NOT NULL
         THEN ROUND(
                  SUM(CASE WHEN sb.schedule_stop IS NOT NULL
                           THEN EXTRACT(EPOCH FROM (sb.schedule_stop - sb.schedule_start)) / 3600.0
                           ELSE 0 END
                  )::NUMERIC, 2
              ) > ROUND((e.overtime_threshold / 2.0)::NUMERIC, 2)
         ELSE false END                                                 AS is_over_ot_threshold

FROM schedule_base sb
JOIN hr_employee e  ON e.id = sb.hr_employee_id
JOIN ops_task    t  ON t.id = sb.ops_task_id
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

COMMENT ON VIEW ops_weekly_schedule IS
    'Pivoted weekly schedule view. One row per employee per task per week. '
    'Day columns show formatted start-stop times. '
    'total_hours sums completed schedule entries. '
    'ot_threshold_weekly is the bi-weekly overtime_threshold halved. '
    'is_over_ot_threshold flags employees whose total_hours exceed their weekly threshold.';
