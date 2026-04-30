# Context (legacy module summary + migration phasing notes)

> Source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (DOC, classification confidence: high)
> Purpose: Verbatim reference notes for downstream roadmapping. The source document is a code-heavy procedural dump of legacy Google Apps Script automations slated for migration to Supabase + RR7.
> Scope status: All 7 legacy functions are now in-scope for the AppSheet Scripts Migration milestone as of 2026-04-29 (PROJECT.md Key Decisions reversal — payroll processing brought in-scope).

---

## Legacy module inventory

The legacy automation system is built on a single Google Sheet (`13DUQTQyZf0CW07xv4FJ4ukP2x3Yoz8PyAw3Z2SwNsts`) acting as a database, plus an HRB payroll workbook (`1HLX11I82ADv_ypFztMIMTF4xw6axcGUVTLkxV_CcTo0`) imported on demand, and an HRB Drive archive folder (`1ALCDDV5ob1MsmwO-YB1nVtauua2jSS17`). Six top-level functions:

### 1. `emailSchedule()` — weekly schedule PDF distribution
- Reads trigger row from `hr_print_sched` tab (last row → scheduleType, recipient email).
- Exports four sheet tabs as PDFs via `docs.google.com/spreadsheets/.../export?format=pdf` with `ScriptApp.getOAuthToken()`.
  - `print_cuke_gh_sched` → `Cuke_GH_tasks.pdf`
  - `print_cuke_ph_sched` → `Cuke_PH_tasks.pdf`
  - `print_lettuce_sched` → `Lettuce_all_tasks.pdf`
  - `print_full_sched` → `Full_Schedule.pdf`
- Sends one email via `MailApp.sendEmail` with all four PDFs attached, subject `"{type} Schedules YYYY-MM-DD HH:mm"` (HST), then `Utilities.sleep(5000)` and clears the trigger sheet body.

### 2. `runPayroll()` — HRB payroll ingest into `hr_ee_payroll`
- Reads 6 tabs from HRB workbook: `$data`, `NetPay`, `Hours`, `PTOBank`, `WC`, `TDI`.
- Builds employee-ID maps from each tab using source-specific name regexes (see C-PRESERVE-NORMALIZATION-RULES).
- Validates every payroll record has a matching `hr_ee_register` row; halts with a human-readable list of missing IDs if any are found.
- For each `$data` row, derives ~60 fields including period-spanning month splits (d1/d2/h1/h2/t1/t2), discretionary overtime, WC code+amount, deduction roll-ups, ISO weeks, etc., then appends to `hr_ee_payroll`.
- Backs up the HRB workbook to the HRB Drive folder under `{maxCheckDate}_processed_{HST timestamp}`.
- Clears the 6 input tabs and chains into `payrollSchedComparison()`.
- **Scope:** In-scope as of 2026-04-29 (PROJECT.md Key Decisions: "Payroll processing brought in-scope"). Target architecture: staging tables (one per HRB source tab) → transformation service → `hr_ee_payroll`. Source-file archival replacement (Supabase Storage vs. raw-payload audit table) is an open follow-up for the roadmapper.

### 3. `updateDailySched()` — weekly rollover of `hr_ee_sched_daily`
- HST-anchored "today" → this Sunday → next Sunday boundaries.
- First pass: drop all rows whose display `WeekStartDate` matches next-week's `M/d/yyyy`; collect current-week rows for cloning.
- Second pass: clone each current-week row, advance Date by exactly 7 days, recompute Year, Week (`ceil(...)` formula), DayofWeek (`getDay()+1`), generate fresh EntryID + UpdatedDateTime.
- Single clear-and-write operation on the tab; chains into `updateWeekSched()`.

### 4. `updateWeekSched()` — aggregate `hr_ee_sched_daily` → `hr_ee_sched_weekly`
- Group by `(WeekStartDate, employee_id, FullName, Department, Status, Task)`.
- Per-day cells (`days[0..6]`) hold `HH:MM - HH:MM` ranges (multiple ranges joined with `,`).
- Output also carries totalHours, weekNumber, currentYear, EntryID, UpdatedDateTime.
- Clears existing body rows and writes the aggregate in one operation. Note: `updateWeekSchedSummary()` is currently commented out at the chain end.

### 5. `updateWeekSchedSummary()` — `hr_ee_sched_daily` → `hr_ee_sched_weekly_tasks`
- Two parallel groupings emitted into the same output: `(week, task)` and `(week, "Total")`.
- Per-day unique-employee count (Set-equivalent via object keys) plus per-day hours sum across the week.

### 6. `payrollSchedComparison()` — `hr_ee_payroll` × `hr_ee_sched_weekly` × `hr_ee_tasks` → `hr_ee_payroll_by_tasks`
- Filter payroll to `check_date.year >= 2025` and non-empty `pay_period`.
- Group payroll by `(full_name, check_date)` and pre-sum the relevant hours/cost columns.
- Build a schedule lookup keyed by `normName(FullName)`.
- For each grouped payroll record: filter that employee's schedule entries whose `WeekStartDate` falls within the pay period (compared as `YYYYMMDD` integer), aggregate hours by QuickBooks account (via `hr_ee_tasks.QuickBooksAccount`, fallback to department), scale to match payroll total hours when totals diverge, then split cost/hours proportionally per account.
- Emits one output row per (payroll record × account) into `hr_ee_payroll_by_tasks`. If no schedule found, emits a single fallback row.

