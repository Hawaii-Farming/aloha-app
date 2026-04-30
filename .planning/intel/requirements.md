# Requirements (extracted from ingested DOCs)

> Status: PROPOSED — derived from APPSHEET_SCRIPTS.md as functional intent for the migration. The source is a DOC (not a PRD), so these requirements have no formal acceptance criteria and the lowest precedence in the default ordering. Roadmapper should elevate, refine, and assign IDs through `/gsd-new-milestone`.
> All requirements are unblocked as of 2026-04-29 — payroll processing is now in-scope for the AppSheet Scripts Migration milestone (see PROJECT.md Key Decisions + `INGEST-CONFLICTS.md` INFO note on resolution).

---

## REQ-email-weekly-schedule

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`emailSchedule`)
- scope: weekly schedule distribution
- description: Generate four PDF schedule reports (Cuke GH, Cuke PH, Lettuce GH/PH, Full) from the current weekly schedule data and email them to a configured recipient with a Honolulu-time timestamped subject line.
- legacy trigger: `hr_print_sched` sheet — last row supplies `scheduleType` (col A) and recipient email (col B); after send, the trigger sheet is cleared.
- acceptance (proposed, not authoritative):
  - Subject format: `{scheduleType} Schedules YYYY-MM-DD HH:mm` (Pacific/Honolulu)
  - Four PDF attachments delivered together
  - Trigger row(s) cleared after successful send
- status: proposed

## REQ-process-hrb-payroll

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`runPayroll`)
- scope: payroll ingest + transformation
- description: Read 6 input tabs (`$data`, `NetPay`, `Hours`, `PTOBank`, `WC`, `TDI`) from the HRB workbook, normalize employee IDs and names, validate that every payroll record has a matching employee in `hr_ee_register`, compute per-row pay/hours/cost projections (overtime split, period-spanning month proration, year/week derivation, WC code resolution), append to `hr_ee_payroll`, archive the source workbook (or its raw payload — replacement strategy TBD per D-PROPOSED-06 follow-up), clear input staging, and trigger `payrollSchedComparison`.
- target architecture (per PROJECT.md Key Decisions 2026-04-29): staging tables (one per HRB source tab) → transformation service → `hr_ee_payroll`.
- acceptance (proposed):
  - Validation halt on missing employee IDs returns a human-readable list
  - Output row schema matches the 60+ column layout enumerated in the source (full_name, employee_id, pay_period, check_date, …, entry_id, updated_date_time)
  - `is_standard` derived from per-invoice hours sum > 5000
  - Discretionary OT computed as `max(total_hours - overtime_threshold, 0)`
  - Period-spanning months produce two rows of derived (h1, h2, t1, t2, d1, d2) splits
  - All computations preserved verbatim per C-PRESERVE-COMPUTATION-FIDELITY (overtime split, cost-per-hour proration, WC code precedence, rounding, etc.)
  - Employee-ID and name normalization preserved per C-PRESERVE-NORMALIZATION-RULES
- status: proposed

## REQ-rollover-daily-schedule

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`updateDailySched`)
- scope: weekly schedule rollover
- description: For the current Honolulu-local week, delete any existing next-week rows in `hr_ee_sched_daily`, clone every current-week row forward by exactly 7 days (recomputing Date, Year, Week, DayofWeek, EntryID, UpdatedDateTime), then trigger `updateWeekSched`.
- acceptance (proposed):
  - Sunday is treated as the week boundary (`getDay() === 0`)
  - Week number = `ceil(((newDate - startOfYear)/86400000 + startOfYear.getDay() + 1) / 7)`
  - DayofWeek written as `getDay() + 1` (1–7)
  - New `EntryID` per cloned row
- status: proposed

