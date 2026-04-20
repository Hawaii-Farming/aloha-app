---
slug: scheduler-tz-display-mismatch
status: root_cause_found
trigger: "In scheduler, user picked 9am Sunday (04/19/2026) to 9am Saturday (04/25/2026) from forms. Main scheduler page Sun column displays '14:00 - 14:00' which is wrong. Also wants time rendered in user's timezone (not Hawaii or other fixed location)."
created: 2026-04-20T18:33:45Z
updated: 2026-04-20T18:45:00Z
---

# Debug Session: scheduler-tz-display-mismatch

## Symptoms

- **Expected behavior:** Scheduler grid Sun column should display `09:00 - 09:00` (matching the time the user picked in the form), rendered in the user's local timezone.
- **Actual behavior:** Sun column header cell displays `14:00 - 14:00`. The sub-cell (row below) shows `09:00 - 09:00` with the correct date `2026-04-19` — so the underlying data carries the right times, but the summary cell renders differently.
- **Error messages:** None — silent display bug.
- **Timeline:** Not yet established. Reported fresh 2026-04-20.
- **Reproduction:** Navigate to `/home/hawaii_farming/human_resources/scheduler?week=2026-04-19`, open the create form for an employee (Josue Angel), pick start=Sun 09:00 on 2026-04-19, end=Sat 09:00 on 2026-04-25, submit. The created entry appears in the Sun column with wrong summary time `14:00 - 14:00`.
- **URL observed:** `localhost:5173/home/hawaii_farming/human_resources/scheduler?week=2026-04-26` (screenshot).
- **Screenshot reference:** Grid rows: header (Employee / Sun / Mon / ... / Sat / Total Hrs), one employee row showing Sun summary `14:00 - 14:00`, detail sub-row with `Sun 2026-04-19 / 09:00 - 09:00 14hr / Cuba Harvest, OH / FUERTE (Local)`. Total Hrs column shows `144`.

## Observations from screenshot

- Delta between displayed summary (`14:00`) and detail (`09:00`) is exactly +5h.
- Suggests summary renders UTC while detail renders local, OR summary applies a fixed offset.
- Total Hrs `144` for 6 full days (~144h) is consistent with a start→end spanning 6×24h (duration math is tz-independent, so this is not the bug).

## Scope

Two related problems:

1. **Bug:** Summary cell in scheduler grid day columns displays time in UTC instead of the user's local timezone.
2. **Enhancement:** All scheduler time rendering should adapt to the browser timezone.

Analysis below shows both resolve with a single fix (stop formatting times in SQL).

## Current Focus

```yaml
hypothesis: Scheduler grid summary cell renderer stringifies the timestamp using UTC (or an ISO-string slice) instead of formatting in the user's local timezone, producing a ~5h offset for a user outside Hawaii. Detail cell renders correctly because it uses a different formatter.
test: Locate the scheduler grid component, identify the day-column summary cell renderer, compare how it formats start/end against the detail row renderer.
expecting: Summary cell uses toISOString / toUTCString / hardcoded tz, while detail uses locale formatting. Fix is to swap summary to use the same local-timezone formatter.
next_action: None — root cause confirmed. See Resolution.
reasoning_checkpoint: null
tdd_checkpoint: null
```

## Evidence

- timestamp: 2026-04-20T18:40:00Z
  observation: |
    File `supabase/migrations/20260408000001_update_ops_task_weekly_schedule_view.sql`, view `ops_task_weekly_schedule`, lines 36–70. Each day-of-week aggregate formats the timestamp as UTC clock-time:
    ```sql
    MAX(CASE WHEN sb.day_of_week = 0
        THEN TO_CHAR(sb.schedule_start AT TIME ZONE 'UTC', 'HH24:MI')
             || CASE WHEN sb.schedule_stop IS NOT NULL
                     THEN ' - ' || TO_CHAR(sb.schedule_stop AT TIME ZONE 'UTC', 'HH24:MI')
                     ELSE '' END END)                                       AS sunday,
    ```
    `AT TIME ZONE 'UTC'` on a `TIMESTAMPTZ` returns the UTC clock reading as a `TIMESTAMP` (no zone). `TO_CHAR(..., 'HH24:MI')` then prints that UTC wall clock. For a shift stored as `2026-04-19 14:00:00+00` (user entered `09:00` Central), this produces `"14:00"` — exactly the symptom.

