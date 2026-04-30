# Constraints (cross-cutting refactor rules)

> Source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (DOC)
> Type: refactor / migration constraints (informal, derived from user intent)
> These are not formal SPEC contracts; the source is a DOC. Roadmapper may promote them to SPECs once a milestone is scoped.

---

## C-NO-SPREADSHEETAPP

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (all functions)
- type: protocol
- constraint: No re-implementation may use `SpreadsheetApp.openById`, `getSheetByName`, `getDataRange`, `getValues`, `getDisplayValues`, `setValues`, or any other Google Sheets API. All reads/writes go through Supabase tables/views via `getSupabaseServerClient(request)` (server) or the existing client patterns.
- rationale: Eliminate Google Sheets as system-of-record; consolidate on Supabase per the migration intent and per CLAUDE.md "Supabase: Hosted (NOT Local Docker)".

## C-NO-DRIVEAPP

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`runPayroll` archive step)
- type: protocol
- constraint: No use of `DriveApp.getFolderById`, `makeCopy`, or any Google Drive operations. Source-file archival (currently `runPayroll` snapshotting the HRB workbook) must be replaced — either by Supabase Storage (object versioning) or by storing the raw payload in an audit table. Decision deferred to roadmapper as a D-PROPOSED-06 follow-up; payroll processing is now in-scope (per PROJECT.md 2026-04-29 reversal), so this archival surface must be designed, not dropped.

## C-NO-MAILAPP

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`emailSchedule`)
- type: protocol
- constraint: No use of `MailApp.sendEmail` or `GmailApp`. All transactional email goes through the app's existing mailer abstraction configured by `MAILER_PROVIDER` (`nodemailer` or `resend`) using `EMAIL_*` env vars.

## C-NO-URLFETCHAPP-PDF-EXPORT

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`getPdfBlob`)
- type: protocol
- constraint: No reliance on `https://docs.google.com/spreadsheets/.../export?format=pdf` with `ScriptApp.getOAuthToken()`. Server-side PDF generation must be self-contained (e.g., `@react-pdf/renderer`, Puppeteer in an Edge Function, or `pdfkit`) operating on Supabase data.

## C-NO-UTILITIES-SLEEP

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`emailSchedule` `Utilities.sleep(5000)`, helpers)
- type: protocol
- constraint: No `Utilities.sleep`-style busy waits. Sequence operations via async/await; prefer transactional integrity (single SQL operation) over post-hoc clearing-with-delay.

## C-PRESERVE-HONOLULU-TZ

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (every script — `Pacific/Honolulu` is hardcoded)
- type: nfr
- constraint: All date/time math that drives schedule rollover, payroll period boundaries, week numbers, and email subjects MUST anchor to `Pacific/Honolulu` regardless of server locale. Stored timestamps may remain UTC (Postgres `timestamptz`), but derivations of "today / this week / this quarter" must convert to HST first.
- existing alignment: Quick task 260418-tz1 already fixed `FormDateField` HST timezone bugs — this constraint extends that policy to backend automations.

## C-PRESERVE-COMPUTATION-FIDELITY

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (all scripts)
- type: nfr
- constraint: Every numeric computation present in the legacy code is part of the contract. Specifically protected:
  - Overtime split: `discretionaryOT = max(total_hours - overtime_threshold, 0)`
  - Period-spanning month proration formulas (`d1`, `d2`, `h1`, `h2`, `t1`, `t2`)
  - Pay-period-number formula: `ceil((((checkDate - startOfYear)/86400000 + startOfYear.getDay() + 1)/7)/2)`
  - Week-number formula: `ceil(((weekDate - startOfYear)/86400000 + startOfYear.getDay() + 1)/7)`
  - WC-code resolution: first-non-zero among `WC 0008`, `WC 8810`, `WC 8742` (order matters)
  - Cost-per-hour proration in `payrollSchedComparison` with schedule-total scaling when totals diverge
  - Rounding: `Math.round((val + Number.EPSILON) * 100) / 100`
  - `is_standard` rule: invoice-grouped hours sum > 5000

## C-PRESERVE-NORMALIZATION-RULES

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (`normId`, `normName`, `mapFromNameWithId`)
- type: protocol
- constraint:
  - `normId(v)` = strip non-digits, trim. All employee-ID joins use this normalization (HRB inputs frequently embed IDs in `Employee Name`-style strings).
  - `normName(name)` = lowercase, collapse internal whitespace, trim — used for cross-source name-based joins where employee_id is unavailable.
  - Name→ID extraction patterns are source-specific and must be preserved per source: `/-(\d+)\s*$/` for `NetPay`, `/EMPLOYEE:\s*(\d+)\s*-/i` for `PTOBank`, `/^(\d+)\s*-/` for `TDI` and `WC`.

## C-CONFIG-NOT-HARDCODED-IDS

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (hardcoded spreadsheet/folder IDs)
- type: nfr
- constraint: Hardcoded Google identifiers (`13DUQTQyZf0CW07xv4FJ4ukP2x3Yoz8PyAw3Z2SwNsts` output sheet, `1HLX11I82ADv_ypFztMIMTF4xw6axcGUVTLkxV_CcTo0` HRB input sheet, `1ALCDDV5ob1MsmwO-YB1nVtauua2jSS17` HRB folder) MUST NOT carry over. Replace with Supabase table references; if any external file path remains needed (e.g., for an import shim), source it from environment configuration, not source code.

## C-CRON-NOT-MANUAL-TRIGGERS

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md (Apps Script trigger model)
- type: nfr
- constraint: Apps Script "manual run / time-driven trigger" automations move to scheduled execution — Supabase `pg_cron`, scheduled Edge Functions, or an external scheduler hitting a signed app endpoint. Cadence must be explicitly documented per job (daily for `updateDailySched`, weekly for the rollover/aggregation chain, quarterly month-2 for `createReviewData`, on-demand for `emailSchedule` and `runPayroll`).

> Note: The earlier C-RESPECT-EXISTING-LOCKED-SCOPE constraint (which gated payroll processing against the prior PROJECT.md "Out of Scope" line) has been retired as of 2026-04-29 — PROJECT.md line 57 is now struck through and a new Key Decisions row brings payroll ingest in-scope. See `INGEST-CONFLICTS.md` for the resolution audit trail.
