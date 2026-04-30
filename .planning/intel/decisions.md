# Decisions (extracted from ingested DOCs)

> Status: PROPOSED — these are migration-target architecture decisions inferred from APPSHEET_SCRIPTS.md and the user's stated intent ("re-implement as Supabase Postgres + edge functions + (optionally) RR7 UI, preserving business logic exactly"). None are LOCKED. Per-conflict gates have been cleared as of 2026-04-29 (see `INGEST-CONFLICTS.md`).

---

## D-PROPOSED-01 — Migrate AppSheet/Google-Apps-Script automations to Supabase

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md
- status: proposed
- locked: false
- scope: legacy automation runtime
- decision: Replace Google Apps Script (`SpreadsheetApp`, `DriveApp`, `MailApp`, `UrlFetchApp`) automations with Supabase Postgres tables/views + Supabase Edge Functions, optionally surfaced through the existing React Router 7 workspace.
- rationale (from user intent): Eliminate Google Sheets as system-of-record; consolidate on Supabase to align with the rest of the app.
- precedence: DOC (lowest) — pending elevation to ADR via roadmapper.

## D-PROPOSED-02 — Preserve business logic verbatim across migration

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md
- status: proposed
- locked: false
- scope: payroll/schedule/review computation
- decision: Re-implementation MUST preserve every existing computation exactly (overtime threshold split, cost-per-hour proration, week-number formula, WC code precedence ordering, name/ID normalization, quarter dating, review-eligibility filters, etc.).
- rationale: The legacy code is the de-facto spec; outputs feed downstream payroll comparison and quarterly reviews already shipped in v1.0.
- precedence: DOC.

## D-PROPOSED-03 — Schedule duplication runs server-side on a cron

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md `updateDailySched`
- status: proposed
- locked: false
- scope: weekly schedule rollover
- decision: The "delete next-week rows, then clone current-week rows + 7 days" rollover currently triggered manually in Apps Script becomes a scheduled job (Supabase pg_cron or scheduled Edge Function) operating on `hr_ee_sched_daily` (or its Postgres equivalent).
- precedence: DOC.

## D-PROPOSED-04 — Quarterly review row generation runs on a cron

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md `createReviewData`
- status: proposed
- locked: false
- scope: hr_employee_review row seeding
- decision: The Feb/May/Aug/Nov auto-seed of review rows for eligible active employees becomes a scheduled job that inserts pending rows into `hr_employee_review` (existing v1.0 table).
- precedence: DOC.
- note: Existing v1.0 `hr_employee_review` table already enforces lock + scored averages; this automation must respect those constraints.

## D-PROPOSED-05 — PDF schedule export + email distribution

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md `emailSchedule`
- status: proposed
- locked: false
- scope: weekly schedule distribution
- decision: Replace Google Sheets PDF export (`docs.google.com/spreadsheets/.../export?format=pdf`) and `MailApp.sendEmail` with a server-side PDF render (e.g., Puppeteer or @react-pdf/renderer in an Edge Function or Node SSR route) plus the app's existing mailer (`MAILER_PROVIDER` = nodemailer | resend, see env contract).
- precedence: DOC.

## D-PROPOSED-06 — Payroll ingest + comparison are server functions, not sheet macros

- source: /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/APPSHEET_SCRIPTS.md `runPayroll` + `payrollSchedComparison`
- status: proposed (UNBLOCKED 2026-04-29 — see PROJECT.md Key Decisions row "Payroll processing brought in-scope")
- locked: false
- scope: payroll processing + payroll-vs-schedule comparison
- decision: Implement HRB payroll ingest (the `$data`/`NetPay`/`Hours`/`PTOBank`/`WC`/`TDI` workbook → `hr_ee_payroll` row construction) and the schedule-comparison projection inside this app via Supabase functions/migrations. Architecture per the Key Decisions row: staging tables (one per HRB source tab) → transformation service (preserves all derivations per D-PROPOSED-02 and C-PRESERVE-COMPUTATION-FIDELITY) → `hr_ee_payroll`.
- supersedes: prior PROJECT.md "Out of Scope" line stating `Payroll import/processing — hr_payroll is imported externally, this project only displays it` (now struck through on PROJECT.md line 57).
- open follow-ups for roadmapper:
  - Source-file archival replacement for the legacy `DriveApp` snapshot of the HRB workbook — Supabase Storage object versioning vs. raw-payload audit table vs. drop entirely. See C-NO-DRIVEAPP.
  - Ingestion trigger surface — admin upload form, signed webhook, or scheduled pull — undefined at synthesis time.
- precedence: DOC.