### 7. `createReviewData()` — quarterly seed of `hr_quarterly_review`
- No-op outside months 2/5/8/11.
- Eligibility: `IsActive == true|"true"`, has `TeamLead`, `StartDate < quarter.start`, no `EndDate` or `EndDate > nextQuarter.end`.
- Dedup against existing rows for `(year, "Q{quarter}", normId(employee_id))`.
- Inserts pending rows with empty score fields, fresh EntryID, `is_locked: false`, current timestamp.

### Shared helpers (must be preserved or replaced functionally equivalently)
- `normId(v)` — strip non-digits, trim.
- `normName(name)` — lowercase, collapse whitespace, trim.
- `isoDate(d)` — UTC YYYY-MM-DD.
- `extractColumns(data, headers)` — header-row-driven projection from a 2D array.
- `toMap(arr, keyFn)` — array → keyed map by computed key.
- `invSummary(data)` — sum `Hours` per `Inv No`.
- `generateUniqueId()` — 8-char alphanumeric (lowercase a–z + 0–9). Replace with `gen_random_uuid()` or `nanoid`.
- `formattedDateCode(value)` — `YYYYMMDD` integer for date comparisons (handles both `Date` and `M/d/yy[yy]` strings).
- `round(val)` — `Math.round((val + Number.EPSILON) * 100) / 100`.
- `getCurrentQuarter()` / `getQuarterDates(year, quarter)` — quarter math.

---

## Existing-app overlap map

How each legacy module relates to what is already shipped (per PROJECT.md / MILESTONES.md). Auto-resolved: existing v1.0 UI/data-display contracts win for the display layer; the incoming DOC contributes the automation/computation layer feeding them.

| Legacy function | Existing v1.0 surface | Migration disposition |
|---|---|---|
| `emailSchedule` | (none) | NEW capability — schedule export + email is not yet in-app. Greenfield. |
| `runPayroll` | (now in-scope per PROJECT.md 2026-04-29) | Greenfield ingest pipeline (staging tables → transformation service → `hr_ee_payroll`). Existing Payroll Data submodule continues to render `hr_ee_payroll` rows; this function now produces them. |
| `updateDailySched` | Scheduler submodule (v1.0 Phase 2) renders weekly schedule; rollover automation is not in-app. | Greenfield automation feeding the existing UI's data source. |
| `updateWeekSched` | Hours Comparison + Scheduler views (v1.0) read `hr_ee_sched_weekly` (or its Postgres analog). | Greenfield aggregation. UI consumers already exist. |
| `updateWeekSchedSummary` | (none — currently commented out at chain end) | Optional. May not be needed if SQL views can replace pre-aggregated table. |
| `payrollSchedComparison` | Payroll Comparison submodule (v1.0 Phase 4) renders by-task/by-employee toggle. | The submodule reads the projection; this function generates it. Now consumes `hr_ee_payroll` rows produced in-app by the migrated `runPayroll`. |
| `createReviewData` | Employee Review submodule (v1.0 Phase 6) — quarterly scores, Year-Quarter filter, lock enforcement, scored avg via `GENERATED ALWAYS AS STORED`. | Greenfield seeding automation feeding the existing review UI. Must respect existing `is_locked` semantics. |

---

## Suggested migration phasing (proposed, not authoritative)

> Roadmapper owns the actual milestone breakdown. This is a hint based on dependency direction. All three phases are now in-scope as of 2026-04-29.

1. **Phase A — Greenfield, low-risk schedule + review automations.**
   - `updateDailySched` + `updateWeekSched` (+ optionally `updateWeekSchedSummary`) as scheduled jobs writing to existing Postgres tables/views. Replaces sheet-based rollover and aggregation that today's Scheduler/Hours-Comparison views consume.
   - `createReviewData` as a quarterly cron seeding `hr_employee_review`.
   - `emailSchedule` as an on-demand server route + edge PDF render + existing mailer.

2. **Phase B — Payroll ingest (`runPayroll`).**
   - Build HRB staging tables (one per source tab: `$data`, `NetPay`, `Hours`, `PTOBank`, `WC`, `TDI`) as the upload landing zone.
   - Transformation service applies all derivations per C-PRESERVE-COMPUTATION-FIDELITY and C-PRESERVE-NORMALIZATION-RULES, validates against `hr_ee_register`, and writes `hr_ee_payroll`.
   - Source-payload archival surface: Supabase Storage object versioning OR raw-payload audit table — decision deferred to roadmapper (D-PROPOSED-06 follow-up).
   - Ingestion trigger: admin upload form vs. signed webhook vs. scheduled pull — also deferred.

3. **Phase C — Payroll-by-task projection.**
   - `payrollSchedComparison` as a scheduled job or trigger producing the `hr_ee_payroll_by_tasks` analog the existing Payroll Comparison submodule reads. Now sourced from in-app `hr_ee_payroll` rows produced by Phase B.

---

## Open questions raised by the source

- Output sheet `hr_print_sched` is the only place tying a recipient + schedule type to the email job. In-app, what surface owns scheduling these emails (admin form? cron with config table? signed webhook?).
- `hr_ee_tasks.QuickBooksAccount` is the only mapping driving by-task projection — does the in-app schema already have an equivalent column? (Not visible in PROJECT.md/MILESTONES.md.)
- `hr_ee_register.OvertimeThreshold` per-employee threshold — same question, is there a Postgres analog already?
- Schedule rollover currently keys on display `WeekStartDate` strings (`M/d/yyyy`). The Postgres equivalent should use a real `date`/`timestamptz` column to avoid locale-format coupling.
- Payroll source-file archival: Supabase Storage (object versioning) vs. raw-payload audit table vs. drop entirely now that the ingest is reproducible from staging tables — roadmapper to decide.
- Payroll ingest trigger surface: admin upload form vs. signed webhook from an external uploader vs. scheduled pull — undefined at synthesis time.