- timestamp: 2026-04-20T18:40:30Z
  observation: |
    File `supabase/migrations/20260401000037_ops_task_schedule.sql` confirms `start_time` and `stop_time` are `TIMESTAMPTZ`:
    ```sql
    start_time              TIMESTAMPTZ NOT NULL,
    stop_time               TIMESTAMPTZ,
    ```
    The storage itself is correct — the bug is purely in the display formatting.

- timestamp: 2026-04-20T18:41:00Z
  observation: |
    File `app/routes/api/schedule-history.ts` (detail-row path) formats times client-side using the browser timezone:
    ```ts
    const startTime = start
      ? new Date(start).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '';
    ```
    That's why the detail sub-row displays `09:00 - 09:00` correctly for a Central-Time user — it uses the browser's local zone. The summary cell is inconsistent because it comes from the SQL view, not the detail API.

- timestamp: 2026-04-20T18:41:30Z
  observation: |
    File `app/components/ag-grid/cell-renderers/schedule-day-renderer.tsx` is a thin pass-through:
    ```tsx
    export function ScheduleDayRenderer(props: CustomCellRendererProps) {
      const value = props.value as string | null | undefined;
      if (!value || value.trim() === '') { ... }
      return <span className="...">{value}</span>;
    }
    ```
    It renders whatever the view produced. So the only way to get the summary into local tz is to return raw timestamps from the view and format them here.

- timestamp: 2026-04-20T18:42:00Z
  observation: |
    File `app/lib/crud/ops-task-schedule.config.ts` (list view: `ops_task_weekly_schedule`) routes the scheduler list to the custom `SchedulerListView`, whose day-column fields are `sunday`..`saturday` strings pulled directly from the view.

- timestamp: 2026-04-20T18:42:30Z
  observation: |
    File `packages/ui/src/kit/form-fields.tsx` `FormDateTimeField` (used by the scheduler create form for `start_time`/`stop_time`) commits the selection via `formatISO(next)` where `next = new Date(date); next.setHours(Number(h), Number(m))`. This produces an ISO string with the browser's local offset (e.g., `2026-04-19T09:00:00-05:00` for Central). When stored in `TIMESTAMPTZ`, Postgres normalizes to UTC (`2026-04-19T14:00:00Z`). Storage side is correct.

- timestamp: 2026-04-20T18:43:00Z
  observation: |
    Secondary concern (not part of reported symptom but related): `day_of_week = EXTRACT(DOW FROM s.start_time)::INTEGER` in the view is evaluated in the database session's timezone (typically UTC). For shifts near midnight user-local, the DOW bucket may disagree with the day on which the detail row shows the shift. After the fix (see Resolution), the view should compute `day_of_week` and `week_start_date` in a consistent, explicit way — but without a browser-tz signal the server can't do this perfectly. Simplest path: also move day bucketing to the client for the `sunday..saturday` roll-up, OR add an `org.timezone` column for a sane fallback. Flagging for follow-up.

## Eliminated

- "Detail row formatter is wrong" — ruled out; detail uses `toLocaleTimeString` (browser-local), matches user input.
- "Form writes wrong timestamp" — ruled out; form uses `formatISO(localDate)` which correctly encodes local offset, Postgres normalizes to UTC in `TIMESTAMPTZ`. Round-trip through the view is what breaks display.
- "Renderer has a bug" — `ScheduleDayRenderer` is a pass-through; the pre-formatted UTC string it receives is correct per the view's logic.
- "Hardcoded Hawaii offset somewhere" — no; the offset comes from `AT TIME ZONE 'UTC'` in the SQL view, not a per-org value.

## Resolution