## REQ-aggregate-weekly-schedule

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`updateWeekSched`)
- scope: weekly schedule aggregation per employee × task
- description: From `hr_ee_sched_daily`, group by `(WeekStartDate, employee_id, FullName, Department, Status, Task)` and produce one row per group with seven `days[0..6]` time-range strings (`HH:MM - HH:MM`, comma-joined when a day has multiple ranges) plus a totalHours rollup, week number, year, EntryID, UpdatedDateTime; overwrite all body rows of `hr_ee_sched_weekly`.
- acceptance (proposed):
  - Time formatting strips seconds (`split(":").slice(0,2).join(":")`)
  - Multiple time ranges per day comma-joined in source order
  - Week number formula identical to REQ-rollover-daily-schedule
- status: proposed

## REQ-aggregate-weekly-schedule-summary

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`updateWeekSchedSummary`)
- scope: per-week-per-task hours+headcount summary, plus per-week Total row
- description: From `hr_ee_sched_daily`, produce two grouping levels — `(WeekStartDate, Task)` and `(WeekStartDate, "Total")` — emitting per-day unique-employee headcount and per-day hours sum across the week, plus a totalHours, weekNumber, year, EntryID, UpdatedDateTime; overwrite all body rows of `hr_ee_sched_weekly_tasks`.
- acceptance (proposed):
  - Skip rows lacking week, task, hours, or a Date instance
  - Unique-employee count is per (week, task, dayIndex), not double-counted
  - Total row aggregates across all tasks for the same week
- status: proposed

## REQ-compare-payroll-vs-schedule

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`payrollSchedComparison`)
- scope: payroll-by-task projection
- description: For payroll rows from check dates ≥ 2025 with a non-empty pay_period, group by `(full_name, check_date)`, look up that employee's weekly schedule rows whose `WeekStartDate` falls within the pay period, map each schedule task to its QuickBooks account via `hr_ee_tasks.QuickBooksAccount` (fallback: department), then split the payroll cost/hours across accounts proportionally to scheduled hours; emit one row per (employee, check_date, account) into `hr_ee_payroll_by_tasks`. If no schedule found, emit a single row bucketed to WC code/department with zero scheduled hours.
- partial overlap (auto-resolved): v1.0 already ships `Payroll Comparison submodule — by-task/by-employee toggle…` reading existing payroll data. This requirement defines the *generation* of the by-task projection that submodule consumes; the existing UI contract wins on display, the incoming DOC contributes the projection logic.
- upstream dependency: now consumes `hr_ee_payroll` rows produced by REQ-process-hrb-payroll (in-app as of 2026-04-29) instead of externally-imported rows.
- acceptance (proposed):
  - Date-code comparison via `YYYYMMDD` integer (formattedDateCode)
  - Schedule total scaled to payroll total when they differ (`scale = payrollTotalHours / schedTotal`)
  - Per-account ratio applied to `regular_hours`, `discretionary_overtime_hours`, `regular_pay`, `discretionary_overtime_pay`, `total_cost`
  - Round to 2 decimals using `Math.round((val + EPSILON) * 100) / 100`
  - WC code prefixed with single quote (`'`) on output (Sheets text-cast workaround — safe to drop in Postgres)
- status: proposed

## REQ-seed-quarterly-review-rows

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`createReviewData`)
- scope: quarterly hr_employee_review row generation
- description: On a quarterly cadence (only month 2 of each quarter: Feb, May, Aug, Nov), iterate `hr_ee_register`, filter to employees who are (a) `IsActive` true, (b) have a non-empty `TeamLead`, (c) `StartDate < quarter.start`, (d) either no `EndDate` or `EndDate > nextQuarter.end`. For any eligible employee without an existing review row for the current `(year, "Q{quarter}")`, insert a new pending review row with empty score fields, fresh EntryID, current timestamp, and `is_locked = false`.
- partial overlap (auto-resolved): v1.0 already ships `Employee Review submodule — quarterly scores with color coding, Year-Quarter filter, lock enforcement`. This requirement defines the *seeding* of pending rows the submodule then collects scores for; existing UI/lock contract wins.
- acceptance (proposed):
  - Deduplicate via `(year, quarter, employee_id)` against existing rows before insert
  - Quarter formatted as `Q1|Q2|Q3|Q4`
  - Eligibility uses normalized `employee_id` for the existence check
  - No-op outside of months 2/5/8/11
- status: proposed
