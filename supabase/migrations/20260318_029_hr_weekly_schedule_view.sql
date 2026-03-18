CREATE OR REPLACE VIEW hr_weekly_schedule AS
WITH roster_base AS (
    -- Flatten roster + tracker into one row per employee per task per day,
    -- and derive the Sunday-anchored week start date
    SELECT
        r.employee_id,
        r.start_time                                                    AS roster_start,
        r.stop_time                                                     AS roster_stop,
        tt.date                                                         AS task_date,
        tt.task_id,
        tt.org_id,
        tt.farm_id,
        EXTRACT(DOW FROM tt.date)::INTEGER                              AS day_of_week,
        (tt.date - EXTRACT(DOW FROM tt.date)::INTEGER)                 AS week_start_date
    FROM hr_task_roster r
    JOIN hr_task_tracker tt ON tt.id = r.task_tracker_id
    WHERE r.is_active  = true
      AND tt.is_active = true
)
SELECT
    rb.week_start_date,
    e.first_name || ' ' || e.last_name                                  AS full_name,
    e.id                                                                AS employee_id,
    rb.org_id,
    e.department,
    e.work_authorization,
    t.name                                                              AS task,

    -- Day columns — formatted as "HH:MM - HH:MM"; null when employee did not work that day
    MAX(CASE WHEN rb.day_of_week = 0
        THEN TO_CHAR(rb.roster_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN rb.roster_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(rb.roster_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS sunday,
    MAX(CASE WHEN rb.day_of_week = 1
        THEN TO_CHAR(rb.roster_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN rb.roster_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(rb.roster_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS monday,
    MAX(CASE WHEN rb.day_of_week = 2
        THEN TO_CHAR(rb.roster_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN rb.roster_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(rb.roster_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS tuesday,
    MAX(CASE WHEN rb.day_of_week = 3
        THEN TO_CHAR(rb.roster_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN rb.roster_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(rb.roster_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS wednesday,
    MAX(CASE WHEN rb.day_of_week = 4
        THEN TO_CHAR(rb.roster_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN rb.roster_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(rb.roster_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS thursday,
    MAX(CASE WHEN rb.day_of_week = 5
        THEN TO_CHAR(rb.roster_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN rb.roster_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(rb.roster_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS friday,
    MAX(CASE WHEN rb.day_of_week = 6
        THEN TO_CHAR(rb.roster_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN rb.roster_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(rb.roster_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                   AS saturday,

    -- Total hours worked for the week (only counts entries with a stop_time)
    ROUND(
        SUM(
            CASE WHEN rb.roster_stop IS NOT NULL
                 THEN EXTRACT(EPOCH FROM (rb.roster_stop - rb.roster_start)) / 3600.0
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
                  SUM(CASE WHEN rb.roster_stop IS NOT NULL
                           THEN EXTRACT(EPOCH FROM (rb.roster_stop - rb.roster_start)) / 3600.0
                           ELSE 0 END
                  )::NUMERIC, 2
              ) > ROUND((e.overtime_threshold / 2.0)::NUMERIC, 2)
         ELSE false END                                                 AS is_over_ot_threshold

FROM roster_base rb
JOIN hr_employee e ON e.id = rb.employee_id
JOIN hr_task     t ON t.id = rb.task_id
WHERE e.is_active = true
GROUP BY
    rb.week_start_date,
    rb.org_id,
    rb.farm_id,
    e.id,
    e.first_name,
    e.last_name,
    e.department,
    e.work_authorization,
    e.overtime_threshold,
    t.name
ORDER BY
    rb.week_start_date,
    e.last_name,
    e.first_name;

COMMENT ON VIEW hr_weekly_schedule IS
    'Pivoted weekly schedule view. One row per employee per task per week. '
    'Day columns show formatted start-stop times. '
    'total_hours sums completed roster entries. '
    'ot_threshold_weekly is the bi-weekly overtime_threshold halved. '
    'is_over_ot_threshold flags employees whose total_hours exceed their weekly threshold.';