root_cause: |
  In the SQL view `ops_task_weekly_schedule` (migration `20260408000001_update_ops_task_weekly_schedule_view.sql`, lines 36–70), each day column pre-formats the `TIMESTAMPTZ` start/stop as `TO_CHAR(... AT TIME ZONE 'UTC', 'HH24:MI')`. This produces the UTC wall-clock time as a fixed string. Because SQL runs server-side, it cannot know the end user's browser timezone — so the summary cell shows UTC (`14:00`) while the detail sub-row (formatted client-side with `toLocaleTimeString`) shows the correct local time (`09:00`). The +5h delta = US Central Time offset from UTC. Additionally, this pattern is incompatible with the enhancement requirement that times render in the end user's local timezone.

fix: |
  Move all time-of-day formatting for the scheduler out of SQL and into the client. Recommended plan:

  1. **SQL view** (`supabase/migrations/<new>_update_ops_task_weekly_schedule_view.sql`): drop the `TO_CHAR(... AT TIME ZONE 'UTC', ...)` formatting. Emit `sunday`, `monday`, ..., `saturday` as `JSONB` (or two columns per day: `sunday_start TIMESTAMPTZ`, `sunday_stop TIMESTAMPTZ`) so the client receives raw timestamps. Simplest minimal-change shape per day:
     ```sql
     MAX(CASE WHEN sb.day_of_week = 0
         THEN jsonb_build_object('start', sb.schedule_start, 'stop', sb.schedule_stop)
         END) AS sunday
     ```
     (Supabase-js will deserialize the timestamps back as ISO strings inside the JSON, which `new Date(...)` parses correctly.)

  2. **Types regen**: human runs `npx supabase gen types --lang typescript --linked > app/lib/database.types.ts`.

  3. **Renderer** (`app/components/ag-grid/cell-renderers/schedule-day-renderer.tsx`): accept the JSON `{ start, stop }` value, render via `toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })` — same formatter used in `app/routes/api/schedule-history.ts` for the detail row. This guarantees summary and detail match, and both follow the user's browser timezone.

  4. **Column config** (`app/components/ag-grid/scheduler-list-view.tsx`): `dataColDefs` day columns already point at `field: 'sunday' | 'monday' | ...`, no change needed. AG Grid will pass the JSON object straight to the renderer via `props.value`.

  5. **Secondary fix (day-of-week bucketing)**: The view's `day_of_week = EXTRACT(DOW FROM s.start_time)` is UTC-biased for the same reason. For shifts at midnight boundaries the day bucket could disagree with the detail row. Two options:
     - **Short-term:** leave as-is (known minor edge case; does not repro in user's current scenario).
     - **Long-term:** drop day-of-week aggregation in SQL, return one row per schedule entry, aggregate by `day = new Date(start).getDay()` in the client. Moves all tz decisions to the browser.

  Recommend tackling steps 1–4 as the shipping fix (resolves reported bug + enhancement). Flag step 5 as a follow-up ticket.

verification: |
  Manual reproduction:
  - Start app, sign in, navigate to `/home/hawaii_farming/human_resources/scheduler?week=2026-04-19`.
  - Create a shift for any employee with start=Sun 09:00 (local), stop=Sun 17:00 (local).
  - Confirm Sun column summary displays `09:00 - 17:00` (matches input).
  - Expand the detail row, confirm `09:00 - 17:00` matches.
  - Change OS timezone (e.g., switch laptop from Central to Pacific), hard-refresh; summary should display `07:00 - 15:00` without any DB migration.
  - Spot-check a shift near UTC midnight (e.g., local 22:00 Sun → 06:00 Mon) to confirm day bucketing (step 5 note above).

files_changed: |
  (Not yet applied — awaiting user direction.)
  Planned:
    - supabase/migrations/<new-ts>_update_ops_task_weekly_schedule_view.sql  (replaces or follows 20260408000001)
    - app/lib/database.types.ts  (regenerated after `supabase db push`)
    - app/components/ag-grid/cell-renderers/schedule-day-renderer.tsx  (accept JSON value, format client-side)
    - (possibly) app/components/ag-grid/scheduler-list-view.tsx  (type annotations for the new value shape)

specialist_hint: typescript
</content>
</invoke>